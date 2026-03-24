import * as React from 'react'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import { PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus'
import { UsersIcon } from '@phosphor-icons/react/dist/ssr/Users'
import { Helmet } from 'react-helmet-async'

import { appConfig } from '@/config/app'
import { paths } from '@/paths'
import { RouterLink } from '@/components/core/link'
import { useSalesforceQuery } from '@/hooks/use-salesforce'
import { DataTableView } from '@/components/core/data-table-view'
import { AnimatedPage } from '@/components/core/animations'

const metadata = { title: `Vendors | Dashboard | ${appConfig.name}` }

const industryColors = {
  Apparel: 'info',
  Consulting: 'secondary',
  Construction: 'warning',
  Electronics: 'primary',
  Energy: 'error',
  Education: 'success',
  Hospitality: 'info',
  Biotechnology: 'success',
  Transportation: 'warning',
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

const columns = [
  {
    id: 'company',
    label: 'Company',
    sortKey: 'Name',
    field: 'Name',
    width: '250px',
    formatter: (row) => (
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
        <Box>
          <Link color="text.primary" component={RouterLink} href={paths.dashboard.customers.details(row.Id)} variant="subtitle2">
            {row.Name}
          </Link>
          {row.AccountNumber && (
            <Typography color="text.secondary" variant="body2">{row.AccountNumber}</Typography>
          )}
        </Box>
      </Stack>
    ),
  },
  {
    id: 'industry',
    label: 'Industry',
    sortKey: 'Industry',
    field: 'Industry',
    formatter: (row) =>
      row.Industry ? (
        <Chip color={industryColors[row.Industry] || 'default'} label={row.Industry} size="small" variant="soft" />
      ) : '\u2014',
  },
  {
    id: 'type',
    label: 'Type',
    sortKey: 'Type',
    field: 'Type',
  },
  {
    id: 'phone',
    label: 'Phone',
    sortKey: 'Phone',
    field: 'Phone',
    filterable: false,
  },
  {
    id: 'location',
    label: 'Location',
    sortKey: 'BillingCity',
    field: 'BillingCity',
    formatter: (row) =>
      row.BillingCity || row.BillingState
        ? [row.BillingCity, row.BillingState].filter(Boolean).join(', ')
        : '\u2014',
    exportValue: (row) => [row.BillingCity, row.BillingState].filter(Boolean).join(', '),
  },
  {
    id: 'contacts',
    label: 'Contacts',
    align: 'center',
    filterable: false,
    formatter: (row) => {
      const count = row.Contacts?.totalSize ?? 0
      return (
        <Chip icon={<UsersIcon />} label={count} size="small" variant="outlined" color={count > 0 ? 'primary' : 'default'} />
      )
    },
    exportValue: (row) => row.Contacts?.totalSize ?? 0,
  },
  {
    id: 'website',
    label: 'Website',
    field: 'Website',
    filterable: false,
    formatter: (row) =>
      row.Website ? (
        <Link href={row.Website.startsWith('http') ? row.Website : `https://${row.Website}`} target="_blank" rel="noopener" variant="body2">
          {row.Website.replace(/^https?:\/\//, '')}
        </Link>
      ) : '\u2014',
  },
]

export function Page() {
  const { data: accounts, loading, error } = useSalesforceQuery((client) => client.getAccounts())

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
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Alert severity="error" sx={{ m: 2 }}>
                  Failed to load vendors: {error.message}
                </Alert>
              ) : (
                <DataTableView
                  columns={columns}
                  rows={accounts || []}
                  entityLabel="Vendors"
                  defaultSortKey="Name"
                  defaultSortDirection="asc"
                  quickViewConfig={{
                    titleField: 'Name',
                    subtitleField: 'Industry',
                    subtitleColorMap: industryColors,
                    detailsPath: (row) => paths.dashboard.customers.details(row.Id),
                    sections: [
                      {
                        title: 'Company Information',
                        fields: [
                          { label: 'Company Name', field: 'Name' },
                          { label: 'Industry', field: 'Industry' },
                          { label: 'Type', field: 'Type' },
                          { label: 'Phone', field: 'Phone' },
                          { label: 'Website', field: 'Website' },
                        ],
                      },
                      {
                        title: 'Location',
                        fields: [
                          { label: 'City', field: 'BillingCity' },
                          { label: 'State', field: 'BillingState' },
                          { label: 'Country', field: 'BillingCountry' },
                        ],
                      },
                    ],
                  }}
                />
              )}
            </Card>
          </Stack>
        </Box>
      </AnimatedPage>
    </React.Fragment>
  )
}
