import * as React from 'react'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Step from '@mui/material/Step'
import StepConnector from '@mui/material/StepConnector'
import StepLabel from '@mui/material/StepLabel'
import Stepper from '@mui/material/Stepper'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Drawer from '@mui/material/Drawer'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import OutlinedInput from '@mui/material/OutlinedInput'
import Select from '@mui/material/Select'
import { styled } from '@mui/material/styles'
import { CaretRightIcon } from '@phosphor-icons/react/dist/ssr/CaretRight'
import { CheckCircleIcon } from '@phosphor-icons/react/dist/ssr/CheckCircle'
import { ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock'
import { CreditCardIcon } from '@phosphor-icons/react/dist/ssr/CreditCard'
import { CurrencyDollarIcon } from '@phosphor-icons/react/dist/ssr/CurrencyDollar'
import { EnvelopeSimpleIcon } from '@phosphor-icons/react/dist/ssr/EnvelopeSimple'
import { PaperPlaneTiltIcon } from '@phosphor-icons/react/dist/ssr/PaperPlaneTilt'
import { PencilSimpleIcon } from '@phosphor-icons/react/dist/ssr/PencilSimple'
import { ProhibitIcon } from '@phosphor-icons/react/dist/ssr/Prohibit'
import { ReceiptIcon } from '@phosphor-icons/react/dist/ssr/Receipt'
import { SealCheckIcon } from '@phosphor-icons/react/dist/ssr/SealCheck'
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
import { AnimatedPage } from '@/components/core/animations'
import { AssignReviewerDialog } from '@/components/dashboard/work/assign-reviewer-dialog'
import { InvoiceTimesheets } from '@/components/dashboard/invoice/invoice-timesheets'
import { EntityEventsTab } from '@/components/dashboard/entity-timeline'
import { EntityDocumentsTab } from '@/components/dashboard/entity-documents'

const metadata = { title: `Details | Invoices | Dashboard | ${appConfig.name}` }

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

// ─── Lifecycle Stepper ───

const INVOICE_CATEGORIES = ['Labor', 'ODC', 'Travel', 'Materials', 'Subcontract', 'Other']

const LIFECYCLE_STEPS = ['Draft', 'Review', 'Approval', 'Paid']

const stepIcons = {
  Draft: ClockIcon,
  Review: PaperPlaneTiltIcon,
  Approval: SealCheckIcon,
  Paid: CurrencyDollarIcon,
  Rejected: XCircleIcon,
  Void: ProhibitIcon,
}

function getActiveStep(status) {
  const idx = LIFECYCLE_STEPS.indexOf(status)
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

function LifecycleStepIcon({ icon: Icon, active, completed, error }) {
  const color = error
    ? 'var(--mui-palette-error-main)'
    : completed || active
      ? 'var(--mui-palette-primary-main)'
      : 'var(--mui-palette-text-disabled)'

  const bgcolor = error
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
        <Icon weight={active || error ? 'fill' : 'regular'} fontSize="var(--icon-fontSize-lg)" />
      )}
    </Box>
  )
}

function InvoiceLifecycleStepper({ status }) {
  const isRejected = status === 'Rejected'
  const isVoid = status === 'Void'
  const isTerminal = isRejected || isVoid
  const activeStep = isTerminal ? -1 : getActiveStep(status)

  if (isTerminal) {
    const Icon = stepIcons[status]
    const label = isRejected ? 'Invoice Rejected' : 'Invoice Voided'
    const color = isRejected ? 'error.main' : 'text.secondary'
    const bgcolor = isRejected
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

  return (
    <Card variant="outlined">
      <CardContent>
        <Stepper
          activeStep={activeStep}
          alternativeLabel
          connector={<LifecycleConnector />}
        >
          {LIFECYCLE_STEPS.map((step, index) => {
            const Icon = stepIcons[step]
            const completed = index < activeStep || (step === 'Paid' && activeStep === 3)
            const active = index === activeStep && step !== 'Paid'
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

// ─── Status advancement ───

const INV_STATUS_NEXT = {
  'Draft': 'Review',
  'Review': 'Approval',
  'Approval': 'Paid',
}
const INV_STATUS_PREV = Object.fromEntries(Object.entries(INV_STATUS_NEXT).map(([from, to]) => [to, from]))

// ─── Page ───

export function Page() {
  const { invoiceId } = useParams()
  const client = useSalesforceClient()
  const [currentTab, setCurrentTab] = React.useState('overview')
  const [reviewOpen, setReviewOpen] = React.useState(false)
  const [assignOpen, setAssignOpen] = React.useState(false)
  const [editOpen, setEditOpen] = React.useState(false)

  const { addRecentRecord } = useRecentRecords()

  const { data: invoice, loading, error, refetch: refetchInvoice } = useSalesforceQuery(
    (client) => client.getInvoice(invoiceId),
    [invoiceId]
  )

  React.useEffect(() => {
    if (invoice?.Name) {
      addRecentRecord({ id: invoiceId, name: invoice.Name, label: 'Invoice', path: `/dashboard/invoices/${invoiceId}` })
    }
  }, [invoice?.Name, invoiceId, addRecentRecord])

  const { data: validationRequests, refetch: refetchValidations } = useSalesforceQuery(
    (client) => client.getValidationRequests('Invoice', invoiceId),
    [invoiceId]
  )

  const { data: entityEvents, refetch: refetchEvents } = useSalesforceQuery(
    (client) => client.getEntityEvents(invoiceId),
    [invoiceId]
  )

  const { data: entityDocuments, refetch: refetchDocuments } = useSalesforceQuery(
    (client) => client.getEntityDocuments('Invoice', invoiceId),
    [invoiceId]
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
        Failed to load invoice: {error.message}
      </Alert>
    )
  }

  if (!invoice) {
    return (
      <Alert severity="warning" sx={{ m: 3 }}>
        Invoice not found
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
              <Link color="text.primary" component={RouterLink} href={paths.dashboard.invoices.list} variant="subtitle2" underline="hover">
                Invoices
              </Link>
              {invoice.cux_Contract__c ? (
                <Link color="text.primary" component={RouterLink} href={paths.dashboard.contracts.details(invoice.cux_Contract__c)} variant="subtitle2" underline="hover">
                  {invoice.cux_Contract__r?.Name || 'Contract'}
                </Link>
              ) : null}
              {invoice.cux_Task_Order__c ? (
                <Link color="text.primary" component={RouterLink} href={paths.dashboard.taskOrders.details(invoice.cux_Task_Order__c)} variant="subtitle2" underline="hover">
                  {invoice.cux_Task_Order__r?.Name || 'Task Order'}
                </Link>
              ) : null}
              <Typography color="text.secondary" variant="subtitle2">{invoice.Name}</Typography>
            </Breadcrumbs>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ alignItems: 'flex-start' }}>
              <Box sx={{ flex: '1 1 auto' }}>
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                  <Typography variant="h4">{invoice.Name}</Typography>
                  <Chip
                    color={statusColorMap[invoice.cux_Status__c] || 'default'}
                    label={invoice.cux_Status__c}
                    size="small"
                    variant="soft"
                  />
                </Stack>
                <Typography color="text.secondary" variant="body2">
                  {invoice.cux_Category__c || 'Invoice'}
                  {invoice.cux_External_Invoice_Number__c ? ` \u00B7 External #${invoice.cux_External_Invoice_Number__c}` : ''}
                </Typography>
              </Box>
              {invoice.cux_Contract__r?.cux_Contract_Manager__r?.Email ? (
                <Button
                  component="a"
                  href={`mailto:${invoice.cux_Contract__r.cux_Contract_Manager__r.Email}?subject=Invoice ${invoice.Name}`}
                  size="small"
                  variant="outlined"
                  startIcon={<EnvelopeSimpleIcon fontSize="var(--icon-fontSize-md)" />}
                >
                  Email Contract Manager
                </Button>
              ) : null}
            </Stack>
          </Stack>

          <InvoiceLifecycleStepper status={invoice.cux_Status__c} />

          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Tabs value={currentTab} onChange={(_, val) => setCurrentTab(val)}>
              <Tab label="Overview" value="overview" />
              <Tab label="Timesheets" value="timesheets" />
              <Tab label="Documents" value="documents" />
              <Tab label="Events" value="events" />
            </Tabs>
            <Stack direction="row" spacing={1}>
              {invoice.cux_Status__c === 'Draft' && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<PencilSimpleIcon />}
                  onClick={() => setEditOpen(true)}
                >
                  Edit
                </Button>
              )}
              <Button
                variant="outlined"
                size="small"
                startIcon={<UserCirclePlusIcon />}
                onClick={() => setAssignOpen(true)}
              >
                {invoice.cux_Assigned_To__c ? 'Reassign' : 'Assign'}
              </Button>
              <Button
                variant={reviewOpen ? 'contained' : 'outlined'}
                size="small"
                startIcon={<ShieldCheckIcon />}
                onClick={() => setReviewOpen((prev) => !prev)}
              >
                Invoice Review
              </Button>
            </Stack>
          </Stack>

          {currentTab === 'overview' && <OverviewTab invoice={invoice} onInvoiceUpdated={refetchInvoice} />}
          {currentTab === 'timesheets' && <InvoiceTimesheets invoice={invoice} client={client} />}
          {currentTab === 'documents' && (
            <EntityDocumentsTab
              documents={entityDocuments}
              contractId={invoice.cux_Contract__c}
              entityType="Invoice"
              entityId={invoiceId}
              onDocumentAdded={refetchDocuments}
            />
          )}
          {currentTab === 'events' && <EntityEventsTab events={entityEvents} onRefresh={refetchEvents} />}

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
              <Typography variant="h6">{invoice.cux_Status__c ? `${invoice.cux_Status__c} Checklist` : 'Invoice Review'}</Typography>
              <IconButton onClick={() => setReviewOpen(false)} size="small">
                <XIcon />
              </IconButton>
            </Box>
            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
              <InvoiceReviewTab
                invoiceId={invoiceId}
                invoiceStatus={invoice.cux_Status__c}
                contractId={invoice.cux_Contract__c}
                validationRequests={validationRequests}
                onRefresh={refetchValidations}
                onInvoiceUpdated={refetchInvoice}
                onDrawerClose={() => setReviewOpen(false)}
              />
            </Box>
          </Drawer>

          <AssignReviewerDialog
            open={assignOpen}
            onClose={() => setAssignOpen(false)}
            entityType="Invoice"
            entityId={invoiceId}
            entityName={invoice.Name}
            assignmentField="cux_Assigned_To__c"
            sobjectName="cux_Invoice__c"
            currentAssigneeId={invoice.cux_Assigned_To__c}
            onAssigned={refetchInvoice}
          />

          <EditInvoiceDialog
            invoice={invoice}
            open={editOpen}
            onClose={() => setEditOpen(false)}
            onSuccess={refetchInvoice}
          />
        </Stack>
      </Box>
      </AnimatedPage>
    </React.Fragment>
  )
}

// ─── Overview Tab (Devias order-detail style: 8/4 grid) ───

function OverviewTab({ invoice, onInvoiceUpdated }) {
  const client = useSalesforceClient()
  const contract = invoice.cux_Contract__r
  const taskOrder = invoice.cux_Task_Order__r
  const vendor = contract?.cux_Account__r
  const contractManager = contract?.cux_Contract_Manager__r
  const vendorContact = contract?.cux_Vendor_Contact__r

  // Drawer state for inline entity preview
  const [drawerEntity, setDrawerEntity] = React.useState(null) // { type, id, label }
  const { data: drawerData, loading: drawerLoading } = useSalesforceQuery(
    (c) => {
      if (!drawerEntity) return Promise.resolve(null)
      if (drawerEntity.type === 'contract') return c.getContract(drawerEntity.id)
      if (drawerEntity.type === 'taskOrder') return c.getTaskOrder(drawerEntity.id)
      return Promise.resolve(null)
    },
    [drawerEntity?.type, drawerEntity?.id]
  )

  return (
    <Grid container spacing={4}>
      {/* ─── Main content (left, 8 cols) ─── */}
      <Grid size={{ md: 8, xs: 12 }}>
        <Stack spacing={4}>
          {/* Invoice Information — Devias "Order information" style */}
          <Card>
            <CardHeader
              avatar={<Avatar><CreditCardIcon fontSize="var(--Icon-fontSize)" /></Avatar>}
              title="Invoice information"
            />
            <CardContent>
              <Card sx={{ borderRadius: 1 }} variant="outlined">
                <PropertyList divider={<Divider />} sx={{ '--PropertyItem-padding': '12px 24px' }}>
                  {[
                    { key: 'Invoice Number', value: invoice.Name },
                    { key: 'Category', value: invoice.cux_Category__c || '\u2014' },
                    {
                      key: 'Status',
                      value: (
                        <Chip
                          icon={invoice.cux_Status__c === 'Paid' ? <CheckCircleIcon color="var(--mui-palette-success-main)" weight="fill" /> : undefined}
                          color={statusColorMap[invoice.cux_Status__c] || 'default'}
                          label={invoice.cux_Status__c}
                          size="small"
                          variant="outlined"
                        />
                      ),
                    },
                    { key: 'Invoice Date', value: invoice.cux_Invoice_Date__c ? dayjs(invoice.cux_Invoice_Date__c).format('MMMM D, YYYY') : '\u2014' },
                    { key: 'Received Date', value: invoice.cux_Received_Date__c ? dayjs(invoice.cux_Received_Date__c).format('MMMM D, YYYY') : '\u2014' },
                    ...(invoice.cux_Service_Period_Start__c ? [{
                      key: 'Service Period',
                      value: invoice.cux_Service_Period_End__c
                        ? `${dayjs(invoice.cux_Service_Period_Start__c).format('MMM D, YYYY')} \u2014 ${dayjs(invoice.cux_Service_Period_End__c).format('MMM D, YYYY')}`
                        : dayjs(invoice.cux_Service_Period_Start__c).format('MMM D, YYYY'),
                    }] : []),
                    ...(invoice.cux_External_Invoice_Number__c ? [{ key: 'External Invoice #', value: invoice.cux_External_Invoice_Number__c }] : []),
                    ...(contract ? [{
                      key: 'Contract',
                      value: (
                        <Link
                          component="button"
                          variant="subtitle2"
                          sx={{ cursor: 'pointer' }}
                          onClick={() => setDrawerEntity({ type: 'contract', id: invoice.cux_Contract__c, label: contract.Name })}
                        >
                          {contract.Name}{contract.cux_Title__c ? ` \u2014 ${contract.cux_Title__c}` : ''}
                        </Link>
                      ),
                    }] : []),
                    ...(taskOrder ? [{
                      key: 'Task Order',
                      value: (
                        <Link
                          component="button"
                          variant="subtitle2"
                          sx={{ cursor: 'pointer' }}
                          onClick={() => setDrawerEntity({ type: 'taskOrder', id: invoice.cux_Task_Order__c, label: taskOrder.Name })}
                        >
                          {taskOrder.Name}
                        </Link>
                      ),
                    }] : []),
                    ...(vendor ? [{
                      key: 'Vendor',
                      value: (
                        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                          <div>
                            <Typography variant="body2">
                              <Link component={RouterLink} href={paths.dashboard.customers.details(contract.cux_Account__c)} variant="subtitle2">
                                {vendor.Name}
                              </Link>
                            </Typography>
                            {(vendor.BillingCity || vendor.BillingState) ? (
                              <Typography color="text.secondary" variant="body2">
                                {[vendor.BillingCity, vendor.BillingState].filter(Boolean).join(', ')}
                              </Typography>
                            ) : null}
                          </div>
                        </Stack>
                      ),
                    }] : []),
                    ...(contractManager ? [{
                      key: 'Contract Manager',
                      value: (
                        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                          {contractManager.SmallPhotoUrl ? (
                            <Avatar src={contractManager.SmallPhotoUrl} sx={{ '--Avatar-size': '32px' }} />
                          ) : null}
                          <div>
                            <Typography variant="body2">{contractManager.Name}</Typography>
                            {contractManager.Email ? (
                              <Typography color="text.secondary" variant="body2">
                                {contractManager.Email}
                              </Typography>
                            ) : null}
                          </div>
                        </Stack>
                      ),
                    }] : []),
                    ...(vendorContact ? [{
                      key: 'Vendor Contact',
                      value: (
                        <div>
                          <Typography variant="body2">{vendorContact.Name}</Typography>
                          {vendorContact.Title ? <Typography color="text.secondary" variant="caption">{vendorContact.Title}</Typography> : null}
                          {vendorContact.Email ? (
                            <Typography color="text.secondary" variant="body2">
                              {vendorContact.Email}
                            </Typography>
                          ) : null}
                        </div>
                      ),
                    }] : []),
                  ].map((item) => (
                    <PropertyItem key={item.key} name={item.key} value={item.value} />
                  ))}
                </PropertyList>
              </Card>
            </CardContent>
          </Card>

          {/* Description */}
          {invoice.cux_Description__c ? (
            <Card>
              <CardHeader title="Notes" />
              <CardContent sx={{ pt: 0 }}>
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                  {invoice.cux_Description__c}
                </Typography>
              </CardContent>
            </Card>
          ) : null}

          {/* Rejection Reason */}
          {invoice.cux_Status__c === 'Rejected' && invoice.cux_Rejection_Reason__c ? (
            <Card sx={{ border: '1px solid var(--mui-palette-error-200, rgba(211, 47, 47, 0.3))' }}>
              <CardHeader
                avatar={<Avatar sx={{ bgcolor: 'var(--mui-palette-error-50)', color: 'var(--mui-palette-error-main)' }}><XCircleIcon fontSize="var(--Icon-fontSize)" /></Avatar>}
                title="Rejection Reason"
                titleTypographyProps={{ color: 'error' }}
              />
              <CardContent sx={{ pt: 0 }}>
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                  {invoice.cux_Rejection_Reason__c}
                </Typography>
              </CardContent>
            </Card>
          ) : null}
        </Stack>
      </Grid>

      {/* ─── Sidebar (right, 4 cols) ─── */}
      <Grid size={{ md: 4, xs: 12 }}>
        <Stack spacing={4}>
          {/* Summary */}
          <Card>
            <CardHeader
              avatar={<Avatar><ReceiptIcon fontSize="var(--Icon-fontSize)" /></Avatar>}
              title="Summary"
            />
            <CardContent>
              <Stack spacing={2}>
                <Card sx={{ borderRadius: 1 }} variant="outlined">
                  <PropertyList divider={<Divider />} sx={{ '--PropertyItem-padding': '12px 24px' }}>
                    {[
                      { key: 'Amount', value: formatCurrency(invoice.cux_Amount__c) },
                      ...(invoice.cux_Total_Hours__c != null && invoice.cux_Total_Hours__c > 0
                        ? [{ key: 'Total Hours', value: `${invoice.cux_Total_Hours__c} hrs` }]
                        : []),
                      ...(taskOrder ? [
                        { key: 'TO Authorized', value: formatCurrency(taskOrder.cux_Authorized_Amount__c) },
                        { key: 'TO Invoiced', value: formatCurrency(taskOrder.cux_Total_Invoiced_Amount__c) },
                      ] : []),
                      ...(contract ? [
                        { key: 'Contract Value', value: formatCurrency(contract.cux_Total_Authorized_Amount__c) },
                      ] : []),
                    ].map((item) => (
                      <PropertyItem key={item.key} name={item.key} value={item.value} />
                    ))}
                  </PropertyList>
                </Card>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Stack spacing={1} sx={{ width: '100%' }}>
                    <Stack direction="row" spacing={3} sx={{ justifyContent: 'space-between' }}>
                      <Typography variant="body2">Invoice Amount</Typography>
                      <Typography variant="body2">{formatCurrency(invoice.cux_Amount__c)}</Typography>
                    </Stack>
                    {taskOrder?.cux_Authorized_Amount__c ? (
                      <Stack direction="row" spacing={3} sx={{ justifyContent: 'space-between' }}>
                        <Typography variant="body2">TO Remaining</Typography>
                        <Typography variant="body2">
                          {formatCurrency((taskOrder.cux_Authorized_Amount__c || 0) - (taskOrder.cux_Total_Invoiced_Amount__c || 0))}
                        </Typography>
                      </Stack>
                    ) : null}
                    <Divider />
                    <Stack direction="row" spacing={3} sx={{ justifyContent: 'space-between' }}>
                      <Typography variant="subtitle1">Total Due</Typography>
                      <Typography variant="subtitle1">{formatCurrency(invoice.cux_Amount__c)}</Typography>
                    </Stack>
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Payment Details (read-only) */}
          {(invoice.cux_Status__c === 'Approval' || invoice.cux_Status__c === 'Paid') && (
            <StageFieldsCard invoice={invoice} />
          )}
        </Stack>
      </Grid>

      {/* ─── Entity Preview Drawer ─── */}
      <Drawer
        anchor="right"
        open={Boolean(drawerEntity)}
        onClose={() => setDrawerEntity(null)}
        slotProps={{ backdrop: { sx: { backgroundColor: 'transparent' } } }}
        PaperProps={{ sx: { width: { xs: '100%', sm: 480 }, boxShadow: 'var(--mui-shadows-16)' } }}
      >
        {drawerEntity && (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: '1px solid var(--mui-palette-divider)' }}>
              <Typography variant="h6">{drawerEntity.label || 'Details'}</Typography>
              <IconButton onClick={() => setDrawerEntity(null)} size="small"><XIcon /></IconButton>
            </Box>
            <Box sx={{ p: 2, overflow: 'auto' }}>
              {drawerLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
              ) : drawerData ? (
                <Stack spacing={2}>
                  {drawerEntity.type === 'contract' && (
                    <Card sx={{ borderRadius: 1 }} variant="outlined">
                      <PropertyList divider={<Divider />} sx={{ '--PropertyItem-padding': '12px 24px' }}>
                        {[
                          { key: 'Contract', value: drawerData.Name },
                          ...(drawerData.cux_Title__c ? [{ key: 'Title', value: drawerData.cux_Title__c }] : []),
                          { key: 'Status', value: drawerData.cux_Status__c || '\u2014' },
                          { key: 'Type', value: drawerData.cux_Contract_Type__c || '\u2014' },
                          { key: 'Total Authorized', value: formatCurrency(drawerData.cux_Total_Authorized_Amount__c) },
                          ...(drawerData.cux_Start_Date__c ? [{ key: 'Start Date', value: dayjs(drawerData.cux_Start_Date__c).format('MMMM D, YYYY') }] : []),
                          ...(drawerData.cux_End_Date__c ? [{ key: 'End Date', value: dayjs(drawerData.cux_End_Date__c).format('MMMM D, YYYY') }] : []),
                        ].map((item) => (
                          <PropertyItem key={item.key} name={item.key} value={item.value} />
                        ))}
                      </PropertyList>
                    </Card>
                  )}
                  {drawerEntity.type === 'taskOrder' && (
                    <Card sx={{ borderRadius: 1 }} variant="outlined">
                      <PropertyList divider={<Divider />} sx={{ '--PropertyItem-padding': '12px 24px' }}>
                        {[
                          { key: 'Task Order', value: drawerData.Name },
                          { key: 'Status', value: drawerData.cux_Status__c || '\u2014' },
                          { key: 'Type', value: drawerData.cux_Task_Order_Type__c || '\u2014' },
                          { key: 'Authorized Amount', value: formatCurrency(drawerData.cux_Authorized_Amount__c) },
                          { key: 'Total Invoiced', value: formatCurrency(drawerData.cux_Total_Invoiced_Amount__c) },
                          ...(drawerData.cux_Start_Date__c ? [{ key: 'Start Date', value: dayjs(drawerData.cux_Start_Date__c).format('MMMM D, YYYY') }] : []),
                          ...(drawerData.cux_End_Date__c ? [{ key: 'End Date', value: dayjs(drawerData.cux_End_Date__c).format('MMMM D, YYYY') }] : []),
                        ].map((item) => (
                          <PropertyItem key={item.key} name={item.key} value={item.value} />
                        ))}
                      </PropertyList>
                    </Card>
                  )}
                  <Button
                    variant="outlined"
                    size="small"
                    component={RouterLink}
                    href={drawerEntity.type === 'contract'
                      ? paths.dashboard.contracts.details(drawerEntity.id)
                      : paths.dashboard.taskOrders.details(drawerEntity.id)}
                  >
                    View Full Details
                  </Button>
                </Stack>
              ) : null}
            </Box>
          </>
        )}
      </Drawer>
    </Grid>
  )
}

// ─── Stage Fields Card (Approval / Paid) ───

function StageFieldsCard({ invoice }) {
  const hasPaymentData = invoice.cux_Out_to_Account_Date__c || invoice.cux_Payment_Schedule_Date__c
    || invoice.cux_Schedule_Number__c || invoice.cux_Paid_Amount__c != null

  if (!hasPaymentData) return null

  const items = [
    ...(invoice.cux_Out_to_Account_Date__c ? [{ key: 'Out to Account Date', value: dayjs(invoice.cux_Out_to_Account_Date__c).format('MMMM D, YYYY') }] : []),
    ...(invoice.cux_Payment_Schedule_Date__c ? [{ key: 'Payment Schedule Date', value: dayjs(invoice.cux_Payment_Schedule_Date__c).format('MMMM D, YYYY') }] : []),
    ...(invoice.cux_Schedule_Number__c ? [{ key: 'Schedule Number', value: invoice.cux_Schedule_Number__c }] : []),
    ...(invoice.cux_Paid_Amount__c != null ? [{ key: 'Paid Amount', value: formatCurrency(invoice.cux_Paid_Amount__c) }] : []),
  ]

  return (
    <Card>
      <CardHeader
        avatar={<Avatar><SealCheckIcon fontSize="var(--Icon-fontSize)" /></Avatar>}
        title="Payment Details"
      />
      <CardContent>
        <Card sx={{ borderRadius: 1 }} variant="outlined">
          <PropertyList divider={<Divider />} sx={{ '--PropertyItem-padding': '12px 24px' }}>
            {items.map((item) => (
              <PropertyItem key={item.key} name={item.key} value={item.value} />
            ))}
          </PropertyList>
        </Card>
      </CardContent>
    </Card>
  )
}

// ─── Edit Invoice Dialog (Draft only) ───

function EditInvoiceDialog({ invoice, open, onClose, onSuccess }) {
  const client = useSalesforceClient()
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState(null)
  const [warnings, setWarnings] = React.useState([])
  const [warningsConfirmed, setWarningsConfirmed] = React.useState(false)

  const toAuthorized = invoice?.cux_Task_Order__r?.cux_Authorized_Amount__c || 0
  const toInvoiced = invoice?.cux_Task_Order__r?.cux_Total_Invoiced_Amount__c || 0
  const toRemaining = toAuthorized - toInvoiced

  const [values, setValues] = React.useState({
    cux_Amount__c: '',
    cux_Category__c: '',
    cux_Invoice_Date__c: '',
    cux_Received_Date__c: '',
    cux_Service_Period_Start__c: '',
    cux_Service_Period_End__c: '',
    cux_External_Invoice_Number__c: '',
    cux_Total_Hours__c: '',
    cux_Description__c: '',
  })

  React.useEffect(() => {
    if (open && invoice) {
      setValues({
        cux_Amount__c: invoice.cux_Amount__c ?? '',
        cux_Category__c: invoice.cux_Category__c || '',
        cux_Invoice_Date__c: invoice.cux_Invoice_Date__c || '',
        cux_Received_Date__c: invoice.cux_Received_Date__c || '',
        cux_Service_Period_Start__c: invoice.cux_Service_Period_Start__c || '',
        cux_Service_Period_End__c: invoice.cux_Service_Period_End__c || '',
        cux_External_Invoice_Number__c: invoice.cux_External_Invoice_Number__c || '',
        cux_Total_Hours__c: invoice.cux_Total_Hours__c ?? '',
        cux_Description__c: invoice.cux_Description__c || '',
      })
      setError(null)
    }
  }, [open, invoice])

  function handleChange(field) {
    return (event) => {
      setValues((prev) => ({ ...prev, [field]: event.target.value }))
      if (warnings.length > 0) {
        setWarnings([])
        setWarningsConfirmed(false)
      }
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!client) return
    setSubmitting(true)
    setError(null)
    try {
      const payload = { ...values }
      if (payload.cux_Amount__c !== '') {
        payload.cux_Amount__c = Number(payload.cux_Amount__c)
      } else {
        delete payload.cux_Amount__c
      }
      if (payload.cux_Total_Hours__c !== '') {
        payload.cux_Total_Hours__c = Number(payload.cux_Total_Hours__c)
      } else {
        delete payload.cux_Total_Hours__c
      }
      // Remove empty strings — keeps null/undefined untouched
      Object.keys(payload).forEach((key) => {
        if (payload[key] === '') delete payload[key]
      })

      // ── Business Rule Validations ──

      // Rule 5: Hours required
      if (!payload.cux_Total_Hours__c) {
        setError('Total Hours is required.')
        setSubmitting(false)
        return
      }

      // Rule 2: Amount <= remaining TO balance
      if (payload.cux_Amount__c && payload.cux_Amount__c > toRemaining) {
        setError(`Invoice amount exceeds the remaining Task Order balance (${formatCurrency(toRemaining)}).`)
        setSubmitting(false)
        return
      }

      // Rule 3 & 4: Date warnings
      if (!warningsConfirmed) {
        const dateWarnings = []
        if (values.cux_Service_Period_End__c) {
          if (values.cux_Invoice_Date__c && values.cux_Invoice_Date__c < values.cux_Service_Period_End__c) {
            dateWarnings.push('Invoice Date is before the Service Period End date.')
          }
          if (values.cux_Received_Date__c && values.cux_Received_Date__c < values.cux_Service_Period_End__c) {
            dateWarnings.push('Received Date is before the Service Period End date.')
          }
        }
        if (dateWarnings.length > 0) {
          setWarnings(dateWarnings)
          setSubmitting(false)
          return
        }
      }

      await client.updateInvoice(invoice.Id, payload)
      onClose()
      onSuccess?.()
    } catch (err) {
      setError(err.response?.data?.[0]?.message || err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ component: 'form', onSubmit: handleSubmit }}>
      <DialogTitle>Edit Invoice</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth required>
                <InputLabel>Amount</InputLabel>
                <OutlinedInput label="Amount" type="number" inputProps={{ min: 0, step: 0.01 }} value={values.cux_Amount__c} onChange={handleChange('cux_Amount__c')} />
                {toAuthorized > 0 ? (
                  <FormHelperText>Remaining TO balance: {formatCurrency(toRemaining)}</FormHelperText>
                ) : null}
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select label="Category" value={values.cux_Category__c} onChange={handleChange('cux_Category__c')}>
                  {INVOICE_CATEGORIES.map((cat) => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth required>
                <InputLabel shrink>Invoice Date</InputLabel>
                <OutlinedInput label="Invoice Date" type="date" value={values.cux_Invoice_Date__c} onChange={handleChange('cux_Invoice_Date__c')} notched />
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel shrink>Received Date</InputLabel>
                <OutlinedInput label="Received Date" type="date" value={values.cux_Received_Date__c} onChange={handleChange('cux_Received_Date__c')} notched />
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel shrink>Service Period Start</InputLabel>
                <OutlinedInput label="Service Period Start" type="date" value={values.cux_Service_Period_Start__c} onChange={handleChange('cux_Service_Period_Start__c')} notched />
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel shrink>Service Period End</InputLabel>
                <OutlinedInput label="Service Period End" type="date" value={values.cux_Service_Period_End__c} onChange={handleChange('cux_Service_Period_End__c')} notched />
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>External Invoice Number</InputLabel>
                <OutlinedInput label="External Invoice Number" value={values.cux_External_Invoice_Number__c} onChange={handleChange('cux_External_Invoice_Number__c')} />
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth required>
                <InputLabel>Total Hours</InputLabel>
                <OutlinedInput label="Total Hours" type="number" inputProps={{ min: 0, step: 0.25 }} value={values.cux_Total_Hours__c} onChange={handleChange('cux_Total_Hours__c')} />
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel>Description</InputLabel>
                <OutlinedInput label="Description" multiline rows={3} value={values.cux_Description__c} onChange={handleChange('cux_Description__c')} />
              </FormControl>
            </Grid>
          </Grid>
        </Stack>
      </DialogContent>
      {warnings.length > 0 ? (
        <Alert severity="warning" sx={{ mx: 3, mb: 1 }}>
          <Stack spacing={0.5}>
            {warnings.map((w, i) => (
              <span key={i}>{w}</span>
            ))}
          </Stack>
        </Alert>
      ) : null}
      <DialogActions>
        <Button color="secondary" onClick={onClose}>Cancel</Button>
        {warnings.length > 0 && !warningsConfirmed ? (
          <Button
            variant="contained"
            color="warning"
            onClick={() => {
              setWarningsConfirmed(true)
              // Re-trigger submit
              const form = document.querySelector('form')
              if (form) form.requestSubmit()
            }}
          >
            Proceed Anyway
          </Button>
        ) : (
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

// ─── Review Tab ───

function InvoiceReviewTab({ invoiceId, invoiceStatus, contractId, validationRequests, onRefresh, onInvoiceUpdated, onDrawerClose }) {
  const client = useSalesforceClient()
  const { auth } = useAuth()
  const { run, loading: runLoading, result: runResult, error: runError } = useRunValidation()
  const [advanceLoading, setAdvanceLoading] = React.useState(false)
  const [advanceError, setAdvanceError] = React.useState(null)
  const [paymentDialogOpen, setPaymentDialogOpen] = React.useState(false)

  const latestRequest = React.useMemo(() => {
    if (!validationRequests?.length) return null
    let candidates = validationRequests
    if (invoiceStatus) {
      const stageFiltered = validationRequests.filter((r) => r.cux_Stage__c === invoiceStatus)
      if (stageFiltered.length > 0) candidates = stageFiltered
    }
    const completed = candidates.filter((r) => r.cux_Status__c === 'Completed')
    return completed.length > 0
      ? completed.reduce((a, b) =>
          new Date(b.cux_Requested_At__c) > new Date(a.cux_Requested_At__c) ? b : a
        )
      : candidates[0]
  }, [validationRequests, invoiceStatus])

  const { data: results, refetch: refetchResults } = useSalesforceQuery(
    (sfClient) => latestRequest ? sfClient.getValidationResults(latestRequest.Id) : Promise.resolve([]),
    [latestRequest?.Id]
  )

  async function handleRunValidation() {
    const result = await run({
      targetEntityType: 'Invoice',
      targetEntityId: invoiceId,
      stage: invoiceStatus,
      idempotencyKey: `invoice-${invoiceStatus}-${invoiceId}-${Date.now()}`,
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
    const nextStatus = INV_STATUS_NEXT[invoiceStatus]
    if (!nextStatus) return

    // If advancing to Paid, show the payment details dialog first
    if (nextStatus === 'Paid') {
      setPaymentDialogOpen(true)
      return
    }

    await executeAdvance(nextStatus)
  }

  async function executeAdvance(nextStatus, paymentData) {
    setAdvanceLoading(true)
    setAdvanceError(null)
    try {
      // Complete the current stage's review WorkTask
      if (auth?.user?.id) {
        await completeReviewWork(client, invoiceId, auth.user.id, invoiceStatus).catch((err) =>
          console.warn('Failed to complete review WorkTask:', err)
        )
      }

      // Build update payload — include payment details if advancing to Paid
      const updatePayload = { cux_Status__c: nextStatus }
      if (paymentData) {
        if (paymentData.cux_Out_to_Account_Date__c) updatePayload.cux_Out_to_Account_Date__c = paymentData.cux_Out_to_Account_Date__c
        if (paymentData.cux_Payment_Schedule_Date__c) updatePayload.cux_Payment_Schedule_Date__c = paymentData.cux_Payment_Schedule_Date__c
        if (paymentData.cux_Schedule_Number__c) updatePayload.cux_Schedule_Number__c = paymentData.cux_Schedule_Number__c
        if (paymentData.cux_Paid_Amount__c !== undefined && paymentData.cux_Paid_Amount__c !== '') {
          updatePayload.cux_Paid_Amount__c = Number(paymentData.cux_Paid_Amount__c)
        }
      }

      await client.updateRecord('cux_Invoice__c', invoiceId, updatePayload)
      await client.createRecord('cux_ContractEvent__c', {
        cux_Contract__c: contractId || undefined,
        cux_Event_Type__c: 'Status Changed',
        cux_Related_Record_Id__c: invoiceId,
        cux_Related_Object_Type__c: 'Invoice',
        cux_Previous_Status__c: invoiceStatus,
        cux_New_Status__c: nextStatus,
        cux_Event_Detail__c: JSON.stringify({ trigger: 'validation_gate_passed' }),
        cux_Event_Timestamp__c: new Date().toISOString(),
      })
      // Trigger validation for the NEW stage
      await triggerStageValidation(client, 'Invoice', invoiceId, nextStatus)
      onRefresh()
      onInvoiceUpdated?.()
      onDrawerClose?.()
    } catch (err) {
      console.error('Advance invoice error:', err.response?.data || err)
      setAdvanceError(err.response?.data?.[0]?.message || err.message || 'Failed to advance status')
    } finally {
      setAdvanceLoading(false)
    }
  }

  async function handleReturn(notes) {
    if (!client) return
    const prevStatus = INV_STATUS_PREV[invoiceStatus]
    if (!prevStatus) return
    setAdvanceLoading(true)
    setAdvanceError(null)
    try {
      await client.updateRecord('cux_Invoice__c', invoiceId, { cux_Status__c: prevStatus })
      await client.createRecord('cux_ContractEvent__c', {
        cux_Contract__c: contractId || undefined,
        cux_Event_Type__c: 'Status Changed',
        cux_Related_Record_Id__c: invoiceId,
        cux_Related_Object_Type__c: 'Invoice',
        cux_Previous_Status__c: invoiceStatus,
        cux_New_Status__c: prevStatus,
        cux_Event_Detail__c: JSON.stringify({ trigger: 'validation_gate_failed', notes }),
        cux_Event_Timestamp__c: new Date().toISOString(),
      })
      // Reopen the completed review WorkTask and notify the original reviewer
      await reopenReviewWork(client, 'Invoice', invoiceId, invoiceStatus, auth?.user?.id, notes)
        .catch((err) => console.warn('Failed to reopen review WorkTask:', err))
      onInvoiceUpdated?.()
      onDrawerClose?.()
    } catch (err) {
      console.error('Return invoice error:', err.response?.data || err)
      setAdvanceError(err.response?.data?.[0]?.message || err.message || 'Failed to return status')
    } finally {
      setAdvanceLoading(false)
    }
  }

  const canAdvance = invoiceStatus && INV_STATUS_NEXT[invoiceStatus]
  const canReturn = invoiceStatus && INV_STATUS_PREV[invoiceStatus]

  return (
    <>
      <EntityReviewPanel
        entityLabel="Invoice"
        stage={invoiceStatus}
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
            completeReviewWork(client, invoiceId, auth.user.id, invoiceStatus).catch((err) =>
              console.warn('Failed to complete review WorkTask:', err)
            )
          }
        }}
      />
      <PaymentDetailsDialog
        open={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        onConfirm={(paymentData) => {
          setPaymentDialogOpen(false)
          executeAdvance('Paid', paymentData)
        }}
        loading={advanceLoading}
      />
    </>
  )
}

// ─── Payment Details Dialog (shown when advancing to Paid) ───

function PaymentDetailsDialog({ open, onClose, onConfirm, loading }) {
  const [values, setValues] = React.useState({
    cux_Out_to_Account_Date__c: '',
    cux_Payment_Schedule_Date__c: '',
    cux_Schedule_Number__c: '',
    cux_Paid_Amount__c: '',
  })

  React.useEffect(() => {
    if (open) {
      setValues({
        cux_Out_to_Account_Date__c: '',
        cux_Payment_Schedule_Date__c: '',
        cux_Schedule_Number__c: '',
        cux_Paid_Amount__c: '',
      })
    }
  }, [open])

  function handleChange(field) {
    return (event) => setValues((prev) => ({ ...prev, [field]: event.target.value }))
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Payment Details</DialogTitle>
      <Divider />
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <FormControl fullWidth>
            <InputLabel shrink>Out to Account Date</InputLabel>
            <OutlinedInput
              label="Out to Account Date"
              type="date"
              value={values.cux_Out_to_Account_Date__c}
              onChange={handleChange('cux_Out_to_Account_Date__c')}
              notched
            />
          </FormControl>
          <FormControl fullWidth>
            <InputLabel shrink>Payment Schedule Date</InputLabel>
            <OutlinedInput
              label="Payment Schedule Date"
              type="date"
              value={values.cux_Payment_Schedule_Date__c}
              onChange={handleChange('cux_Payment_Schedule_Date__c')}
              notched
            />
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Schedule Number</InputLabel>
            <OutlinedInput
              label="Schedule Number"
              value={values.cux_Schedule_Number__c}
              onChange={handleChange('cux_Schedule_Number__c')}
            />
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Paid Amount</InputLabel>
            <OutlinedInput
              label="Paid Amount"
              type="number"
              inputProps={{ min: 0, step: 0.01 }}
              value={values.cux_Paid_Amount__c}
              onChange={handleChange('cux_Paid_Amount__c')}
            />
          </FormControl>
        </Stack>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button color="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button
          variant="contained"
          onClick={() => onConfirm(values)}
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Confirm & Mark as Paid'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
