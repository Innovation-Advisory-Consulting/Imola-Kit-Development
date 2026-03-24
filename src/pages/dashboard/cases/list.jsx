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
import { AnimatedPage } from '@/components/core/animations'

const metadata = { title: `Cases | Dashboard | ${appConfig.name}` }

const statusColorMap = {
  Open: 'info',
  'In Progress': 'warning',
  Escalated: 'error',
  Resolved: 'success',
  Closed: 'default',
}

const priorityColorMap = {
  Low: 'default',
  Medium: 'info',
  High: 'warning',
  Critical: 'error',
}

export function Page() {
  const { data: cases, loading, error } = useSalesforceQuery((client) => client.getCases())

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
              <Typography variant="h4">Cases</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                component={RouterLink}
                href={paths.dashboard.cases.create}
                startIcon={<PlusIcon />}
                variant="contained"
              >
                New Case
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
                Failed to load cases: {error.message}
              </Alert>
            ) : !cases?.length ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary" variant="body2">
                  No cases found
                </Typography>
              </Box>
            ) : (
              <React.Fragment>
                <Box sx={{ overflowX: 'auto' }}>
                  <Table sx={{ minWidth: 900 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Case #</TableCell>
                        <TableCell>Subject</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Priority</TableCell>
                        <TableCell>Account</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell>Created Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {cases.map((caseRecord) => (
                        <TableRow hover key={caseRecord.Id} sx={{ '&:last-child td': { border: 0 } }}>
                          <TableCell>
                            <Link
                              color="text.primary"
                              component={RouterLink}
                              href={paths.dashboard.cases.details(caseRecord.Id)}
                              variant="subtitle2"
                            >
                              {caseRecord.Name}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ maxWidth: 250 }} noWrap>
                              {caseRecord.cux_Subject__c || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              color={statusColorMap[caseRecord.cux_Status__c] || 'default'}
                              label={caseRecord.cux_Status__c}
                              size="small"
                              variant="soft"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              color={priorityColorMap[caseRecord.cux_Priority__c] || 'default'}
                              label={caseRecord.cux_Priority__c}
                              size="small"
                              variant="soft"
                            />
                          </TableCell>
                          <TableCell>{caseRecord.cux_Account__r?.Name || '—'}</TableCell>
                          <TableCell>{caseRecord.cux_Category__c || '—'}</TableCell>
                          <TableCell>
                            {caseRecord.CreatedDate
                              ? dayjs(caseRecord.CreatedDate).format('MMM D, YYYY')
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
                    {cases.length} case{cases.length !== 1 ? 's' : ''}
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
