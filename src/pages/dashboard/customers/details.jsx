import * as React from 'react'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr/ArrowLeft'
import { BuildingsIcon } from '@phosphor-icons/react/dist/ssr/Buildings'
import { CurrencyDollarIcon } from '@phosphor-icons/react/dist/ssr/CurrencyDollar'
import { EnvelopeSimpleIcon } from '@phosphor-icons/react/dist/ssr/EnvelopeSimple'
import { GlobeIcon } from '@phosphor-icons/react/dist/ssr/Globe'
import { MapPinIcon } from '@phosphor-icons/react/dist/ssr/MapPin'
import { PencilSimpleIcon } from '@phosphor-icons/react/dist/ssr/PencilSimple'
import { PhoneIcon } from '@phosphor-icons/react/dist/ssr/Phone'
import { UserIcon } from '@phosphor-icons/react/dist/ssr/User'
import { UsersIcon } from '@phosphor-icons/react/dist/ssr/Users'
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

const metadata = { title: `Details | Vendors | Dashboard | ${appConfig.name}` }

function getInitials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function Page() {
  const { customerId } = useParams()
  const { data: account, loading, error } = useSalesforceQuery(
    (client) => client.getAccount(customerId),
    [customerId]
  )
  const { data: contacts, loading: contactsLoading } = useSalesforceQuery(
    (client) => client.getAccountContacts(customerId),
    [customerId]
  )
  const { data: invoices, loading: invoicesLoading } = useSalesforceQuery(
    (client) => client.getAccountInvoices(customerId),
    [customerId]
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
        Failed to load vendor: {error.message}
      </Alert>
    )
  }

  if (!account) {
    return (
      <Alert severity="warning" sx={{ m: 3 }}>
        Vendor not found
      </Alert>
    )
  }

  const billingAddress = [account.BillingStreet, account.BillingCity, account.BillingState, account.BillingPostalCode, account.BillingCountry]
    .filter(Boolean)
    .join(', ')

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
              {/* ─── Left column: Company Details ─── */}
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
                      {[
                        { key: 'Account #', value: account.AccountNumber ? <Chip label={account.AccountNumber} size="small" variant="soft" /> : '\u2014' },
                        { key: 'Phone', value: account.Phone || '\u2014' },
                        {
                          key: 'Website',
                          value: account.Website ? (
                            <Link href={account.Website.startsWith('http') ? account.Website : `https://${account.Website}`} target="_blank" rel="noopener" variant="body2">
                              {account.Website.replace(/^https?:\/\//, '')}
                            </Link>
                          ) : '\u2014',
                        },
                        { key: 'Industry', value: account.Industry || '\u2014' },
                        { key: 'Type', value: account.Type || '\u2014' },
                        { key: 'Address', value: billingAddress || '\u2014' },
                      ].map((item) => (
                        <PropertyItem key={item.key} name={item.key} value={item.value} />
                      ))}
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

              {/* ─── Right column: Contacts + Payments ─── */}
              <Grid size={{ lg: 8, xs: 12 }}>
                <Stack spacing={4}>
                <Card>
                  <CardHeader
                    avatar={
                      <Avatar>
                        <UsersIcon fontSize="var(--Icon-fontSize)" />
                      </Avatar>
                    }
                    title={`Contacts (${contacts?.length ?? 0})`}
                  />
                  {contactsLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : !contacts?.length ? (
                    <CardContent>
                      <Typography color="text.secondary" variant="body2" sx={{ textAlign: 'center' }}>
                        No contacts associated with this vendor
                      </Typography>
                    </CardContent>
                  ) : (
                    <React.Fragment>
                      <Box sx={{ overflowX: 'auto' }}>
                        <Table sx={{ minWidth: 500 }}>
                          <TableHead>
                            <TableRow>
                              <TableCell>Name</TableCell>
                              <TableCell>Title</TableCell>
                              <TableCell>Email</TableCell>
                              <TableCell>Phone</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {contacts.map((contact) => (
                              <TableRow hover key={contact.Id} sx={{ '&:last-child td': { border: 0 } }}>
                                <TableCell>
                                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                                    <Avatar sx={{ '--Avatar-size': '36px', fontSize: '0.8rem' }}>
                                      {getInitials(`${contact.FirstName || ''} ${contact.LastName || ''}`)}
                                    </Avatar>
                                    <Typography variant="subtitle2">
                                      {[contact.FirstName, contact.LastName].filter(Boolean).join(' ')}
                                    </Typography>
                                  </Stack>
                                </TableCell>
                                <TableCell>{contact.Title || '\u2014'}</TableCell>
                                <TableCell>
                                  {contact.Email ? (
                                    <Link href={`mailto:${contact.Email}`} variant="body2">
                                      {contact.Email}
                                    </Link>
                                  ) : (
                                    '\u2014'
                                  )}
                                </TableCell>
                                <TableCell>{contact.Phone || '\u2014'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Box>
                      <Divider />
                      <Box sx={{ px: 3, py: 2 }}>
                        <Typography color="text.secondary" variant="body2">
                          {contacts.length} contact{contacts.length !== 1 ? 's' : ''}
                        </Typography>
                      </Box>
                    </React.Fragment>
                  )}
                </Card>

                {/* ─── Payments / Invoices ─── */}
                <Card>
                  <CardHeader
                    avatar={
                      <Avatar>
                        <CurrencyDollarIcon fontSize="var(--Icon-fontSize)" />
                      </Avatar>
                    }
                    title={`Invoices (${invoices?.length ?? 0})`}
                  />
                  <CardContent>
                    <Stack spacing={3}>
                      {(() => {
                        const rows = invoices || []
                        const totalAmount = rows.reduce((sum, inv) => sum + (inv.cux_Amount__c || 0), 0)
                        const paidRows = rows.filter((inv) => inv.cux_Status__c === 'Paid')
                        const paidAmount = paidRows.reduce((sum, inv) => sum + (inv.cux_Amount__c || 0), 0)
                        const fmt = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v)
                        return (
                          <Card sx={{ borderRadius: 1 }} variant="outlined">
                            <Stack
                              direction="row"
                              divider={<Divider flexItem orientation="vertical" />}
                              spacing={3}
                              sx={{ justifyContent: 'space-between', p: 2 }}
                            >
                              <div>
                                <Typography color="text.secondary" variant="overline">Total Invoices</Typography>
                                <Typography variant="h6">{rows.length}</Typography>
                              </div>
                              <div>
                                <Typography color="text.secondary" variant="overline">Total Amount</Typography>
                                <Typography variant="h6">{fmt(totalAmount)}</Typography>
                              </div>
                              <div>
                                <Typography color="text.secondary" variant="overline">Paid</Typography>
                                <Typography variant="h6">{fmt(paidAmount)}</Typography>
                              </div>
                            </Stack>
                          </Card>
                        )
                      })()}

                      {invoicesLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                          <CircularProgress size={24} />
                        </Box>
                      ) : !invoices?.length ? (
                        <Typography color="text.secondary" variant="body2" sx={{ textAlign: 'center' }}>
                          No invoices found for this vendor
                        </Typography>
                      ) : (
                        <Card sx={{ borderRadius: 1 }} variant="outlined">
                          <Box sx={{ overflowX: 'auto' }}>
                            <Table sx={{ minWidth: 500 }}>
                              <TableHead>
                                <TableRow>
                                  <TableCell>Invoice</TableCell>
                                  <TableCell>Amount</TableCell>
                                  <TableCell>Status</TableCell>
                                  <TableCell>Contract</TableCell>
                                  <TableCell>Date</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {invoices.map((inv) => {
                                  const statusMap = {
                                    Draft: 'default',
                                    Submitted: 'info',
                                    'Under Review': 'warning',
                                    Approved: 'primary',
                                    Paid: 'success',
                                    Rejected: 'error',
                                    Cancelled: 'error',
                                  }
                                  return (
                                    <TableRow hover key={inv.Id} sx={{ '&:last-child td': { border: 0 } }}>
                                      <TableCell>
                                        <Link
                                          component={RouterLink}
                                          href={paths.dashboard.invoices.details(inv.Id)}
                                          variant="subtitle2"
                                        >
                                          {inv.Name}
                                        </Link>
                                      </TableCell>
                                      <TableCell>
                                        <Typography variant="subtitle2" sx={{ whiteSpace: 'nowrap' }}>
                                          {inv.cux_Amount__c != null
                                            ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(inv.cux_Amount__c)
                                            : '\u2014'}
                                        </Typography>
                                      </TableCell>
                                      <TableCell>
                                        <Chip
                                          label={inv.cux_Status__c || 'Unknown'}
                                          size="small"
                                          variant="soft"
                                          color={statusMap[inv.cux_Status__c] || 'default'}
                                        />
                                      </TableCell>
                                      <TableCell>
                                        {inv.cux_Contract__c ? (
                                          <Link
                                            component={RouterLink}
                                            href={paths.dashboard.contracts.details(inv.cux_Contract__c)}
                                            variant="body2"
                                          >
                                            {inv.cux_Contract__r?.Name || 'Contract'}
                                          </Link>
                                        ) : (
                                          '\u2014'
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                                          {inv.cux_Invoice_Date__c
                                            ? dayjs(inv.cux_Invoice_Date__c).format('MMM D, YYYY')
                                            : dayjs(inv.CreatedDate).format('MMM D, YYYY')}
                                        </Typography>
                                      </TableCell>
                                    </TableRow>
                                  )
                                })}
                              </TableBody>
                            </Table>
                          </Box>
                        </Card>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
                </Stack>
              </Grid>
            </Grid>
          </Stack>
        </Box>
      </AnimatedPage>
    </React.Fragment>
  )
}
