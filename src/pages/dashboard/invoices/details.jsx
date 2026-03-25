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
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr/ArrowLeft'
import { Helmet } from 'react-helmet-async'

import { appConfig } from '@/config/app'
import { paths } from '@/paths'
import { RouterLink } from '@/components/core/link'
import { PropertyItem } from '@/components/core/property-item'
import { PropertyList } from '@/components/core/property-list'
import { AnimatedPage } from '@/components/core/animations'

const metadata = { title: `Details | Invoices | Dashboard | ${appConfig.name}` }

const statusColorMap = {
  Draft: 'default',
  Review: 'warning',
  Approval: 'info',
  Paid: 'success',
  Rejected: 'error',
  Void: 'default',
}

function formatCurrency(value) {
  if (value == null) return '$0.00'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

const demoInvoice = {
  Id: 'demo-001',
  Name: 'INV-0001',
  cux_Status__c: 'Draft',
  cux_Category__c: 'Labor',
  cux_Amount__c: 15000,
  cux_Invoice_Date__c: '2025-01-15',
  cux_Total_Hours__c: 120,
  cux_Description__c: 'Sample invoice for demo purposes.',
}

export function Page() {
  const invoice = demoInvoice

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
                  href={paths.dashboard.invoices.list}
                  sx={{ alignItems: 'center', display: 'inline-flex', gap: 1 }}
                  variant="subtitle2"
                >
                  <ArrowLeftIcon fontSize="var(--icon-fontSize-md)" />
                  Invoices
                </Link>
              </div>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ alignItems: 'flex-start' }}>
                <Box sx={{ flex: '1 1 auto' }}>
                  <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                    <Typography variant="h4">{invoice.Name}</Typography>
                    <Chip
                      color={statusColorMap[invoice.cux_Status__c] || 'default'}
                      label={invoice.cux_Status__c}
                      size="small"
                      variant="soft"
                    />
                  </Stack>
                  <Typography color="text.secondary" variant="body2">
                    {invoice.cux_Category__c || 'Invoice'}
                  </Typography>
                </Box>
              </Stack>
            </Stack>

            <Grid container spacing={4}>
              <Grid size={{ md: 8, xs: 12 }}>
                <Card>
                  <CardHeader title="Invoice Information" />
                  <CardContent>
                    <Card sx={{ borderRadius: 1 }} variant="outlined">
                      <PropertyList divider={<Divider />} sx={{ '--PropertyItem-padding': '12px 24px' }}>
                        <PropertyItem name="Invoice Number" value={invoice.Name} />
                        <PropertyItem name="Category" value={invoice.cux_Category__c || '\u2014'} />
                        <PropertyItem
                          name="Status"
                          value={
                            <Chip
                              color={statusColorMap[invoice.cux_Status__c] || 'default'}
                              label={invoice.cux_Status__c}
                              size="small"
                              variant="outlined"
                            />
                          }
                        />
                        <PropertyItem name="Invoice Date" value={invoice.cux_Invoice_Date__c || '\u2014'} />
                        <PropertyItem name="Total Hours" value={invoice.cux_Total_Hours__c ? `${invoice.cux_Total_Hours__c} hrs` : '\u2014'} />
                      </PropertyList>
                    </Card>
                  </CardContent>
                </Card>

                {invoice.cux_Description__c ? (
                  <Card sx={{ mt: 4 }}>
                    <CardHeader title="Notes" />
                    <CardContent sx={{ pt: 0 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                        {invoice.cux_Description__c}
                      </Typography>
                    </CardContent>
                  </Card>
                ) : null}
              </Grid>

              <Grid size={{ md: 4, xs: 12 }}>
                <Card>
                  <CardHeader title="Summary" />
                  <CardContent>
                    <Stack spacing={2}>
                      <Stack direction="row" spacing={3} sx={{ justifyContent: 'space-between' }}>
                        <Typography variant="body2">Invoice Amount</Typography>
                        <Typography variant="body2">{formatCurrency(invoice.cux_Amount__c)}</Typography>
                      </Stack>
                      <Divider />
                      <Stack direction="row" spacing={3} sx={{ justifyContent: 'space-between' }}>
                        <Typography variant="subtitle1">Total Due</Typography>
                        <Typography variant="subtitle1">{formatCurrency(invoice.cux_Amount__c)}</Typography>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Stack>
        </Box>
      </AnimatedPage>
    </React.Fragment>
  )
}
