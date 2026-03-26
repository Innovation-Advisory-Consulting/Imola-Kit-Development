import * as React from 'react'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr/ArrowLeft'
import { BuildingsIcon } from '@phosphor-icons/react/dist/ssr/Buildings'
import { Helmet } from 'react-helmet-async'
import { useParams } from 'react-router-dom'

import { appConfig } from '@/config/app'
import { paths } from '@/paths'
import { RouterLink } from '@/components/core/link'
import { PropertyItem } from '@/components/core/property-item'
import { PropertyList } from '@/components/core/property-list'
import { AnimatedPage } from '@/components/core/animations'
import { fetchAccount } from '@/lib/dataverse/client'

const metadata = { title: `Details | Customers | Dashboard | ${appConfig.name}` }

const INDUSTRY_LABELS = {
  1: 'Accounting', 2: 'Agriculture', 3: 'Broadcasting', 4: 'Brokers',
  5: 'Building Supply Retail', 6: 'Business Services', 7: 'Consulting',
  8: 'Consumer Services', 9: 'Design', 10: 'Distributors', 11: "Doctor's Offices",
  12: 'Durable Manufacturing', 13: 'Eating & Drinking', 14: 'Entertainment Retail',
  15: 'Equipment Rental', 16: 'Financial', 17: 'Food & Tobacco', 18: 'Inbound Capital',
  19: 'Inbound Repair', 20: 'Insurance', 21: 'Legal Services', 22: 'Non-Durable Retail',
  23: 'Outbound Services', 24: 'Petrochemical', 25: 'Service Retail', 26: 'SIG',
  27: 'Social Services', 28: 'Trade Contractors', 29: 'Specialty Realty',
  30: 'Transportation', 31: 'Utility', 32: 'Vehicle Retail', 33: 'Wholesale',
}

const TYPE_LABELS = {
  1: 'Competitor', 2: 'Consultant', 3: 'Customer', 4: 'Investor', 5: 'Partner',
  6: 'Influencer', 7: 'Press', 8: 'Prospect', 9: 'Reseller', 10: 'Supplier',
  11: 'Vendor', 12: 'Other',
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

export function Page() {
  const { customerId } = useParams()
  const [account, setAccount] = React.useState(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(null)

  React.useEffect(() => {
    if (!customerId) return
    fetchAccount(customerId)
      .then(setAccount)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [customerId])

  return (
    <React.Fragment>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>
      <AnimatedPage>
        <Box sx={{ maxWidth: 'var(--Content-maxWidth)', m: 'var(--Content-margin)', p: 'var(--Content-padding)', width: 'var(--Content-width)' }}>
          <Stack spacing={4}>
            <Stack spacing={3}>
              <div>
                <Link
                  color="text.primary"
                  component={RouterLink}
                  href={paths.dashboard.customers.list}
                  sx={{ alignItems: 'center', display: 'inline-flex', gap: 1 }}
                  variant="subtitle2"
                >
                  <ArrowLeftIcon fontSize="var(--icon-fontSize-md)" />
                  Customers
                </Link>
              </div>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Typography color="error" variant="body2">{error}</Typography>
              ) : account ? (
                <>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ alignItems: 'flex-start' }}>
                    <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flex: '1 1 auto' }}>
                      <Avatar sx={{ '--Avatar-size': '64px', bgcolor: 'var(--mui-palette-primary-50)', color: 'var(--mui-palette-primary-main)', fontSize: '1.25rem', fontWeight: 700 }}>
                        {getInitials(account.name)}
                      </Avatar>
                      <div>
                        <Typography variant="h4">{account.name}</Typography>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 0.5 }}>
                          {account.industrycode != null && (
                            <Chip label={INDUSTRY_LABELS[account.industrycode] ?? account.industrycode} size="small" variant="soft" color="primary" />
                          )}
                          {account.customertypecode != null && (
                            <Chip label={TYPE_LABELS[account.customertypecode] ?? account.customertypecode} size="small" variant="outlined" />
                          )}
                          <Chip
                            color={account.statecode === 0 ? 'success' : 'default'}
                            label={account.statecode === 0 ? 'Active' : 'Inactive'}
                            size="small"
                            variant="soft"
                          />
                        </Stack>
                      </div>
                    </Stack>
                  </Stack>

                  <Grid container spacing={4}>
                    <Grid size={{ lg: 4, xs: 12 }}>
                      <Stack spacing={4}>
                        <Card>
                          <CardHeader
                            avatar={<Avatar><BuildingsIcon fontSize="var(--Icon-fontSize)" /></Avatar>}
                            title="Company Details"
                          />
                          <PropertyList divider={<Divider />} orientation="vertical" sx={{ '--PropertyItem-padding': '12px 24px' }}>
                            {account.accountnumber && (
                              <PropertyItem name="Account #" value={account.accountnumber} />
                            )}
                            <PropertyItem name="Phone" value={account.telephone1 || '—'} />
                            <PropertyItem name="Email" value={account.emailaddress1 || '—'} />
                            <PropertyItem
                              name="Website"
                              value={
                                account.websiteurl ? (
                                  <Link href={account.websiteurl} target="_blank" rel="noopener" variant="body2">
                                    {account.websiteurl.replace(/^https?:\/\//, '')}
                                  </Link>
                                ) : '—'
                              }
                            />
                            {account.numberofemployees != null && (
                              <PropertyItem name="Employees" value={account.numberofemployees.toLocaleString()} />
                            )}
                            <PropertyItem
                              name="Address"
                              value={[account.address1_line1, account.address1_city, account.address1_stateorprovince, account.address1_postalcode, account.address1_country].filter(Boolean).join(', ') || '—'}
                            />
                          </PropertyList>
                        </Card>

                        {account.description && (
                          <Card>
                            <CardHeader title="Description" />
                            <CardContent>
                              <Typography variant="body2" color="text.secondary">
                                {account.description}
                              </Typography>
                            </CardContent>
                          </Card>
                        )}
                      </Stack>
                    </Grid>

                    <Grid size={{ lg: 8, xs: 12 }}>
                      <Card>
                        <CardContent>
                          <Typography color="text.secondary" variant="body2" sx={{ textAlign: 'center' }}>
                            No additional data available.
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </>
              ) : null}
            </Stack>
          </Stack>
        </Box>
      </AnimatedPage>
    </React.Fragment>
  )
}
