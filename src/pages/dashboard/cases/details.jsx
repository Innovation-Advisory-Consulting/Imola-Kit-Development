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

const metadata = { title: `Details | Cases | Dashboard | ${appConfig.name}` }

const statusColorMap = {
  Open: 'info',
  'In Progress': 'warning',
  Escalated: 'error',
  Resolved: 'success',
  Closed: 'default',
}

export function Page() {
  const { caseId } = useParams()

  const { data: caseRecord, loading, error } = useSalesforceQuery(
    (client) => client.getCase(caseId),
    [caseId]
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
        Failed to load case: {error.message}
      </Alert>
    )
  }

  if (!caseRecord) {
    return (
      <Alert severity="warning" sx={{ m: 3 }}>
        Case not found
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
                href={paths.dashboard.cases.list}
                sx={{ alignItems: 'center', display: 'inline-flex', gap: 1 }}
                variant="subtitle2"
              >
                <ArrowLeftIcon fontSize="var(--icon-fontSize-md)" />
                Cases
              </Link>
            </div>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ alignItems: 'flex-start' }}>
              <Stack sx={{ flex: '1 1 auto' }} spacing={1}>
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                  <Typography variant="h4">{caseRecord.Name}</Typography>
                  <Chip
                    color={statusColorMap[caseRecord.cux_Status__c] || 'default'}
                    label={caseRecord.cux_Status__c}
                    size="small"
                    variant="soft"
                  />
                </Stack>
                <Typography color="text.secondary" variant="body1">
                  {caseRecord.cux_Subject__c || 'No Subject'}
                </Typography>
              </Stack>
            </Stack>
          </Stack>

          <Grid container spacing={4}>
            <Grid size={{ lg: 6, xs: 12 }}>
              <Card>
                <CardHeader title="Case Details" />
                <Divider />
                <PropertyList divider={<Divider />} sx={{ '--PropertyItem-padding': '12px 24px' }}>
                  {[
                    { key: 'Case #', value: caseRecord.Name },
                    { key: 'Subject', value: caseRecord.cux_Subject__c },
                    { key: 'Status', value: caseRecord.cux_Status__c },
                    { key: 'Priority', value: caseRecord.cux_Priority__c },
                    { key: 'Category', value: caseRecord.cux_Category__c },
                  ].map((item) => (
                    <PropertyItem key={item.key} name={item.key} value={item.value} />
                  ))}
                </PropertyList>
              </Card>
            </Grid>
            <Grid size={{ lg: 6, xs: 12 }}>
              <Card>
                <CardHeader title="Parties & Dates" />
                <Divider />
                <PropertyList divider={<Divider />} sx={{ '--PropertyItem-padding': '12px 24px' }}>
                  {[
                    { key: 'Account', value: caseRecord.cux_Account__r?.Name },
                    { key: 'Contact', value: caseRecord.cux_Contact__r?.Name },
                    { key: 'Contract', value: caseRecord.cux_Contract__r?.Name },
                    {
                      key: 'Created Date',
                      value: caseRecord.CreatedDate ? dayjs(caseRecord.CreatedDate).format('MMM D, YYYY') : null,
                    },
                    {
                      key: 'Resolved At',
                      value: caseRecord.cux_Resolved_At__c ? dayjs(caseRecord.cux_Resolved_At__c).format('MMM D, YYYY') : null,
                    },
                    {
                      key: 'Closed At',
                      value: caseRecord.cux_Closed_At__c ? dayjs(caseRecord.cux_Closed_At__c).format('MMM D, YYYY') : null,
                    },
                  ].map((item) => (
                    <PropertyItem key={item.key} name={item.key} value={item.value} />
                  ))}
                </PropertyList>
              </Card>
            </Grid>
            {caseRecord.cux_Description__c ? (
              <Grid size={{ xs: 12 }}>
                <Card>
                  <CardHeader title="Description" />
                  <Divider />
                  <CardContent>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {caseRecord.cux_Description__c}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ) : null}
            {caseRecord.cux_Resolution__c ? (
              <Grid size={{ xs: 12 }}>
                <Card>
                  <CardHeader title="Resolution" />
                  <Divider />
                  <CardContent>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {caseRecord.cux_Resolution__c}
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
