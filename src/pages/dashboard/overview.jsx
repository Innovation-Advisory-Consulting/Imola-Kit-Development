import * as React from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Helmet } from 'react-helmet-async'

import { appConfig } from '@/config/app'

const metadata = { title: `Overview | Dashboard | ${appConfig.name}` }

export function Page() {
  return (
    <React.Fragment>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>
      <Box
        sx={{
          maxWidth: 'var(--Content-maxWidth)',
          m: 'var(--Content-margin)',
          p: 'var(--Content-padding)',
          width: 'var(--Content-width)',
        }}
      >
        <Stack spacing={4}>
          <div>
            <Typography variant="h4">Overview</Typography>
          </div>

          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="h3" gutterBottom>
                Welcome to Imola Kit
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Your application dashboard. Use the navigation to explore features.
              </Typography>
            </CardContent>
          </Card>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="overline" color="text.secondary">
                    Users
                  </Typography>
                  <Typography variant="h4">1,024</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active accounts
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="overline" color="text.secondary">
                    Projects
                  </Typography>
                  <Typography variant="h4">48</Typography>
                  <Typography variant="body2" color="text.secondary">
                    In progress
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="overline" color="text.secondary">
                    Tasks
                  </Typography>
                  <Typography variant="h4">312</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed this month
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="overline" color="text.secondary">
                    Uptime
                  </Typography>
                  <Typography variant="h4">99.9%</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Last 30 days
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Stack>
      </Box>
    </React.Fragment>
  )
}
