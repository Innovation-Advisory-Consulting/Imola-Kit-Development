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
import Drawer from '@mui/material/Drawer'
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
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import { styled } from '@mui/material/styles'
import { CaretRightIcon } from '@phosphor-icons/react/dist/ssr/CaretRight'
import { CheckCircleIcon } from '@phosphor-icons/react/dist/ssr/CheckCircle'
import { ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock'
import { PencilSimpleIcon } from '@phosphor-icons/react/dist/ssr/PencilSimple'
import { ProhibitIcon } from '@phosphor-icons/react/dist/ssr/Prohibit'
import { SealCheckIcon } from '@phosphor-icons/react/dist/ssr/SealCheck'
import { ShieldCheckIcon } from '@phosphor-icons/react/dist/ssr/ShieldCheck'
import { XIcon } from '@phosphor-icons/react/dist/ssr/X'
import { Helmet } from 'react-helmet-async'
import { useParams, useNavigate } from 'react-router-dom'

import { appConfig } from '@/config/app'
import { paths } from '@/paths'
import { dayjs } from '@/lib/dayjs'
import { RouterLink } from '@/components/core/link'
import { PropertyItem } from '@/components/core/property-item'
import { PropertyList } from '@/components/core/property-list'
import { useSalesforceClient, useSalesforceQuery } from '@/hooks/use-salesforce'
import { useRunValidation } from '@/hooks/use-validation-engine'
import { triggerStageValidation, completeReviewWork, reopenReviewWork } from '@/hooks/use-validation-engine'
import { useAuth } from '@/auth/AuthContext'
import { AnimatedPage } from '@/components/core/animations'
import { EntityEventsTab } from '@/components/dashboard/entity-timeline'
import { EntityDocumentsTab } from '@/components/dashboard/entity-documents'
import { EntityReviewPanel } from '@/components/dashboard/validations/entity-review-panel'

const metadata = { title: `Details | Terminations | Dashboard | ${appConfig.name}` }

const statusColorMap = {
  Draft: 'default',
  Approved: 'success',
  Cancelled: 'error',
}

const TERMINATION_TYPES = [
  'For Cause',
  'For Default',
  'For Convenience',
  'For Lack Of Funding',
]

// ─── Lifecycle Stepper ───

const LIFECYCLE_STEPS = ['Draft', 'Approved']

const stepIcons = {
  Draft: ClockIcon,
  Approved: SealCheckIcon,
}

function getActiveStep(status) {
  if (status === 'Cancelled') return -1
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

function TerminationLifecycleStepper({ status }) {
  const activeStep = getActiveStep(status)
  const isCancelled = status === 'Cancelled'
  const isApproved = status === 'Approved'

  return (
    <Card variant="outlined">
      <CardContent>
        {isCancelled ? (
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
            <ProhibitIcon fontSize="var(--icon-fontSize-lg)" color="var(--mui-palette-error-main)" />
            <Typography variant="subtitle1" color="error">Cancelled</Typography>
          </Stack>
        ) : (
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
        )}
      </CardContent>
    </Card>
  )
}

// ─── Page ───

export function Page() {
  const { terminationId } = useParams()
  const navigate = useNavigate()
  const client = useSalesforceClient()
  const { auth } = useAuth()
  const [currentTab, setCurrentTab] = React.useState('overview')
  const [editOpen, setEditOpen] = React.useState(false)
  const [reviewOpen, setReviewOpen] = React.useState(false)

  const { data: termination, loading, error, refetch: refetchTermination } = useSalesforceQuery(
    (client) => client.getTermination(terminationId),
    [terminationId]
  )

  const { data: entityEvents, refetch: refetchEvents } = useSalesforceQuery(
    (client) => client.getEntityEvents(terminationId),
    [terminationId]
  )

  const { data: entityDocuments, refetch: refetchDocuments } = useSalesforceQuery(
    (client) => client.getEntityDocuments('Termination', terminationId),
    [terminationId]
  )

  // Validation requests for this termination
  const { data: validationRequests, refetch: refetchValidations } = useSalesforceQuery(
    (client) => client.getValidationRequests('Termination', terminationId),
    [terminationId]
  )

  const [actionLoading, setActionLoading] = React.useState(false)
  const [actionError, setActionError] = React.useState(null)

  async function handleCancel() {
    if (!client || !termination) return
    setActionLoading(true)
    setActionError(null)
    try {
      await client.updateTermination(terminationId, { cux_Status__c: 'Cancelled' })
      refetchTermination()
      refetchEvents()
    } catch (err) {
      setActionError(err.response?.data?.[0]?.message || err.message || 'Failed to cancel')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleCreateSettlement() {
    if (!client || !termination) return
    setActionLoading(true)
    setActionError(null)
    try {
      const payload = {
        cux_Termination__c: terminationId,
        cux_Parent_Type__c: termination.cux_Parent_Type__c,
        cux_Status__c: 'Draft',
        cux_Effective_Date__c: termination.cux_Termination_Date__c,
      }
      if (termination.cux_Contract__c) payload.cux_Contract__c = termination.cux_Contract__c
      if (termination.cux_Task_Order__c) payload.cux_Task_Order__c = termination.cux_Task_Order__c

      const result = await client.createSettlement(payload)
      navigate(paths.dashboard.settlements.details(result.id))
    } catch (err) {
      setActionError(err.response?.data?.[0]?.message || err.message || 'Failed to create settlement')
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
    return <Alert severity="error" sx={{ m: 3 }}>Failed to load termination: {error.message}</Alert>
  }

  if (!termination) {
    return <Alert severity="warning" sx={{ m: 3 }}>Termination not found</Alert>
  }

  const currentStatus = termination.cux_Status__c || 'Draft'
  const isLocked = termination.cux_Is_Locked__c
  const canCancel = currentStatus === 'Draft'
  const canEdit = !isLocked
  const canCreateSettlement = currentStatus === 'Approved' && termination.cux_Requires_Settlement__c && !termination.cux_Settlement__c

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
              <Link color="text.primary" component={RouterLink} href={paths.dashboard.terminations.list} variant="subtitle2" underline="hover">
                Terminations
              </Link>
              {termination.cux_Contract__c ? (
                <Link color="text.primary" component={RouterLink} href={paths.dashboard.contracts.details(termination.cux_Contract__c)} variant="subtitle2" underline="hover">
                  {termination.cux_Contract__r?.Name || 'Contract'}
                </Link>
              ) : null}
              <Typography color="text.secondary" variant="subtitle2">{termination.Name}</Typography>
            </Breadcrumbs>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ alignItems: 'flex-start' }}>
              <Box sx={{ flex: '1 1 auto' }}>
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                  <Typography variant="h4">{termination.Name}</Typography>
                  <Chip
                    color={statusColorMap[currentStatus] || 'default'}
                    label={currentStatus}
                    size="small"
                    variant="soft"
                  />
                </Stack>
                <Typography color="text.secondary" variant="body2">
                  {termination.cux_Termination_Type__c || 'Termination'}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
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
                {canCancel && (
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={handleCancel}
                    disabled={actionLoading}
                  >
                    Cancel Termination
                  </Button>
                )}
                {currentStatus === 'Draft' && (
                  <Button
                    variant={reviewOpen ? 'contained' : 'outlined'}
                    size="small"
                    startIcon={<ShieldCheckIcon />}
                    onClick={() => setReviewOpen((prev) => !prev)}
                  >
                    Termination Review
                  </Button>
                )}
                {canCreateSettlement && (
                  <Button
                    size="small"
                    variant="contained"
                    color="secondary"
                    onClick={handleCreateSettlement}
                    disabled={actionLoading}
                  >
                    Create Settlement
                  </Button>
                )}
              </Stack>
            </Stack>
          </Stack>

          {actionError && <Alert severity="error" onClose={() => setActionError(null)}>{actionError}</Alert>}

          <TerminationLifecycleStepper status={currentStatus} />

          <Tabs value={currentTab} onChange={(_, val) => setCurrentTab(val)}>
            <Tab label="Overview" value="overview" />
            <Tab label="Documents" value="documents" />
            <Tab label="Events" value="events" />
          </Tabs>

          {currentTab === 'overview' && <OverviewTab termination={termination} />}
          {currentTab === 'documents' && (
            <EntityDocumentsTab
              documents={entityDocuments}
              contractId={termination.cux_Contract__c}
              entityType="Termination"
              entityId={terminationId}
              onDocumentAdded={refetchDocuments}
            />
          )}
          {currentTab === 'events' && <EntityEventsTab events={entityEvents} onRefresh={refetchEvents} />}

          <EditTerminationDialog
            termination={termination}
            open={editOpen}
            onClose={() => setEditOpen(false)}
            onSuccess={refetchTermination}
          />
        </Stack>
      </Box>

      {/* Review Drawer */}
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
          <Typography variant="h6">Termination Review Checklist</Typography>
          <IconButton onClick={() => setReviewOpen(false)} size="small">
            <XIcon />
          </IconButton>
        </Box>
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          <TerminationReviewTab
            terminationId={terminationId}
            termination={termination}
            terminationStatus={currentStatus}
            validationRequests={validationRequests}
            onRefresh={() => { refetchValidations(); refetchTermination(); refetchEvents() }}
            onDrawerClose={() => setReviewOpen(false)}
          />
        </Box>
      </Drawer>
      </AnimatedPage>
    </React.Fragment>
  )
}

// ─── Termination Review Tab ───

function TerminationReviewTab({ terminationId, termination, terminationStatus, validationRequests, onRefresh, onDrawerClose }) {
  const client = useSalesforceClient()
  const { auth } = useAuth()
  const { run, loading: runLoading, result: runResult, error: runError } = useRunValidation()
  const [advanceLoading, setAdvanceLoading] = React.useState(false)
  const [advanceError, setAdvanceError] = React.useState(null)
  const [attestOpen, setAttestOpen] = React.useState(false)
  const [attestText, setAttestText] = React.useState('')

  // Load results for the most recent request matching the current stage
  const latestRequest = React.useMemo(() => {
    if (!validationRequests?.length) return null
    const stageFiltered = terminationStatus
      ? validationRequests.filter((r) => r.cux_Stage__c === terminationStatus)
      : validationRequests
    if (stageFiltered.length === 0) return null
    const completed = stageFiltered.filter((r) => r.cux_Status__c === 'Completed')
    return completed.length > 0
      ? completed.reduce((a, b) =>
          new Date(b.cux_Requested_At__c) > new Date(a.cux_Requested_At__c) ? b : a
        )
      : stageFiltered[0]
  }, [validationRequests, terminationStatus])

  const { data: results, refetch: refetchResults } = useSalesforceQuery(
    (sfClient) => latestRequest ? sfClient.getValidationResults(latestRequest.Id) : Promise.resolve([]),
    [latestRequest?.Id]
  )

  async function handleRunValidation() {
    const result = await run({
      targetEntityType: 'Termination',
      targetEntityId: terminationId,
      stage: terminationStatus,
      idempotencyKey: `termination-${terminationStatus}-${terminationId}-${Date.now()}`,
    })
    if (result) {
      onRefresh()
    }
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
      console.error('Toggle checklist error:', err)
      throw err
    }
  }

  function promptAdvance() {
    setAttestText('')
    setAttestOpen(true)
  }

  async function handleApproveTermination() {
    if (!client) return
    setAttestOpen(false)
    setAdvanceLoading(true)
    setAdvanceError(null)
    try {
      // Complete the review WorkTask
      if (auth?.user?.id) {
        await completeReviewWork(client, terminationId, auth.user.id, terminationStatus).catch((err) =>
          console.warn('Failed to complete review WorkTask:', err)
        )
      }
      // Advance termination to Approved — this triggers backend to close the contract
      await client.updateTermination(terminationId, { cux_Status__c: 'Approved' })
      // Log event
      await client.createRecord('cux_ContractEvent__c', {
        cux_Contract__c: termination.cux_Contract__c,
        cux_Event_Type__c: 'Termination Approved',
        cux_Previous_Status__c: 'Draft',
        cux_New_Status__c: 'Approved',
        cux_Event_Detail__c: JSON.stringify({ trigger: 'review_checklist_passed', attestation: attestText.trim() || null }),
        cux_Event_Timestamp__c: new Date().toISOString(),
      })
      onRefresh()
      onDrawerClose?.()
    } catch (err) {
      console.error('Approve termination error:', err.response?.data || err)
      setAdvanceError(err.response?.data?.[0]?.message || err.message || 'Failed to approve termination')
    } finally {
      setAdvanceLoading(false)
    }
  }

  async function handleReturnTermination(notes) {
    // Termination only has Draft status before approval — returning reopens the review
    if (!client) return
    setAdvanceLoading(true)
    setAdvanceError(null)
    try {
      // Reopen the completed review WorkTask and notify the original reviewer
      await reopenReviewWork(client, 'Termination', terminationId, terminationStatus, auth?.user?.id, notes)
        .catch((err) => console.warn('Failed to reopen review WorkTask:', err))
      onRefresh()
      onDrawerClose?.()
    } catch (err) {
      console.error('Return termination error:', err.response?.data || err)
      setAdvanceError(err.response?.data?.[0]?.message || err.message || 'Failed to return')
    } finally {
      setAdvanceLoading(false)
    }
  }

  const canAdvance = terminationStatus === 'Draft'

  return (
    <>
      <EntityReviewPanel
        entityLabel="Termination"
        stage={terminationStatus}
        validationRequests={validationRequests}
        results={results}
        onRunValidation={handleRunValidation}
        runLoading={runLoading}
        runResult={runResult}
        runError={runError}
        onRefresh={() => { onRefresh(); refetchResults() }}
        onToggleChecklistItem={handleToggleChecklistItem}
        onAdvance={canAdvance ? promptAdvance : undefined}
        onReturn={canAdvance ? handleReturnTermination : undefined}
        advanceLoading={advanceLoading}
        advanceError={advanceError}
        onReviewComplete={() => {
          if (client && auth?.user?.id) {
            completeReviewWork(client, terminationId, auth.user.id, terminationStatus).catch((err) =>
              console.warn('Failed to complete review WorkTask:', err)
            )
          }
        }}
      />

      <Dialog open={attestOpen} onClose={() => setAttestOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Approve Termination</DialogTitle>
        <Divider />
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Alert severity="warning" variant="outlined">
              You are approving this termination. This will <strong>close the parent contract</strong> and terminate all active task orders.
            </Alert>
            <Typography variant="body2" color="text.secondary">
              I attest that I have reviewed all checklist items and confirm the termination is ready for approval.
            </Typography>
            <OutlinedInput
              multiline
              minRows={3}
              placeholder="Additional notes (optional)..."
              value={attestText}
              onChange={(e) => setAttestText(e.target.value)}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAttestOpen(false)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleApproveTermination} disabled={advanceLoading}>
            {advanceLoading ? 'Approving...' : 'Confirm & Approve'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

// ─── Overview Tab ───

function OverviewTab({ termination }) {
  return (
    <Grid container spacing={4}>
      <Grid size={{ md: 8, xs: 12 }}>
        <Stack spacing={4}>
          <Card>
            <CardHeader
              avatar={<Avatar><ProhibitIcon fontSize="var(--Icon-fontSize)" /></Avatar>}
              title="Termination information"
            />
            <CardContent>
              <Card sx={{ borderRadius: 1 }} variant="outlined">
                <PropertyList divider={<Divider />} sx={{ '--PropertyItem-padding': '12px 24px' }}>
                  {[
                    { key: 'Termination Number', value: termination.Name },
                    { key: 'Parent Type', value: termination.cux_Parent_Type__c || '—' },
                    { key: 'Type', value: termination.cux_Termination_Type__c || '—' },
                    {
                      key: 'Status',
                      value: (
                        <Chip
                          color={statusColorMap[termination.cux_Status__c] || 'default'}
                          label={termination.cux_Status__c || 'Draft'}
                          size="small"
                          variant="outlined"
                        />
                      ),
                    },
                    { key: 'Termination Date', value: termination.cux_Termination_Date__c ? dayjs(termination.cux_Termination_Date__c).format('MMMM D, YYYY') : '—' },
                    { key: 'Reason Code', value: termination.cux_Reason_Code__c || '—' },
                    { key: 'Requires Settlement', value: termination.cux_Requires_Settlement__c ? 'Yes' : 'No' },
                    ...(termination.cux_Settlement__c ? [{
                      key: 'Settlement',
                      value: (
                        <Link component={RouterLink} href={paths.dashboard.settlements.details(termination.cux_Settlement__c)} variant="subtitle2">
                          {termination.cux_Settlement__r?.Name || 'View Settlement'}
                        </Link>
                      ),
                    }] : []),
                    { key: 'Created', value: termination.CreatedDate ? dayjs(termination.CreatedDate).format('MMMM D, YYYY h:mm A') : '—' },
                    { key: 'Last Modified', value: termination.LastModifiedDate ? dayjs(termination.LastModifiedDate).format('MMMM D, YYYY h:mm A') : '—' },
                  ].map((item) => (
                    <PropertyItem key={item.key} name={item.key} value={item.value} />
                  ))}
                </PropertyList>
              </Card>
            </CardContent>
          </Card>

          {termination.cux_Narrative__c ? (
            <Card>
              <CardHeader title="Narrative" />
              <CardContent sx={{ pt: 0 }}>
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                  {termination.cux_Narrative__c}
                </Typography>
              </CardContent>
            </Card>
          ) : null}
        </Stack>
      </Grid>

      <Grid size={{ md: 4, xs: 12 }}>
        <Stack spacing={4}>
          {termination.cux_Contract__r ? (
            <Card>
              <CardHeader title="Related Contract" />
              <CardContent sx={{ pt: 0 }}>
                <Stack spacing={0.5}>
                  <Link component={RouterLink} href={paths.dashboard.contracts.details(termination.cux_Contract__c)} variant="subtitle2">
                    {termination.cux_Contract__r.Name}
                  </Link>
                </Stack>
              </CardContent>
            </Card>
          ) : null}
          {termination.cux_Task_Order__r ? (
            <Card>
              <CardHeader title="Related Task Order" />
              <CardContent sx={{ pt: 0 }}>
                <Stack spacing={0.5}>
                  <Link component={RouterLink} href={paths.dashboard.taskOrders.details(termination.cux_Task_Order__c)} variant="subtitle2">
                    {termination.cux_Task_Order__r.Name}
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

// ─── Edit Termination Dialog ───

function EditTerminationDialog({ termination, open, onClose, onSuccess }) {
  const client = useSalesforceClient()
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState(null)

  const [values, setValues] = React.useState({
    terminationType: '',
    terminationDate: '',
    reasonCode: '',
    narrative: '',
    requiresSettlement: false,
  })

  React.useEffect(() => {
    if (open && termination) {
      setValues({
        terminationType: termination.cux_Termination_Type__c || '',
        terminationDate: termination.cux_Termination_Date__c || '',
        reasonCode: termination.cux_Reason_Code__c || '',
        narrative: termination.cux_Narrative__c || '',
        requiresSettlement: !!termination.cux_Requires_Settlement__c,
      })
      setError(null)
    }
  }, [open, termination])

  function handleChange(field) {
    return (event) => setValues((prev) => ({ ...prev, [field]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!client) return

    setSubmitting(true)
    setError(null)
    try {
      const payload = {}
      if (values.terminationType) payload.cux_Termination_Type__c = values.terminationType
      if (values.terminationDate) payload.cux_Termination_Date__c = values.terminationDate
      payload.cux_Reason_Code__c = values.reasonCode || null
      payload.cux_Narrative__c = values.narrative || null
      payload.cux_Requires_Settlement__c = values.requiresSettlement

      await client.updateTermination(termination.Id, payload)
      onClose()
      if (onSuccess) onSuccess()
    } catch (err) {
      setError(err.response?.data?.[0]?.message || err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const isDerived = termination?.cux_Termination_Type__c === 'Derived From Contract Termination'

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ component: 'form', onSubmit: handleSubmit }}
    >
      <DialogTitle>Edit Termination</DialogTitle>
      <Divider />
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <FormControl fullWidth required>
            <InputLabel>Termination Type</InputLabel>
            <Select
              value={values.terminationType}
              onChange={handleChange('terminationType')}
              label="Termination Type"
              disabled={isDerived}
            >
              {TERMINATION_TYPES.map((t) => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
              {isDerived && (
                <MenuItem value="Derived From Contract Termination">Derived From Contract Termination</MenuItem>
              )}
            </Select>
          </FormControl>
          <FormControl fullWidth required>
            <InputLabel shrink>Termination Date</InputLabel>
            <OutlinedInput
              type="date"
              value={values.terminationDate}
              onChange={handleChange('terminationDate')}
              label="Termination Date"
              notched
            />
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Reason Code</InputLabel>
            <OutlinedInput
              value={values.reasonCode}
              onChange={handleChange('reasonCode')}
              label="Reason Code"
            />
          </FormControl>
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
              placeholder="Describe the termination reason and context..."
            />
          </FormControl>
          <FormControlLabel
            control={
              <Checkbox
                checked={values.requiresSettlement}
                onChange={(e) => setValues((prev) => ({ ...prev, requiresSettlement: e.target.checked }))}
              />
            }
            label="Requires Settlement"
          />
        </Stack>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button color="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={submitting || !values.terminationType || !values.terminationDate}>
          {submitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
