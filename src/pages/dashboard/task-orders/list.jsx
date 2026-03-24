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

const metadata = { title: `Task Orders | Dashboard | ${appConfig.name}` }

const statusColorMap = {
  Draft: 'default',
  'Under Review': 'warning',
  Approved: 'info',
  Active: 'success',
  Completed: 'success',
  Closed: 'default',
  Terminated: 'error',
}

function formatCurrency(value) {
  if (value == null) return '$0.00'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

const columns = [
  {
    id: 'name',
    label: 'TO #',
    sortKey: 'Name',
    field: 'Name',
    width: '100px',
    formatter: (row) => (
      <Link color="text.primary" component={RouterLink} href={paths.dashboard.taskOrders.details(row.Id)} variant="subtitle2">
        {row.Name}
      </Link>
    ),
  },
  {
    id: 'contract',
    label: 'Contract',
    sortKey: 'cux_Contract__r.Name',
    field: 'cux_Contract__r.Name',
    formatter: (row) => row.cux_Contract__r?.Name || '\u2014',
    exportValue: (row) => row.cux_Contract__r?.Name || '',
  },
  {
    id: 'type',
    label: 'Type',
    sortKey: 'cux_Task_Order_Type__c',
    field: 'cux_Task_Order_Type__c',
  },
  {
    id: 'status',
    label: 'Status',
    sortKey: 'cux_Status__c',
    field: 'cux_Status__c',
    width: '130px',
    formatter: (row) => (
      <Chip color={statusColorMap[row.cux_Status__c] || 'default'} label={row.cux_Status__c} size="small" variant="soft" />
    ),
  },
  {
    id: 'startDate',
    label: 'Start Date',
    sortKey: 'cux_Start_Date__c',
    field: 'cux_Start_Date__c',
    formatter: (row) => row.cux_Start_Date__c ? dayjs(row.cux_Start_Date__c).format('MMM D, YYYY') : '\u2014',
    filterable: false,
  },
  {
    id: 'endDate',
    label: 'End Date',
    sortKey: 'cux_End_Date__c',
    field: 'cux_End_Date__c',
    formatter: (row) => row.cux_End_Date__c ? dayjs(row.cux_End_Date__c).format('MMM D, YYYY') : '\u2014',
    filterable: false,
  },
  {
    id: 'authorized',
    label: 'Authorized',
    sortKey: 'cux_Authorized_Amount__c',
    field: 'cux_Authorized_Amount__c',
    align: 'right',
    formatter: (row) => formatCurrency(row.cux_Authorized_Amount__c),
    exportValue: (row) => row.cux_Authorized_Amount__c || 0,
  },
]

export function Page() {
  const { data: taskOrders, loading, error } = useSalesforceQuery((client) => client.getTaskOrders())

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
              <Typography variant="h4">Task Orders</Typography>
            </Box>
          </Stack>
          <Card>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ m: 2 }}>
                Failed to load task orders: {error.message}
              </Alert>
            ) : (
              <DataTableView
                columns={columns}
                rows={taskOrders || []}
                entityLabel="Task Orders"
                defaultSortKey="Name"
                quickViewConfig={{
                  titleField: 'Name',
                  subtitleField: 'cux_Status__c',
                  subtitleColorMap: statusColorMap,
                  detailsPath: (row) => paths.dashboard.taskOrders.details(row.Id),
                  sections: [
                    {
                      title: 'Task Order Information',
                      fields: [
                        { label: 'Contract', field: 'cux_Contract__r.Name' },
                        { label: 'Type', field: 'cux_Task_Order_Type__c' },
                        { label: 'Status', field: 'cux_Status__c' },
                      ],
                    },
                    {
                      title: 'Schedule',
                      fields: [
                        { label: 'Start Date', field: 'cux_Start_Date__c', type: 'date' },
                        { label: 'End Date', field: 'cux_End_Date__c', type: 'date' },
                      ],
                    },
                    {
                      title: 'Financials',
                      fields: [
                        { label: 'Authorized Amount', field: 'cux_Authorized_Amount__c', type: 'currency' },
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
