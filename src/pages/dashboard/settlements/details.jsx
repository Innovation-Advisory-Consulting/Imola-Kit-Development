import * as React from 'react'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
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
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import { styled } from '@mui/material/styles'
import { CaretRightIcon } from '@phosphor-icons/react/dist/ssr/CaretRight'
import { CheckCircleIcon } from '@phosphor-icons/react/dist/ssr/CheckCircle'
import { ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock'
import { MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass'
import { PencilSimpleIcon } from '@phosphor-icons/react/dist/ssr/PencilSimple'
import { PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus'
import { ScalesIcon } from '@phosphor-icons/react/dist/ssr/Scales'
import { SealCheckIcon } from '@phosphor-icons/react/dist/ssr/SealCheck'
import { TrashIcon } from '@phosphor-icons/react/dist/ssr/Trash'
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

const metadata = { title: `Details | Settlements | Dashboard | ${appConfig.name}` }

const statusColorMap = {
  Draft: 'default',
  'Under Review': 'warning',
  Approved: 'info',
  Executed: 'success',
  Closed: 'secondary',
}

const LINE_ITEM_CATEGORIES = [
  'Services Rendered',
  'Termination Costs',
  'Demobilization Costs',
  'Equipment Return Costs',
  'Legal Settlement Payment',
  'Penalty Offset',
  'Administrative Costs',
  'Other',
]

function formatCurrency(value) {
  if (value == null) return '$0.00'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

// ─── Lifecycle Stepper ───

const LIFECYCLE_STEPS = ['Draft', 'Under Review', 'Approved', 'Executed', 'Closed']

const stepIcons = {
  Draft: ClockIcon,
  'Under Review': MagnifyingGlassIcon,
  Approved: SealCheckIcon,
  Executed: CheckCircleIcon,
  Closed: CheckCircleIcon,
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

function SettlementLifecycleStepper({ status }) {
  const activeStep = getActiveStep(status)
  const isClosed = status === 'Closed'

  return (
    <Card variant="outlined">
      <CardContent>
        <Stepper activeStep={activeStep} alternativeLabel connector={<LifecycleConnector />}>
          {LIFECYCLE_STEPS.map((step, index) => {
            const Icon = stepIcons[step]
            const completed = index < activeStep || (isClosed && index === activeStep)
            const active = index === activeStep && !isClosed
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

const STATUS_NEXT = {
  Draft: 'Under Review',
  'Under Review': 'Approved',
  Approved: 'Executed',
  Executed: 'Closed',
}
const STATUS_PREV = { 'Under Review': 'Draft' }

const LOCKED_STATUSES = new Set(['Approved', 'Executed', 'Closed'])

// ─── Page ───

export function Page() {
  const { settlementId } = useParams()
  const client = useSalesforceClient()
  const [currentTab, setCurrentTab] = React.useState('overview')
  const [editOpen, setEditOpen] = React.useState(false)

  const { data: settlement, loading, error, refetch: refetchSettlement } = useSalesforceQuery(
    (client) => client.getSettlement(settlementId),
    [settlementId]
  )

  const { data: lineItems, refetch: refetchLineItems } = useSalesforceQuery(
    (client) => client.getSettlementLineItems(settlementId),
    [settlementId]
  )

  const { data: entityEvents, refetch: refetchEvents } = useSalesforceQuery(
    (client) => client.getEntityEvents(settlementId),
    [settlementId]
  )

  const { data: entityDocuments, refetch: refetchDocuments } = useSalesforceQuery(
    (client) => client.getEntityDocuments('Settlement', settlementId),
    [settlementId]
  )

  const [actionLoading, setActionLoading] = React.useState(false)
  const [actionError, setActionError] = React.useState(null)

  async function handleAdvance() {
    if (!client || !settlement) return
    const currentStatus = settlement.cux_Status__c || 'Draft'
    const nextStatus = STATUS_NEXT[currentStatus]
    if (!nextStatus) return

    setActionLoading(true)
    setActionError(null)
    try {
      await client.updateSettlement(settlementId, { cux_Status__c: nextStatus })
      refetchSettlement()
      refetchEvents()
    } catch (err) {
      setActionError(err.response?.data?.[0]?.message || err.message || 'Failed to advance')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleReturn() {
    if (!client || !settlement) return
    const currentStatus = settlement.cux_Status__c || 'Draft'
    const prevStatus = STATUS_PREV[currentStatus]
    if (!prevStatus) return

    setActionLoading(true)
    setActionError(null)
    try {
      await client.updateSettlement(settlementId, { cux_Status__c: prevStatus })
      refetchSettlement()
      refetchEvents()
    } catch (err) {
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
    return <Alert severity="error" sx={{ m: 3 }}>Failed to load settlement: {error.message}</Alert>
  }

  if (!settlement) {
    return <Alert severity="warning" sx={{ m: 3 }}>Settlement not found</Alert>
  }

  const currentStatus = settlement.cux_Status__c || 'Draft'
  const isLocked = LOCKED_STATUSES.has(currentStatus)
  const canAdvance = !!STATUS_NEXT[currentStatus]
  const canReturn = !!STATUS_PREV[currentStatus]
  const canEdit = !isLocked

  const advanceLabel = STATUS_NEXT[currentStatus] === 'Executed'
    ? 'Execute Settlement'
    : STATUS_NEXT[currentStatus] === 'Closed'
    ? 'Close Settlement'
    : STATUS_NEXT[currentStatus]
    ? `Advance to ${STATUS_NEXT[currentStatus]}`
    : ''

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
              <Link color="text.primary" component={RouterLink} href={paths.dashboard.settlements.list} variant="subtitle2" underline="hover">
                Settlements
              </Link>
              {settlement.cux_Termination__c ? (
                <Link color="text.primary" component={RouterLink} href={paths.dashboard.terminations.details(settlement.cux_Termination__c)} variant="subtitle2" underline="hover">
                  {settlement.cux_Termination__r?.Name || 'Termination'}
                </Link>
              ) : null}
              <Typography color="text.secondary" variant="subtitle2">{settlement.Name}</Typography>
            </Breadcrumbs>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ alignItems: 'flex-start' }}>
              <Box sx={{ flex: '1 1 auto' }}>
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                  <Typography variant="h4">{settlement.Name}</Typography>
                  <Chip
                    color={statusColorMap[currentStatus] || 'default'}
                    label={currentStatus}
                    size="small"
                    variant="soft"
                  />
                </Stack>
                <Typography color="text.secondary" variant="body2">
                  Settlement — {formatCurrency(settlement.cux_Authorized_Amount__c)}
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
                    {actionLoading ? 'Processing...' : advanceLabel}
                  </Button>
                )}
              </Stack>
            </Stack>
          </Stack>

          {actionError && <Alert severity="error" onClose={() => setActionError(null)}>{actionError}</Alert>}

          <SettlementLifecycleStepper status={currentStatus} />

          <Tabs value={currentTab} onChange={(_, val) => setCurrentTab(val)}>
            <Tab label="Overview" value="overview" />
            <Tab label="Line Items" value="lineItems" />
            <Tab label="Documents" value="documents" />
            <Tab label="Events" value="events" />
          </Tabs>

          {currentTab === 'overview' && <OverviewTab settlement={settlement} />}
          {currentTab === 'lineItems' && (
            <LineItemsTab
              settlement={settlement}
              lineItems={lineItems || []}
              isLocked={isLocked}
              onRefresh={refetchLineItems}
            />
          )}
          {currentTab === 'documents' && (
            <EntityDocumentsTab
              documents={entityDocuments}
              contractId={settlement.cux_Contract__c}
              entityType="Settlement"
              entityId={settlementId}
              onDocumentAdded={refetchDocuments}
            />
          )}
          {currentTab === 'events' && <EntityEventsTab events={entityEvents} onRefresh={refetchEvents} />}

          <EditSettlementDialog
            settlement={settlement}
            open={editOpen}
            onClose={() => setEditOpen(false)}
            onSuccess={refetchSettlement}
          />
        </Stack>
      </Box>
      </AnimatedPage>
    </React.Fragment>
  )
}

// ─── Overview Tab ───

function OverviewTab({ settlement }) {
  return (
    <Grid container spacing={4}>
      <Grid size={{ md: 8, xs: 12 }}>
        <Stack spacing={4}>
          <Card>
            <CardHeader
              avatar={<Avatar><ScalesIcon fontSize="var(--Icon-fontSize)" /></Avatar>}
              title="Settlement information"
            />
            <CardContent>
              <Card sx={{ borderRadius: 1 }} variant="outlined">
                <PropertyList divider={<Divider />} sx={{ '--PropertyItem-padding': '12px 24px' }}>
                  {[
                    { key: 'Settlement Number', value: settlement.Name },
                    { key: 'Parent Type', value: settlement.cux_Parent_Type__c || '—' },
                    {
                      key: 'Status',
                      value: (
                        <Chip
                          color={statusColorMap[settlement.cux_Status__c] || 'default'}
                          label={settlement.cux_Status__c || 'Draft'}
                          size="small"
                          variant="outlined"
                        />
                      ),
                    },
                    { key: 'Authorized Amount', value: formatCurrency(settlement.cux_Authorized_Amount__c) },
                    { key: 'Effective Date', value: settlement.cux_Effective_Date__c ? dayjs(settlement.cux_Effective_Date__c).format('MMMM D, YYYY') : '—' },
                    ...(settlement.cux_Approved_At__c ? [{ key: 'Approved At', value: dayjs(settlement.cux_Approved_At__c).format('MMMM D, YYYY h:mm A') }] : []),
                    ...(settlement.cux_Executed_At__c ? [{ key: 'Executed At', value: dayjs(settlement.cux_Executed_At__c).format('MMMM D, YYYY h:mm A') }] : []),
                    { key: 'Post-Termination Invoicing', value: settlement.cux_Allows_Post_Termination_Invoicing__c ? 'Allowed' : 'Not Allowed' },
                    ...(settlement.cux_Allows_Post_Termination_Invoicing__c && settlement.cux_Post_Termination_Invoice_Cutoff_Date__c ? [
                      { key: 'Invoice Cutoff Date', value: dayjs(settlement.cux_Post_Termination_Invoice_Cutoff_Date__c).format('MMMM D, YYYY') },
                    ] : []),
                    { key: 'Created', value: settlement.CreatedDate ? dayjs(settlement.CreatedDate).format('MMMM D, YYYY h:mm A') : '—' },
                    { key: 'Last Modified', value: settlement.LastModifiedDate ? dayjs(settlement.LastModifiedDate).format('MMMM D, YYYY h:mm A') : '—' },
                  ].map((item) => (
                    <PropertyItem key={item.key} name={item.key} value={item.value} />
                  ))}
                </PropertyList>
              </Card>
            </CardContent>
          </Card>
        </Stack>
      </Grid>

      <Grid size={{ md: 4, xs: 12 }}>
        <Stack spacing={4}>
          {settlement.cux_Termination__r ? (
            <Card>
              <CardHeader title="Related Termination" />
              <CardContent sx={{ pt: 0 }}>
                <Link component={RouterLink} href={paths.dashboard.terminations.details(settlement.cux_Termination__c)} variant="subtitle2">
                  {settlement.cux_Termination__r.Name}
                </Link>
              </CardContent>
            </Card>
          ) : null}
          {settlement.cux_Contract__r ? (
            <Card>
              <CardHeader title="Related Contract" />
              <CardContent sx={{ pt: 0 }}>
                <Link component={RouterLink} href={paths.dashboard.contracts.details(settlement.cux_Contract__c)} variant="subtitle2">
                  {settlement.cux_Contract__r.Name}
                </Link>
              </CardContent>
            </Card>
          ) : null}
          {settlement.cux_Task_Order__r ? (
            <Card>
              <CardHeader title="Related Task Order" />
              <CardContent sx={{ pt: 0 }}>
                <Link component={RouterLink} href={paths.dashboard.taskOrders.details(settlement.cux_Task_Order__c)} variant="subtitle2">
                  {settlement.cux_Task_Order__r.Name}
                </Link>
              </CardContent>
            </Card>
          ) : null}
        </Stack>
      </Grid>
    </Grid>
  )
}

// ─── Line Items Tab ───

function LineItemsTab({ settlement, lineItems, isLocked, onRefresh }) {
  const client = useSalesforceClient()
  const [addOpen, setAddOpen] = React.useState(false)
  const [editItem, setEditItem] = React.useState(null)
  const [deleteLoading, setDeleteLoading] = React.useState(null)

  const total = lineItems.reduce((sum, li) => sum + (li.cux_Amount__c || 0), 0)
  const authorized = settlement.cux_Authorized_Amount__c || 0
  const overBudget = total > authorized

  async function handleDelete(itemId) {
    if (!client) return
    setDeleteLoading(itemId)
    try {
      await client.deleteSettlementLineItem(itemId)
      onRefresh()
    } catch (err) {
      console.error('Failed to delete line item:', err)
    } finally {
      setDeleteLoading(null)
    }
  }

  return (
    <Card>
      <CardHeader
        title="Line Items"
        action={
          !isLocked ? (
            <Button size="small" startIcon={<PlusIcon />} onClick={() => setAddOpen(true)}>
              Add Line Item
            </Button>
          ) : null
        }
      />
      <Divider />
      {overBudget && (
        <Alert severity="warning" sx={{ mx: 2, mt: 1 }}>
          Total line items ({formatCurrency(total)}) exceed the authorized amount ({formatCurrency(authorized)}).
        </Alert>
      )}
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Item #</TableCell>
            <TableCell>Category</TableCell>
            <TableCell align="right">Amount</TableCell>
            <TableCell>Description</TableCell>
            {!isLocked && <TableCell align="right" width={100}>Actions</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {lineItems.length === 0 ? (
            <TableRow>
              <TableCell colSpan={isLocked ? 4 : 5} align="center">
                <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                  No line items yet.
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            lineItems.map((li) => (
              <TableRow key={li.Id} hover>
                <TableCell>{li.Name}</TableCell>
                <TableCell>
                  <Chip label={li.cux_Category__c || '—'} size="small" variant="outlined" />
                </TableCell>
                <TableCell align="right">{formatCurrency(li.cux_Amount__c)}</TableCell>
                <TableCell>{li.cux_Description__c || '—'}</TableCell>
                {!isLocked && (
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => setEditItem(li)}>
                      <PencilSimpleIcon fontSize="var(--icon-fontSize-sm)" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(li.Id)}
                      disabled={deleteLoading === li.Id}
                    >
                      <TrashIcon fontSize="var(--icon-fontSize-sm)" />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
          {lineItems.length > 0 && (
            <TableRow>
              <TableCell colSpan={2}>
                <Typography variant="subtitle2" fontWeight={700}>Total</Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="subtitle2" fontWeight={700} color={overBudget ? 'error' : 'text.primary'}>
                  {formatCurrency(total)}
                </Typography>
              </TableCell>
              <TableCell colSpan={isLocked ? 1 : 2} />
            </TableRow>
          )}
        </TableBody>
      </Table>

      <LineItemDialog
        settlementId={settlement.Id}
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={onRefresh}
      />
      <LineItemDialog
        settlementId={settlement.Id}
        lineItem={editItem}
        open={!!editItem}
        onClose={() => setEditItem(null)}
        onSuccess={onRefresh}
      />
    </Card>
  )
}

// ─── Line Item Add/Edit Dialog ───

function LineItemDialog({ settlementId, lineItem, open, onClose, onSuccess }) {
  const client = useSalesforceClient()
  const isEdit = !!lineItem
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState(null)

  const [values, setValues] = React.useState({
    category: '',
    amount: '',
    description: '',
  })

  React.useEffect(() => {
    if (open) {
      if (lineItem) {
        setValues({
          category: lineItem.cux_Category__c || '',
          amount: lineItem.cux_Amount__c ?? '',
          description: lineItem.cux_Description__c || '',
        })
      } else {
        setValues({ category: '', amount: '', description: '' })
      }
      setError(null)
    }
  }, [open, lineItem])

  function handleChange(field) {
    return (event) => setValues((prev) => ({ ...prev, [field]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!client || !values.category || !values.amount) return

    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        cux_Category__c: values.category,
        cux_Amount__c: Number(values.amount),
        cux_Description__c: values.description || null,
      }

      if (isEdit) {
        await client.updateSettlementLineItem(lineItem.Id, payload)
      } else {
        payload.cux_Settlement__c = settlementId
        await client.createSettlementLineItem(payload)
      }

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
      <DialogTitle>{isEdit ? 'Edit Line Item' : 'Add Line Item'}</DialogTitle>
      <Divider />
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <FormControl fullWidth required>
            <InputLabel>Category</InputLabel>
            <Select
              value={values.category}
              onChange={handleChange('category')}
              label="Category"
            >
              {LINE_ITEM_CATEGORIES.map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth required>
            <InputLabel>Amount</InputLabel>
            <OutlinedInput
              type="number"
              value={values.amount}
              onChange={handleChange('amount')}
              label="Amount"
              inputProps={{ min: 0, step: 0.01 }}
              startAdornment={<Typography sx={{ mr: 0.5 }}>$</Typography>}
            />
          </FormControl>
          <FormControl fullWidth>
            <InputLabel shrink>Description</InputLabel>
            <OutlinedInput
              multiline
              minRows={2}
              maxRows={4}
              value={values.description}
              onChange={handleChange('description')}
              label="Description"
              notched
              placeholder="Describe this line item..."
            />
          </FormControl>
        </Stack>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button color="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={submitting || !values.category || !values.amount}>
          {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Line Item'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ─── Edit Settlement Dialog ───

function EditSettlementDialog({ settlement, open, onClose, onSuccess }) {
  const client = useSalesforceClient()
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState(null)

  const [values, setValues] = React.useState({
    authorizedAmount: '',
    effectiveDate: '',
    allowsPostTerminationInvoicing: false,
    postTerminationCutoffDate: '',
  })

  React.useEffect(() => {
    if (open && settlement) {
      setValues({
        authorizedAmount: settlement.cux_Authorized_Amount__c ?? '',
        effectiveDate: settlement.cux_Effective_Date__c || '',
        allowsPostTerminationInvoicing: !!settlement.cux_Allows_Post_Termination_Invoicing__c,
        postTerminationCutoffDate: settlement.cux_Post_Termination_Invoice_Cutoff_Date__c || '',
      })
      setError(null)
    }
  }, [open, settlement])

  function handleChange(field) {
    return (event) => setValues((prev) => ({ ...prev, [field]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!client) return

    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        cux_Effective_Date__c: values.effectiveDate || null,
        cux_Allows_Post_Termination_Invoicing__c: values.allowsPostTerminationInvoicing,
      }
      if (values.authorizedAmount !== '') {
        payload.cux_Authorized_Amount__c = Number(values.authorizedAmount)
      }
      if (values.allowsPostTerminationInvoicing && values.postTerminationCutoffDate) {
        payload.cux_Post_Termination_Invoice_Cutoff_Date__c = values.postTerminationCutoffDate
      }

      await client.updateSettlement(settlement.Id, payload)
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
      <DialogTitle>Edit Settlement</DialogTitle>
      <Divider />
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <FormControl fullWidth required>
            <InputLabel>Authorized Amount</InputLabel>
            <OutlinedInput
              type="number"
              value={values.authorizedAmount}
              onChange={handleChange('authorizedAmount')}
              label="Authorized Amount"
              inputProps={{ min: 0, step: 0.01 }}
              startAdornment={<Typography sx={{ mr: 0.5 }}>$</Typography>}
            />
          </FormControl>
          <FormControl fullWidth required>
            <InputLabel shrink>Effective Date</InputLabel>
            <OutlinedInput
              type="date"
              value={values.effectiveDate}
              onChange={handleChange('effectiveDate')}
              label="Effective Date"
              notched
            />
          </FormControl>
          <FormControlLabel
            control={
              <Checkbox
                checked={values.allowsPostTerminationInvoicing}
                onChange={(e) => setValues((prev) => ({ ...prev, allowsPostTerminationInvoicing: e.target.checked }))}
              />
            }
            label="Allow Post-Termination Invoicing"
          />
          {values.allowsPostTerminationInvoicing && (
            <FormControl fullWidth>
              <InputLabel shrink>Invoice Cutoff Date</InputLabel>
              <OutlinedInput
                type="date"
                value={values.postTerminationCutoffDate}
                onChange={handleChange('postTerminationCutoffDate')}
                label="Invoice Cutoff Date"
                notched
              />
            </FormControl>
          )}
        </Stack>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button color="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
