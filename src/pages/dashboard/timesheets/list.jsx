import * as React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import { PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus'
import { Helmet } from 'react-helmet-async'

import { appConfig } from '@/config/app'
import { paths } from '@/paths'
import { dayjs } from '@/lib/dayjs'
import { RouterLink } from '@/components/core/link'
import { useSalesforceQuery } from '@/hooks/use-salesforce'
import { useTableSort } from '@/hooks/use-table-sort'
import { SortableTableCell } from '@/components/core/sortable-table-cell'
import { AnimatedPage } from '@/components/core/animations'

const metadata = { title: `Timesheets | Dashboard | ${appConfig.name}` }

const statusColorMap = {
  Draft: 'default',
  Submitted: 'warning',
  Approved: 'success',
  Rejected: 'error',
}

function formatCurrency(value) {
  if (value == null) return '$0.00'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

export function Page() {
  const { data: timesheets, loading, error } = useSalesforceQuery((client) => client.getTimesheets())
  const { sortedData, sortKey, sortDirection, onSort } = useTableSort(timesheets, { defaultSortKey: 'Name', defaultDirection: 'desc' })

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
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ alignItems: 'flex-start' }}>
            <Box sx={{ flex: '1 1 auto' }}>
              <Typography variant="h4">Timesheets</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                component={RouterLink}
                href={paths.dashboard.timesheets.create}
                startIcon={<PlusIcon />}
                variant="contained"
              >
                New Timesheet
              </Button>
            </Box>
          </Stack>
          <Card>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ m: 2 }}>
                Failed to load timesheets: {error.message}
              </Alert>
            ) : !timesheets?.length ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary" variant="body2">
                  No timesheets found
                </Typography>
              </Box>
            ) : (
              <React.Fragment>
                <Box sx={{ overflowX: 'auto' }}>
                  <Table sx={{ minWidth: 900 }}>
                    <TableHead>
                      <TableRow>
                        <SortableTableCell sortKey="Name" activeSortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>TS #</SortableTableCell>
                        <SortableTableCell sortKey="cux_Worker_Name__c" activeSortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>Worker</SortableTableCell>
                        <SortableTableCell sortKey="cux_Task_Order__r.Name" activeSortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>Task Order</SortableTableCell>
                        <SortableTableCell sortKey="cux_Work_Date__c" activeSortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>Work Date</SortableTableCell>
                        <SortableTableCell sortKey="cux_Hours__c" activeSortKey={sortKey} sortDirection={sortDirection} onSort={onSort} align="right">Hours</SortableTableCell>
                        <SortableTableCell sortKey="cux_Hourly_Rate__c" activeSortKey={sortKey} sortDirection={sortDirection} onSort={onSort} align="right">Rate</SortableTableCell>
                        <SortableTableCell sortKey="cux_Total_Amount__c" activeSortKey={sortKey} sortDirection={sortDirection} onSort={onSort} align="right">Amount</SortableTableCell>
                        <SortableTableCell sortKey="cux_Status__c" activeSortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>Status</SortableTableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sortedData.map((ts) => (
                        <TableRow hover key={ts.Id} sx={{ '&:last-child td': { border: 0 } }}>
                          <TableCell>
                            <Link
                              color="text.primary"
                              component={RouterLink}
                              href={paths.dashboard.timesheets.details(ts.Id)}
                              variant="subtitle2"
                            >
                              {ts.Name}
                            </Link>
                          </TableCell>
                          <TableCell>{ts.cux_Worker_Name__c || '—'}</TableCell>
                          <TableCell>{ts.cux_Task_Order__r?.Name || '—'}</TableCell>
                          <TableCell>
                            {ts.cux_Work_Date__c
                              ? dayjs(ts.cux_Work_Date__c).format('MMM D, YYYY')
                              : '—'}
                          </TableCell>
                          <TableCell align="right">
                            {ts.cux_Hours__c != null ? Number(ts.cux_Hours__c).toFixed(1) : '—'}
                          </TableCell>
                          <TableCell align="right">{formatCurrency(ts.cux_Hourly_Rate__c)}</TableCell>
                          <TableCell align="right">{formatCurrency(ts.cux_Total_Amount__c)}</TableCell>
                          <TableCell>
                            <Chip
                              color={statusColorMap[ts.cux_Status__c] || 'default'}
                              label={ts.cux_Status__c}
                              size="small"
                              variant="soft"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
                <Divider />
                <Box sx={{ px: 3, py: 2 }}>
                  <Typography color="text.secondary" variant="body2">
                    {timesheets.length} timesheet{timesheets.length !== 1 ? 's' : ''}
                  </Typography>
                </Box>
              </React.Fragment>
            )}
          </Card>
        </Stack>
      </Box>
      </AnimatedPage>
    </React.Fragment>
  )
}
