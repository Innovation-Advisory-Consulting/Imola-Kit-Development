import * as React from 'react'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import Link from '@mui/material/Link'
import LinearProgress from '@mui/material/LinearProgress'
import Stack from '@mui/material/Stack'
import Step from '@mui/material/Step'
import StepConnector from '@mui/material/StepConnector'
import StepLabel from '@mui/material/StepLabel'
import Stepper from '@mui/material/Stepper'
import { styled } from '@mui/material/styles'
import Tab from '@mui/material/Tab'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Drawer from '@mui/material/Drawer'
import FormControl from '@mui/material/FormControl'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import OutlinedInput from '@mui/material/OutlinedInput'
import Select from '@mui/material/Select'
import { BuildingsIcon } from '@phosphor-icons/react/dist/ssr/Buildings'
import { CalendarIcon } from '@phosphor-icons/react/dist/ssr/Calendar'
import { CaretRightIcon } from '@phosphor-icons/react/dist/ssr/CaretRight'
import { CheckCircleIcon } from '@phosphor-icons/react/dist/ssr/CheckCircle'
import { ClipboardTextIcon } from '@phosphor-icons/react/dist/ssr/ClipboardText'
import { ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock'
import { CurrencyDollarIcon } from '@phosphor-icons/react/dist/ssr/CurrencyDollar'
import { EnvelopeSimpleIcon } from '@phosphor-icons/react/dist/ssr/EnvelopeSimple'
import { EyeIcon } from '@phosphor-icons/react/dist/ssr/Eye'
import { FileTextIcon } from '@phosphor-icons/react/dist/ssr/FileText'
import { FlagCheckeredIcon } from '@phosphor-icons/react/dist/ssr/FlagCheckered'
import { LightningIcon } from '@phosphor-icons/react/dist/ssr/Lightning'
import { LockIcon } from '@phosphor-icons/react/dist/ssr/Lock'
import { PhoneIcon } from '@phosphor-icons/react/dist/ssr/Phone'
import { PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus'
import { SealCheckIcon } from '@phosphor-icons/react/dist/ssr/SealCheck'
import { UserIcon } from '@phosphor-icons/react/dist/ssr/User'
import { ShieldCheckIcon } from '@phosphor-icons/react/dist/ssr/ShieldCheck'
import { UserCirclePlusIcon } from '@phosphor-icons/react/dist/ssr/UserCirclePlus'
import { XIcon } from '@phosphor-icons/react/dist/ssr/X'
import { XCircleIcon } from '@phosphor-icons/react/dist/ssr/XCircle'
import { Helmet } from 'react-helmet-async'
import { useParams } from 'react-router-dom'

import { useRecentRecords } from '@/contexts/recent-records-context'
import { appConfig } from '@/config/app'
import { paths } from '@/paths'
import { dayjs } from '@/lib/dayjs'
import { RouterLink } from '@/components/core/link'
import { PropertyItem } from '@/components/core/property-item'
import { PropertyList } from '@/components/core/property-list'
import { useSalesforceClient, useSalesforceQuery } from '@/hooks/use-salesforce'
import { useRunValidation, completeReviewWork, triggerStageValidation, reopenReviewWork } from '@/hooks/use-validation-engine'
import { useAuth } from '@/auth/AuthContext'
import { EntityReviewPanel } from '@/components/dashboard/validations/entity-review-panel'
import { AssignReviewerDialog } from '@/components/dashboard/work/assign-reviewer-dialog'
import { AnimatedPage } from '@/components/core/animations'
import { EntityEventsTab } from '@/components/dashboard/entity-timeline'
import { EntityDocumentsTab } from '@/components/dashboard/entity-documents'

const metadata = { title: `Details | Task Orders | Dashboard | ${appConfig.name}` }

const statusColorMap = {
  Draft: 'default',
  'Under Review': 'warning',
  Approved: 'info',
  Active: 'success',
  Completed: 'success',
  Closed: 'default',
  Terminated: 'error',
}

const invoiceStatusColorMap = {
  Draft: 'default',
  Submitted: 'warning',
  Approved: 'info',
  Paid: 'success',
  Rejected: 'error',
  Void: 'default',
}

const timesheetStatusColorMap = {
  Draft: 'default',
  Submitted: 'warning',
  Approved: 'success',
  Rejected: 'error',
}

function formatCurrency(value) {
  if (value == null) return '$0.00'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

const TO_STATUS_NEXT = {
  'Draft': 'Under Review',
  'Under Review': 'Approved',
  'Approved': 'Active',
}
const TO_STATUS_PREV = Object.fromEntries(Object.entries(TO_STATUS_NEXT).map(([from, to]) => [to, from]))

export function Page() {
  const { taskOrderId } = useParams()
  const [currentTab, setCurrentTab] = React.useState('overview')
  const [reviewOpen, setReviewOpen] = React.useState(false)
  const [assignOpen, setAssignOpen] = React.useState(false)

  const { addRecentRecord } = useRecentRecords()

  const { data: taskOrder, loading, error, refetch: refetchTaskOrder } = useSalesforceQuery(
    (client) => client.getTaskOrder(taskOrderId),
    [taskOrderId]
  )

  React.useEffect(() => {
    if (taskOrder?.Name) {
      addRecentRecord({ id: taskOrderId, name: taskOrder.Name, label: 'Task Order', path: `/dashboard/task-orders/${taskOrderId}` })
    }
  }, [taskOrder?.Name, taskOrderId, addRecentRecord])

  const { data: invoices } = useSalesforceQuery(
    (client) => client.getTaskOrderInvoices(taskOrderId),
    [taskOrderId]
  )

  const { data: timesheets } = useSalesforceQuery(
    (client) => client.getTaskOrderTimesheets(taskOrderId),
    [taskOrderId]
  )

  const { data: validationRequests, refetch: refetchValidations } = useSalesforceQuery(
    (client) => client.getValidationRequests('Task Order', taskOrderId),
    [taskOrderId]
  )

  const { data: supplements, refetch: refetchSupplements } = useSalesforceQuery(
    (client) => client.getSupplements(taskOrderId),
    [taskOrderId]
  )

  const { data: entityEvents } = useSalesforceQuery(
    (client) => client.getEntityEvents(taskOrderId),
    [taskOrderId]
  )

  const { data: entityDocuments, refetch: refetchEntityDocuments } = useSalesforceQuery(
    (client) => client.getEntityDocuments('TaskOrder', taskOrderId),
    [taskOrderId]
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
        Failed to load task order: {error.message}
      </Alert>
    )
  }

  if (!taskOrder) {
    return (
      <Alert severity="warning" sx={{ m: 3 }}>
        Task order not found
      </Alert>
    )
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
        <Stack spacing={4}>
          <Stack spacing={3}>
            <Breadcrumbs separator={<CaretRightIcon fontSize="var(--icon-fontSize-sm)" />}>
              <Link color="text.primary" component={RouterLink} href={paths.dashboard.taskOrders.list} variant="subtitle2" underline="hover">
                Task Orders
              </Link>
              {taskOrder.cux_Contract__c ? (
                <Link color="text.primary" component={RouterLink} href={paths.dashboard.contracts.details(taskOrder.cux_Contract__c)} variant="subtitle2" underline="hover">
                  {taskOrder.cux_Contract__r?.Name || 'Contract'}
                </Link>
              ) : null}
              <Typography color="text.secondary" variant="subtitle2">{taskOrder.Name}</Typography>
            </Breadcrumbs>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ alignItems: 'flex-start' }}>
              <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flex: '1 1 auto' }}>
                <Avatar
                  sx={{
                    '--Avatar-size': '64px',
                    bgcolor: 'var(--mui-palette-info-50)',
                    color: 'var(--mui-palette-info-main)',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                  }}
                >
                  <ClipboardTextIcon fontSize="var(--icon-fontSize-lg)" />
                </Avatar>
                <div>
                  <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                    <Typography variant="h4">{taskOrder.Name}</Typography>
                    <Chip
                      color={statusColorMap[taskOrder.cux_Status__c] || 'default'}
                      label={taskOrder.cux_Status__c}
                      size="small"
                      variant="soft"
                    />
                  </Stack>
                  <Typography color="text.secondary" variant="body1">
                    {taskOrder.cux_Task_Order_Type__c || 'Task Order'}
                    {taskOrder.cux_Contract__r ? ` \u00B7 ${taskOrder.cux_Contract__r.Name}` : ''}
                  </Typography>
                </div>
              </Stack>
            </Stack>
          </Stack>

          <TaskOrderLifecycleStepper status={taskOrder.cux_Status__c} />

          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Tabs value={currentTab} onChange={(_, val) => setCurrentTab(val)}>
              <Tab label="Overview" value="overview" />
              <Tab label={`Invoices (${invoices?.length || 0})`} value="invoices" />
              <Tab label={`Timesheets (${timesheets?.length || 0})`} value="timesheets" />
              <Tab label={`Supplements (${supplements?.length || 0})`} value="supplements" />
              <Tab label={`Documents (${entityDocuments?.length || 0})`} value="documents" />
              <Tab label={`Events (${entityEvents?.length || 0})`} value="events" />
            </Tabs>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<UserCirclePlusIcon />}
                onClick={() => setAssignOpen(true)}
              >
                {taskOrder.cux_Assigned_To__c ? 'Reassign' : 'Assign'}
              </Button>
              <Button
                variant={reviewOpen ? 'contained' : 'outlined'}
                size="small"
                startIcon={<ShieldCheckIcon />}
                onClick={() => setReviewOpen((prev) => !prev)}
              >
                Task Order Review
              </Button>
            </Stack>
          </Stack>

          {currentTab === 'overview' && <OverviewTab taskOrder={taskOrder} invoices={invoices} />}
          {currentTab === 'invoices' && <InvoicesTab invoices={invoices} taskOrder={taskOrder} taskOrderId={taskOrderId} />}
          {currentTab === 'timesheets' && <TimesheetsTab timesheets={timesheets} />}
          {currentTab === 'supplements' && (
            <SupplementsTab
              supplements={supplements}
              taskOrderId={taskOrderId}
              taskOrder={taskOrder}
              onSupplementCreated={() => { refetchSupplements(); refetchTaskOrder() }}
            />
          )}
          {currentTab === 'documents' && (
            <EntityDocumentsTab
              documents={entityDocuments}
              contractId={taskOrder?.cux_Contract__c}
              entityType="TaskOrder"
              entityId={taskOrderId}
              onDocumentAdded={refetchEntityDocuments}
            />
          )}
          {currentTab === 'events' && <EntityEventsTab events={entityEvents} />}

          <Drawer
            anchor="right"
            open={reviewOpen}
            onClose={() => setReviewOpen(false)}
            variant="persistent"
            PaperProps={{
              sx: {
                width: { xs: '100%', sm: 480, md: 520 },
                borderLeft: '1px solid var(--mui-palette-divider)',
                boxShadow: 'var(--mui-shadows-16)',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: '1px solid var(--mui-palette-divider)' }}>
              <Typography variant="h6">{taskOrder.cux_Status__c ? `${taskOrder.cux_Status__c} Checklist` : 'Task Order Review'}</Typography>
              <IconButton onClick={() => setReviewOpen(false)} size="small">
                <XIcon />
              </IconButton>
            </Box>
            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
              <TaskOrderReviewTab
                taskOrderId={taskOrderId}
                taskOrderStatus={taskOrder.cux_Status__c}
                contractId={taskOrder.cux_Contract__c}
                validationRequests={validationRequests}
                onRefresh={refetchValidations}
                onTaskOrderUpdated={refetchTaskOrder}
                onDrawerClose={() => setReviewOpen(false)}
              />
            </Box>
          </Drawer>

          <AssignReviewerDialog
            open={assignOpen}
            onClose={() => setAssignOpen(false)}
            entityType="Task Order"
            entityId={taskOrderId}
            entityName={taskOrder.Name}
            assignmentField="cux_Assigned_To__c"
            sobjectName="cux_TaskOrder__c"
            currentAssigneeId={taskOrder.cux_Assigned_To__c}
            onAssigned={refetchTaskOrder}
          />
        </Stack>
      </Box>
      </AnimatedPage>
    </React.Fragment>
  )
}

// ─── Overview Tab (Devias customer-style layout) ───

function OverviewTab({ taskOrder, invoices }) {
  const contract = taskOrder.cux_Contract__r
  const vendor = contract?.cux_Account__r
  const vendorContact = contract?.cux_Vendor_Contact__r
  const contractManager = contract?.cux_Contract_Manager__r
  const assignedTo = taskOrder.cux_Assigned_To__r

  const totalInvoiced = (invoices || []).reduce((sum, inv) => sum + (inv.cux_Amount__c || 0), 0)
  const paidAmount = (invoices || []).filter((inv) => inv.cux_Status__c === 'Paid').reduce((sum, inv) => sum + (inv.cux_Amount__c || 0), 0)
  const budgetUsed = taskOrder.cux_Authorized_Amount__c
    ? Math.min(100, Math.round((totalInvoiced / taskOrder.cux_Authorized_Amount__c) * 100))
    : 0

  return (
    <Grid container spacing={4}>
      {/* ─── Left column: Task Order + Contract details ─── */}
      <Grid size={{ lg: 4, xs: 12 }}>
        <Stack spacing={3}>
          {/* Task Order Details */}
          <Card>
            <CardHeader
              avatar={<Avatar sx={{ bgcolor: 'var(--mui-palette-info-50)', color: 'var(--mui-palette-info-main)' }}><ClipboardTextIcon fontSize="var(--Icon-fontSize)" /></Avatar>}
              title="Task Order Details"
            />
            <PropertyList divider={<Divider />} orientation="vertical" sx={{ '--PropertyItem-padding': '12px 24px' }}>
              {[
                { key: 'TO Number', value: taskOrder.Name },
                { key: 'Type', value: taskOrder.cux_Task_Order_Type__c },
                { key: 'Status', value: <Chip color={statusColorMap[taskOrder.cux_Status__c] || 'default'} label={taskOrder.cux_Status__c} size="small" variant="soft" /> },
                { key: 'Start Date', value: taskOrder.cux_Start_Date__c ? dayjs(taskOrder.cux_Start_Date__c).format('MMM D, YYYY') : '\u2014' },
                { key: 'End Date', value: taskOrder.cux_End_Date__c ? dayjs(taskOrder.cux_End_Date__c).format('MMM D, YYYY') : '\u2014' },
                ...(taskOrder.cux_Activated_At__c ? [{ key: 'Activated', value: dayjs(taskOrder.cux_Activated_At__c).format('MMM D, YYYY h:mm A') }] : []),
                ...(taskOrder.cux_Current_Supplement_Number__c ? [{ key: 'Supplement #', value: String(taskOrder.cux_Current_Supplement_Number__c) }] : []),
              ].map((item) => (
                <PropertyItem key={item.key} name={item.key} value={item.value} />
              ))}
            </PropertyList>
          </Card>

          {/* Parent Contract */}
          {contract ? (
            <Card>
              <CardHeader
                avatar={<Avatar sx={{ bgcolor: 'var(--mui-palette-primary-50)', color: 'var(--mui-palette-primary-main)' }}><FileTextIcon fontSize="var(--Icon-fontSize)" /></Avatar>}
                title="Parent Contract"
              />
              <PropertyList divider={<Divider />} orientation="vertical" sx={{ '--PropertyItem-padding': '12px 24px' }}>
                {[
                  {
                    key: 'Contract',
                    value: (
                      <Link component={RouterLink} href={paths.dashboard.contracts.details(taskOrder.cux_Contract__c)} variant="subtitle2">
                        {contract.Name}
                      </Link>
                    ),
                  },
                  { key: 'Title', value: contract.cux_Title__c || '\u2014' },
                  { key: 'Type', value: contract.cux_Contract_Type__c || '\u2014' },
                  { key: 'Status', value: contract.cux_Status__c || '\u2014' },
                  { key: 'Contract Amount', value: formatCurrency(contract.cux_Total_Authorized_Amount__c) },
                ].map((item) => (
                  <PropertyItem key={item.key} name={item.key} value={item.value} />
                ))}
              </PropertyList>
            </Card>
          ) : null}

          {/* Scope Summary */}
          {taskOrder.cux_Scope_Summary__c ? (
            <Card>
              <CardHeader title="Scope Summary" />
              <CardContent>
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                  {taskOrder.cux_Scope_Summary__c}
                </Typography>
              </CardContent>
            </Card>
          ) : null}
        </Stack>
      </Grid>

      {/* ─── Right column: Financials, Vendor, Contacts ─── */}
      <Grid size={{ lg: 8, xs: 12 }}>
        <Stack spacing={3}>
          {/* Financial Summary */}
          <Card>
            <CardHeader
              avatar={<Avatar sx={{ bgcolor: 'var(--mui-palette-success-50)', color: 'var(--mui-palette-success-main)' }}><CurrencyDollarIcon fontSize="var(--Icon-fontSize)" /></Avatar>}
              title="Financial Summary"
            />
            <CardContent>
              <Stack spacing={3}>
                <Card sx={{ borderRadius: 1 }} variant="outlined">
                  <Stack
                    direction="row"
                    divider={<Divider flexItem orientation="vertical" />}
                    spacing={3}
                    sx={{ justifyContent: 'space-between', p: 2 }}
                  >
                    <div>
                      <Typography color="text.secondary" variant="overline">Authorized</Typography>
                      <Typography variant="h6">{formatCurrency(taskOrder.cux_Authorized_Amount__c)}</Typography>
                    </div>
                    <div>
                      <Typography color="text.secondary" variant="overline">Invoiced</Typography>
                      <Typography variant="h6">{formatCurrency(totalInvoiced)}</Typography>
                    </div>
                    <div>
                      <Typography color="text.secondary" variant="overline">Paid</Typography>
                      <Typography variant="h6">{formatCurrency(paidAmount)}</Typography>
                    </div>
                    {taskOrder.cux_Max_Authorized_Hours__c != null ? (
                      <div>
                        <Typography color="text.secondary" variant="overline">Max Hours</Typography>
                        <Typography variant="h6">{taskOrder.cux_Max_Authorized_Hours__c}</Typography>
                      </div>
                    ) : null}
                  </Stack>
                </Card>
                {taskOrder.cux_Authorized_Amount__c ? (
                  <Stack spacing={1}>
                    <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Budget Used</Typography>
                      <Typography variant="body2" fontWeight={600}>{budgetUsed}%</Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={budgetUsed}
                      color={budgetUsed > 90 ? 'error' : budgetUsed > 70 ? 'warning' : 'primary'}
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                  </Stack>
                ) : null}
              </Stack>
            </CardContent>
          </Card>

          {/* Vendor */}
          {vendor ? (
            <Card>
              <CardHeader
                avatar={<Avatar sx={{ bgcolor: 'var(--mui-palette-warning-50)', color: 'var(--mui-palette-warning-main)' }}><BuildingsIcon fontSize="var(--Icon-fontSize)" /></Avatar>}
                title="Vendor"
              />
              <CardContent sx={{ pt: 0 }}>
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ '--Avatar-size': '48px', bgcolor: 'var(--mui-palette-warning-50)', color: 'var(--mui-palette-warning-main)', fontSize: '1rem', fontWeight: 700 }}>
                    {getInitials(vendor.Name)}
                  </Avatar>
                  <div>
                    <Link component={RouterLink} href={paths.dashboard.customers.details(contract.cux_Account__c)} variant="subtitle1">
                      {vendor.Name}
                    </Link>
                    <Typography variant="body2" color="text.secondary">
                      {[vendor.BillingCity, vendor.BillingState].filter(Boolean).join(', ') || 'No address'}
                    </Typography>
                  </div>
                </Stack>
                <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap', gap: 1 }}>
                  {vendor.Phone ? (
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                      <PhoneIcon fontSize="var(--icon-fontSize-sm)" />
                      <Typography variant="body2">{vendor.Phone}</Typography>
                    </Stack>
                  ) : null}
                  {vendor.Website ? (
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                      <Link href={vendor.Website.startsWith('http') ? vendor.Website : `https://${vendor.Website}`} target="_blank" rel="noopener" variant="body2">
                        {vendor.Website.replace(/^https?:\/\//, '')}
                      </Link>
                    </Stack>
                  ) : null}
                </Stack>
              </CardContent>
            </Card>
          ) : null}

          {/* People: Vendor Contact, Contract Manager, Assigned To */}
          <Card>
            <CardHeader
              avatar={<Avatar sx={{ bgcolor: 'var(--mui-palette-primary-50)', color: 'var(--mui-palette-primary-main)' }}><UserIcon fontSize="var(--Icon-fontSize)" /></Avatar>}
              title="People"
            />
            <Box sx={{ overflowX: 'auto' }}>
              <Table sx={{ minWidth: 500 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Role</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {vendorContact ? (
                    <TableRow hover>
                      <TableCell><Chip label="Vendor Contact" size="small" variant="soft" color="warning" /></TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                          <Avatar sx={{ '--Avatar-size': '32px', fontSize: '0.75rem' }}>{getInitials(vendorContact.Name)}</Avatar>
                          <div>
                            <Typography variant="subtitle2">{vendorContact.Name}</Typography>
                            {vendorContact.Title ? <Typography variant="caption" color="text.secondary">{vendorContact.Title}</Typography> : null}
                          </div>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        {vendorContact.Email ? <Link href={`mailto:${vendorContact.Email}`} variant="body2">{vendorContact.Email}</Link> : '\u2014'}
                      </TableCell>
                      <TableCell>{vendorContact.Phone || '\u2014'}</TableCell>
                    </TableRow>
                  ) : null}
                  {contractManager ? (
                    <TableRow hover>
                      <TableCell><Chip label="Contract Manager" size="small" variant="soft" color="primary" /></TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                          <Avatar src={contractManager.SmallPhotoUrl} sx={{ '--Avatar-size': '32px', fontSize: '0.75rem' }}>{getInitials(contractManager.Name)}</Avatar>
                          <Typography variant="subtitle2">{contractManager.Name}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        {contractManager.Email ? <Link href={`mailto:${contractManager.Email}`} variant="body2">{contractManager.Email}</Link> : '\u2014'}
                      </TableCell>
                      <TableCell>{'\u2014'}</TableCell>
                    </TableRow>
                  ) : null}
                  {assignedTo ? (
                    <TableRow hover>
                      <TableCell><Chip label="Assigned To" size="small" variant="soft" color="info" /></TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                          <Avatar sx={{ '--Avatar-size': '32px', fontSize: '0.75rem' }}>{getInitials(assignedTo.Name)}</Avatar>
                          <Typography variant="subtitle2">{assignedTo.Name}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        {assignedTo.Email ? <Link href={`mailto:${assignedTo.Email}`} variant="body2">{assignedTo.Email}</Link> : '\u2014'}
                      </TableCell>
                      <TableCell>{'\u2014'}</TableCell>
                    </TableRow>
                  ) : null}
                  {!vendorContact && !contractManager && !assignedTo ? (
                    <TableRow>
                      <TableCell colSpan={4} sx={{ textAlign: 'center', py: 3 }}>
                        <Typography color="text.secondary" variant="body2">No people associated with this task order</Typography>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </Box>
          </Card>
        </Stack>
      </Grid>
    </Grid>
  )
}

// ─── Invoices Tab ───

function InvoicesTab({ invoices, taskOrder, taskOrderId }) {
  const isActive = taskOrder?.cux_Status__c === 'Active'

  return (
    <Stack spacing={3}>
      {isActive && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            startIcon={<PlusIcon />}
            variant="contained"
            component={RouterLink}
            href={`${paths.dashboard.invoices.create}?taskOrderId=${taskOrderId}`}
          >
            Create Invoice
          </Button>
        </Box>
      )}
      {!invoices?.length ? (
        <Card>
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary" variant="body2">No invoices</Typography>
          </Box>
        </Card>
      ) : (
    <Card>
      <Box sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: 700 }}>
          <TableHead>
            <TableRow>
              <TableCell>INV #</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Invoice Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices.map((inv) => (
              <TableRow key={inv.Id} hover>
                <TableCell>
                  <Link
                    color="text.primary"
                    component={RouterLink}
                    href={paths.dashboard.invoices.details(inv.Id)}
                    variant="subtitle2"
                  >
                    {inv.Name}
                  </Link>
                </TableCell>
                <TableCell>
                  <Chip
                    color={invoiceStatusColorMap[inv.cux_Status__c] || 'default'}
                    label={inv.cux_Status__c}
                    size="small"
                    variant="soft"
                  />
                </TableCell>
                <TableCell align="right">{formatCurrency(inv.cux_Amount__c)}</TableCell>
                <TableCell>{inv.cux_Category__c || '\u2014'}</TableCell>
                <TableCell>
                  {inv.cux_Invoice_Date__c ? dayjs(inv.cux_Invoice_Date__c).format('MMM D, YYYY') : '\u2014'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Card>
      )}
    </Stack>
  )
}

// ─── Timesheets Tab ───

function TimesheetsTab({ timesheets }) {
  if (!timesheets?.length) {
    return (
      <Card>
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary" variant="body2">No timesheets</Typography>
        </Box>
      </Card>
    )
  }

  return (
    <Card>
      <Box sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: 800 }}>
          <TableHead>
            <TableRow>
              <TableCell>TS #</TableCell>
              <TableCell>Worker</TableCell>
              <TableCell>Work Date</TableCell>
              <TableCell align="right">Hours</TableCell>
              <TableCell align="right">Rate</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {timesheets.map((ts) => (
              <TableRow key={ts.Id} hover>
                <TableCell>
                  <Link
                    color="text.primary"
                    component={RouterLink}
                    href={paths.dashboard.timesheets.details(ts.Id)}
                    variant="subtitle2"
                  >
                    {ts.Name}
                  </Link>
                </TableCell>
                <TableCell>{ts.cux_Worker__r?.Name || ts.cux_Worker_Name__c || '\u2014'}</TableCell>
                <TableCell>
                  {ts.cux_Work_Date__c ? dayjs(ts.cux_Work_Date__c).format('MMM D, YYYY') : '\u2014'}
                </TableCell>
                <TableCell align="right">{ts.cux_Hours__c != null ? ts.cux_Hours__c : '\u2014'}</TableCell>
                <TableCell align="right">{formatCurrency(ts.cux_Hourly_Rate__c || ts.cux_Rate__c)}</TableCell>
                <TableCell align="right">{formatCurrency(ts.cux_Total_Amount__c || ts.cux_Amount__c)}</TableCell>
                <TableCell>
                  <Chip
                    color={timesheetStatusColorMap[ts.cux_Status__c] || 'default'}
                    label={ts.cux_Status__c}
                    size="small"
                    variant="soft"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Card>
  )
}

// ─── Lifecycle Stepper ───

const TO_LIFECYCLE_STEPS = ['Draft', 'Under Review', 'Approved', 'Active', 'Completed']

const toStepIcons = {
  Draft: ClockIcon,
  'Under Review': EyeIcon,
  Approved: SealCheckIcon,
  Active: LightningIcon,
  Completed: FlagCheckeredIcon,
  Closed: LockIcon,
  Terminated: XCircleIcon,
}

function getActiveStep(status) {
  const idx = TO_LIFECYCLE_STEPS.indexOf(status)
  if (idx >= 0) return idx
  return -1
}

const LifecycleConnector = styled(StepConnector)(() => ({
  '& .MuiStepConnector-line': {
    borderTopWidth: 3,
    borderRadius: 1,
    borderColor: 'var(--mui-palette-divider)',
  },
  '&.Mui-active .MuiStepConnector-line, &.Mui-completed .MuiStepConnector-line': {
    borderColor: 'var(--mui-palette-primary-main)',
  },
}))

function LifecycleStepIcon({ icon: Icon, active, completed, error: isError }) {
  const color = isError
    ? 'var(--mui-palette-error-main)'
    : completed || active
      ? 'var(--mui-palette-primary-main)'
      : 'var(--mui-palette-text-disabled)'

  const bgcolor = isError
    ? 'var(--mui-palette-error-50, rgba(211, 47, 47, 0.08))'
    : completed || active
      ? 'var(--mui-palette-primary-50, rgba(38, 105, 179, 0.08))'
      : 'var(--mui-palette-action-hover)'

  return (
    <Box
      sx={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor,
        color,
        transition: 'all 0.2s ease',
      }}
    >
      {completed ? (
        <CheckCircleIcon weight="fill" fontSize="var(--icon-fontSize-lg)" />
      ) : (
        <Icon weight={active || isError ? 'fill' : 'regular'} fontSize="var(--icon-fontSize-lg)" />
      )}
    </Box>
  )
}

function TaskOrderLifecycleStepper({ status }) {
  const isClosed = status === 'Closed'
  const isTerminated = status === 'Terminated'
  const isTerminal = isClosed || isTerminated

  if (isTerminal) {
    const Icon = toStepIcons[status]
    const label = isTerminated ? 'Task Order Terminated' : 'Task Order Closed'
    const color = isTerminated ? 'error.main' : 'text.secondary'
    const bgcolor = isTerminated
      ? 'var(--mui-palette-error-50, rgba(211, 47, 47, 0.08))'
      : 'var(--mui-palette-action-hover)'

    return (
      <Card variant="outlined">
        <CardContent>
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'center', py: 1 }}>
            <Box sx={{ width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor, color }}>
              <Icon weight="fill" fontSize="var(--icon-fontSize-lg)" />
            </Box>
            <Typography variant="subtitle1" color={color}>{label}</Typography>
          </Stack>
        </CardContent>
      </Card>
    )
  }

  const activeStep = getActiveStep(status)

  return (
    <Card variant="outlined">
      <CardContent>
        <Stepper
          activeStep={activeStep}
          alternativeLabel
          connector={<LifecycleConnector />}
        >
          {TO_LIFECYCLE_STEPS.map((step, index) => {
            const Icon = toStepIcons[step]
            const completed = index < activeStep || (step === 'Completed' && activeStep === 4)
            const active = index === activeStep && step !== 'Completed'
            return (
              <Step key={step} completed={completed}>
                <StepLabel
                  StepIconComponent={() => (
                    <LifecycleStepIcon icon={Icon} active={active} completed={completed} />
                  )}
                >
                  <Typography variant="caption" fontWeight={active ? 700 : 500}>
                    {step}
                  </Typography>
                </StepLabel>
              </Step>
            )
          })}
        </Stepper>
      </CardContent>
    </Card>
  )
}

// ─── Review Tab ───

function TaskOrderReviewTab({ taskOrderId, taskOrderStatus, contractId, validationRequests, onRefresh, onTaskOrderUpdated, onDrawerClose }) {
  const client = useSalesforceClient()
  const { auth } = useAuth()
  const { run, loading: runLoading, result: runResult, error: runError } = useRunValidation()
  const [advanceLoading, setAdvanceLoading] = React.useState(false)
  const [advanceError, setAdvanceError] = React.useState(null)

  const latestRequest = React.useMemo(() => {
    if (!validationRequests?.length) return null
    let candidates = validationRequests
    if (taskOrderStatus) {
      const stageFiltered = validationRequests.filter((r) => r.cux_Stage__c === taskOrderStatus)
      if (stageFiltered.length > 0) candidates = stageFiltered
    }
    const completed = candidates.filter((r) => r.cux_Status__c === 'Completed')
    return completed.length > 0
      ? completed.reduce((a, b) =>
          new Date(b.cux_Requested_At__c) > new Date(a.cux_Requested_At__c) ? b : a
        )
      : candidates[0]
  }, [validationRequests, taskOrderStatus])

  const { data: results, refetch: refetchResults } = useSalesforceQuery(
    (sfClient) => latestRequest ? sfClient.getValidationResults(latestRequest.Id) : Promise.resolve([]),
    [latestRequest?.Id]
  )

  async function handleRunValidation() {
    const result = await run({
      targetEntityType: 'Task Order',
      targetEntityId: taskOrderId,
      stage: taskOrderStatus,
      idempotencyKey: `task-order-${taskOrderStatus}-${taskOrderId}-${Date.now()}`,
    })
    if (result) onRefresh()
  }

  async function handleToggleChecklistItem(resultId, outcome) {
    if (!client) return
    const outcomeMap = {
      PASS: { cux_Outcome__c: 'PASS', cux_Result_Status__c: 'Pass' },
      FAIL: { cux_Outcome__c: 'FAIL', cux_Result_Status__c: 'Fail' },
      WARN: { cux_Outcome__c: 'WARN', cux_Result_Status__c: 'Manual Review Required' },
    }
    try {
      await client.updateValidationResult(resultId, outcomeMap[outcome] || outcomeMap.WARN)
      refetchResults()
    } catch (err) {
      console.error('Toggle checklist error:', err.response?.data || err)
      throw err
    }
  }

  async function handleAdvance() {
    if (!client) return
    const nextStatus = TO_STATUS_NEXT[taskOrderStatus]
    if (!nextStatus) return
    setAdvanceLoading(true)
    setAdvanceError(null)
    try {
      // Complete the current stage's review WorkTask
      if (auth?.user?.id) {
        await completeReviewWork(client, taskOrderId, auth.user.id, taskOrderStatus).catch((err) =>
          console.warn('Failed to complete review WorkTask:', err)
        )
      }
      await client.updateRecord('cux_TaskOrder__c', taskOrderId, { cux_Status__c: nextStatus })
      await client.createRecord('cux_ContractEvent__c', {
        cux_Contract__c: contractId || undefined,
        cux_Event_Type__c: 'Task Order Status Changed',
        cux_Related_Record_Id__c: taskOrderId,
        cux_Related_Object_Type__c: 'Task Order',
        cux_Previous_Status__c: taskOrderStatus,
        cux_New_Status__c: nextStatus,
        cux_Event_Detail__c: JSON.stringify({ trigger: 'validation_gate_passed' }),
        cux_Event_Timestamp__c: new Date().toISOString(),
      })
      // Trigger validation for the NEW stage
      await triggerStageValidation(client, 'Task Order', taskOrderId, nextStatus)
      onRefresh()
      onTaskOrderUpdated?.()
      onDrawerClose?.()
    } catch (err) {
      console.error('Advance task order error:', err.response?.data || err)
      setAdvanceError(err.response?.data?.[0]?.message || err.message || 'Failed to advance status')
    } finally {
      setAdvanceLoading(false)
    }
  }

  async function handleReturn(notes) {
    if (!client) return
    const prevStatus = TO_STATUS_PREV[taskOrderStatus]
    if (!prevStatus) return
    setAdvanceLoading(true)
    setAdvanceError(null)
    try {
      await client.updateRecord('cux_TaskOrder__c', taskOrderId, { cux_Status__c: prevStatus })
      await client.createRecord('cux_ContractEvent__c', {
        cux_Contract__c: contractId || undefined,
        cux_Event_Type__c: 'Task Order Status Changed',
        cux_Related_Record_Id__c: taskOrderId,
        cux_Related_Object_Type__c: 'Task Order',
        cux_Previous_Status__c: taskOrderStatus,
        cux_New_Status__c: prevStatus,
        cux_Event_Detail__c: JSON.stringify({ trigger: 'validation_gate_failed', notes }),
        cux_Event_Timestamp__c: new Date().toISOString(),
      })
      // Reopen the completed review WorkTask and notify the original reviewer
      await reopenReviewWork(client, 'Task Order', taskOrderId, taskOrderStatus, auth?.user?.id, notes)
        .catch((err) => console.warn('Failed to reopen review WorkTask:', err))
      onTaskOrderUpdated?.()
      onDrawerClose?.()
    } catch (err) {
      console.error('Return task order error:', err.response?.data || err)
      setAdvanceError(err.response?.data?.[0]?.message || err.message || 'Failed to return status')
    } finally {
      setAdvanceLoading(false)
    }
  }

  const canAdvance = taskOrderStatus && TO_STATUS_NEXT[taskOrderStatus]
  const canReturn = taskOrderStatus && TO_STATUS_PREV[taskOrderStatus]

  return (
    <EntityReviewPanel
      entityLabel="Task Order"
      stage={taskOrderStatus}
      validationRequests={validationRequests}
      results={results}
      onRunValidation={handleRunValidation}
      runLoading={runLoading}
      runResult={runResult}
      runError={runError}
      onRefresh={() => { onRefresh(); refetchResults() }}
      onToggleChecklistItem={handleToggleChecklistItem}
      onAdvance={canAdvance ? handleAdvance : undefined}
      onReturn={canReturn ? handleReturn : undefined}
      advanceLoading={advanceLoading}
      advanceError={advanceError}
      onReviewComplete={() => {
        if (client && auth?.user?.id) {
          completeReviewWork(client, taskOrderId, auth.user.id, taskOrderStatus).catch((err) =>
            console.warn('Failed to complete review WorkTask:', err)
          )
        }
      }}
    />
  )
}

// --- Supplements Tab ---

const supplementStatusColorMap = {
  Draft: 'default',
  'Under Review': 'warning',
  Approved: 'success',
  Rejected: 'error',
}

const SUPPLEMENT_REASONS = [
  'Performance Period',
  'Authorized Amount',
  'Personnel Change',
  'Scope',
  'Cost Proposal',
  'Other',
]

const SUPPLEMENT_TO_TYPES = ['Emergency', 'Translab']

function SupplementsTab({ supplements, taskOrderId, taskOrder, onSupplementCreated }) {
  const [dialogOpen, setDialogOpen] = React.useState(false)

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="flex-end">
        <Button
          variant="contained"
          size="small"
          startIcon={<PlusIcon />}
          onClick={() => setDialogOpen(true)}
        >
          Create Supplement
        </Button>
      </Stack>

      {supplements && supplements.length > 0 ? (
        <Card>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>SUP #</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Effective</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {supplements.map((sup) => (
                <TableRow key={sup.Id} hover>
                  <TableCell>
                    <Link
                      color="text.primary"
                      component={RouterLink}
                      href={paths.dashboard.supplements.details(sup.Id)}
                      variant="subtitle2"
                    >
                      {sup.Name}
                    </Link>
                  </TableCell>
                  <TableCell>{sup.cux_Supplement_Reason__c || '—'}</TableCell>
                  <TableCell>
                    <Chip
                      color={supplementStatusColorMap[sup.cux_Status__c] || 'default'}
                      label={sup.cux_Status__c || 'Draft'}
                      size="small"
                      variant="soft"
                    />
                  </TableCell>
                  <TableCell>{sup.cux_Start_Date__c ? dayjs(sup.cux_Start_Date__c).format('MMM D, YYYY') : '—'}</TableCell>
                  <TableCell>{sup.cux_End_Date__c ? dayjs(sup.cux_End_Date__c).format('MMM D, YYYY') : '—'}</TableCell>
                  <TableCell align="right">{formatCurrency(sup.cux_Full_Obligation_Amount__c)}</TableCell>
                  <TableCell>
                    {sup.cux_Is_Effective__c ? (
                      <Chip label="Yes" color="success" size="small" variant="soft" />
                    ) : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <Typography color="text.secondary" variant="body2" align="center">
              No supplements
            </Typography>
          </CardContent>
        </Card>
      )}

      <CreateSupplementDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        taskOrderId={taskOrderId}
        taskOrder={taskOrder}
        onSuccess={() => { setDialogOpen(false); onSupplementCreated() }}
      />
    </Stack>
  )
}

function CreateSupplementDialog({ open, onClose, taskOrderId, taskOrder, onSuccess }) {
  const client = useSalesforceClient()
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState(null)

  const [values, setValues] = React.useState({
    supplementReason: '',
    startDate: '',
    endDate: '',
    fullObligationAmount: '',
    taskOrderType: '',
    fullScope: '',
  })

  // Pre-populate with current task order values
  React.useEffect(() => {
    if (open && taskOrder) {
      setValues({
        supplementReason: '',
        startDate: taskOrder.cux_Start_Date__c || '',
        endDate: taskOrder.cux_End_Date__c || '',
        fullObligationAmount: taskOrder.cux_Authorized_Amount__c ?? '',
        taskOrderType: taskOrder.cux_Task_Order_Type__c || '',
        fullScope: taskOrder.cux_Scope_Summary__c || '',
      })
      setError(null)
    }
  }, [open, taskOrder])

  function handleChange(field) {
    return (event) => setValues((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const contract = taskOrder?.cux_Contract__r
  const contractAvailable = (() => {
    const contractAuth = contract?.cux_Total_Authorized_Amount__c || 0
    const contractObligated = contract?.cux_Total_Obligated_Amount__c || 0
    const currentToAuth = taskOrder?.cux_Authorized_Amount__c || 0
    return contractAuth - contractObligated + currentToAuth
  })()

  async function handleSubmit(event) {
    event.preventDefault()
    if (!client || !values.supplementReason) return

    const contractEndDate = contract?.cux_End_Date__c
    if (contractEndDate && values.endDate && values.endDate > contractEndDate) {
      setError(`Supplement end date cannot exceed the contract end date (${dayjs(contractEndDate).format('MMMM D, YYYY')}).`)
      return
    }

    if (values.fullObligationAmount) {
      const newAmount = parseFloat(values.fullObligationAmount)
      if (newAmount > contractAvailable) {
        setError(`New amount ($${newAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) exceeds the contract available amount ($${contractAvailable.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}).`)
        return
      }
    }

    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        cux_Task_Order__c: taskOrderId,
        cux_Status__c: 'Draft',
        cux_Supplement_Reason__c: values.supplementReason,
        cux_Start_Date__c: values.startDate,
        cux_End_Date__c: values.endDate,
        cux_Full_Obligation_Amount__c: values.fullObligationAmount ? parseFloat(values.fullObligationAmount) : 0,
        cux_Full_Scope__c: values.fullScope || null,
      }
      if (values.taskOrderType) {
        payload.cux_Task_Order_Type__c = values.taskOrderType
      }

      await client.createSupplement(payload)
      if (onSuccess) onSuccess()
    } catch (err) {
      setError(err.response?.data?.[0]?.message || err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ component: 'form', onSubmit: handleSubmit }}
    >
      <DialogTitle>Create Supplement</DialogTitle>
      <Divider />
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}

          <Alert severity="info" variant="outlined">
            Supplement values represent the full new state of the task order. Pre-populated with current values — modify only what changes.
          </Alert>

          <FormControl fullWidth required>
            <InputLabel>Supplement Reason</InputLabel>
            <Select
              value={values.supplementReason}
              onChange={handleChange('supplementReason')}
              label="Supplement Reason"
            >
              {SUPPLEMENT_REASONS.map((reason) => (
                <MenuItem key={reason} value={reason}>{reason}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Stack direction="row" spacing={2} alignItems="center">
            <FormControl fullWidth>
              <InputLabel shrink>Current Start Date</InputLabel>
              <OutlinedInput
                type="date"
                value={taskOrder?.cux_Start_Date__c || ''}
                label="Current Start Date"
                notched
                readOnly
                sx={{ bgcolor: 'action.hover' }}
              />
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel shrink>New Start Date</InputLabel>
              <OutlinedInput
                type="date"
                value={values.startDate}
                onChange={handleChange('startDate')}
                label="New Start Date"
                notched
              />
            </FormControl>
          </Stack>

          <Stack direction="row" spacing={2} alignItems="center">
            <FormControl fullWidth>
              <InputLabel shrink>Current End Date</InputLabel>
              <OutlinedInput
                type="date"
                value={taskOrder?.cux_End_Date__c || ''}
                label="Current End Date"
                notched
                readOnly
                sx={{ bgcolor: 'action.hover' }}
              />
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel shrink>New End Date</InputLabel>
              <OutlinedInput
                type="date"
                value={values.endDate}
                onChange={handleChange('endDate')}
                label="New End Date"
                notched
              />
            </FormControl>
          </Stack>
          {contract?.cux_End_Date__c && (
            <Typography variant="caption" color="text.secondary">
              Maximum: {dayjs(contract.cux_End_Date__c).format('MMM D, YYYY')} (contract end date)
            </Typography>
          )}

          <Stack direction="row" spacing={2} alignItems="center">
            <FormControl fullWidth>
              <InputLabel shrink>Current Amount</InputLabel>
              <OutlinedInput
                value={formatCurrency(taskOrder?.cux_Authorized_Amount__c)}
                label="Current Amount"
                notched
                readOnly
                sx={{ bgcolor: 'action.hover' }}
              />
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel shrink>New Obligation Amount</InputLabel>
              <OutlinedInput
                type="number"
                value={values.fullObligationAmount}
                onChange={handleChange('fullObligationAmount')}
                label="New Obligation Amount"
                notched
                startAdornment={<Typography sx={{ mr: 0.5 }}>$</Typography>}
              />
            </FormControl>
          </Stack>
          {contractAvailable > 0 && (
            <Typography variant="caption" color="text.secondary">
              Maximum: {formatCurrency(contractAvailable)} (contract available amount)
            </Typography>
          )}

          <FormControl fullWidth>
            <InputLabel>Task Order Type</InputLabel>
            <Select
              value={values.taskOrderType}
              onChange={handleChange('taskOrderType')}
              label="Task Order Type"
            >
              <MenuItem value="">— No change —</MenuItem>
              {SUPPLEMENT_TO_TYPES.map((type) => (
                <MenuItem key={type} value={type}>{type}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel shrink>Scope</InputLabel>
            <OutlinedInput
              multiline
              minRows={3}
              maxRows={6}
              value={values.fullScope}
              onChange={handleChange('fullScope')}
              label="Scope"
              notched
              placeholder="Full scope of work..."
            />
          </FormControl>
        </Stack>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button color="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={submitting || !values.supplementReason}>
          {submitting ? 'Creating...' : 'Create Supplement'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
