import * as React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr/ArrowLeft'
import { Helmet } from 'react-helmet-async'

import { appConfig } from '@/config/app'
import { paths } from '@/paths'
import { RouterLink } from '@/components/core/link'
import { AnimatedPage } from '@/components/core/animations'

const metadata = { title: `Create | Vendors | Dashboard | ${appConfig.name}` }

export function Page() {
  const handleSubmit = (event) => {
    event.preventDefault()
    // Static demo - no backend
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
                  href={paths.dashboard.customers.list}
                  sx={{ alignItems: 'center', display: 'inline-flex', gap: 1 }}
                  variant="subtitle2"
                >
                  <ArrowLeftIcon fontSize="var(--icon-fontSize-md)" />
                  Vendors
                </Link>
              </div>
              <div>
                <Typography variant="h4">New Vendor</Typography>
              </div>
            </Stack>

            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                <Card>
                  <CardHeader title="Company Information" />
                  <Divider />
                  <CardContent>
                    <Grid container spacing={3}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField fullWidth label="Company Name" name="name" required />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField fullWidth label="Account Number" name="accountNumber" />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField fullWidth label="Phone" name="phone" />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField fullWidth label="Website" name="website" />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField fullWidth label="Industry" name="industry" />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField fullWidth label="Type" name="type" />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader title="Billing Address" />
                  <Divider />
                  <CardContent>
                    <Grid container spacing={3}>
                      <Grid size={{ xs: 12 }}>
                        <TextField fullWidth label="Street" name="billingStreet" multiline rows={2} />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField fullWidth label="City" name="billingCity" />
                      </Grid>
                      <Grid size={{ xs: 12, md: 3 }}>
                        <TextField fullWidth label="State" name="billingState" />
                      </Grid>
                      <Grid size={{ xs: 12, md: 3 }}>
                        <TextField fullWidth label="Postal Code" name="billingPostalCode" />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField fullWidth label="Country" name="billingCountry" />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader title="Additional Information" />
                  <Divider />
                  <CardContent>
                    <TextField fullWidth label="Description" name="description" multiline rows={4} />
                  </CardContent>
                </Card>

                <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
                  <Button component={RouterLink} href={paths.dashboard.customers.list} color="secondary">
                    Cancel
                  </Button>
                  <Button type="submit" variant="contained">
                    Create Vendor
                  </Button>
                </Stack>
              </Stack>
            </form>
          </Stack>
        </Box>
      </AnimatedPage>
    </React.Fragment>
  )
}
