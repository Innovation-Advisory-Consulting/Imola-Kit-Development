import * as React from 'react'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid'
import InputLabel from '@mui/material/InputLabel'
import Link from '@mui/material/Link'
import MenuItem from '@mui/material/MenuItem'
import OutlinedInput from '@mui/material/OutlinedInput'
import Select from '@mui/material/Select'
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
import { styled } from '@mui/material/styles'
import { CaretRightIcon } from '@phosphor-icons/react/dist/ssr/CaretRight'
import { CheckCircleIcon } from '@phosphor-icons/react/dist/ssr/CheckCircle'
import { ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock'
import { FileTextIcon } from '@phosphor-icons/react/dist/ssr/FileText'
import { PencilSimpleIcon } from '@phosphor-icons/react/dist/ssr/PencilSimple'
import { SealCheckIcon } from '@phosphor-icons/react/dist/ssr/SealCheck'
import { Helmet } from 'react-helmet-async'
import { useParams } from 'react-router-dom'

import { appConfig } from '@/config/app'
import { paths } from '@/paths'
import { dayjs } from '@/lib/dayjs'
import { RouterLink } from '@/components/core/link'
import { PropertyItem } from '@/components/core/property-item'
import { PropertyList } from '@/components/core/property-list'
import { useSalesforceClient, useSalesforceQuery } from '@/hooks/use-salesforce'
import { AnimatedPage } from '@/components/core/animations'
import { EntityEventsTab } from '@/components/dashboard/entity-timeline'
import { EntityDocumentsTab } from '@/components/dashboard/entity-documents'

const metadata = { title: `Details | Supplements | Dashboard | ${appConfig.name}` }

const statusColorMap = {
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

const TASK_ORDER_TYPES = ['Emergency', 'Translab']

function formatCurrency(value) {
  if (value == null) return '$0.00'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

// --- Lifecycle Stepper ---

const LIFECYCLE_STEPS = ['Draft', 'Under Review', 'Approved']

const stepIcons = {
  Draft: ClockIcon,
  'Under Review': SealCheckIcon,
  Approved: CheckCircleIcon,
}

function getActiveStep(status) {
  const idx = LIFECYCLE_STEPS.indexOf(status)
  return idx >= 0 ? idx : 0
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

function LifecycleStepIcon({ icon: Icon, active, completed }) {
  const color = completed || active
    ? 'var(--mui-palette-primary-main)'
    : 'var(--mui-palette-text-disabled)'

  const bgcolor = completed || active
    ? 'var(--mui-palette-primary-50, rgba(38, 105, 179, 0.08))'
    : 'var(--mui-palette-action-hover)'

  return (
    <Box
      sx={{
        width: 40, height: 40, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        bgcolor, color, transition: 'all 0.2s ease',
      }}
    >
      {completed ? (
        <CheckCircleIcon weight="fill" fontSize="var(--icon-fontSize-lg)" />
      ) : (
        <Icon weight={active ? 'fill' : 'regular'} fontSize="var(--icon-fontSize-lg)" />
      )}
    </Box>
  )
}

function SupplementLifecycleStepper({ status }) {
  const activeStep = getActiveStep(status)
  const isApproved = status === 'Approved'

  return (
    <Card variant="outlined">
      <CardContent>
        <Stepper activeStep={activeStep} alternativeLabel connector={<LifecycleConnector />}>
          {LIFECYCLE_STEPS.map((step, index) => {
            const Icon = stepIcons[step]
            const completed = index < activeStep || (isApproved && index === activeStep)
            const active = index === activeStep && !isApproved
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

// --- Status advancement ---

const STATUS_NEXT = {
  Draft: 'Under Review',
  'Under Review': 'Approved',
}
const STATUS_PREV = { 'Under Review': 'Draft' }

function getAdvanceLabel(currentStatus) {
  const next = STATUS_NEXT[currentStatus]
  if (next === 'Approved') return 'Approve Supplement'
  if (next === 'Under Review') return 'Submit for Review'
  return `Advance to ${next}`
}

// --- Page ---

export function Page() {
  const { supplementId } = useParams()
  const client = useSalesforceClient()
  const [currentTab, setCurrentTab] = React.useState('overview')
  const [editOpen, setEditOpen] = React.useState(false)

  const { data: supplement, loading, error, refetch: refetchSupplement } = useSalesforceQuery(
    (client) => client.getSupplement(supplementId),
    [supplementId]
  )

  const { data: entityEvents } = useSalesforceQuery(
    (client) => client.getEntityEvents(supplementId),
    [supplementId]
  )

  const { data: entityDocuments, refetch: refetchEntityDocuments } = useSalesforceQuery(
    (client) => client.getEntityDocuments('Supplement', supplementId),
    [supplementId]
  )

  const [actionLoading, setActionLoading] = React.useState(false)
  const [actionError, setActionError] = React.useState(null)

  async function handleAdvance() {
    if (!client || !supplement) return
    const currentStatus = supplement.cux_Status__c || 'Draft'
    const nextStatus = STATUS_NEXT[currentStatus]
    if (!nextStatus) return

    setActionLoading(true)
    setActionError(null)
    try {
      await client.updateSupplement(supplementId, { cux_Status__c: nextStatus })
      refetchSupplement()
    } catch (err) {
      console.error('Advance supplement error:', err.response?.data || err)
      setActionError(err.response?.data?.[0]?.message || err.message || 'Failed to advance')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleReturn() {
    if (!client || !supplement) return
    const currentStatus = supplement.cux_Status__c || 'Draft'
    const prevStatus = STATUS_PREV[currentStatus]
    if (!prevStatus) return

    setActionLoading(true)
    setActionError(null)
    try {
      await client.updateSupplement(supplementId, { cux_Status__c: prevStatus })
      refetchSupplement()
    } catch (err) {
      console.error('Return supplement error:', err.response?.data || err)
      setActionError(err.response?.data?.[0]?.message || err.message || 'Failed to return')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return <Alert severity="error" sx={{ m: 3 }}>Failed to load supplement: {error.message}</Alert>
  }

  if (!supplement) {
    return <Alert severity="warning" sx={{ m: 3 }}>Supplement not found</Alert>
  }

  const currentStatus = supplement.cux_Status__c || 'Draft'
  const isLocked = currentStatus === 'Approved' || currentStatus === 'Rejected'
  const canAdvance = !!STATUS_NEXT[currentStatus]
  const canReturn = !!STATUS_PREV[currentStatus]
  const canEdit = !isLocked
  const taskOrder = supplement.cux_Task_Order__r

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
              {taskOrder?.cux_Contract__c ? (
                <Link color="text.primary" component={RouterLink} href={paths.dashboard.contracts.details(taskOrder.cux_Contract__c)} variant="subtitle2" underline="hover">
                  {taskOrder.cux_Contract__r?.Name || 'Contract'}
                </Link>
              ) : null}
              {supplement.cux_Task_Order__c ? (
                <Link color="text.primary" component={RouterLink} href={paths.dashboard.taskOrders.details(supplement.cux_Task_Order__c)} variant="subtitle2" underline="hover">
                  {taskOrder?.Name || 'Task Order'}
                </Link>
              ) : null}
              <Typography color="text.secondary" variant="subtitle2">{supplement.Name}</Typography>
            </Breadcrumbs>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ alignItems: 'flex-start' }}>
              <Box sx={{ flex: '1 1 auto' }}>
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                  <Typography variant="h4">{supplement.Name}</Typography>
                  <Chip
                    color={statusColorMap[currentStatus] || 'default'}
                    label={currentStatus}
                    size="small"
                    variant="soft"
                  />
                </Stack>
                <Typography color="text.secondary" variant="body2">
                  {supplement.cux_Supplement_Reason__c || 'Supplement'}
                  {taskOrder ? ` · ${taskOrder.Name}` : ''}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                {canEdit && (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<PencilSimpleIcon />}
                    onClick={() => setEditOpen(true)}
                  >
                    Edit
                  </Button>
                )}
                {canReturn && (
                  <Button
                    size="small"
                    variant="outlined"
                    color="warning"
                    onClick={handleReturn}
                    disabled={actionLoading}
                  >
                    Return to Draft
                  </Button>
                )}
                {canAdvance && (
                  <Button
                    size="small"
                    variant="contained"
                    onClick={handleAdvance}
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Processing...' : getAdvanceLabel(currentStatus)}
                  </Button>
                )}
              </Stack>
            </Stack>
          </Stack>

          {actionError && <Alert severity="error" onClose={() => setActionError(null)}>{actionError}</Alert>}

          <SupplementLifecycleStepper status={currentStatus} />

          <Tabs value={currentTab} onChange={(_, val) => setCurrentTab(val)}>
            <Tab label="Overview" value="overview" />
            <Tab label={`Documents (${entityDocuments?.length || 0})`} value="documents" />
            <Tab label={`Events (${entityEvents?.length || 0})`} value="events" />
          </Tabs>

          {currentTab === 'overview' && <OverviewTab supplement={supplement} />}
          {currentTab === 'documents' && (
            <EntityDocumentsTab
              documents={entityDocuments}
              contractId={supplement?.cux_Task_Order__r?.cux_Contract__c}
              entityType="Supplement"
              entityId={supplementId}
              onDocumentAdded={refetchEntityDocuments}
            />
          )}
          {currentTab === 'events' && <EntityEventsTab events={entityEvents} />}

          <EditSupplementDialog
            supplement={supplement}
            open={editOpen}
            onClose={() => setEditOpen(false)}
            onSuccess={refetchSupplement}
          />
        </Stack>
      </Box>
      </AnimatedPage>
    </React.Fragment>
  )
}

// --- Overview Tab ---

function OverviewTab({ supplement }) {
  const taskOrder = supplement.cux_Task_Order__r
  const contract = taskOrder?.cux_Contract__r

  return (
    <Grid container spacing={4}>
      <Grid size={{ md: 8, xs: 12 }}>
        <Stack spacing={4}>
          {/* Supplement Information */}
          <Card>
            <CardHeader
              avatar={<Avatar><FileTextIcon fontSize="var(--Icon-fontSize)" /></Avatar>}
              title="Supplement information"
            />
            <CardContent>
              <Card sx={{ borderRadius: 1 }} variant="outlined">
                <PropertyList divider={<Divider />} sx={{ '--PropertyItem-padding': '12px 24px' }}>
                  {[
                    { key: 'Supplement Number', value: supplement.Name },
                    { key: 'Supplement #', value: supplement.cux_Supplement_Number__c != null ? `#${supplement.cux_Supplement_Number__c}` : '—' },
                    {
                      key: 'Reason',
                      value: supplement.cux_Supplement_Reason__c ? (
                        <Chip label={supplement.cux_Supplement_Reason__c} size="small" variant="outlined" />
                      ) : '—',
                    },
                    {
                      key: 'Status',
                      value: (
                        <Chip
                          color={statusColorMap[supplement.cux_Status__c] || 'default'}
                          label={supplement.cux_Status__c || 'Draft'}
                          size="small"
                          variant="outlined"
                        />
                      ),
                    },
                    { key: 'Version Type', value: supplement.cux_Version_Type__c || '—' },
                    ...(taskOrder ? [{
                      key: 'Task Order',
                      value: (
                        <Link component={RouterLink} href={paths.dashboard.taskOrders.details(supplement.cux_Task_Order__c)} variant="subtitle2">
                          {taskOrder.Name}
                        </Link>
                      ),
                    }] : []),
                    {
                      key: 'Effective',
                      value: supplement.cux_Is_Effective__c ? (
                        <Chip label="Yes" color="success" size="small" variant="outlined" />
                      ) : (
                        <Chip label="No" size="small" variant="outlined" />
                      ),
                    },
                  ].map((item) => (
                    <PropertyItem key={item.key} name={item.key} value={item.value} />
                  ))}
                </PropertyList>
              </Card>
            </CardContent>
          </Card>

          {/* Changes */}
          <Card>
            <CardHeader
              avatar={<Avatar><SealCheckIcon fontSize="var(--Icon-fontSize)" /></Avatar>}
              title="Changes"
            />
            <CardContent>
              <Card sx={{ borderRadius: 1 }} variant="outlined">
                <PropertyList divider={<Divider />} sx={{ '--PropertyItem-padding': '12px 24px' }}>
                  {[
                    { key: 'Current Start Date', value: taskOrder?.cux_Start_Date__c ? dayjs(taskOrder.cux_Start_Date__c).format('MMMM D, YYYY') : '—' },
                    { key: 'New Start Date', value: supplement.cux_Start_Date__c ? dayjs(supplement.cux_Start_Date__c).format('MMMM D, YYYY') : '—' },
                    { key: 'Current End Date', value: taskOrder?.cux_End_Date__c ? dayjs(taskOrder.cux_End_Date__c).format('MMMM D, YYYY') : '—' },
                    { key: 'New End Date', value: supplement.cux_End_Date__c ? dayjs(supplement.cux_End_Date__c).format('MMMM D, YYYY') : '—' },
                    { key: 'Current Authorized Amount', value: formatCurrency(taskOrder?.cux_Authorized_Amount__c) },
                    { key: 'New Obligation Amount', value: formatCurrency(supplement.cux_Full_Obligation_Amount__c) },
                    ...(supplement.cux_Task_Order_Type__c ? [
                      { key: 'Current Type', value: taskOrder?.cux_Task_Order_Type__c || '—' },
                      { key: 'New Type', value: supplement.cux_Task_Order_Type__c },
                    ] : []),
                  ].map((item) => (
                    <PropertyItem key={item.key} name={item.key} value={item.value} />
                  ))}
                </PropertyList>
              </Card>
            </CardContent>
          </Card>

          {/* Scope */}
          {supplement.cux_Full_Scope__c ? (
            <Card>
              <CardHeader title="Scope" />
              <CardContent sx={{ pt: 0 }}>
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                  {supplement.cux_Full_Scope__c}
                </Typography>
              </CardContent>
            </Card>
          ) : null}
        </Stack>
      </Grid>

      {/* Sidebar */}
      <Grid size={{ md: 4, xs: 12 }}>
        <Stack spacing={4}>
          {/* Related Task Order */}
          {taskOrder ? (
            <Card>
              <CardHeader title="Related Task Order" />
              <CardContent sx={{ pt: 0 }}>
                <Stack spacing={0.5}>
                  <Link component={RouterLink} href={paths.dashboard.taskOrders.details(supplement.cux_Task_Order__c)} variant="subtitle2">
                    {taskOrder.Name}
                  </Link>
                  <Typography variant="caption" color="text.secondary">
                    {taskOrder.cux_Status__c} · {taskOrder.cux_Task_Order_Type__c || 'Task Order'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatCurrency(taskOrder.cux_Authorized_Amount__c)}
                  </Typography>
                  {taskOrder.cux_Start_Date__c && taskOrder.cux_End_Date__c ? (
                    <Typography variant="caption" color="text.secondary">
                      {dayjs(taskOrder.cux_Start_Date__c).format('MMM D, YYYY')} — {dayjs(taskOrder.cux_End_Date__c).format('MMM D, YYYY')}
                    </Typography>
                  ) : null}
                </Stack>
              </CardContent>
            </Card>
          ) : null}

          {/* Related Contract */}
          {contract ? (
            <Card>
              <CardHeader title="Related Contract" />
              <CardContent sx={{ pt: 0 }}>
                <Stack spacing={0.5}>
                  <Link component={RouterLink} href={paths.dashboard.contracts.details(taskOrder.cux_Contract__c)} variant="subtitle2">
                    {contract.Name}
                  </Link>
                </Stack>
              </CardContent>
            </Card>
          ) : null}
        </Stack>
      </Grid>
    </Grid>
  )
}

// --- Edit Supplement Dialog ---

function EditSupplementDialog({ supplement, open, onClose, onSuccess }) {
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

  React.useEffect(() => {
    if (open && supplement) {
      setValues({
        supplementReason: supplement.cux_Supplement_Reason__c || '',
        startDate: supplement.cux_Start_Date__c || '',
        endDate: supplement.cux_End_Date__c || '',
        fullObligationAmount: supplement.cux_Full_Obligation_Amount__c ?? '',
        taskOrderType: supplement.cux_Task_Order_Type__c || '',
        fullScope: supplement.cux_Full_Scope__c || '',
      })
      setError(null)
    }
  }, [open, supplement])

  const taskOrder = supplement?.cux_Task_Order__r
  const contract = taskOrder?.cux_Contract__r
  const contractAvailable = (() => {
    const contractAuth = contract?.cux_Total_Authorized_Amount__c || 0
    const contractObligated = contract?.cux_Total_Obligated_Amount__c || 0
    const currentToAuth = taskOrder?.cux_Authorized_Amount__c || 0
    return contractAuth - contractObligated + currentToAuth
  })()

  function handleChange(field) {
    return (event) => setValues((prev) => ({ ...prev, [field]: event.target.value }))
  }

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
        cux_Supplement_Reason__c: values.supplementReason,
        cux_Start_Date__c: values.startDate,
        cux_End_Date__c: values.endDate,
        cux_Full_Obligation_Amount__c: values.fullObligationAmount ? parseFloat(values.fullObligationAmount) : 0,
        cux_Full_Scope__c: values.fullScope || null,
      }
      if (values.taskOrderType) {
        payload.cux_Task_Order_Type__c = values.taskOrderType
      }

      await client.updateSupplement(supplement.Id, payload)
      onClose()
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
      <DialogTitle>Edit Supplement</DialogTitle>
      <Divider />
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}
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
              {TASK_ORDER_TYPES.map((type) => (
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
              placeholder="Full scope of work for this supplement..."
            />
          </FormControl>
        </Stack>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button color="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={submitting || !values.supplementReason}>
          {submitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
