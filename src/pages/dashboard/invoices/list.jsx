import * as React from 'react'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import LinearProgress from '@mui/material/LinearProgress'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import { CurrencyDollarIcon } from '@phosphor-icons/react/dist/ssr/CurrencyDollar'
import { CheckCircleIcon } from '@phosphor-icons/react/dist/ssr/CheckCircle'
import { ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock'
import { ReceiptIcon } from '@phosphor-icons/react/dist/ssr/Receipt'
import { Helmet } from 'react-helmet-async'

import { appConfig } from '@/config/app'
import { paths } from '@/paths'
import { dayjs } from '@/lib/dayjs'
import { RouterLink } from '@/components/core/link'
import { useSalesforceQuery } from '@/hooks/use-salesforce'
import { DataTableView } from '@/components/core/data-table-view'
import { AnimatedPage } from '@/components/core/animations'

const metadata = { title: `Invoices | Dashboard | ${appConfig.name}` }

const statusColorMap = {
  Draft: 'default',
  Review: 'warning',
  Approval: 'info',
  Paid: 'success',
  Rejected: 'error',
  Void: 'default',
}

function formatCurrency(value) {
  if (value == null) return '$0.00'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

const columns = [
  {
    id: 'name',
    label: 'Invoice #',
    sortKey: 'Name',
    field: 'Name',
    width: '120px',
    formatter: (row) => (
      <Link color="text.primary" component={RouterLink} href={paths.dashboard.invoices.details(row.Id)} variant="subtitle2">
        {row.Name}
      </Link>
    ),
  },
  {
    id: 'taskOrder',
    label: 'Task Order',
    sortKey: 'cux_Task_Order__r.Name',
    field: 'cux_Task_Order__r.Name',
    formatter: (row) => row.cux_Task_Order__r?.Name || '\u2014',
    exportValue: (row) => row.cux_Task_Order__r?.Name || '',
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
    id: 'status',
    label: 'Status',
    sortKey: 'cux_Status__c',
    field: 'cux_Status__c',
    width: '120px',
    formatter: (row) => (
      <Chip color={statusColorMap[row.cux_Status__c] || 'default'} label={row.cux_Status__c} size="small" variant="soft" />
    ),
  },
  {
    id: 'amount',
    label: 'Amount',
    sortKey: 'cux_Amount__c',
    field: 'cux_Amount__c',
    align: 'right',
    formatter: (row) => formatCurrency(row.cux_Amount__c),
    exportValue: (row) => row.cux_Amount__c || 0,
  },
  {
    id: 'category',
    label: 'Category',
    sortKey: 'cux_Category__c',
    field: 'cux_Category__c',
  },
  {
    id: 'invoiceDate',
    label: 'Invoice Date',
    sortKey: 'cux_Invoice_Date__c',
    field: 'cux_Invoice_Date__c',
    formatter: (row) => row.cux_Invoice_Date__c ? dayjs(row.cux_Invoice_Date__c).format('MMM D, YYYY') : '\u2014',
    filterable: false,
  },
]

export function Page() {
  const { data: invoices, loading, error } = useSalesforceQuery((client) => client.getInvoices())

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
              <Typography variant="h4">Invoices</Typography>
            </Box>
          </Stack>

          {!loading && !error && invoices?.length > 0 && (
            <InvoiceAnalytics invoices={invoices} />
          )}

          <Card>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ m: 2 }}>
                Failed to load invoices: {error.message}
              </Alert>
            ) : (
              <DataTableView
                columns={columns}
                rows={invoices || []}
                entityLabel="Invoices"
                defaultSortKey="Name"
                quickViewConfig={{
                  titleField: 'Name',
                  subtitleField: 'cux_Status__c',
                  subtitleColorMap: statusColorMap,
                  detailsPath: (row) => paths.dashboard.invoices.details(row.Id),
                  sections: [
                    {
                      title: 'Invoice Information',
                      fields: [
                        { label: 'Task Order', field: 'cux_Task_Order__r.Name' },
                        { label: 'Contract', field: 'cux_Contract__r.Name' },
                        { label: 'Status', field: 'cux_Status__c' },
                        { label: 'Category', field: 'cux_Category__c' },
                      ],
                    },
                    {
                      title: 'Schedule',
                      fields: [
                        { label: 'Invoice Date', field: 'cux_Invoice_Date__c', type: 'date' },
                      ],
                    },
                    {
                      title: 'Financials',
                      fields: [
                        { label: 'Amount', field: 'cux_Amount__c', type: 'currency' },
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

function formatCompact(value) {
  if (value == null) return '$0'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

function InvoiceAnalytics({ invoices }) {
  const total = invoices.length
  const totalAmount = invoices.reduce((sum, inv) => sum + (inv.cux_Amount__c || 0), 0)
  const paid = invoices.filter((i) => i.cux_Status__c === 'Paid')
  const paidAmount = paid.reduce((sum, i) => sum + (i.cux_Amount__c || 0), 0)
  const pending = invoices.filter((i) => ['Review', 'Approval'].includes(i.cux_Status__c))
  const pendingAmount = pending.reduce((sum, i) => sum + (i.cux_Amount__c || 0), 0)
  const rejected = invoices.filter((i) => i.cux_Status__c === 'Rejected').length

  const statusCounts = {}
  invoices.forEach((inv) => {
    const s = inv.cux_Status__c || 'Unknown'
    statusCounts[s] = (statusCounts[s] || 0) + 1
  })

  const categoryAmounts = {}
  invoices.forEach((inv) => {
    const c = inv.cux_Category__c || 'Uncategorized'
    categoryAmounts[c] = (categoryAmounts[c] || 0) + (inv.cux_Amount__c || 0)
  })

  return (
    <Stack spacing={3}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard icon={ReceiptIcon} label="Total Invoices" value={total} detail={formatCompact(totalAmount)} color="primary" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard icon={CheckCircleIcon} label="Paid" value={paid.length} detail={formatCompact(paidAmount)} color="success" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard icon={ClockIcon} label="Pending" value={pending.length} detail={formatCompact(pendingAmount)} color="warning" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard icon={CurrencyDollarIcon} label="Rejected" value={rejected} detail={rejected > 0 ? 'need attention' : 'none'} color={rejected > 0 ? 'error' : 'success'} />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <BreakdownCard title="By Status" data={statusCounts} colorMap={statusColorMap} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <CategoryCard title="By Category" data={categoryAmounts} />
        </Grid>
      </Grid>
    </Stack>
  )
}

function StatCard({ icon: Icon, label, value, detail, color = 'primary' }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            <Avatar
              sx={{
                bgcolor: `var(--mui-palette-${color}-50)`,
                color: `var(--mui-palette-${color}-main)`,
                '--Avatar-size': '48px',
              }}
            >
              <Icon fontSize="var(--icon-fontSize-lg)" />
            </Avatar>
            <Box>
              <Typography color="text.secondary" variant="body2">{label}</Typography>
              <Typography variant="h4">{value}</Typography>
            </Box>
          </Stack>
          <Typography color="text.secondary" variant="body2">{detail}</Typography>
        </Stack>
      </CardContent>
    </Card>
  )
}

function BreakdownCard({ title, data, colorMap }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1])
  const total = entries.reduce((sum, [, count]) => sum + count, 0)

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="subtitle2" sx={{ mb: 2 }}>{title}</Typography>
        <Stack spacing={1.5}>
          {entries.map(([name, count]) => {
            const pct = total > 0 ? Math.round((count / total) * 100) : 0
            const chipColor = colorMap?.[name] || 'default'
            return (
              <Stack key={name} spacing={0.5}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip label={name} size="small" color={chipColor} variant="soft" />
                  <Typography variant="body2" color="text.secondary">
                    {count} ({pct}%)
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={pct}
                  color={chipColor === 'default' ? 'inherit' : chipColor}
                  sx={{ height: 4, borderRadius: 2 }}
                />
              </Stack>
            )
          })}
        </Stack>
      </CardContent>
    </Card>
  )
}

function CategoryCard({ title, data }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1])
  const maxAmount = Math.max(...entries.map(([, amt]) => amt), 1)

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="subtitle2" sx={{ mb: 2 }}>{title}</Typography>
        <Stack spacing={1.5}>
          {entries.map(([name, amount]) => {
            const pct = Math.round((amount / maxAmount) * 100)
            return (
              <Stack key={name} spacing={0.5}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">{name}</Typography>
                  <Typography variant="subtitle2">{formatCompact(amount)}</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={pct} sx={{ height: 4, borderRadius: 2 }} />
              </Stack>
            )
          })}
        </Stack>
      </CardContent>
    </Card>
  )
}
