import * as React from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
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

const metadata = { title: `Contract Portfolio | Reports | ${appConfig.name}` }

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
  Archived: 'default',
}

export function Page() {
  const { data: contracts, loading, error } = useSalesforceQuery((client) => client.getContracts())
  const [statusFilter, setStatusFilter] = React.useState('all')
  const [vendorFilter, setVendorFilter] = React.useState('all')

  const vendors = React.useMemo(() => {
    if (!contracts?.length) return []
    const set = new Set(contracts.map((c) => c.cux_Account__r?.Name).filter(Boolean))
    return [...set].sort()
  }, [contracts])

  const statuses = React.useMemo(() => {
    if (!contracts?.length) return []
    const set = new Set(contracts.map((c) => c.cux_Status__c).filter(Boolean))
    return [...set].sort()
  }, [contracts])

  const filtered = React.useMemo(() => {
    if (!contracts?.length) return []
    return contracts.filter((c) => {
      if (statusFilter !== 'all' && c.cux_Status__c !== statusFilter) return false
      if (vendorFilter !== 'all' && c.cux_Account__r?.Name !== vendorFilter) return false
      return true
    })
  }, [contracts, statusFilter, vendorFilter])

  const totals = React.useMemo(() => {
    if (!filtered.length) return null
    return filtered.reduce(
      (acc, c) => ({
        authorized: acc.authorized + (c.cux_Total_Authorized_Amount__c || 0),
        obligated: acc.obligated + (c.cux_Total_Obligated_Amount__c || 0),
        expended: acc.expended + (c.cux_Total_Expended_Amount__c || 0),
      }),
      { authorized: 0, obligated: 0, expended: 0 }
    )
  }, [filtered])

  const remaining = totals ? totals.authorized - totals.expended : 0

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
            <Typography variant="h4">Contract Portfolio Status</Typography>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error">Failed to load contracts: {error.message}</Alert>
            ) : !contracts?.length ? (
              <Card>
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography color="text.secondary" variant="body2">No contracts found</Typography>
                </Box>
              </Card>
            ) : (
              <React.Fragment>
                {/* Summary KPIs */}
                <Grid container spacing={3}>
                  {[
                    { label: 'Total Authorized', value: formatCurrency(totals?.authorized), color: 'primary' },
                    { label: 'Total Obligated', value: formatCurrency(totals?.obligated), color: 'success' },
                    { label: 'Total Expended', value: formatCurrency(totals?.expended), color: 'info' },
                    { label: 'Remaining Balance', value: formatCurrency(remaining), color: remaining < 0 ? 'error' : 'warning' },
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
                    label="Vendor"
                    value={vendorFilter}
                    onChange={(e) => setVendorFilter(e.target.value)}
                    size="small"
                    sx={{ minWidth: 200 }}
                  >
                    <MenuItem value="all">All Vendors</MenuItem>
                    {vendors.map((v) => (
                      <MenuItem key={v} value={v}>{v}</MenuItem>
                    ))}
                  </TextField>
                  <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
                    {filtered.length} contract{filtered.length !== 1 ? 's' : ''}
                  </Typography>
                </Stack>

                {/* Contracts table */}
                <Card>
                  <CardHeader title="Contracts" />
                  <Box sx={{ overflowX: 'auto' }}>
                    <Table sx={{ minWidth: 900 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell>Contract</TableCell>
                          <TableCell>Vendor</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Period</TableCell>
                          <TableCell align="right">Authorized</TableCell>
                          <TableCell align="right">Obligated</TableCell>
                          <TableCell align="right">Expended</TableCell>
                          <TableCell align="right">Remaining</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filtered.map((c) => {
                          const auth = c.cux_Total_Authorized_Amount__c || 0
                          const exp = c.cux_Total_Expended_Amount__c || 0
                          const rem = auth - exp
                          const daysToEnd = c.cux_End_Date__c ? dayjs(c.cux_End_Date__c).diff(dayjs(), 'day') : null

                          return (
                            <TableRow key={c.Id} hover component={RouterLink} href={paths.dashboard.contracts.details(c.Id)} sx={{ textDecoration: 'none' }}>
                              <TableCell>
                                <Stack spacing={0.25}>
                                  <Typography variant="subtitle2">{c.Name}</Typography>
                                  {c.cux_Title__c && (
                                    <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                                      {c.cux_Title__c}
                                    </Typography>
                                  )}
                                </Stack>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">{c.cux_Account__r?.Name || '—'}</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">{c.cux_Contract_Type__c || '—'}</Typography>
                              </TableCell>
                              <TableCell>
                                <Chip label={c.cux_Status__c} size="small" variant="soft" color={statusColors[c.cux_Status__c] || 'default'} />
                              </TableCell>
                              <TableCell>
                                <Stack spacing={0.25}>
                                  <Typography variant="caption">
                                    {c.cux_Start_Date__c ? dayjs(c.cux_Start_Date__c).format('MMM YYYY') : '—'}
                                    {' – '}
                                    {c.cux_End_Date__c ? dayjs(c.cux_End_Date__c).format('MMM YYYY') : '—'}
                                  </Typography>
                                  {daysToEnd != null && daysToEnd <= 90 && daysToEnd >= 0 && (
                                    <Chip label={`${daysToEnd}d left`} size="small" variant="soft" color="warning" sx={{ width: 'fit-content' }} />
                                  )}
                                  {daysToEnd != null && daysToEnd < 0 && (
                                    <Chip label="Expired" size="small" variant="soft" color="error" sx={{ width: 'fit-content' }} />
                                  )}
                                </Stack>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2">{formatCurrency(auth)}</Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2">{formatCurrency(c.cux_Total_Obligated_Amount__c)}</Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2">{formatCurrency(exp)}</Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" color={rem < 0 ? 'error.main' : 'text.primary'}>
                                  {formatCurrency(rem)}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </Box>
                </Card>
              </React.Fragment>
            )}
          </Stack>
        </Box>
      </AnimatedPage>
    </React.Fragment>
  )
}
