import * as React from 'react'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import LinearProgress from '@mui/material/LinearProgress'
import Link from '@mui/material/Link'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { CurrencyDollarIcon } from '@phosphor-icons/react/dist/ssr/CurrencyDollar'
import { DotsSixVerticalIcon } from '@phosphor-icons/react/dist/ssr/DotsSixVertical'
import { FileTextIcon } from '@phosphor-icons/react/dist/ssr/FileText'
import { FolderOpenIcon } from '@phosphor-icons/react/dist/ssr/FolderOpen'
import { ListChecksIcon } from '@phosphor-icons/react/dist/ssr/ListChecks'
import { NoteIcon } from '@phosphor-icons/react/dist/ssr/Note'
import { Helmet } from 'react-helmet-async'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { appConfig } from '@/config/app'
import { dayjs } from '@/lib/dayjs'
import { paths } from '@/paths'
import { RouterLink } from '@/components/core/link'
import { NoSsr } from '@/components/core/no-ssr'
import { useSalesforceQuery } from '@/hooks/use-salesforce'
import { useUserPreferences, DASHBOARD_WIDGETS } from '@/components/core/user-preferences-context'
import { AnimatedPage } from '@/components/core/animations'
import { DashboardSkeleton } from '@/components/core/animations'

const metadata = { title: `Overview | Dashboard | ${appConfig.name}` }

function formatCurrency(value) {
  if (value == null) return '$0'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
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

const PIE_COLORS = [
  'var(--mui-palette-primary-main)',
  'var(--mui-palette-success-main)',
  'var(--mui-palette-warning-main)',
  'var(--mui-palette-error-main)',
  'var(--mui-palette-info-main)',
  'var(--mui-palette-secondary-main)',
]

const invoiceStatusColors = {
  Draft: 'default',
  Review: 'warning',
  Approval: 'info',
  Paid: 'success',
  Rejected: 'error',
  Void: 'default',
}

// ─── Per-widget grid sizing ───
const WIDGET_GRID_SIZE = {
  summaryStrip: { xs: 12 },
  budgetGauge: { lg: 4, md: 6, xs: 12 },
  contractStatus: { lg: 4, md: 6, xs: 12 },
  amendments: { lg: 4, xs: 12 },
  invoiceCategory: { md: 7, xs: 12 },
  invoicePipeline: { md: 5, xs: 12 },
  taskOrdersByContract: { md: 6, xs: 12 },
  recentInvoices: { md: 6, xs: 12 },
  expiringContracts: { md: 7, xs: 12 },
  taskOrderSummary: { md: 5, xs: 12 },
}

export function Page() {
  const { data: stats, loading, error } = useSalesforceQuery(
    (client) => client.getDashboardStats(),
    []
  )
  const { preferences, setPreference } = useUserPreferences()

  // Drag state for individual widgets
  const [dragId, setDragId] = React.useState(null)
  const [dragOverId, setDragOverId] = React.useState(null)

  const hiddenSet = React.useMemo(
    () => new Set(preferences.dashboardHiddenWidgets || []),
    [preferences.dashboardHiddenWidgets]
  )

  const widgetOrder = preferences.dashboardWidgetOrder || DASHBOARD_WIDGETS.map((w) => w.id)

  // Ordered visible widgets
  const visibleWidgets = React.useMemo(() => {
    const ordered = []
    widgetOrder.forEach((id) => {
      if (!hiddenSet.has(id) && WIDGET_GRID_SIZE[id]) ordered.push(id)
    })
    // Add any missing widgets at the end
    Object.keys(WIDGET_GRID_SIZE).forEach((id) => {
      if (!ordered.includes(id) && !hiddenSet.has(id)) ordered.push(id)
    })
    return ordered
  }, [widgetOrder, hiddenSet])

  function handleDragStart(e, id) {
    setDragId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e, id) {
    e.preventDefault()
    setDragOverId(id)
  }

  function handleDrop(e, dropId) {
    e.preventDefault()
    if (!dragId || dragId === dropId) {
      setDragId(null)
      setDragOverId(null)
      return
    }

    const newOrder = [...widgetOrder]
    const fromIdx = newOrder.indexOf(dragId)
    const toIdx = newOrder.indexOf(dropId)
    if (fromIdx < 0 || toIdx < 0) return

    newOrder.splice(fromIdx, 1)
    newOrder.splice(toIdx, 0, dragId)
    setPreference('dashboardWidgetOrder', newOrder)
    setDragId(null)
    setDragOverId(null)
  }

  function handleDragEnd() {
    setDragId(null)
    setDragOverId(null)
  }

  if (loading) {
    return (
      <Box
        sx={{
          maxWidth: 'var(--Content-maxWidth)',
          m: 'var(--Content-margin)',
          p: 'var(--Content-padding)',
          width: 'var(--Content-width)',
        }}
      >
        <DashboardSkeleton />
      </Box>
    )
  }

  if (error || !stats) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Failed to load dashboard data</Typography>
      </Box>
    )
  }

  const totalContracts = stats.contracts.reduce((sum, r) => sum + r.cnt, 0)
  const activeContracts = stats.contracts.find((r) => r.cux_Status__c === 'Active')?.cnt || 0
  const totalAuthorized = stats.contracts.reduce((sum, r) => sum + (r.totalAuth || 0), 0)
  const totalObligated = stats.contracts.reduce((sum, r) => sum + (r.totalObl || 0), 0)
  const totalExpended = stats.contracts.reduce((sum, r) => sum + (r.totalExp || 0), 0)
  const totalTaskOrders = stats.taskOrders.reduce((sum, r) => sum + r.cnt, 0)
  const totalInvoices = stats.invoicesByStatus.reduce((sum, r) => sum + r.cnt, 0)
  const totalInvoiceAmount = stats.invoicesByStatus.reduce((sum, r) => sum + (r.totalAmt || 0), 0)
  const totalAmendments = stats.amendments.reduce((sum, r) => sum + r.cnt, 0)

  const utilizationPct = totalAuthorized > 0 ? Math.round((totalExpended / totalAuthorized) * 100) : 0
  const obligationPct = totalAuthorized > 0 ? Math.round((totalObligated / totalAuthorized) * 100) : 0

  const contractStatusData = stats.contracts.map((r) => ({ name: r.cux_Status__c, value: r.cnt }))
  const invoiceStatusData = stats.invoicesByStatus.map((r) => ({ name: r.cux_Status__c, value: r.cnt, amount: r.totalAmt || 0 }))
  const invoiceCategoryData = stats.invoicesByCategory.map((r) => ({ name: r.cux_Category__c || 'Other', amount: r.totalAmt || 0 }))
  const taskOrderStatusData = stats.taskOrders.map((r) => ({ name: r.cux_Status__c, count: r.cnt, authorized: r.totalAuth || 0, invoiced: r.totalInv || 0 }))

  const widgetRenderers = {
    summaryStrip: () => (
      <SummaryStrip
        contracts={totalContracts}
        activeContracts={activeContracts}
        totalAuthorized={totalAuthorized}
        totalExpended={totalExpended}
        taskOrders={totalTaskOrders}
        invoices={totalInvoices}
        invoiceAmount={totalInvoiceAmount}
      />
    ),
    budgetGauge: () => (
      <BudgetUtilizationGauge
        utilization={utilizationPct}
        obligation={obligationPct}
        authorized={totalAuthorized}
        obligated={totalObligated}
        expended={totalExpended}
      />
    ),
    contractStatus: () => <ContractStatusChart data={contractStatusData} />,
    amendments: () => <AmendmentStatusCards amendments={stats.amendments} total={totalAmendments} />,
    invoiceCategory: () => <InvoiceCategoryChart data={invoiceCategoryData} />,
    invoicePipeline: () => <InvoicePipeline data={invoiceStatusData} />,
    taskOrdersByContract: () => <TaskOrdersByContract data={stats.taskOrdersByContract} />,
    recentInvoices: () => <RecentInvoices invoices={stats.recentInvoices} />,
    expiringContracts: () => <ExpiringContracts contracts={stats.recentContracts} />,
    taskOrderSummary: () => <TaskOrderSummary data={taskOrderStatusData} />,
  }

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
        <Stack spacing={3}>
          <Typography variant="h4">Overview</Typography>

          <Grid container spacing={3}>
            {visibleWidgets.map((widgetId) => {
              const isDragging = dragId === widgetId
              const isDragOver = dragOverId === widgetId && dragId !== widgetId

              return (
                <Grid key={widgetId} size={WIDGET_GRID_SIZE[widgetId] || { xs: 12 }}>
                  <Box
                    draggable
                    onDragStart={(e) => handleDragStart(e, widgetId)}
                    onDragOver={(e) => handleDragOver(e, widgetId)}
                    onDrop={(e) => handleDrop(e, widgetId)}
                    onDragEnd={handleDragEnd}
                    sx={{
                      position: 'relative',
                      height: '100%',
                      borderRadius: 2,
                      transition: 'opacity 0.2s, outline 0.2s',
                      ...(isDragging && { opacity: 0.4 }),
                      ...(isDragOver && {
                        outline: '2px solid',
                        outlineColor: 'primary.main',
                        outlineOffset: 2,
                      }),
                    }}
                  >
                    {/* Drag handle */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        zIndex: 1,
                        cursor: 'grab',
                        color: 'text.disabled',
                        bgcolor: 'background.paper',
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        p: 0.25,
                        '&:hover': { color: 'text.secondary', bgcolor: 'action.hover' },
                        transition: 'color 0.15s, background-color 0.15s',
                      }}
                    >
                      <DotsSixVerticalIcon size={16} />
                    </Box>
                    {widgetRenderers[widgetId]?.()}
                  </Box>
                </Grid>
              )
            })}
          </Grid>
        </Stack>
      </Box>
      </AnimatedPage>
    </React.Fragment>
  )
}

// ─── Summary Strip (Devias analytics/summary pattern) ───
function SummaryStrip({ contracts, activeContracts, totalAuthorized, totalExpended, taskOrders, invoices, invoiceAmount }) {
  const items = [
    { label: 'Contracts', value: contracts, detail: `${activeContracts} active`, icon: FolderOpenIcon },
    { label: 'Authorized', value: formatCompact(totalAuthorized), detail: `${formatCompact(totalExpended)} expended`, icon: CurrencyDollarIcon },
    { label: 'Task Orders', value: taskOrders, detail: 'across contracts', icon: ListChecksIcon },
    { label: 'Invoices', value: invoices, detail: formatCompact(invoiceAmount), icon: FileTextIcon },
  ]

  return (
    <Card>
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          p: 3,
        }}
      >
        {items.map((item, idx) => {
          const Icon = item.icon
          return (
            <Stack
              key={item.label}
              spacing={1}
              sx={{
                borderRight: { xs: 'none', lg: idx < 3 ? '1px solid var(--mui-palette-divider)' : 'none' },
                borderBottom: { xs: idx < 3 ? '1px solid var(--mui-palette-divider)' : 'none', lg: 'none' },
                pb: { xs: idx < 3 ? 2 : 0, lg: 0 },
              }}
            >
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Avatar sx={{ '--Avatar-size': '32px', bgcolor: 'var(--mui-palette-background-level1)' }}>
                  <Icon fontSize="var(--icon-fontSize-md)" />
                </Avatar>
                <Typography color="text.secondary" variant="body2">{item.label}</Typography>
              </Stack>
              <Typography variant="h3">{item.value}</Typography>
              <Typography color="text.secondary" variant="body2">{item.detail}</Typography>
            </Stack>
          )
        })}
      </Box>
    </Card>
  )
}

// ─── Budget Utilization Radial Gauge ───
function BudgetUtilizationGauge({ utilization, obligation, authorized, obligated, expended }) {
  const chartSize = 200
  const data = [
    { name: 'Expended', value: utilization, fill: 'var(--mui-palette-primary-main)' },
    { name: 'Obligated', value: obligation, fill: 'var(--mui-palette-warning-main)' },
  ]

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader title="Budget Utilization" />
      <CardContent>
        <Stack spacing={3} sx={{ alignItems: 'center' }}>
          <Box sx={{ position: 'relative', width: chartSize, height: chartSize }}>
            <NoSsr fallback={<Box sx={{ height: chartSize, width: chartSize }} />}>
              <RadialBarChart
                width={chartSize}
                height={chartSize}
                cx={chartSize / 2}
                cy={chartSize / 2}
                innerRadius={60}
                outerRadius={90}
                barSize={14}
                data={data}
                startAngle={180}
                endAngle={-180}
              >
                <RadialBar
                  dataKey="value"
                  cornerRadius={7}
                  background={{ fill: 'var(--mui-palette-background-level2)' }}
                >
                  {data.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </RadialBar>
              </RadialBarChart>
            </NoSsr>
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
              }}
            >
              <Typography variant="h4">{utilization}%</Typography>
              <Typography color="text.secondary" variant="caption">spent</Typography>
            </Box>
          </Box>
          <Stack spacing={1} sx={{ width: '100%' }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'var(--mui-palette-primary-main)' }} />
                <Typography variant="body2">Expended</Typography>
              </Stack>
              <Typography variant="subtitle2">{formatCompact(expended)}</Typography>
            </Stack>
            <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'var(--mui-palette-warning-main)' }} />
                <Typography variant="body2">Obligated</Typography>
              </Stack>
              <Typography variant="subtitle2">{formatCompact(obligated)}</Typography>
            </Stack>
            <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'var(--mui-palette-background-level2)' }} />
                <Typography variant="body2">Authorized</Typography>
              </Stack>
              <Typography variant="subtitle2">{formatCompact(authorized)}</Typography>
            </Stack>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}

// ─── Contract Status Donut ───
function ContractStatusChart({ data }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader title="Contracts by Status" />
      <CardContent>
        <NoSsr fallback={<Box sx={{ height: 200 }} />}>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((_, index) => (
                  <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip formatter={(v) => `${v} contracts`} />} />
            </PieChart>
          </ResponsiveContainer>
        </NoSsr>
        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 2, justifyContent: 'center', mt: 1 }}>
          {data.map((item, idx) => (
            <Stack key={item.name} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: PIE_COLORS[idx % PIE_COLORS.length] }} />
              <Typography variant="caption" color="text.secondary">
                {item.name} ({item.value})
              </Typography>
            </Stack>
          ))}
        </Stack>
      </CardContent>
    </Card>
  )
}

// ─── Amendment Status (Donut Progress Cards — Devias logistics pattern) ───
function AmendmentStatusCards({ amendments, total }) {
  const statusMap = {
    Draft: { color: 'var(--mui-palette-info-main)', track: 'var(--mui-palette-info-100)' },
    'In Review': { color: 'var(--mui-palette-warning-main)', track: 'var(--mui-palette-warning-100)' },
    Approved: { color: 'var(--mui-palette-success-main)', track: 'var(--mui-palette-success-100)' },
    Effective: { color: 'var(--mui-palette-primary-main)', track: 'var(--mui-palette-primary-100)' },
    Rejected: { color: 'var(--mui-palette-error-main)', track: 'var(--mui-palette-error-100)' },
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        avatar={<Avatar><NoteIcon fontSize="var(--Icon-fontSize)" /></Avatar>}
        title="Amendments"
        subheader={`${total} total`}
      />
      <CardContent>
        <Grid container spacing={2}>
          {amendments.map((amd) => {
            const status = amd.cux_Approval_Status__c
            const colors = statusMap[status] || { color: 'var(--mui-palette-neutral-400)', track: 'var(--mui-palette-neutral-100)' }
            const pct = total > 0 ? Math.round((amd.cnt / total) * 100) : 0
            const chartSize = 72
            const thickness = 8
            const pieData = [
              { name: status, value: pct, color: colors.color },
              { name: 'Empty', value: 100 - pct, color: colors.track },
            ]
            return (
              <Grid key={status} size={{ xs: 6 }}>
                <Card variant="outlined">
                  <Stack spacing={1} sx={{ alignItems: 'center', px: 1, py: 2 }}>
                    <NoSsr fallback={<Box sx={{ height: chartSize, width: chartSize }} />}>
                      <PieChart height={chartSize} width={chartSize} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                        <Pie
                          animationDuration={300}
                          cx={chartSize / 2}
                          cy={chartSize / 2}
                          data={pieData}
                          dataKey="value"
                          innerRadius={chartSize / 2 - thickness}
                          outerRadius={chartSize / 2}
                          strokeWidth={0}
                        >
                          {pieData.map((entry) => (
                            <Cell fill={entry.color} key={entry.name} />
                          ))}
                        </Pie>
                      </PieChart>
                    </NoSsr>
                    <Typography variant="subtitle2">{amd.cnt}</Typography>
                    <Typography color="text.secondary" variant="caption">{status}</Typography>
                  </Stack>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      </CardContent>
    </Card>
  )
}

// ─── Invoice by Category Bar Chart ───
function InvoiceCategoryChart({ data }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader title="Invoices by Category" subheader="Approval & Paid" />
      <CardContent>
        <NoSsr fallback={<Box sx={{ height: 300 }} />}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<ChartTooltip formatter={(v) => formatCurrency(v)} />} cursor={{ fill: 'var(--mui-palette-action-hover)' }} />
              <Bar dataKey="amount" fill="var(--mui-palette-primary-main)" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </NoSsr>
      </CardContent>
    </Card>
  )
}

// ─── Invoice Pipeline ───
function InvoicePipeline({ data }) {
  const totalAmt = data.reduce((s, d) => s + d.amount, 0) || 1

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader title="Invoice Pipeline" />
      <Divider />
      <CardContent>
        <Stack spacing={2}>
          {data.map((row) => (
            <Stack key={row.name} spacing={1}>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Chip
                    label={row.name}
                    color={invoiceStatusColors[row.name] || 'default'}
                    size="small"
                    variant="soft"
                  />
                  <Typography variant="body2" color="text.secondary">
                    {row.value} invoice{row.value !== 1 ? 's' : ''}
                  </Typography>
                </Stack>
                <Typography variant="subtitle2">{formatCurrency(row.amount)}</Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={Math.min((row.amount / totalAmt) * 100, 100)}
                color={invoiceStatusColors[row.name] === 'default' ? 'inherit' : invoiceStatusColors[row.name] || 'primary'}
                sx={{ height: 6, borderRadius: 3 }}
              />
            </Stack>
          ))}
        </Stack>
      </CardContent>
    </Card>
  )
}

// ─── Task Orders by Contract (Horizontal Bar) ───
function TaskOrdersByContract({ data }) {
  if (!data?.length) return null

  const chartData = data.map((r) => ({
    name: r.Name || 'Unknown',
    authorized: r.cux_Authorized_Amount__c || 0,
    invoiced: r.cux_Total_Invoiced_Amount__c || 0,
  }))

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader title="Active Task Orders by Contract" subheader="Authorized vs Invoiced" />
      <CardContent>
        <NoSsr fallback={<Box sx={{ height: 300 }} />}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={75} tick={{ fontSize: 11 }} />
              <Tooltip content={<MultiBarTooltip />} cursor={{ fill: 'var(--mui-palette-action-hover)' }} />
              <Bar dataKey="authorized" fill="var(--mui-palette-primary-main)" radius={[0, 4, 4, 0]} barSize={12} name="Authorized" />
              <Bar dataKey="invoiced" fill="var(--mui-palette-success-main)" radius={[0, 4, 4, 0]} barSize={12} name="Invoiced" />
            </BarChart>
          </ResponsiveContainer>
        </NoSsr>
        <Stack direction="row" spacing={3} sx={{ justifyContent: 'center', mt: 1 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Box sx={{ width: 10, height: 10, borderRadius: 1, bgcolor: 'var(--mui-palette-primary-main)' }} />
            <Typography variant="caption" color="text.secondary">Authorized</Typography>
          </Stack>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Box sx={{ width: 10, height: 10, borderRadius: 1, bgcolor: 'var(--mui-palette-success-main)' }} />
            <Typography variant="caption" color="text.secondary">Invoiced</Typography>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}

// ─── Recent Invoices ───
function RecentInvoices({ invoices }) {
  if (!invoices?.length) return null

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader title="Recent Invoices" />
      <Divider />
      <Box sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: 400 }}>
          <TableHead>
            <TableRow>
              <TableCell>Invoice</TableCell>
              <TableCell>Task Order</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Amount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices.map((inv) => (
              <TableRow key={inv.Id} hover>
                <TableCell>
                  <Typography variant="subtitle2">{inv.Name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {inv.cux_Invoice_Date__c ? dayjs(inv.cux_Invoice_Date__c).format('MMM D, YYYY') : '—'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{inv.cux_Task_Order__r?.Name || '—'}</Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={inv.cux_Status__c}
                    color={invoiceStatusColors[inv.cux_Status__c] || 'default'}
                    size="small"
                    variant="soft"
                  />
                </TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle2">{formatCurrency(inv.cux_Amount__c)}</Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Card>
  )
}

// ─── Expiring Contracts Table ───
function ExpiringContracts({ contracts }) {
  return (
    <Card>
      <CardHeader title="Active Contracts — Nearest Expiry" />
      <Divider />
      <Box sx={{ overflowX: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Contract</TableCell>
              <TableCell>Vendor</TableCell>
              <TableCell align="right">Authorized</TableCell>
              <TableCell>Utilization</TableCell>
              <TableCell>End Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {contracts?.map((c) => {
              const utilization =
                c.cux_Total_Authorized_Amount__c > 0
                  ? ((c.cux_Total_Expended_Amount__c || 0) / c.cux_Total_Authorized_Amount__c) * 100
                  : 0
              const daysLeft = c.cux_End_Date__c ? dayjs(c.cux_End_Date__c).diff(dayjs(), 'day') : null

              return (
                <TableRow key={c.Id} hover>
                  <TableCell>
                    <Link component={RouterLink} href={paths.dashboard.contracts.details(c.Id)} variant="subtitle2">
                      {c.Name}
                    </Link>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {c.cux_Title__c}
                    </Typography>
                  </TableCell>
                  <TableCell>{c.cux_Account__r?.Name || '—'}</TableCell>
                  <TableCell align="right">{formatCompact(c.cux_Total_Authorized_Amount__c)}</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>
                    <Stack spacing={0.5}>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(utilization, 100)}
                        color={utilization > 90 ? 'error' : utilization > 70 ? 'warning' : 'primary'}
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {utilization.toFixed(0)}%
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack>
                      <Typography variant="body2">
                        {c.cux_End_Date__c ? dayjs(c.cux_End_Date__c).format('MMM D, YYYY') : '—'}
                      </Typography>
                      {daysLeft != null && (
                        <Typography variant="caption" color={daysLeft < 90 ? 'error.main' : 'text.secondary'}>
                          {daysLeft > 0 ? `${daysLeft}d left` : 'Expired'}
                        </Typography>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Box>
    </Card>
  )
}

// ─── Task Order Summary ───
function TaskOrderSummary({ data }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader title="Task Orders by Status" />
      <Divider />
      <CardContent>
        <Stack spacing={2}>
          {data.map((row) => {
            const burn = row.authorized > 0 ? (row.invoiced / row.authorized) * 100 : 0
            return (
              <Stack key={row.name} spacing={1}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Chip label={row.name} size="small" variant="outlined" />
                    <Typography variant="caption" color="text.secondary">{row.count} orders</Typography>
                  </Stack>
                  <Typography variant="subtitle2">{formatCompact(row.authorized)}</Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(burn, 100)}
                  color={burn > 90 ? 'error' : burn > 70 ? 'warning' : 'success'}
                  sx={{ height: 6, borderRadius: 3 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'right' }}>
                  {burn.toFixed(0)}% burned ({formatCompact(row.invoiced)} invoiced)
                </Typography>
              </Stack>
            )
          })}
        </Stack>
      </CardContent>
    </Card>
  )
}

// ─── Shared Tooltips ───
function ChartTooltip({ active, payload, formatter }) {
  if (!active || !payload?.length) return null
  return (
    <Paper sx={{ p: 1.5, border: '1px solid var(--mui-palette-divider)' }}>
      <Typography variant="subtitle2">{payload[0].name || payload[0].payload?.name}</Typography>
      <Typography variant="body2" color="text.secondary">
        {formatter ? formatter(payload[0].value) : payload[0].value}
      </Typography>
    </Paper>
  )
}

function MultiBarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <Paper sx={{ p: 1.5, border: '1px solid var(--mui-palette-divider)' }}>
      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>{label}</Typography>
      {payload.map((entry) => (
        <Stack key={entry.name} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: entry.fill }} />
          <Typography variant="body2" color="text.secondary">
            {entry.name}: {formatCurrency(entry.value)}
          </Typography>
        </Stack>
      ))}
    </Paper>
  )
}
