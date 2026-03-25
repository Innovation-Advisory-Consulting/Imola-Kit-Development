import * as React from 'react'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus'
import { Helmet } from 'react-helmet-async'

import { appConfig } from '@/config/app'
import { paths } from '@/paths'
import { RouterLink } from '@/components/core/link'
import { AnimatedPage } from '@/components/core/animations'

const metadata = { title: `Vendors | Dashboard | ${appConfig.name}` }

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

const demoAccounts = [
  { Id: '1', Name: 'Acme Corp', Industry: 'Consulting', Type: 'Vendor', Phone: '(555) 123-4567', BillingCity: 'San Francisco', BillingState: 'CA' },
  { Id: '2', Name: 'Globex Inc', Industry: 'Electronics', Type: 'Vendor', Phone: '(555) 987-6543', BillingCity: 'Austin', BillingState: 'TX' },
  { Id: '3', Name: 'Initech LLC', Industry: 'Construction', Type: 'Subcontractor', Phone: '(555) 456-7890', BillingCity: 'Denver', BillingState: 'CO' },
  { Id: '4', Name: 'Umbrella Corp', Industry: 'Biotechnology', Type: 'Vendor', Phone: '(555) 321-0987', BillingCity: 'Chicago', BillingState: 'IL' },
]

const industryColors = {
  Consulting: 'secondary',
  Construction: 'warning',
  Electronics: 'primary',
  Biotechnology: 'success',
}

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
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ alignItems: 'flex-start' }}>
              <Box sx={{ flex: '1 1 auto' }}>
                <Typography variant="h4">Vendors</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  component={RouterLink}
                  href={paths.dashboard.customers.create}
                  startIcon={<PlusIcon />}
                  variant="contained"
                >
                  New Vendor
                </Button>
              </Box>
            </Stack>

            <Card>
              <Box sx={{ overflowX: 'auto' }}>
                <Table sx={{ minWidth: 700 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Company</TableCell>
                      <TableCell>Industry</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Phone</TableCell>
                      <TableCell>Location</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {demoAccounts.map((row) => (
                      <TableRow hover key={row.Id}>
                        <TableCell>
                          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                            <Avatar
                              sx={{
                                bgcolor: 'var(--mui-palette-primary-50)',
                                color: 'var(--mui-palette-primary-main)',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                              }}
                            >
                              {getInitials(row.Name)}
                            </Avatar>
                            <Link color="text.primary" component={RouterLink} href={paths.dashboard.customers.details(row.Id)} variant="subtitle2">
                              {row.Name}
                            </Link>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          {row.Industry ? (
                            <Chip color={industryColors[row.Industry] || 'default'} label={row.Industry} size="small" variant="soft" />
                          ) : '\u2014'}
                        </TableCell>
                        <TableCell>{row.Type || '\u2014'}</TableCell>
                        <TableCell>{row.Phone || '\u2014'}</TableCell>
                        <TableCell>{[row.BillingCity, row.BillingState].filter(Boolean).join(', ') || '\u2014'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Card>
          </Stack>
        </Box>
      </AnimatedPage>
    </React.Fragment>
  )
}
