import * as React from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import { Helmet } from 'react-helmet-async'

import { appConfig } from '@/config/app'
import { paths } from '@/paths'
import { dayjs } from '@/lib/dayjs'
import { RouterLink } from '@/components/core/link'
import { useSalesforceQuery } from '@/hooks/use-salesforce'
import { DataTableView } from '@/components/core/data-table-view'
import { AnimatedPage } from '@/components/core/animations'

const metadata = { title: `Amendments | Dashboard | ${appConfig.name}` }

const statusColorMap = {
  Draft: 'default',
  Review: 'warning',
  Executed: 'success',
}

function formatCurrency(value) {
  if (value == null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

const columns = [
  {
    id: 'name',
    label: 'Amendment #',
    sortKey: 'Name',
    field: 'Name',
    width: '120px',
    formatter: (row) => (
      <Link color="text.primary" component={RouterLink} href={paths.dashboard.amendments.details(row.Id)} variant="subtitle2">
        {row.Name}
      </Link>
    ),
  },
  {
    id: 'contract',
    label: 'Contract',
    sortKey: 'cux_Contract__r.Name',
    field: 'cux_Contract__r.Name',
    formatter: (row) => row.cux_Contract__r?.Name ? (
      <Link color="text.primary" component={RouterLink} href={paths.dashboard.contracts.details(row.cux_Contract__c)} variant="subtitle2">
        {row.cux_Contract__r.Name}
      </Link>
    ) : '—',
    exportValue: (row) => row.cux_Contract__r?.Name || '',
  },
  {
    id: 'type',
    label: 'Type',
    sortKey: 'cux_Amendment_Type__c',
    field: 'cux_Amendment_Type__c',
    formatter: (row) => {
      const types = row.cux_Amendment_Type__c?.split(';') || []
      return types.length > 0 ? (
        <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
          {types.map((t) => <Chip key={t} label={t} size="small" variant="outlined" />)}
        </Stack>
      ) : '—'
    },
  },
  {
    id: 'status',
    label: 'Status',
    sortKey: 'cux_Approval_Status__c',
    field: 'cux_Approval_Status__c',
    width: '120px',
    formatter: (row) => (
      <Chip color={statusColorMap[row.cux_Approval_Status__c] || 'default'} label={row.cux_Approval_Status__c || 'Draft'} size="small" variant="soft" />
    ),
  },
  {
    id: 'newAmount',
    label: 'New Amount',
    sortKey: 'cux_New_Authorized_Amount__c',
    field: 'cux_New_Authorized_Amount__c',
    align: 'right',
    formatter: (row) => formatCurrency(row.cux_New_Authorized_Amount__c),
    exportValue: (row) => row.cux_New_Authorized_Amount__c || 0,
  },
  {
    id: 'newEndDate',
    label: 'New End Date',
    sortKey: 'cux_New_End_Date__c',
    field: 'cux_New_End_Date__c',
    formatter: (row) => row.cux_New_End_Date__c ? dayjs(row.cux_New_End_Date__c).format('MMM D, YYYY') : '—',
    filterable: false,
  },
  {
    id: 'amendmentDate',
    label: 'Amendment Date',
    sortKey: 'cux_Amendment_Date__c',
    field: 'cux_Amendment_Date__c',
    formatter: (row) => row.cux_Amendment_Date__c ? dayjs(row.cux_Amendment_Date__c).format('MMM D, YYYY') : '—',
    filterable: false,
  },
]

export function Page() {
  const { data: amendments, loading, error } = useSalesforceQuery((client) => client.getAllAmendments())

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
              <Typography variant="h4">Amendments</Typography>
            </Box>
          </Stack>

          <Card>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ m: 2 }}>
                Failed to load amendments: {error.message}
              </Alert>
            ) : (
              <DataTableView
                columns={columns}
                rows={amendments || []}
                entityLabel="Amendments"
                defaultSortKey="Name"
                quickViewConfig={{
                  titleField: 'Name',
                  subtitleField: 'cux_Approval_Status__c',
                  subtitleColorMap: statusColorMap,
                  detailsPath: (row) => paths.dashboard.amendments.details(row.Id),
                  sections: [
                    {
                      title: 'Amendment Information',
                      fields: [
                        { label: 'Contract', field: 'cux_Contract__r.Name' },
                        { label: 'Type', field: 'cux_Amendment_Type__c' },
                        { label: 'Status', field: 'cux_Approval_Status__c' },
                      ],
                    },
                    {
                      title: 'Changes',
                      fields: [
                        { label: 'New End Date', field: 'cux_New_End_Date__c', type: 'date' },
                        { label: 'New Authorized Amount', field: 'cux_New_Authorized_Amount__c', type: 'currency' },
                      ],
                    },
                    {
                      title: 'Dates',
                      fields: [
                        { label: 'Amendment Date', field: 'cux_Amendment_Date__c', type: 'date' },
                        { label: 'Effective Date', field: 'cux_Effective_Date__c', type: 'date' },
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
