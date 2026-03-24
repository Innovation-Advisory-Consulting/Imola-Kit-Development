import * as React from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
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
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr/ArrowLeft'
import { Helmet } from 'react-helmet-async'
import { useParams } from 'react-router-dom'

import { appConfig } from '@/config/app'
import { paths } from '@/paths'
import { dayjs } from '@/lib/dayjs'
import { RouterLink } from '@/components/core/link'
import { PropertyItem } from '@/components/core/property-item'
import { PropertyList } from '@/components/core/property-list'
import { useSalesforceQuery } from '@/hooks/use-salesforce'
import { AnimatedPage } from '@/components/core/animations'

const metadata = { title: `Details | Validation Requests | Dashboard | ${appConfig.name}` }

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

const resultOutcomeColorMap = {
  PASS: 'success',
  WARN: 'warning',
  FAIL: 'error',
}

const severityColorMap = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'error',
}

export function Page() {
  const { requestId } = useParams()

  const { data: request, loading, error } = useSalesforceQuery(
    (client) => client.getValidationRequest(requestId),
    [requestId]
  )

  const { data: results, loading: resultsLoading } = useSalesforceQuery(
    (client) => client.getValidationResults(requestId),
    [requestId]
  )

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        Failed to load validation request: {error.message}
      </Alert>
    )
  }

  if (!request) {
    return (
      <Alert severity="warning" sx={{ m: 3 }}>
        Validation request not found
      </Alert>
    )
  }

  const passCount = results?.filter((r) => r.cux_Outcome__c === 'PASS').length || 0
  const warnCount = results?.filter((r) => r.cux_Outcome__c === 'WARN').length || 0
  const failCount = results?.filter((r) => r.cux_Outcome__c === 'FAIL').length || 0
  const totalCount = results?.length || 0

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
          <Stack spacing={3}>
            <div>
              <Link
                color="text.primary"
                component={RouterLink}
                href={paths.dashboard.validations.requests.list}
                sx={{ alignItems: 'center', display: 'inline-flex', gap: 1 }}
                variant="subtitle2"
              >
                <ArrowLeftIcon fontSize="var(--icon-fontSize-md)" />
                Validation Requests
              </Link>
            </div>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ alignItems: 'flex-start' }}>
              <Stack sx={{ flex: '1 1 auto' }} spacing={1}>
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                  <Typography variant="h4">{request.Name}</Typography>
                  <Chip
                    color={statusColorMap[request.cux_Status__c] || 'default'}
                    label={request.cux_Status__c}
                    size="small"
                    variant="soft"
                  />
                </Stack>
              </Stack>
            </Stack>
          </Stack>

          {/* ─── Request Details ─── */}
          <Card>
            <CardHeader title="Request Details" />
            <Divider />
            <CardContent>
              <PropertyList divider={<Divider />} stripe="odd" sx={{ '--PropertyItem-padding': '12px 24px' }}>
                <PropertyItem name="Target Type" value={request.cux_Target_Type__c || '—'} />
                <PropertyItem name="Target ID" value={request.cux_Target_Id__c || '—'} />
                <PropertyItem
                  name="Status"
                  value={
                    <Chip
                      color={statusColorMap[request.cux_Status__c] || 'default'}
                      label={request.cux_Status__c}
                      size="small"
                      variant="soft"
                    />
                  }
                />
                <PropertyItem
                  name="Outcome"
                  value={
                    request.cux_Outcome__c ? (
                      <Chip
                        color={outcomeColorMap[request.cux_Outcome__c] || 'default'}
                        label={request.cux_Outcome__c}
                        size="small"
                        variant="soft"
                      />
                    ) : (
                      '—'
                    )
                  }
                />
                <PropertyItem name="Profile" value={request.cux_Validation_Profile__r?.cux_Profile_Name__c || '—'} />
                <PropertyItem name="Profile Version" value={request.cux_Profile_Version__c || '—'} />
                <PropertyItem name="Rule Set Version" value={request.cux_Rule_Set_Version__c || '—'} />
                <PropertyItem
                  name="Requested At"
                  value={request.cux_Requested_At__c ? dayjs(request.cux_Requested_At__c).format('MMM D, YYYY h:mm A') : '—'}
                />
                <PropertyItem
                  name="Completed At"
                  value={request.cux_Completed_At__c ? dayjs(request.cux_Completed_At__c).format('MMM D, YYYY h:mm A') : '—'}
                />
                <PropertyItem name="Idempotency Key" value={request.cux_Idempotency_Key__c || '—'} />
                <PropertyItem name="Correlation ID" value={request.cux_Correlation_Id__c || '—'} />
              </PropertyList>
            </CardContent>
          </Card>

          {/* ─── Validation Results ─── */}
          <Card>
            <CardHeader
              title="Validation Results"
              subheader={
                totalCount > 0 ? (
                  <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Total: <strong>{totalCount}</strong>
                    </Typography>
                    <Typography variant="body2" color="success.main">
                      Pass: <strong>{passCount}</strong>
                    </Typography>
                    <Typography variant="body2" color="warning.main">
                      Warn: <strong>{warnCount}</strong>
                    </Typography>
                    <Typography variant="body2" color="error.main">
                      Fail: <strong>{failCount}</strong>
                    </Typography>
                  </Stack>
                ) : undefined
              }
            />
            <Divider />
            {resultsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : !results?.length ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary" variant="body2">
                  No validation results found
                </Typography>
              </Box>
            ) : (
              <Box sx={{ overflowX: 'auto' }}>
                <Table sx={{ minWidth: 900 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Result #</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Outcome</TableCell>
                      <TableCell>Severity</TableCell>
                      <TableCell>Message</TableCell>
                      <TableCell>Exec Mode</TableCell>
                      <TableCell>Task Code</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {results.map((result) => (
                      <TableRow hover key={result.Id} sx={{ '&:last-child td': { border: 0 } }}>
                        <TableCell>
                          <Typography variant="subtitle2">{result.Name}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={result.cux_Result_Type__c} size="small" variant="soft" />
                        </TableCell>
                        <TableCell>
                          {result.cux_Outcome__c ? (
                            <Chip
                              color={resultOutcomeColorMap[result.cux_Outcome__c] || 'default'}
                              label={result.cux_Outcome__c}
                              size="small"
                              variant="soft"
                            />
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell>
                          {result.cux_Severity__c ? (
                            <Chip
                              color={severityColorMap[result.cux_Severity__c] || 'default'}
                              label={result.cux_Severity__c}
                              size="small"
                              variant="soft"
                            />
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ maxWidth: 300 }} noWrap>
                            {result.cux_Message__c || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>{result.cux_Execution_Mode__c || '—'}</TableCell>
                        <TableCell>
                          {result.cux_Result_Type__c === 'CHECKLIST'
                            ? result.cux_Baseline_Task_Template__r?.cux_Task_Code__c || '—'
                            : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}
          </Card>
        </Stack>
      </Box>
      </AnimatedPage>
    </React.Fragment>
  )
}
