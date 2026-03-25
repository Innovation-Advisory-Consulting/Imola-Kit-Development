import * as React from 'react'
import Avatar from '@mui/material/Avatar'
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
import { BuildingsIcon } from '@phosphor-icons/react/dist/ssr/Buildings'
import { Helmet } from 'react-helmet-async'

import { appConfig } from '@/config/app'
import { paths } from '@/paths'
import { RouterLink } from '@/components/core/link'
import { PropertyItem } from '@/components/core/property-item'
import { PropertyList } from '@/components/core/property-list'
import { AnimatedPage } from '@/components/core/animations'

const metadata = { title: `Details | Vendors | Dashboard | ${appConfig.name}` }

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

const demoAccount = {
  Id: 'demo-001',
  Name: 'Acme Corp',
  Industry: 'Consulting',
  Type: 'Vendor',
  Phone: '(555) 123-4567',
  Website: 'https://acme.example.com',
  BillingCity: 'San Francisco',
  BillingState: 'CA',
  BillingCountry: 'US',
  Description: 'A leading consulting firm specializing in digital transformation.',
}

export function Page() {
  const account = demoAccount

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
                  href={paths.dashboard.customers.list}
                  sx={{ alignItems: 'center', display: 'inline-flex', gap: 1 }}
                  variant="subtitle2"
                >
                  <ArrowLeftIcon fontSize="var(--icon-fontSize-md)" />
                  Vendors
                </Link>
              </div>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ alignItems: 'flex-start' }}>
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flex: '1 1 auto' }}>
                  <Avatar
                    sx={{
                      '--Avatar-size': '64px',
                      bgcolor: 'var(--mui-palette-primary-50)',
                      color: 'var(--mui-palette-primary-main)',
                      fontSize: '1.25rem',
                      fontWeight: 700,
                    }}
                  >
                    {getInitials(account.Name)}
                  </Avatar>
                  <div>
                    <Typography variant="h4">{account.Name}</Typography>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 0.5 }}>
                      {account.Industry && (
                        <Chip label={account.Industry} size="small" variant="soft" color="primary" />
                      )}
                      {account.Type && (
                        <Chip label={account.Type} size="small" variant="outlined" />
                      )}
                    </Stack>
                  </div>
                </Stack>
              </Stack>
            </Stack>

            <Grid container spacing={4}>
              <Grid size={{ lg: 4, xs: 12 }}>
                <Stack spacing={4}>
                  <Card>
                    <CardHeader
                      avatar={
                        <Avatar>
                          <BuildingsIcon fontSize="var(--Icon-fontSize)" />
                        </Avatar>
                      }
                      title="Company Details"
                    />
                    <PropertyList
                      divider={<Divider />}
                      orientation="vertical"
                      sx={{ '--PropertyItem-padding': '12px 24px' }}
                    >
                      <PropertyItem name="Phone" value={account.Phone || '\u2014'} />
                      <PropertyItem
                        name="Website"
                        value={
                          account.Website ? (
                            <Link href={account.Website} target="_blank" rel="noopener" variant="body2">
                              {account.Website.replace(/^https?:\/\//, '')}
                            </Link>
                          ) : '\u2014'
                        }
                      />
                      <PropertyItem name="Industry" value={account.Industry || '\u2014'} />
                      <PropertyItem name="Type" value={account.Type || '\u2014'} />
                      <PropertyItem
                        name="Address"
                        value={[account.BillingCity, account.BillingState, account.BillingCountry].filter(Boolean).join(', ') || '\u2014'}
                      />
                    </PropertyList>
                  </Card>

                  {account.Description && (
                    <Card>
                      <CardHeader title="Description" />
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">
                          {account.Description}
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
                      No additional data available in demo mode.
                    </Typography>
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
