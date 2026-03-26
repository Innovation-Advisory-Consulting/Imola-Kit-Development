import * as React from 'react'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
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
import { queryAccounts } from '@/lib/dataverse/client'

const metadata = { title: `Customers | Dashboard | ${appConfig.name}` }

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
  const [accounts, setAccounts] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(null)

  React.useEffect(() => {
    queryAccounts({
      select: ['accountid', 'name', 'telephone1', 'address1_city', 'address1_country', 'industrycode', 'customertypecode', 'statecode'],
      orderby: 'name asc',
    })
      .then(setAccounts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <React.Fragment>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>
      <AnimatedPage>
        <Box sx={{ maxWidth: 'var(--Content-maxWidth)', m: 'var(--Content-margin)', p: 'var(--Content-padding)', width: 'var(--Content-width)' }}>
          <Stack spacing={4}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ alignItems: 'flex-start' }}>
              <Box sx={{ flex: '1 1 auto' }}>
                <Typography variant="h4">Customers</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button component={RouterLink} href={paths.dashboard.customers.create} startIcon={<PlusIcon />} variant="contained">
                  New Customer
                </Button>
              </Box>
            </Stack>

            <Card>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Box sx={{ p: 3 }}>
                  <Typography color="error" variant="body2">{error}</Typography>
                </Box>
              ) : (
                <Box sx={{ overflowX: 'auto' }}>
                  <Table sx={{ minWidth: 700 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Company</TableCell>
                        <TableCell>Industry</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Phone</TableCell>
                        <TableCell>Location</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {accounts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} sx={{ textAlign: 'center', color: 'text.secondary', py: 4 }}>
                            No customers found
                          </TableCell>
                        </TableRow>
                      ) : (
                        accounts.map((row) => (
                          <TableRow hover key={row.accountid}>
                            <TableCell>
                              <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                                <Avatar sx={{ bgcolor: 'var(--mui-palette-primary-50)', color: 'var(--mui-palette-primary-main)', fontSize: '0.875rem', fontWeight: 600 }}>
                                  {getInitials(row.name)}
                                </Avatar>
                                <Link color="text.primary" component={RouterLink} href={paths.dashboard.customers.details(row.accountid)} variant="subtitle2">
                                  {row.name}
                                </Link>
                              </Stack>
                            </TableCell>
                            <TableCell>
                              {row.industrycode != null ? (
                                <Chip label={INDUSTRY_LABELS[row.industrycode] ?? row.industrycode} size="small" variant="soft" />
                              ) : '—'}
                            </TableCell>
                            <TableCell>{TYPE_LABELS[row.customertypecode] ?? '—'}</TableCell>
                            <TableCell>{row.telephone1 || '—'}</TableCell>
                            <TableCell>{[row.address1_city, row.address1_country].filter(Boolean).join(', ') || '—'}</TableCell>
                            <TableCell>
                              <Chip
                                color={row.statecode === 0 ? 'success' : 'default'}
                                label={row.statecode === 0 ? 'Active' : 'Inactive'}
                                size="small"
                                variant="soft"
                              />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
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
