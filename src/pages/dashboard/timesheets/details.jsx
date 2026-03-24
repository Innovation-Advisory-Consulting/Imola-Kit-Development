import * as React from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
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

const metadata = { title: `Details | Timesheets | Dashboard | ${appConfig.name}` }

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
  const { timesheetId } = useParams()

  const { data: timesheet, loading, error } = useSalesforceQuery(
    (client) => client.getTimesheet(timesheetId),
    [timesheetId]
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
        Failed to load timesheet: {error.message}
      </Alert>
    )
  }

  if (!timesheet) {
    return (
      <Alert severity="warning" sx={{ m: 3 }}>
        Timesheet not found
      </Alert>
    )
  }

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
                href={paths.dashboard.timesheets.list}
                sx={{ alignItems: 'center', display: 'inline-flex', gap: 1 }}
                variant="subtitle2"
              >
                <ArrowLeftIcon fontSize="var(--icon-fontSize-md)" />
                Timesheets
              </Link>
            </div>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ alignItems: 'flex-start' }}>
              <Stack sx={{ flex: '1 1 auto' }} spacing={1}>
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                  <Typography variant="h4">{timesheet.Name}</Typography>
                  <Chip
                    color={statusColorMap[timesheet.cux_Status__c] || 'default'}
                    label={timesheet.cux_Status__c}
                    size="small"
                    variant="soft"
                  />
                </Stack>
                <Typography color="text.secondary" variant="body1">
                  {timesheet.cux_Worker_Name__c || 'Unknown Worker'}
                </Typography>
              </Stack>
            </Stack>
          </Stack>

          <Grid container spacing={4}>
            <Grid size={{ lg: 6, xs: 12 }}>
              <Card>
                <CardHeader title="Timesheet Details" />
                <Divider />
                <PropertyList divider={<Divider />} sx={{ '--PropertyItem-padding': '12px 24px' }}>
                  {[
                    { key: 'TS #', value: timesheet.Name },
                    { key: 'Worker Name', value: timesheet.cux_Worker_Name__c },
                    { key: 'Status', value: timesheet.cux_Status__c },
                    { key: 'Category', value: timesheet.cux_Category__c },
                    { key: 'Task Order', value: timesheet.cux_Task_Order__r?.Name },
                    { key: 'Contract', value: timesheet.cux_Contract__r?.Name },
                    { key: 'Invoice', value: timesheet.cux_Invoice__r?.Name },
                  ].map((item) => (
                    <PropertyItem key={item.key} name={item.key} value={item.value} />
                  ))}
                </PropertyList>
              </Card>
            </Grid>
            <Grid size={{ lg: 6, xs: 12 }}>
              <Card>
                <CardHeader title="Work Details" />
                <Divider />
                <PropertyList divider={<Divider />} sx={{ '--PropertyItem-padding': '12px 24px' }}>
                  {[
                    {
                      key: 'Work Date',
                      value: timesheet.cux_Work_Date__c ? dayjs(timesheet.cux_Work_Date__c).format('MMM D, YYYY') : null,
                    },
                    {
                      key: 'Hours',
                      value: timesheet.cux_Hours__c != null ? Number(timesheet.cux_Hours__c).toFixed(1) : null,
                    },
                    { key: 'Hourly Rate', value: formatCurrency(timesheet.cux_Hourly_Rate__c) },
                    { key: 'Total Amount', value: formatCurrency(timesheet.cux_Total_Amount__c) },
                  ].map((item) => (
                    <PropertyItem key={item.key} name={item.key} value={item.value} />
                  ))}
                </PropertyList>
              </Card>
            </Grid>
            {timesheet.cux_Description__c ? (
              <Grid size={{ xs: 12 }}>
                <Card>
                  <CardHeader title="Description" />
                  <Divider />
                  <CardContent>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {timesheet.cux_Description__c}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ) : null}
          </Grid>
        </Stack>
      </Box>
      </AnimatedPage>
    </React.Fragment>
  )
}
