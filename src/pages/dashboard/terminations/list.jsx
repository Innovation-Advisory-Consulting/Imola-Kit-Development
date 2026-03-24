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

const metadata = { title: `Terminations | Dashboard | ${appConfig.name}` }

const statusColorMap = {
  Draft: 'default',
  Approved: 'success',
  Cancelled: 'error',
}

// Picklist values match Salesforce: "For Cause", "For Default", etc.
// No label mapping needed — values are already human-readable.

const columns = [
  {
    id: 'name',
    label: 'Termination #',
    sortKey: 'Name',
    field: 'Name',
    width: '130px',
    formatter: (row) => (
      <Link color="text.primary" component={RouterLink} href={paths.dashboard.terminations.details(row.Id)} variant="subtitle2">
        {row.Name}
      </Link>
    ),
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
      if (row.cux_Parent_Type__c === 'Contract' && row.cux_Contract__r?.Name) {
        return (
          <Link color="text.primary" component={RouterLink} href={paths.dashboard.contracts.details(row.cux_Contract__c)} variant="subtitle2">
            {row.cux_Contract__r.Name}
          </Link>
        )
      }
      if (row.cux_Parent_Type__c === 'Task Order' && row.cux_Task_Order__r?.Name) {
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
    id: 'type',
    label: 'Type',
    sortKey: 'cux_Termination_Type__c',
    field: 'cux_Termination_Type__c',
    formatter: (row) => row.cux_Termination_Type__c || '—',
  },
  {
    id: 'terminationDate',
    label: 'Termination Date',
    sortKey: 'cux_Termination_Date__c',
    field: 'cux_Termination_Date__c',
    formatter: (row) => row.cux_Termination_Date__c ? dayjs(row.cux_Termination_Date__c).format('MMM D, YYYY') : '—',
    filterable: false,
  },
  {
    id: 'status',
    label: 'Status',
    sortKey: 'cux_Status__c',
    field: 'cux_Status__c',
    width: '120px',
    formatter: (row) => (
      <Chip color={statusColorMap[row.cux_Status__c] || 'default'} label={row.cux_Status__c || 'Draft'} size="small" variant="soft" />
    ),
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
  const { data: terminations, loading, error } = useSalesforceQuery((client) => client.getAllTerminations())

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
              <Typography variant="h4">Terminations</Typography>
            </Box>
          </Stack>

          <Card>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ m: 2 }}>
                Failed to load terminations: {error.message}
              </Alert>
            ) : (
              <DataTableView
                columns={columns}
                rows={terminations || []}
                entityLabel="Terminations"
                defaultSortKey="CreatedDate"
                quickViewConfig={{
                  titleField: 'Name',
                  subtitleField: 'cux_Status__c',
                  subtitleColorMap: statusColorMap,
                  detailsPath: (row) => paths.dashboard.terminations.details(row.Id),
                  sections: [
                    {
                      title: 'Termination Information',
                      fields: [
                        { label: 'Parent Type', field: 'cux_Parent_Type__c' },
                        { label: 'Type', field: 'cux_Termination_Type__c' },
                        { label: 'Status', field: 'cux_Status__c' },
                        { label: 'Termination Date', field: 'cux_Termination_Date__c', type: 'date' },
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
