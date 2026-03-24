import * as React from 'react'
import Box from '@mui/material/Box'
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
import { Helmet } from 'react-helmet-async'

import { appConfig } from '@/config/app'
import { paths } from '@/paths'
import { dayjs } from '@/lib/dayjs'
import { RouterLink } from '@/components/core/link'
import { useSalesforceQuery } from '@/hooks/use-salesforce'
import { useTableSort } from '@/hooks/use-table-sort'
import { SortableTableCell } from '@/components/core/sortable-table-cell'
import { AnimatedPage } from '@/components/core/animations'

const metadata = { title: `Validation Requests | Dashboard | ${appConfig.name}` }

const statusColorMap = {
  Pending: 'default',
  'In Progress': 'info',
  Completed: 'success',
  Failed: 'error',
}

const outcomeColorMap = {
  PASS: 'success',
  PASS_WITH_WARNINGS: 'warning',
  FAIL: 'error',
}

export function Page() {
  const { data: requests, loading, error } = useSalesforceQuery((client) => client.getValidationRequests())
  const { sortedData, sortKey, sortDirection, onSort } = useTableSort(requests, { defaultSortKey: 'Name', defaultDirection: 'desc' })

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
              <Typography variant="h4">Validation Requests</Typography>
            </Box>
          </Stack>

          <Card>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ m: 2 }}>
                Failed to load validation requests: {error.message}
              </Alert>
            ) : !requests?.length ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary" variant="body2">
                  No validation requests found
                </Typography>
              </Box>
            ) : (
              <React.Fragment>
                <Box sx={{ overflowX: 'auto' }}>
                  <Table sx={{ minWidth: 900 }}>
                    <TableHead>
                      <TableRow>
                        <SortableTableCell sortKey="Name" activeSortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>Request #</SortableTableCell>
                        <SortableTableCell sortKey="cux_Target_Type__c" activeSortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>Target Type</SortableTableCell>
                        <SortableTableCell sortKey="cux_Status__c" activeSortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>Status</SortableTableCell>
                        <SortableTableCell sortKey="cux_Outcome__c" activeSortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>Outcome</SortableTableCell>
                        <SortableTableCell sortKey="cux_Validation_Profile__r.cux_Profile_Name__c" activeSortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>Profile</SortableTableCell>
                        <SortableTableCell sortKey="cux_Requested_At__c" activeSortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>Requested At</SortableTableCell>
                        <SortableTableCell sortKey="cux_Completed_At__c" activeSortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>Completed At</SortableTableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sortedData.map((request) => (
                        <TableRow hover key={request.Id} sx={{ '&:last-child td': { border: 0 } }}>
                          <TableCell>
                            <Link
                              color="text.primary"
                              component={RouterLink}
                              href={paths.dashboard.validations.requests.details(request.Id)}
                              variant="subtitle2"
                            >
                              {request.Name}
                            </Link>
                          </TableCell>
                          <TableCell>{request.cux_Target_Type__c || '—'}</TableCell>
                          <TableCell>
                            <Chip
                              color={statusColorMap[request.cux_Status__c] || 'default'}
                              label={request.cux_Status__c}
                              size="small"
                              variant="soft"
                            />
                          </TableCell>
                          <TableCell>
                            {request.cux_Outcome__c ? (
                              <Chip
                                color={outcomeColorMap[request.cux_Outcome__c] || 'default'}
                                label={request.cux_Outcome__c}
                                size="small"
                                variant="soft"
                              />
                            ) : (
                              '—'
                            )}
                          </TableCell>
                          <TableCell>{request.cux_Validation_Profile__r?.cux_Profile_Name__c || '—'}</TableCell>
                          <TableCell>
                            {request.cux_Requested_At__c
                              ? dayjs(request.cux_Requested_At__c).format('MMM D, YYYY h:mm A')
                              : '—'}
                          </TableCell>
                          <TableCell>
                            {request.cux_Completed_At__c
                              ? dayjs(request.cux_Completed_At__c).format('MMM D, YYYY h:mm A')
                              : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
                <Divider />
                <Box sx={{ px: 3, py: 2 }}>
                  <Typography color="text.secondary" variant="body2">
                    {requests.length} request{requests.length !== 1 ? 's' : ''}
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
