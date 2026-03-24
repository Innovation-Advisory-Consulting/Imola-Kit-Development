import * as React from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { ChartBarIcon } from '@phosphor-icons/react/dist/ssr/ChartBar'
import { ClipboardTextIcon } from '@phosphor-icons/react/dist/ssr/ClipboardText'
import { CurrencyDollarIcon } from '@phosphor-icons/react/dist/ssr/CurrencyDollar'
import { FileTextIcon } from '@phosphor-icons/react/dist/ssr/FileText'
import { FolderOpenIcon } from '@phosphor-icons/react/dist/ssr/FolderOpen'
import { Helmet } from 'react-helmet-async'

import { appConfig } from '@/config/app'
import { paths } from '@/paths'
import { AnimatedPage } from '@/components/core/animations'
import { RouterLink } from '@/components/core/link'

const metadata = { title: `Reports | Dashboard | ${appConfig.name}` }

const reports = [
  {
    key: 'funding-by-period',
    title: 'Funding by Period',
    description: 'Analyze allocated, obligated, and expended funding by month, quarter, or fiscal year across all contracts.',
    icon: CurrencyDollarIcon,
    href: paths.dashboard.reports.fundingByPeriod,
  },
  {
    key: 'contract-portfolio',
    title: 'Contract Portfolio Status',
    description: 'Portfolio-level view of all contracts with value, spend, status, and expiration tracking.',
    icon: FolderOpenIcon,
    href: paths.dashboard.reports.contractPortfolio,
  },
  {
    key: 'task-order-execution',
    title: 'Task Order Execution',
    description: 'Task orders grouped by contract showing authorized amount, invoiced spend, and burn rate.',
    icon: ClipboardTextIcon,
    href: paths.dashboard.reports.taskOrderExecution,
  },
  {
    key: 'invoice-tracking',
    title: 'Invoice Tracking & Payment',
    description: 'Invoice pipeline with status, aging, days pending, and payment readiness across all contracts.',
    icon: FileTextIcon,
    href: paths.dashboard.reports.invoiceTracking,
  },
]

export function Page() {
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
            <Typography variant="h4">Reports</Typography>

            <Grid container spacing={3}>
              {reports.map((report) => {
                const Icon = report.icon
                return (
                  <Grid key={report.key} size={{ xs: 12, sm: 6, md: 4 }}>
                    <Card sx={{ height: '100%' }}>
                      <CardActionArea component={RouterLink} href={report.href} sx={{ height: '100%' }}>
                        <CardContent>
                          <Stack spacing={2}>
                            <Box
                              sx={{
                                alignItems: 'center',
                                bgcolor: 'var(--mui-palette-primary-50)',
                                borderRadius: '12px',
                                color: 'var(--mui-palette-primary-main)',
                                display: 'flex',
                                height: 48,
                                justifyContent: 'center',
                                width: 48,
                              }}
                            >
                              <Icon fontSize="var(--icon-fontSize-lg)" />
                            </Box>
                            <Stack spacing={0.5}>
                              <Typography variant="h6">{report.title}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {report.description}
                              </Typography>
                            </Stack>
                          </Stack>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Grid>
                )
              })}
            </Grid>
          </Stack>
        </Box>
      </AnimatedPage>
    </React.Fragment>
  )
}
