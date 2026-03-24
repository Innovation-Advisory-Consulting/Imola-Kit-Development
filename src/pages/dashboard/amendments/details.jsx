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
import Grid from '@mui/material/Grid'
import InputLabel from '@mui/material/InputLabel'
import Link from '@mui/material/Link'
import ListItemText from '@mui/material/ListItemText'
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
import { NotePencilIcon } from '@phosphor-icons/react/dist/ssr/NotePencil'
import { PencilSimpleIcon } from '@phosphor-icons/react/dist/ssr/PencilSimple'
import { SealCheckIcon } from '@phosphor-icons/react/dist/ssr/SealCheck'
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
import { AnimatedPage } from '@/components/core/animations'
import { EntityEventsTab } from '@/components/dashboard/entity-timeline'
import { EntityDocumentsTab } from '@/components/dashboard/entity-documents'

const metadata = { title: `Details | Amendments | Dashboard | ${appConfig.name}` }

const statusColorMap = {
  Draft: 'default',
  Review: 'warning',
  Executed: 'success',
}

const AMENDMENT_TYPES = [
  'Scope Modification',
  'Performance Period Modification',
  'Authorized Amount Modification',
  'Other',
]

function formatCurrency(value) {
  if (value == null) return '$0.00'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

// ─── Lifecycle Stepper ───

const LIFECYCLE_STEPS = ['Draft', 'Review', 'Executed']

const stepIcons = {
  Draft: ClockIcon,
  Review: SealCheckIcon,
  Executed: CheckCircleIcon,
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

function AmendmentLifecycleStepper({ status }) {
  const activeStep = getActiveStep(status)
  const isExecuted = status === 'Executed'

  return (
    <Card variant="outlined">
      <CardContent>
        <Stepper activeStep={activeStep} alternativeLabel connector={<LifecycleConnector />}>
          {LIFECYCLE_STEPS.map((step, index) => {
            const Icon = stepIcons[step]
            const completed = index < activeStep || (isExecuted && index === activeStep)
            const active = index === activeStep && !isExecuted
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
  Draft: 'Review',
  Review: 'Executed',
}
const STATUS_PREV = { Review: 'Draft' }

// ─── Page ───

export function Page() {
  const { amendmentId } = useParams()
  const client = useSalesforceClient()
  const [currentTab, setCurrentTab] = React.useState('overview')
  const [editOpen, setEditOpen] = React.useState(false)

  const { addRecentRecord } = useRecentRecords()

  const { data: amendment, loading, error, refetch: refetchAmendment } = useSalesforceQuery(
    (client) => client.getAmendment(amendmentId),
    [amendmentId]
  )

  React.useEffect(() => {
    if (amendment?.Name) {
      addRecentRecord({ id: amendmentId, name: amendment.Name, label: 'Amendment', path: `/dashboard/amendments/${amendmentId}` })
    }
  }, [amendment?.Name, amendmentId, addRecentRecord])

  const { data: entityEvents, refetch: refetchEvents } = useSalesforceQuery(
    (client) => client.getEntityEvents(amendmentId),
    [amendmentId]
  )

  const { data: entityDocuments, refetch: refetchDocuments } = useSalesforceQuery(
    (client) => client.getEntityDocuments('Amendment', amendmentId),
    [amendmentId]
  )

  const [actionLoading, setActionLoading] = React.useState(false)
  const [actionError, setActionError] = React.useState(null)

  async function handleAdvance() {
    if (!client || !amendment) return
    const currentStatus = amendment.cux_Approval_Status__c || 'Draft'
    const nextStatus = STATUS_NEXT[currentStatus]
    if (!nextStatus) return

    setActionLoading(true)
    setActionError(null)
    try {
      if (nextStatus === 'Executed') {
        await executeAmendment()
      } else {
        await client.updateAmendment(amendmentId, { cux_Approval_Status__c: nextStatus })
      }
      refetchAmendment()
    } catch (err) {
      console.error('Advance amendment error:', err.response?.data || err)
      setActionError(err.response?.data?.[0]?.message || err.message || 'Failed to advance')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleReturn() {
    if (!client || !amendment) return
    const currentStatus = amendment.cux_Approval_Status__c || 'Draft'
    const prevStatus = STATUS_PREV[currentStatus]
    if (!prevStatus) return

    setActionLoading(true)
    setActionError(null)
    try {
      await client.updateAmendment(amendmentId, { cux_Approval_Status__c: prevStatus })
      refetchAmendment()
    } catch (err) {
      console.error('Return amendment error:', err.response?.data || err)
      setActionError(err.response?.data?.[0]?.message || err.message || 'Failed to return')
    } finally {
      setActionLoading(false)
    }
  }

  async function executeAmendment() {
    if (!client || !amendment) return
    const types = (amendment.cux_Amendment_Type__c || '').split(';').map((t) => t.trim())
    const contractId = amendment.cux_Contract__c
    if (!contractId) throw new Error('Amendment has no linked contract')

    // Apex trigger handles: amount, end date, locking, events, superseding prior amendments.
    // React handles narrative appends (Apex doesn't touch narrative).
    const narrativeUpdate = {}

    if (types.includes('Scope Modification') && amendment.cux_Amendment_Narrative__c) {
      const currentNarrative = amendment.cux_Contract__r?.cux_Narrative__c || ''
      const separator = currentNarrative ? '\n\n---\n\n' : ''
      const stamp = `[${amendment.Name} - ${dayjs().format('MMM D, YYYY')}]`
      narrativeUpdate.cux_Narrative__c = currentNarrative + separator + stamp + '\n' + amendment.cux_Amendment_Narrative__c
    }

    if (types.includes('Other') && amendment.cux_Other_Description__c) {
      const currentNarrative = narrativeUpdate.cux_Narrative__c || amendment.cux_Contract__r?.cux_Narrative__c || ''
      const separator = currentNarrative ? '\n\n---\n\n' : ''
      const stamp = `[${amendment.Name} - Other - ${dayjs().format('MMM D, YYYY')}]`
      narrativeUpdate.cux_Narrative__c = currentNarrative + separator + stamp + '\n' + amendment.cux_Other_Description__c
    }

    if (Object.keys(narrativeUpdate).length > 0) {
      await client.updateRecord('cux_Contract__c', contractId, narrativeUpdate)
    }

    // Mark amendment as Executed — Apex trigger applies amount/end date to contract
    await client.updateAmendment(amendmentId, {
      cux_Approval_Status__c: 'Executed',
    })
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return <Alert severity="error" sx={{ m: 3 }}>Failed to load amendment: {error.message}</Alert>
  }

  if (!amendment) {
    return <Alert severity="warning" sx={{ m: 3 }}>Amendment not found</Alert>
  }

  const currentStatus = amendment.cux_Approval_Status__c || 'Draft'
  const canAdvance = !!STATUS_NEXT[currentStatus]
  const canReturn = !!STATUS_PREV[currentStatus]
  const canEdit = currentStatus !== 'Executed'
  const contract = amendment.cux_Contract__r

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
              <Link color="text.primary" component={RouterLink} href={paths.dashboard.amendments.list} variant="subtitle2" underline="hover">
                Amendments
              </Link>
              {amendment.cux_Contract__c ? (
                <Link color="text.primary" component={RouterLink} href={paths.dashboard.contracts.details(amendment.cux_Contract__c)} variant="subtitle2" underline="hover">
                  {contract?.Name || 'Contract'}
                </Link>
              ) : null}
              <Typography color="text.secondary" variant="subtitle2">{amendment.Name}</Typography>
            </Breadcrumbs>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ alignItems: 'flex-start' }}>
              <Box sx={{ flex: '1 1 auto' }}>
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                  <Typography variant="h4">{amendment.Name}</Typography>
                  <Chip
                    color={statusColorMap[currentStatus] || 'default'}
                    label={currentStatus}
                    size="small"
                    variant="soft"
                  />
                </Stack>
                <Typography color="text.secondary" variant="body2">
                  {amendment.cux_Amendment_Type__c?.replace(/;/g, ', ') || 'Amendment'}
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
                    {actionLoading ? 'Processing...' : STATUS_NEXT[currentStatus] === 'Executed' ? 'Execute Amendment' : `Advance to ${STATUS_NEXT[currentStatus]}`}
                  </Button>
                )}
              </Stack>
            </Stack>
          </Stack>

          {actionError && <Alert severity="error" onClose={() => setActionError(null)}>{actionError}</Alert>}

          <AmendmentLifecycleStepper status={currentStatus} />

          <Tabs value={currentTab} onChange={(_, val) => setCurrentTab(val)}>
            <Tab label="Overview" value="overview" />
            <Tab label="Documents" value="documents" />
            <Tab label="Events" value="events" />
          </Tabs>

          {currentTab === 'overview' && <OverviewTab amendment={amendment} />}
          {currentTab === 'documents' && (
            <EntityDocumentsTab
              documents={entityDocuments}
              contractId={amendment.cux_Contract__c}
              entityType="Amendment"
              entityId={amendmentId}
              onDocumentAdded={refetchDocuments}
            />
          )}
          {currentTab === 'events' && <EntityEventsTab events={entityEvents} onRefresh={refetchEvents} />}

          <EditAmendmentDialog
            amendment={amendment}
            open={editOpen}
            onClose={() => setEditOpen(false)}
            onSuccess={refetchAmendment}
          />
        </Stack>
      </Box>
      </AnimatedPage>
    </React.Fragment>
  )
}

// ─── Overview Tab ───

function OverviewTab({ amendment }) {
  const contract = amendment.cux_Contract__r
  const types = (amendment.cux_Amendment_Type__c || '').split(';').map((t) => t.trim()).filter(Boolean)

  return (
    <Grid container spacing={4}>
      <Grid size={{ md: 8, xs: 12 }}>
        <Stack spacing={4}>
          {/* Amendment Information */}
          <Card>
            <CardHeader
              avatar={<Avatar><NotePencilIcon fontSize="var(--Icon-fontSize)" /></Avatar>}
              title="Amendment information"
            />
            <CardContent>
              <Card sx={{ borderRadius: 1 }} variant="outlined">
                <PropertyList divider={<Divider />} sx={{ '--PropertyItem-padding': '12px 24px' }}>
                  {[
                    { key: 'Amendment Number', value: amendment.Name },
                    {
                      key: 'Type',
                      value: (
                        <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                          {types.map((t) => <Chip key={t} label={t} size="small" variant="outlined" />)}
                        </Stack>
                      ),
                    },
                    {
                      key: 'Status',
                      value: (
                        <Chip
                          color={statusColorMap[amendment.cux_Approval_Status__c] || 'default'}
                          label={amendment.cux_Approval_Status__c || 'Draft'}
                          size="small"
                          variant="outlined"
                        />
                      ),
                    },
                    { key: 'Amendment Date', value: amendment.cux_Amendment_Date__c ? dayjs(amendment.cux_Amendment_Date__c).format('MMMM D, YYYY') : '—' },
                    { key: 'Effective Date', value: amendment.cux_Effective_Date__c ? dayjs(amendment.cux_Effective_Date__c).format('MMMM D, YYYY') : '—' },
                    ...(contract ? [{
                      key: 'Contract',
                      value: (
                        <Link component={RouterLink} href={paths.dashboard.contracts.details(amendment.cux_Contract__c)} variant="subtitle2">
                          {contract.Name}{contract.cux_Title__c ? ` — ${contract.cux_Title__c}` : ''}
                        </Link>
                      ),
                    }] : []),
                  ].map((item) => (
                    <PropertyItem key={item.key} name={item.key} value={item.value} />
                  ))}
                </PropertyList>
              </Card>
            </CardContent>
          </Card>

          {/* Changes — show what will be / was applied */}
          <Card>
            <CardHeader
              avatar={<Avatar><SealCheckIcon fontSize="var(--Icon-fontSize)" /></Avatar>}
              title="Changes"
            />
            <CardContent>
              <Card sx={{ borderRadius: 1 }} variant="outlined">
                <PropertyList divider={<Divider />} sx={{ '--PropertyItem-padding': '12px 24px' }}>
                  {[
                    ...(types.includes('Performance Period Modification') ? [
                      { key: 'Current End Date', value: contract?.cux_End_Date__c ? dayjs(contract.cux_End_Date__c).format('MMMM D, YYYY') : '—' },
                      { key: 'New End Date', value: amendment.cux_New_End_Date__c ? dayjs(amendment.cux_New_End_Date__c).format('MMMM D, YYYY') : '—' },
                    ] : []),
                    ...(types.includes('Authorized Amount Modification') ? [
                      { key: 'Current Authorized Amount', value: formatCurrency(contract?.cux_Total_Authorized_Amount__c) },
                      { key: 'New Authorized Amount', value: formatCurrency(amendment.cux_New_Authorized_Amount__c) },
                    ] : []),
                    ...(types.includes('Scope Modification') ? [
                      { key: 'Scope Narrative', value: amendment.cux_Amendment_Narrative__c || '—' },
                    ] : []),
                    ...(types.includes('Other') ? [
                      { key: 'Other Description', value: amendment.cux_Other_Description__c || '—' },
                    ] : []),
                  ].map((item) => (
                    <PropertyItem key={item.key} name={item.key} value={item.value} />
                  ))}
                </PropertyList>
              </Card>
            </CardContent>
          </Card>

          {/* Reason */}
          {amendment.cux_Reason__c ? (
            <Card>
              <CardHeader title="Reason / Justification" />
              <CardContent sx={{ pt: 0 }}>
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                  {amendment.cux_Reason__c}
                </Typography>
              </CardContent>
            </Card>
          ) : null}
        </Stack>
      </Grid>

      {/* Sidebar */}
      <Grid size={{ md: 4, xs: 12 }}>
        <Stack spacing={4}>
          {/* Related Contract */}
          {contract ? (
            <Card>
              <CardHeader title="Related Contract" />
              <CardContent sx={{ pt: 0 }}>
                <Stack spacing={0.5}>
                  <Link component={RouterLink} href={paths.dashboard.contracts.details(amendment.cux_Contract__c)} variant="subtitle2">
                    {contract.Name}
                  </Link>
                  {contract.cux_Title__c ? (
                    <Typography variant="body2" color="text.secondary">{contract.cux_Title__c}</Typography>
                  ) : null}
                  <Typography variant="caption" color="text.secondary">
                    {contract.cux_Status__c} · {formatCurrency(contract.cux_Total_Authorized_Amount__c)}
                  </Typography>
                  {contract.cux_End_Date__c ? (
                    <Typography variant="caption" color="text.secondary">
                      End Date: {dayjs(contract.cux_End_Date__c).format('MMM D, YYYY')}
                    </Typography>
                  ) : null}
                </Stack>
              </CardContent>
            </Card>
          ) : null}
        </Stack>
      </Grid>
    </Grid>
  )
}

// ─── Edit Amendment Dialog ───

function EditAmendmentDialog({ amendment, open, onClose, onSuccess }) {
  const client = useSalesforceClient()
  const contract = amendment?.cux_Contract__r

  const { data: contractTaskOrders } = useSalesforceQuery(
    (client) => amendment?.cux_Contract__c ? client.getContractTaskOrders(amendment.cux_Contract__c) : Promise.resolve([]),
    [amendment?.cux_Contract__c]
  )

  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState(null)

  const [values, setValues] = React.useState({
    amendmentTypes: [],
    amendmentDate: '',
    effectiveDate: '',
    newAuthorizedAmount: '',
    newEndDate: '',
    otherDescription: '',
    narrative: '',
    reason: '',
  })

  // Populate form when dialog opens
  React.useEffect(() => {
    if (open && amendment) {
      setValues({
        amendmentTypes: amendment.cux_Amendment_Type__c?.split(';').map((t) => t.trim()).filter(Boolean) || [],
        amendmentDate: amendment.cux_Amendment_Date__c || '',
        effectiveDate: amendment.cux_Effective_Date__c || '',
        newAuthorizedAmount: amendment.cux_New_Authorized_Amount__c ?? '',
        newEndDate: amendment.cux_New_End_Date__c || '',
        otherDescription: amendment.cux_Other_Description__c || '',
        narrative: amendment.cux_Amendment_Narrative__c || '',
        reason: amendment.cux_Reason__c || '',
      })
      setError(null)
    }
  }, [open, amendment])

  const hasPerformancePeriod = values.amendmentTypes.includes('Performance Period Modification')
  const hasAuthorizedAmount = values.amendmentTypes.includes('Authorized Amount Modification')
  const hasOther = values.amendmentTypes.includes('Other')

  function handleChange(field) {
    return (event) => setValues((prev) => ({ ...prev, [field]: event.target.value }))
  }

  function handleTypesChange(event) {
    const val = typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value
    setValues((prev) => ({ ...prev, amendmentTypes: val }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!client || values.amendmentTypes.length === 0 || !values.amendmentDate) return

    if (hasPerformancePeriod && values.newEndDate) {
      const maxToEndDate = (contractTaskOrders || [])
        .map((to) => to.cux_End_Date__c)
        .filter(Boolean)
        .sort()
        .pop()
      if (maxToEndDate && values.newEndDate < maxToEndDate) {
        setError(`New end date cannot be earlier than the latest task order end date (${dayjs(maxToEndDate).format('MMMM D, YYYY')}).`)
        return
      }
    }

    if (hasAuthorizedAmount && values.newAuthorizedAmount) {
      const obligated = contract?.cux_Total_Obligated_Amount__c || 0
      if (parseFloat(values.newAuthorizedAmount) < obligated) {
        setError(`New authorized amount cannot be less than the current obligated amount ($${obligated.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}).`)
        return
      }
    }

    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        cux_Amendment_Type__c: values.amendmentTypes.join(';'),
        cux_Amendment_Date__c: values.amendmentDate,
      }
      if (values.effectiveDate) payload.cux_Effective_Date__c = values.effectiveDate
      if (hasAuthorizedAmount && values.newAuthorizedAmount) {
        payload.cux_New_Authorized_Amount__c = parseFloat(values.newAuthorizedAmount)
      }
      if (hasPerformancePeriod && values.newEndDate) {
        payload.cux_New_End_Date__c = values.newEndDate
      }
      if (hasOther && values.otherDescription) {
        payload.cux_Other_Description__c = values.otherDescription
      }
      if (values.narrative) payload.cux_Amendment_Narrative__c = values.narrative
      if (values.reason) payload.cux_Reason__c = values.reason

      await client.updateAmendment(amendment.Id, payload)
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
      <DialogTitle>Edit Amendment</DialogTitle>
      <Divider />
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <FormControl fullWidth required>
            <InputLabel>Amendment Type</InputLabel>
            <Select
              multiple
              value={values.amendmentTypes}
              onChange={handleTypesChange}
              label="Amendment Type"
              renderValue={(selected) => selected.join(', ')}
            >
              {AMENDMENT_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  <Checkbox checked={values.amendmentTypes.includes(type)} />
                  <ListItemText primary={type} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth required>
            <InputLabel shrink>Amendment Date</InputLabel>
            <OutlinedInput
              type="date"
              value={values.amendmentDate}
              onChange={handleChange('amendmentDate')}
              label="Amendment Date"
              notched
            />
          </FormControl>
          <FormControl fullWidth>
            <InputLabel shrink>Effective Date</InputLabel>
            <OutlinedInput
              type="date"
              value={values.effectiveDate}
              onChange={handleChange('effectiveDate')}
              label="Effective Date"
              notched
            />
          </FormControl>
          {hasPerformancePeriod && (
            <>
              <Stack direction="row" spacing={2} alignItems="center">
                <FormControl fullWidth>
                  <InputLabel shrink>Current End Date</InputLabel>
                  <OutlinedInput
                    type="date"
                    value={contract?.cux_End_Date__c || ''}
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
                    value={values.newEndDate}
                    onChange={handleChange('newEndDate')}
                    label="New End Date"
                    notched
                  />
                </FormControl>
              </Stack>
              {(() => {
                const maxToEndDate = (contractTaskOrders || []).map((to) => to.cux_End_Date__c).filter(Boolean).sort().pop()
                return maxToEndDate ? (
                  <Typography variant="caption" color="text.secondary">
                    Minimum: {dayjs(maxToEndDate).format('MMM D, YYYY')} (latest task order end date)
                  </Typography>
                ) : null
              })()}
            </>
          )}
          {hasAuthorizedAmount && (
            <>
              <Stack direction="row" spacing={2} alignItems="center">
                <FormControl fullWidth>
                  <InputLabel shrink>Current Authorized Amount</InputLabel>
                  <OutlinedInput
                    value={formatCurrency(contract?.cux_Total_Authorized_Amount__c)}
                    label="Current Authorized Amount"
                    notched
                    readOnly
                    sx={{ bgcolor: 'action.hover' }}
                  />
                </FormControl>
                <FormControl fullWidth required>
                  <InputLabel shrink>New Authorized Amount</InputLabel>
                  <OutlinedInput
                    type="number"
                    value={values.newAuthorizedAmount}
                    onChange={handleChange('newAuthorizedAmount')}
                    label="New Authorized Amount"
                    notched
                    startAdornment={<Typography sx={{ mr: 0.5 }}>$</Typography>}
                  />
                </FormControl>
              </Stack>
              {(contract?.cux_Total_Obligated_Amount__c > 0) && (
                <Typography variant="caption" color="text.secondary">
                  Minimum: {formatCurrency(contract.cux_Total_Obligated_Amount__c)} (current obligated amount)
                </Typography>
              )}
            </>
          )}
          {hasOther && (
            <FormControl fullWidth required>
              <InputLabel shrink>Other Description</InputLabel>
              <OutlinedInput
                multiline
                minRows={2}
                maxRows={4}
                value={values.otherDescription}
                onChange={handleChange('otherDescription')}
                label="Other Description"
                notched
                placeholder="Describe the other modification..."
              />
            </FormControl>
          )}
          <FormControl fullWidth>
            <InputLabel shrink>Narrative</InputLabel>
            <OutlinedInput
              multiline
              minRows={3}
              maxRows={6}
              value={values.narrative}
              onChange={handleChange('narrative')}
              label="Narrative"
              notched
              placeholder="Describe the amendment..."
            />
          </FormControl>
          <FormControl fullWidth>
            <InputLabel shrink>Reason / Justification</InputLabel>
            <OutlinedInput
              multiline
              minRows={2}
              maxRows={4}
              value={values.reason}
              onChange={handleChange('reason')}
              label="Reason / Justification"
              notched
              placeholder="Why is this amendment needed?"
            />
          </FormControl>
        </Stack>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button color="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={submitting || values.amendmentTypes.length === 0 || !values.amendmentDate}>
          {submitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
