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

const metadata = { title: `Settlements | Dashboard | ${appConfig.name}` }

const statusColorMap = {
  Draft: 'default',
  'Under Review': 'warning',
  Approved: 'info',
  Executed: 'success',
  Closed: 'secondary',
}

function formatCurrency(value) {
  if (value == null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

const columns = [
  {
    id: 'name',
    label: 'Settlement #',
    sortKey: 'Name',
    field: 'Name',
    width: '130px',
    formatter: (row) => (
      <Link color="text.primary" component={RouterLink} href={paths.dashboard.settlements.details(row.Id)} variant="subtitle2">
        {row.Name}
      </Link>
    ),
  },
  {
    id: 'termination',
    label: 'Termination',
    sortKey: 'cux_Termination__r.Name',
    field: 'cux_Termination__r.Name',
    formatter: (row) => row.cux_Termination__r?.Name ? (
      <Link color="text.primary" component={RouterLink} href={paths.dashboard.terminations.details(row.cux_Termination__c)} variant="subtitle2">
        {row.cux_Termination__r.Name}
      </Link>
    ) : '—',
    exportValue: (row) => row.cux_Termination__r?.Name || '',
  },
  {
    id: 'parentType',
    label: 'Parent Type',
    sortKey: 'cux_Parent_Type__c',
    field: 'cux_Parent_Type__c',
    width: '120px',
    formatter: (row) => (
      <Chip label={row.cux_Parent_Type__c || '—'} size="small" variant="outlined" />
    ),
  },
  {
    id: 'parent',
    label: 'Contract / Task Order',
    formatter: (row) => {
      if (row.cux_Contract__r?.Name) {
        return (
          <Link color="text.primary" component={RouterLink} href={paths.dashboard.contracts.details(row.cux_Contract__c)} variant="subtitle2">
            {row.cux_Contract__r.Name}
          </Link>
        )
      }
      if (row.cux_Task_Order__r?.Name) {
        return (
          <Link color="text.primary" component={RouterLink} href={paths.dashboard.taskOrders.details(row.cux_Task_Order__c)} variant="subtitle2">
            {row.cux_Task_Order__r.Name}
          </Link>
        )
      }
      return '—'
    },
    exportValue: (row) => row.cux_Contract__r?.Name || row.cux_Task_Order__r?.Name || '',
  },
  {
    id: 'authorizedAmount',
    label: 'Authorized Amount',
    sortKey: 'cux_Authorized_Amount__c',
    field: 'cux_Authorized_Amount__c',
    align: 'right',
    formatter: (row) => formatCurrency(row.cux_Authorized_Amount__c),
    exportValue: (row) => row.cux_Authorized_Amount__c || 0,
  },
  {
    id: 'status',
    label: 'Status',
    sortKey: 'cux_Status__c',
    field: 'cux_Status__c',
    width: '130px',
    formatter: (row) => (
      <Chip color={statusColorMap[row.cux_Status__c] || 'default'} label={row.cux_Status__c || 'Draft'} size="small" variant="soft" />
    ),
  },
  {
    id: 'effectiveDate',
    label: 'Effective Date',
    sortKey: 'cux_Effective_Date__c',
    field: 'cux_Effective_Date__c',
    formatter: (row) => row.cux_Effective_Date__c ? dayjs(row.cux_Effective_Date__c).format('MMM D, YYYY') : '—',
    filterable: false,
  },
  {
    id: 'createdDate',
    label: 'Created',
    sortKey: 'CreatedDate',
    field: 'CreatedDate',
    formatter: (row) => row.CreatedDate ? dayjs(row.CreatedDate).format('MMM D, YYYY') : '—',
    filterable: false,
  },
]

export function Page() {
  const { data: settlements, loading, error } = useSalesforceQuery((client) => client.getAllSettlements())

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
              <Typography variant="h4">Settlements</Typography>
            </Box>
          </Stack>

          <Card>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ m: 2 }}>
                Failed to load settlements: {error.message}
              </Alert>
            ) : (
              <DataTableView
                columns={columns}
                rows={settlements || []}
                entityLabel="Settlements"
                defaultSortKey="CreatedDate"
                quickViewConfig={{
                  titleField: 'Name',
                  subtitleField: 'cux_Status__c',
                  subtitleColorMap: statusColorMap,
                  detailsPath: (row) => paths.dashboard.settlements.details(row.Id),
                  sections: [
                    {
                      title: 'Settlement Information',
                      fields: [
                        { label: 'Termination', field: 'cux_Termination__r.Name' },
                        { label: 'Status', field: 'cux_Status__c' },
                        { label: 'Authorized Amount', field: 'cux_Authorized_Amount__c', type: 'currency' },
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
