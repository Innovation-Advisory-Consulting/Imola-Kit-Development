import * as React from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import LinearProgress from '@mui/material/LinearProgress'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import { Helmet } from 'react-helmet-async'

import { appConfig } from '@/config/app'
import { dayjs } from '@/lib/dayjs'
import { paths } from '@/paths'
import { useSalesforceQuery } from '@/hooks/use-salesforce'
import { AnimatedPage } from '@/components/core/animations'
import { RouterLink } from '@/components/core/link'

const metadata = { title: `Task Order Execution | Reports | ${appConfig.name}` }

function formatCurrency(value) {
  if (value == null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)
}

const statusColors = {
  Draft: 'default',
  Active: 'success',
  'Under Review': 'info',
  Completed: 'primary',
  Closed: 'secondary',
  Terminated: 'error',
}

export function Page() {
  const { data: taskOrders, loading, error } = useSalesforceQuery((client) => client.getTaskOrders())
  const [statusFilter, setStatusFilter] = React.useState('all')
  const [contractFilter, setContractFilter] = React.useState('all')

  const contracts = React.useMemo(() => {
    if (!taskOrders?.length) return []
    const map = new Map()
    for (const to of taskOrders) {
      if (to.cux_Contract__r?.Name && !map.has(to.cux_Contract__c)) {
        map.set(to.cux_Contract__c, to.cux_Contract__r.Name)
      }
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]))
  }, [taskOrders])

  const statuses = React.useMemo(() => {
    if (!taskOrders?.length) return []
    const set = new Set(taskOrders.map((t) => t.cux_Status__c).filter(Boolean))
    return [...set].sort()
  }, [taskOrders])

  const filtered = React.useMemo(() => {
    if (!taskOrders?.length) return []
    return taskOrders.filter((t) => {
      if (statusFilter !== 'all' && t.cux_Status__c !== statusFilter) return false
      if (contractFilter !== 'all' && t.cux_Contract__c !== contractFilter) return false
      return true
    })
  }, [taskOrders, statusFilter, contractFilter])

  // Group by contract
  const grouped = React.useMemo(() => {
    const map = new Map()
    for (const to of filtered) {
      const key = to.cux_Contract__c || 'unlinked'
      if (!map.has(key)) {
        map.set(key, {
          contractId: to.cux_Contract__c,
          contractName: to.cux_Contract__r?.Name || 'No Contract',
          contractTitle: to.cux_Contract__r?.cux_Title__c,
          taskOrders: [],
        })
      }
      map.get(key).taskOrders.push(to)
    }
    return [...map.values()].sort((a, b) => a.contractName.localeCompare(b.contractName))
  }, [filtered])

  const totals = React.useMemo(() => {
    if (!filtered.length) return null
    return filtered.reduce(
      (acc, t) => ({
        authorized: acc.authorized + (t.cux_Authorized_Amount__c || 0),
        invoiced: acc.invoiced + (t.cux_Total_Invoiced_Amount__c || 0),
        count: acc.count + 1,
      }),
      { authorized: 0, invoiced: 0, count: 0 }
    )
  }, [filtered])

  return (
    <React.Fragment>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>
      <AnimatedPage>
        <Box
          sx={{
            maxWidth: 'var(--Content-maxWidth)',
            m: 'var(--Content-margin)',
            p: 'var(--Content-padding)',
            width: 'var(--Content-width)',
          }}
        >
          <Stack spacing={4}>
            <Typography variant="h4">Task Order Execution</Typography>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error">Failed to load task orders: {error.message}</Alert>
            ) : !taskOrders?.length ? (
              <Card>
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography color="text.secondary" variant="body2">No task orders found</Typography>
                </Box>
              </Card>
            ) : (
              <React.Fragment>
                {/* Summary KPIs */}
                <Grid container spacing={3}>
                  {[
                    { label: 'Task Orders', value: totals?.count, color: 'primary', raw: true },
                    { label: 'Total Authorized', value: formatCurrency(totals?.authorized), color: 'success', raw: true },
                    { label: 'Total Invoiced', value: formatCurrency(totals?.invoiced), color: 'info', raw: true },
                    { label: 'Remaining', value: formatCurrency((totals?.authorized || 0) - (totals?.invoiced || 0)), color: 'warning', raw: true },
                  ].map((item) => (
                    <Grid key={item.label} size={{ xs: 6, md: 3 }}>
                      <Card>
                        <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                          <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                          <Typography variant="h5" color={`${item.color}.main`}>{item.value}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                {/* Filters */}
                <Stack direction="row" spacing={2}>
                  <TextField
                    select
                    label="Status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    size="small"
                    sx={{ minWidth: 160 }}
                  >
                    <MenuItem value="all">All Statuses</MenuItem>
                    {statuses.map((s) => (
                      <MenuItem key={s} value={s}>{s}</MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    select
                    label="Contract"
                    value={contractFilter}
                    onChange={(e) => setContractFilter(e.target.value)}
                    size="small"
                    sx={{ minWidth: 240 }}
                  >
                    <MenuItem value="all">All Contracts</MenuItem>
                    {contracts.map(([id, name]) => (
                      <MenuItem key={id} value={id}>{name}</MenuItem>
                    ))}
                  </TextField>
                  <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
                    {filtered.length} task order{filtered.length !== 1 ? 's' : ''} across {grouped.length} contract{grouped.length !== 1 ? 's' : ''}
                  </Typography>
                </Stack>

                {/* Grouped table by Contract */}
                {grouped.map((group) => (
                  <Card key={group.contractId || 'unlinked'}>
                    <CardHeader
                      title={
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                          <Typography variant="subtitle1">{group.contractName}</Typography>
                          {group.contractTitle && (
                            <Typography variant="body2" color="text.secondary">— {group.contractTitle}</Typography>
                          )}
                        </Stack>
                      }
                      subheader={`${group.taskOrders.length} task order${group.taskOrders.length !== 1 ? 's' : ''}`}
                    />
                    <Box sx={{ overflowX: 'auto' }}>
                      <Table sx={{ minWidth: 800 }}>
                        <TableHead>
                          <TableRow>
                            <TableCell>Task Order</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Period</TableCell>
                            <TableCell align="right">Authorized</TableCell>
                            <TableCell align="right">Invoiced</TableCell>
                            <TableCell align="right">Remaining</TableCell>
                            <TableCell sx={{ minWidth: 120 }}>Burn</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {group.taskOrders.map((to) => {
                            const auth = to.cux_Authorized_Amount__c || 0
                            const inv = to.cux_Total_Invoiced_Amount__c || 0
                            const rem = auth - inv
                            const burnPct = auth > 0 ? Math.min((inv / auth) * 100, 100) : 0

                            return (
                              <TableRow key={to.Id} hover component={RouterLink} href={paths.dashboard.taskOrders.details(to.Id)} sx={{ textDecoration: 'none' }}>
                                <TableCell>
                                  <Typography variant="subtitle2">{to.Name}</Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">{to.cux_Task_Order_Type__c || '—'}</Typography>
                                </TableCell>
                                <TableCell>
                                  <Chip label={to.cux_Status__c} size="small" variant="soft" color={statusColors[to.cux_Status__c] || 'default'} />
                                </TableCell>
                                <TableCell>
                                  <Typography variant="caption">
                                    {to.cux_Start_Date__c ? dayjs(to.cux_Start_Date__c).format('MMM YYYY') : '—'}
                                    {' – '}
                                    {to.cux_End_Date__c ? dayjs(to.cux_End_Date__c).format('MMM YYYY') : '—'}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="body2">{formatCurrency(auth)}</Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="body2">{formatCurrency(inv)}</Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="body2" color={rem < 0 ? 'error.main' : 'text.primary'}>
                                    {formatCurrency(rem)}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                    <LinearProgress
                                      variant="determinate"
                                      value={burnPct}
                                      sx={{
                                        flex: 1,
                                        height: 6,
                                        borderRadius: 3,
                                        bgcolor: 'action.hover',
                                        '& .MuiLinearProgress-bar': {
                                          borderRadius: 3,
                                          bgcolor: burnPct >= 90 ? 'error.main' : burnPct >= 70 ? 'warning.main' : 'success.main',
                                        },
                                      }}
                                    />
                                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 32, textAlign: 'right' }}>
                                      {Math.round(burnPct)}%
                                    </Typography>
                                  </Stack>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </Box>
                  </Card>
                ))}
              </React.Fragment>
            )}
          </Stack>
        </Box>
      </AnimatedPage>
    </React.Fragment>
  )
}
