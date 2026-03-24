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

const metadata = { title: `Invoice Tracking | Reports | ${appConfig.name}` }

function formatCurrency(value) {
  if (value == null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)
}

const statusColors = {
  Draft: 'default',
  Review: 'info',
  Approval: 'warning',
  Paid: 'success',
  Rejected: 'error',
  Void: 'default',
}

function getDaysPending(invoice) {
  if (invoice.cux_Status__c === 'Paid' || invoice.cux_Status__c === 'Void' || invoice.cux_Status__c === 'Rejected') return null
  const start = invoice.cux_Received_Date__c || invoice.cux_Invoice_Date__c || invoice.CreatedDate
  if (!start) return null
  return dayjs().diff(dayjs(start), 'day')
}

export function Page() {
  const { data: invoices, loading, error } = useSalesforceQuery((client) => client.getInvoices())
  const [statusFilter, setStatusFilter] = React.useState('all')
  const [contractFilter, setContractFilter] = React.useState('all')

  const contractOptions = React.useMemo(() => {
    if (!invoices?.length) return []
    const map = new Map()
    for (const inv of invoices) {
      if (inv.cux_Contract__r?.Name && !map.has(inv.cux_Contract__c)) {
        map.set(inv.cux_Contract__c, inv.cux_Contract__r.Name)
      }
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]))
  }, [invoices])

  const statuses = React.useMemo(() => {
    if (!invoices?.length) return []
    const set = new Set(invoices.map((i) => i.cux_Status__c).filter(Boolean))
    return [...set].sort()
  }, [invoices])

  const filtered = React.useMemo(() => {
    if (!invoices?.length) return []
    return invoices.filter((inv) => {
      if (statusFilter !== 'all' && inv.cux_Status__c !== statusFilter) return false
      if (contractFilter !== 'all' && inv.cux_Contract__c !== contractFilter) return false
      return true
    })
  }, [invoices, statusFilter, contractFilter])

  const totals = React.useMemo(() => {
    if (!filtered.length) return null
    const total = filtered.reduce((acc, inv) => acc + (inv.cux_Amount__c || 0), 0)
    const pending = filtered.filter((i) => !['Paid', 'Void', 'Rejected'].includes(i.cux_Status__c))
    const pendingAmt = pending.reduce((acc, inv) => acc + (inv.cux_Amount__c || 0), 0)
    const paidAmt = filtered.filter((i) => i.cux_Status__c === 'Paid').reduce((acc, inv) => acc + (inv.cux_Amount__c || 0), 0)
    const overdue = pending.filter((i) => getDaysPending(i) > 30).length
    return { total, pendingAmt, paidAmt, pendingCount: pending.length, overdue }
  }, [filtered])

  // Group by status
  const groupedByStatus = React.useMemo(() => {
    const map = new Map()
    for (const inv of filtered) {
      const status = inv.cux_Status__c || 'Unknown'
      if (!map.has(status)) map.set(status, { status, invoices: [], amount: 0 })
      const group = map.get(status)
      group.invoices.push(inv)
      group.amount += inv.cux_Amount__c || 0
    }
    // Order: Draft, Review, Approval, Paid, Rejected, Void
    const order = ['Draft', 'Review', 'Approval', 'Paid', 'Rejected', 'Void']
    return [...map.values()].sort((a, b) => {
      const ai = order.indexOf(a.status)
      const bi = order.indexOf(b.status)
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
    })
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
            <Typography variant="h4">Invoice Tracking &amp; Payment Readiness</Typography>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error">Failed to load invoices: {error.message}</Alert>
            ) : !invoices?.length ? (
              <Card>
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography color="text.secondary" variant="body2">No invoices found</Typography>
                </Box>
              </Card>
            ) : (
              <React.Fragment>
                {/* Summary KPIs */}
                <Grid container spacing={3}>
                  {[
                    { label: 'Total Invoiced', value: formatCurrency(totals?.total), color: 'primary' },
                    { label: 'Paid', value: formatCurrency(totals?.paidAmt), color: 'success' },
                    { label: 'Pending', value: `${totals?.pendingCount} (${formatCurrency(totals?.pendingAmt)})`, color: 'warning' },
                    { label: 'Overdue (>30d)', value: totals?.overdue, color: totals?.overdue > 0 ? 'error' : 'success' },
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
                    {contractOptions.map(([id, name]) => (
                      <MenuItem key={id} value={id}>{name}</MenuItem>
                    ))}
                  </TextField>
                  <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
                    {filtered.length} invoice{filtered.length !== 1 ? 's' : ''}
                  </Typography>
                </Stack>

                {/* Status summary chips */}
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                  {groupedByStatus.map((g) => (
                    <Chip
                      key={g.status}
                      label={`${g.status}: ${g.invoices.length} (${formatCurrency(g.amount)})`}
                      variant="soft"
                      color={statusColors[g.status] || 'default'}
                      onClick={() => setStatusFilter(statusFilter === g.status ? 'all' : g.status)}
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
                </Stack>

                {/* Invoice table */}
                <Card>
                  <CardHeader title="Invoices" />
                  <Box sx={{ overflowX: 'auto' }}>
                    <Table sx={{ minWidth: 1000 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell>Invoice</TableCell>
                          <TableCell>Contract</TableCell>
                          <TableCell>Task Order</TableCell>
                          <TableCell>Category</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Invoice Date</TableCell>
                          <TableCell>Service Period</TableCell>
                          <TableCell align="right">Amount</TableCell>
                          <TableCell align="right">Hours</TableCell>
                          <TableCell align="center">Days Pending</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filtered.map((inv) => {
                          const days = getDaysPending(inv)

                          return (
                            <TableRow key={inv.Id} hover component={RouterLink} href={paths.dashboard.invoices.details(inv.Id)} sx={{ textDecoration: 'none' }}>
                              <TableCell>
                                <Stack spacing={0.25}>
                                  <Typography variant="subtitle2">{inv.Name}</Typography>
                                  {inv.cux_External_Invoice_Number__c && (
                                    <Typography variant="caption" color="text.secondary">{inv.cux_External_Invoice_Number__c}</Typography>
                                  )}
                                </Stack>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">{inv.cux_Contract__r?.Name || '—'}</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">{inv.cux_Task_Order__r?.Name || '—'}</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">{inv.cux_Category__c || '—'}</Typography>
                              </TableCell>
                              <TableCell>
                                <Chip label={inv.cux_Status__c} size="small" variant="soft" color={statusColors[inv.cux_Status__c] || 'default'} />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {inv.cux_Invoice_Date__c ? dayjs(inv.cux_Invoice_Date__c).format('MMM D, YYYY') : '—'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="caption">
                                  {inv.cux_Service_Period_Start__c ? dayjs(inv.cux_Service_Period_Start__c).format('MMM D') : '—'}
                                  {' – '}
                                  {inv.cux_Service_Period_End__c ? dayjs(inv.cux_Service_Period_End__c).format('MMM D, YYYY') : '—'}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(inv.cux_Amount__c)}</Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2">{inv.cux_Total_Hours__c || '—'}</Typography>
                              </TableCell>
                              <TableCell align="center">
                                {days != null ? (
                                  <Chip
                                    label={`${days}d`}
                                    size="small"
                                    variant="soft"
                                    color={days > 30 ? 'error' : days > 14 ? 'warning' : 'default'}
                                  />
                                ) : (
                                  <Typography variant="body2" color="text.secondary">—</Typography>
                                )}
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
