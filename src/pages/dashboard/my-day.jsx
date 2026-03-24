import * as React from 'react'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Collapse from '@mui/material/Collapse'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import LinearProgress from '@mui/material/LinearProgress'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { CalendarCheckIcon } from '@phosphor-icons/react/dist/ssr/CalendarCheck'
import { CheckCircleIcon } from '@phosphor-icons/react/dist/ssr/CheckCircle'
import { ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock'
import { FileTextIcon } from '@phosphor-icons/react/dist/ssr/FileText'
import { FolderOpenIcon } from '@phosphor-icons/react/dist/ssr/FolderOpen'
import { GavelIcon } from '@phosphor-icons/react/dist/ssr/Gavel'
import { LightbulbIcon } from '@phosphor-icons/react/dist/ssr/Lightbulb'
import { ListChecksIcon } from '@phosphor-icons/react/dist/ssr/ListChecks'
import { ShieldCheckIcon } from '@phosphor-icons/react/dist/ssr/ShieldCheck'
import { WarningIcon } from '@phosphor-icons/react/dist/ssr/Warning'
import { XIcon } from '@phosphor-icons/react/dist/ssr/X'
import { Helmet } from 'react-helmet-async'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

import { appConfig } from '@/config/app'
import { useAuth } from '@/auth/AuthContext'
import { useSalesforceClient, useSalesforceQuery } from '@/hooks/use-salesforce'
import { dayjs } from '@/lib/dayjs'
import { paths } from '@/paths'
import { enhanceText } from '@/api/azure-openai'
import { AnimatedPage } from '@/components/core/animations'
import { AiMarkdown } from '@/components/core/ai-markdown'
import { NoSsr } from '@/components/core/no-ssr'
import { RouterLink } from '@/components/core/link'
import { SortableTableCell } from '@/components/core/sortable-table-cell'
import { useTableSort } from '@/hooks/use-table-sort'
import { EntityLink } from '@/components/dashboard/work/entity-link'

const metadata = { title: `My Day | Dashboard | ${appConfig.name}` }

const priorityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 }
const priorityColor = { Critical: 'error', High: 'warning', Medium: 'info', Low: 'default' }
const statusColor = { 'Not Started': 'default', 'In Progress': 'info', Blocked: 'error', Complete: 'success' }

const invoiceStatusColors = {
  Draft: 'default',
  Review: 'warning',
  Approval: 'info',
  Approved: 'success',
  Paid: 'success',
  Rejected: 'error',
  Void: 'default',
}

const caseStatusColors = {
  New: 'info',
  Open: 'info',
  'In Progress': 'warning',
  Escalated: 'error',
  'On Hold': 'default',
}

const PIE_COLORS = [
  'var(--mui-palette-primary-main)',
  'var(--mui-palette-success-main)',
  'var(--mui-palette-warning-main)',
  'var(--mui-palette-error-main)',
  'var(--mui-palette-info-main)',
  'var(--mui-palette-secondary-main)',
]

const ENTITY_LABELS = {
  cux_Contract__c: 'Contracts',
  cux_TaskOrder__c: 'Task Orders',
  cux_Invoice__c: 'Invoices',
  cux_Case__c: 'Cases',
}

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

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function EmptyState({ message }) {
  return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <Typography color="text.secondary" variant="body2">{message}</Typography>
    </Box>
  )
}

export function Page() {
  const { auth } = useAuth()
  const client = useSalesforceClient()
  const userId = auth?.user?.id

  const { data, loading, error } = useSalesforceQuery(
    (c) => c.getMyDayData(userId),
    [userId]
  )

  const tasks = data?.tasks || []
  const completedToday = data?.completedToday || []
  const myInvoices = data?.myInvoices || []
  const myContracts = data?.myContracts || []
  const myCases = data?.myCases || []
  const myValidations = data?.myValidations || []

  // Client-side priority sort
  const sortedByPriority = React.useMemo(() => {
    return [...tasks].sort((a, b) => {
      const pa = priorityOrder[a.cux_Priority__c] ?? 4
      const pb = priorityOrder[b.cux_Priority__c] ?? 4
      if (pa !== pb) return pa - pb
      if (!a.cux_Due_Date__c && !b.cux_Due_Date__c) return 0
      if (!a.cux_Due_Date__c) return 1
      if (!b.cux_Due_Date__c) return -1
      return a.cux_Due_Date__c.localeCompare(b.cux_Due_Date__c)
    })
  }, [tasks])

  const { sortedData, sortKey, sortDirection, onSort } = useTableSort(sortedByPriority, {
    defaultSortKey: null,
    defaultDirection: 'asc',
  })

  const displayTasks = sortKey ? sortedData : sortedByPriority

  const overdueCount = tasks.filter(
    (t) => t.cux_Due_Date__c && dayjs(t.cux_Due_Date__c).isBefore(dayjs(), 'day')
  ).length

  const dueThisWeek = tasks.filter(
    (t) => t.cux_Due_Date__c && dayjs(t.cux_Due_Date__c).isBefore(dayjs().endOf('week'), 'day')
  ).length

  const inProgressCount = tasks.filter((t) => t.cux_Status__c === 'In Progress').length

  // Task distribution by entity type
  const taskDistribution = React.useMemo(() => {
    const counts = {}
    for (const t of tasks) {
      const key = t.cux_Entity_Type__c || 'Other'
      counts[key] = (counts[key] || 0) + 1
    }
    return Object.entries(counts).map(([key, value]) => ({
      name: ENTITY_LABELS[key] || 'Other',
      value,
    }))
  }, [tasks])


  if (!userId) {
    return (
      <Alert severity="warning" sx={{ m: 3 }}>
        User identity not available. Please log out and log back in.
      </Alert>
    )
  }

  const firstName = auth?.user?.name?.split(' ')[0] || 'there'

  return (
    <React.Fragment>
      <Helmet><title>{metadata.title}</title></Helmet>
      <AnimatedPage>
        <Box sx={{ maxWidth: 'var(--Content-maxWidth)', m: 'var(--Content-margin)', p: 'var(--Content-padding)', width: 'var(--Content-width)' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ m: 2 }}>Failed to load data: {error.message}</Alert>
          ) : (
            <Stack spacing={3}>
              {/* Greeting */}
              <div>
                <Typography variant="h4">{getGreeting()}, {firstName}</Typography>
                <Typography variant="body2" color="text.secondary">Here&apos;s your work for today</Typography>
              </div>

              {/* Summary Strip */}
              <MySummaryStrip
                openTasks={tasks.length}
                inProgress={inProgressCount}
                overdueCount={overdueCount}
                dueThisWeek={dueThisWeek}
                completedToday={completedToday.length}
              />

              {/* Priority Tasks + Task Distribution */}
              <Grid container spacing={3}>
                <Grid size={{ md: 8, xs: 12 }}>
                  <PriorityTasksCard
                    tasks={displayTasks}
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={onSort}
                  />
                </Grid>
                <Grid size={{ md: 4, xs: 12 }}>
                  <TaskDistributionChart data={taskDistribution} total={tasks.length} />
                </Grid>
              </Grid>

              {/* Invoices + Expiring Contracts */}
              <Grid container spacing={3}>
                <Grid size={{ md: 6, xs: 12 }}>
                  <InvoiceAttentionCard invoices={myInvoices} />
                </Grid>
                <Grid size={{ md: 6, xs: 12 }}>
                  <MyExpiringContracts contracts={myContracts} />
                </Grid>
              </Grid>

              {/* Cases + Validations */}
              <Grid container spacing={3}>
                <Grid size={{ md: 6, xs: 12 }}>
                  <MyOpenCases cases={myCases} />
                </Grid>
                <Grid size={{ md: 6, xs: 12 }}>
                  <PendingValidationsCard validations={myValidations} />
                </Grid>
              </Grid>
            </Stack>
          )}
        </Box>
      </AnimatedPage>
    </React.Fragment>
  )
}

// ─── Summary Strip ───

function MySummaryStrip({ openTasks, inProgress, overdueCount, dueThisWeek, completedToday }) {
  const stats = [
    {
      label: 'Open Tasks',
      value: openTasks,
      detail: `${inProgress} in progress`,
      icon: ListChecksIcon,
      color: 'primary',
    },
    {
      label: 'Overdue',
      value: overdueCount,
      detail: overdueCount > 0 ? 'Needs attention' : 'All on track',
      icon: WarningIcon,
      color: overdueCount > 0 ? 'error' : 'success',
    },
    {
      label: 'Due This Week',
      value: dueThisWeek,
      detail: `by ${dayjs().endOf('week').format('ddd, MMM D')}`,
      icon: CalendarCheckIcon,
      color: 'info',
    },
    {
      label: 'Completed Today',
      value: completedToday,
      detail: completedToday > 0 ? 'Keep it up!' : 'Get started',
      icon: CheckCircleIcon,
      color: 'success',
    },
  ]

  return (
    <Card>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' } }}>
        {stats.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <React.Fragment key={stat.label}>
              {idx > 0 && (
                <Divider
                  flexItem
                  orientation="vertical"
                  sx={{ display: { xs: idx === 2 ? 'none' : 'block', md: 'block' } }}
                />
              )}
              <Stack spacing={1} sx={{ p: 3, alignItems: 'center' }}>
                <Avatar
                  sx={{
                    bgcolor: `var(--mui-palette-${stat.color}-50, var(--mui-palette-primary-50))`,
                    color: `var(--mui-palette-${stat.color}-main)`,
                    height: 48,
                    width: 48,
                  }}
                >
                  <Icon fontSize="var(--icon-fontSize-lg)" />
                </Avatar>
                <Typography variant="h3">{stat.value}</Typography>
                <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
                <Typography variant="caption" color="text.secondary">{stat.detail}</Typography>
              </Stack>
            </React.Fragment>
          )
        })}
      </Box>
    </Card>
  )
}

// ─── Priority Tasks Card ───

function PriorityTasksCard({ tasks, sortKey, sortDirection, onSort }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title="Priority Queue"
        subheader={`${tasks.length} open tasks`}
        action={
          <Button component={RouterLink} href={paths.dashboard.workQueue} size="small">
            View all
          </Button>
        }
      />
      <Divider />
      {tasks.length === 0 ? (
        <EmptyState message="No open tasks assigned to you. You're all caught up!" />
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 600 }}>
            <TableHead>
              <TableRow>
                <SortableTableCell sortKey="cux_Priority__c" activeSortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>
                  Priority
                </SortableTableCell>
                <SortableTableCell sortKey="cux_Title__c" activeSortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>
                  Title
                </SortableTableCell>
                <TableCell>Entity</TableCell>
                <SortableTableCell sortKey="cux_Due_Date__c" activeSortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>
                  Due Date
                </SortableTableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tasks.slice(0, 10).map((task) => {
                const isOverdue = task.cux_Due_Date__c && dayjs(task.cux_Due_Date__c).isBefore(dayjs(), 'day')
                return (
                  <TableRow hover key={task.Id}>
                    <TableCell>
                      <Chip
                        label={task.cux_Priority__c || 'Medium'}
                        size="small"
                        variant="soft"
                        color={priorityColor[task.cux_Priority__c] || 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2">{task.cux_Title__c || task.Name}</Typography>
                      {task.cux_Assigned_Role__c && (
                        <Typography variant="caption" color="text.secondary">{task.cux_Assigned_Role__c}</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {task.cux_Task_Order__c ? (
                        <EntityLink
                          entityType="cux_TaskOrder__c"
                          entityId={task.cux_Task_Order__c}
                          label={task.cux_Task_Order__r?.Name}
                        />
                      ) : task.cux_Contract__c ? (
                        <EntityLink
                          entityType="cux_Contract__c"
                          entityId={task.cux_Contract__c}
                          label={task.cux_Contract__r?.Name}
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">{task.cux_Entity_Type__c || '\u2014'}</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color={isOverdue ? 'error' : 'text.primary'} sx={{ whiteSpace: 'nowrap', fontWeight: isOverdue ? 600 : 400 }}>
                        {task.cux_Due_Date__c ? dayjs(task.cux_Due_Date__c).format('MMM D, YYYY') : '\u2014'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={task.cux_Status__c || 'Not Started'}
                        size="small"
                        variant="soft"
                        color={statusColor[task.cux_Status__c] || 'default'}
                      />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Box>
      )}
    </Card>
  )
}

// ─── Task Distribution Chart ───

function TaskDistributionChart({ data, total }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader title="Task Distribution" subheader={`${total} tasks by type`} />
      <Divider />
      {data.length === 0 ? (
        <EmptyState message="No tasks to chart" />
      ) : (
        <CardContent>
          <NoSsr fallback={<Box sx={{ height: 260 }} />}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ payload }) => {
                    if (!payload?.length) return null
                    const { name, value } = payload[0].payload
                    return (
                      <Box sx={{ bgcolor: 'var(--mui-palette-background-paper)', border: '1px solid var(--mui-palette-divider)', borderRadius: 1, p: 1 }}>
                        <Typography variant="caption">{name}: {value}</Typography>
                      </Box>
                    )
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </NoSsr>
          <Stack spacing={1} sx={{ mt: 1 }}>
            {data.map((item, idx) => (
              <Stack key={item.name} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>{item.name}</Typography>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>{item.value}</Typography>
              </Stack>
            ))}
          </Stack>
        </CardContent>
      )}
    </Card>
  )
}

// ─── Invoices Needing Attention ───

function InvoiceAttentionCard({ invoices }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        avatar={<Avatar sx={{ bgcolor: 'var(--mui-palette-warning-50)', color: 'var(--mui-palette-warning-main)' }}><FileTextIcon fontSize="var(--icon-fontSize-md)" /></Avatar>}
        title="Invoices Needing Attention"
        subheader={`${invoices.length} pending`}
        action={
          <Button component={RouterLink} href={paths.dashboard.invoices.list} size="small">
            View all
          </Button>
        }
      />
      <Divider />
      {invoices.length === 0 ? (
        <EmptyState message="No invoices need your attention" />
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 500 }}>
            <TableHead>
              <TableRow>
                <TableCell>Invoice</TableCell>
                <TableCell>Contract</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Due</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.map((inv) => {
                const isOverdue = inv.cux_Payment_Schedule_Date__c && dayjs(inv.cux_Payment_Schedule_Date__c).isBefore(dayjs(), 'day')
                return (
                  <TableRow hover key={inv.Id}>
                    <TableCell>
                      <Link component={RouterLink} href={paths.dashboard.invoices.details(inv.Id)} variant="subtitle2" underline="hover">
                        {inv.Name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                        {inv.cux_Contract__r?.Name || '\u2014'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={inv.cux_Status__c} size="small" variant="soft" color={invoiceStatusColors[inv.cux_Status__c] || 'default'} />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="subtitle2">{formatCurrency(inv.cux_Amount__c)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color={isOverdue ? 'error' : 'text.secondary'} sx={{ whiteSpace: 'nowrap', fontWeight: isOverdue ? 600 : 400 }}>
                        {inv.cux_Payment_Schedule_Date__c ? dayjs(inv.cux_Payment_Schedule_Date__c).format('MMM D') : '\u2014'}
                        {isOverdue && ' (overdue)'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Box>
      )}
    </Card>
  )
}

// ─── Expiring Contracts ───

function MyExpiringContracts({ contracts }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        avatar={<Avatar sx={{ bgcolor: 'var(--mui-palette-info-50)', color: 'var(--mui-palette-info-main)' }}><FolderOpenIcon fontSize="var(--icon-fontSize-md)" /></Avatar>}
        title="My Contracts"
        subheader={`${contracts.length} active`}
        action={
          <Button component={RouterLink} href={paths.dashboard.contracts.list} size="small">
            View all
          </Button>
        }
      />
      <Divider />
      {contracts.length === 0 ? (
        <EmptyState message="No active contracts assigned to you" />
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 500 }}>
            <TableHead>
              <TableRow>
                <TableCell>Contract</TableCell>
                <TableCell align="right">Authorized</TableCell>
                <TableCell>Utilization</TableCell>
                <TableCell>Expires</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {contracts.map((c) => {
                const authorized = c.cux_Total_Authorized_Amount__c || 0
                const expended = c.cux_Total_Expended_Amount__c || 0
                const utilPct = authorized > 0 ? Math.min((expended / authorized) * 100, 100) : 0
                const daysLeft = c.cux_End_Date__c ? dayjs(c.cux_End_Date__c).diff(dayjs(), 'day') : null
                const isUrgent = daysLeft !== null && daysLeft <= 90
                const utilColor = utilPct >= 90 ? 'error' : utilPct >= 70 ? 'warning' : 'primary'
                return (
                  <TableRow hover key={c.Id}>
                    <TableCell>
                      <Link component={RouterLink} href={paths.dashboard.contracts.details(c.Id)} variant="subtitle2" underline="hover">
                        {c.Name}
                      </Link>
                      {c.cux_Title__c && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{c.cux_Title__c}</Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="subtitle2">{formatCompact(authorized)}</Typography>
                    </TableCell>
                    <TableCell sx={{ minWidth: 120 }}>
                      <Stack spacing={0.5}>
                        <LinearProgress
                          variant="determinate"
                          value={utilPct}
                          color={utilColor}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                        <Typography variant="caption" color="text.secondary">{utilPct.toFixed(0)}% spent</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      {c.cux_End_Date__c ? (
                        <Stack>
                          <Typography variant="body2" color={isUrgent ? 'error' : 'text.primary'} sx={{ whiteSpace: 'nowrap', fontWeight: isUrgent ? 600 : 400 }}>
                            {dayjs(c.cux_End_Date__c).format('MMM D, YYYY')}
                          </Typography>
                          <Typography variant="caption" color={isUrgent ? 'error.main' : 'text.secondary'}>
                            {daysLeft < 0 ? 'Expired' : `${daysLeft}d left`}
                          </Typography>
                        </Stack>
                      ) : (
                        '\u2014'
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Box>
      )}
    </Card>
  )
}

// ─── My Open Cases ───

function MyOpenCases({ cases }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        avatar={<Avatar sx={{ bgcolor: 'var(--mui-palette-error-50)', color: 'var(--mui-palette-error-main)' }}><GavelIcon fontSize="var(--icon-fontSize-md)" /></Avatar>}
        title="My Open Cases"
        subheader={`${cases.length} open`}
        action={
          <Button component={RouterLink} href={paths.dashboard.cases.list} size="small">
            View all
          </Button>
        }
      />
      <Divider />
      {cases.length === 0 ? (
        <EmptyState message="No open cases assigned to you" />
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 400 }}>
            <TableHead>
              <TableRow>
                <TableCell>Case</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cases.map((c) => (
                <TableRow hover key={c.Id}>
                  <TableCell>
                    <Link component={RouterLink} href={paths.dashboard.cases.details(c.Id)} variant="subtitle2" underline="hover">
                      {c.Name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.cux_Subject__c || '\u2014'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={c.cux_Priority__c || 'Medium'} size="small" variant="soft" color={priorityColor[c.cux_Priority__c] || 'default'} />
                  </TableCell>
                  <TableCell>
                    <Chip label={c.cux_Status__c} size="small" variant="soft" color={caseStatusColors[c.cux_Status__c] || 'default'} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
    </Card>
  )
}

// ─── Pending Validations ───

function PendingValidationsCard({ validations }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        avatar={<Avatar sx={{ bgcolor: 'var(--mui-palette-success-50)', color: 'var(--mui-palette-success-main)' }}><ShieldCheckIcon fontSize="var(--icon-fontSize-md)" /></Avatar>}
        title="Pending Validations"
        subheader={`${validations.length} in progress`}
        action={
          <Button component={RouterLink} href={paths.dashboard.validations.requests.list} size="small">
            View all
          </Button>
        }
      />
      <Divider />
      {validations.length === 0 ? (
        <EmptyState message="No pending validation requests" />
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 400 }}>
            <TableHead>
              <TableRow>
                <TableCell>Request</TableCell>
                <TableCell>Profile</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Requested</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {validations.map((v) => (
                <TableRow hover key={v.Id}>
                  <TableCell>
                    <Link component={RouterLink} href={paths.dashboard.validations.requests.details(v.Id)} variant="subtitle2" underline="hover">
                      {v.Name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {v.cux_Validation_Profile__r?.cux_Profile_Name__c || '\u2014'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={v.cux_Status__c} size="small" variant="soft" color={v.cux_Status__c === 'In Progress' ? 'warning' : 'info'} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                      {v.cux_Requested_At__c ? dayjs(v.cux_Requested_At__c).format('MMM D') : dayjs(v.CreatedDate).format('MMM D')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
    </Card>
  )
}

// ─── RainierAI Day Planner ───

const AI_SYSTEM_PROMPT = `You are RainierAI, a productivity assistant for government contract professionals.
You will receive a summary of a user's current work tasks. Analyze them and provide:
1. A prioritized plan for the day (which tasks to tackle first and why)
2. Time management tips based on due dates and priorities
3. Risks to flag (overdue items, blocked tasks, upcoming deadlines)
4. A brief motivational note

Keep your response concise (under 300 words), practical, and formatted with bullet points.
Use a friendly but professional tone. Do not invent tasks — only reference what is provided.`

function RainierAiCard({ tasks, overdueCount, completedTodayCount }) {
  const [advice, setAdvice] = React.useState(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState(null)
  const [dismissed, setDismissed] = React.useState(false)

  async function handlePlanMyDay() {
    setLoading(true)
    setError(null)
    try {
      const taskSummary = tasks.map((t) => {
        const overdue = t.cux_Due_Date__c && dayjs(t.cux_Due_Date__c).isBefore(dayjs(), 'day')
        return `- [${t.cux_Priority__c || 'Medium'}] ${t.cux_Title__c || t.Name} | Status: ${t.cux_Status__c} | Due: ${t.cux_Due_Date__c || 'No date'}${overdue ? ' (OVERDUE)' : ''}${t.cux_Is_Blocked__c ? ' (BLOCKED)' : ''} | Role: ${t.cux_Assigned_Role__c || 'N/A'}`
      }).join('\n')

      const userMessage = `Today's date: ${dayjs().format('MMMM D, YYYY')}
Open tasks: ${tasks.length} | Overdue: ${overdueCount} | Completed today: ${completedTodayCount}

My tasks:
${taskSummary}`

      const result = await enhanceText(userMessage, '_custom', {
        _systemPrompt: AI_SYSTEM_PROMPT,
      })
      setAdvice(result)
    } catch (err) {
      setError(err.message || 'Failed to get AI suggestions')
    } finally {
      setLoading(false)
    }
  }

  if (dismissed) return null

  return (
    <Card sx={{
      background: 'linear-gradient(135deg, var(--mui-palette-primary-50, rgba(38,105,179,0.06)) 0%, var(--mui-palette-background-paper) 100%)',
      border: '1px solid var(--mui-palette-primary-100, rgba(38,105,179,0.15))',
    }}>
      <CardHeader
        avatar={<Box component="img" src="/assets/reinier-blue.svg" alt="RainierAI" sx={{ width: 40, height: 'auto' }} />}
        title="RainierAI Day Planner"
        subheader="Let AI help you organize your day"
        action={
          <Stack direction="row" spacing={1}>
            {!advice && !loading && (
              <Button
                variant="contained"
                size="small"
                startIcon={<LightbulbIcon />}
                onClick={handlePlanMyDay}
              >
                Plan My Day
              </Button>
            )}
            <Button size="small" color="secondary" onClick={() => setDismissed(true)} sx={{ minWidth: 'auto', px: 1 }}>
              <XIcon />
            </Button>
          </Stack>
        }
      />
      {loading && (
        <CardContent sx={{ pt: 0 }}>
          <LinearProgress sx={{ borderRadius: 1, mb: 1 }} />
          <Typography variant="body2" color="text.secondary">RainierAI is analyzing your tasks...</Typography>
        </CardContent>
      )}
      {error && (
        <CardContent sx={{ pt: 0 }}>
          <Alert severity="error" action={<Button size="small" onClick={handlePlanMyDay}>Retry</Button>}>{error}</Alert>
        </CardContent>
      )}
      <Collapse in={Boolean(advice)} unmountOnExit>
        <CardContent sx={{ pt: 0 }}>
          <Box sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: 'var(--mui-palette-background-paper)',
            border: '1px solid var(--mui-palette-divider)',
          }}>
            <AiMarkdown>{advice}</AiMarkdown>
          </Box>
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Button size="small" variant="outlined" onClick={handlePlanMyDay}>Refresh</Button>
            <Button size="small" color="secondary" onClick={() => { setAdvice(null); setError(null) }}>Dismiss</Button>
          </Stack>
        </CardContent>
      </Collapse>
    </Card>
  )
}
