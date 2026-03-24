import * as React from 'react'
import Timeline from '@mui/lab/Timeline'
import TimelineConnector from '@mui/lab/TimelineConnector'
import TimelineContent from '@mui/lab/TimelineContent'
import TimelineDot from '@mui/lab/TimelineDot'
import TimelineItem from '@mui/lab/TimelineItem'
import TimelineSeparator from '@mui/lab/TimelineSeparator'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
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
import Step from '@mui/material/Step'
import StepConnector from '@mui/material/StepConnector'
import StepLabel from '@mui/material/StepLabel'
import Stepper from '@mui/material/Stepper'
import { styled } from '@mui/material/styles'
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormHelperText from '@mui/material/FormHelperText'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import OutlinedInput from '@mui/material/OutlinedInput'
import Select from '@mui/material/Select'
import Switch from '@mui/material/Switch'
import Checkbox from '@mui/material/Checkbox'
import ListItemText from '@mui/material/ListItemText'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import { CheckIcon } from '@phosphor-icons/react/dist/ssr/Check'
import { ChatIcon } from '@phosphor-icons/react/dist/ssr/Chat'
import { DotsThreeIcon } from '@phosphor-icons/react/dist/ssr/DotsThree'
import { LinkIcon } from '@phosphor-icons/react/dist/ssr/Link'
import { XIcon } from '@phosphor-icons/react/dist/ssr/X'
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr/ArrowLeft'
import { PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus'
import { ArrowsClockwiseIcon } from '@phosphor-icons/react/dist/ssr/ArrowsClockwise'
import { CheckCircleIcon } from '@phosphor-icons/react/dist/ssr/CheckCircle'
import { FileTextIcon } from '@phosphor-icons/react/dist/ssr/FileText'
import { NoteIcon } from '@phosphor-icons/react/dist/ssr/Note'
import { EyeIcon } from '@phosphor-icons/react/dist/ssr/Eye'
import { FlagCheckeredIcon } from '@phosphor-icons/react/dist/ssr/FlagCheckered'
import { GavelIcon } from '@phosphor-icons/react/dist/ssr/Gavel'
import { HandshakeIcon } from '@phosphor-icons/react/dist/ssr/Handshake'
import { LockIcon } from '@phosphor-icons/react/dist/ssr/Lock'
import { PaperPlaneTiltIcon } from '@phosphor-icons/react/dist/ssr/PaperPlaneTilt'
import { SealCheckIcon } from '@phosphor-icons/react/dist/ssr/SealCheck'
import { ShieldCheckIcon } from '@phosphor-icons/react/dist/ssr/ShieldCheck'
import { UserCirclePlusIcon } from '@phosphor-icons/react/dist/ssr/UserCirclePlus'
import { WarningIcon } from '@phosphor-icons/react/dist/ssr/Warning'
import { XCircleIcon } from '@phosphor-icons/react/dist/ssr/XCircle'
import { ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock'
import { Helmet } from 'react-helmet-async'
import { useParams } from 'react-router-dom'

import { useRecentRecords } from '@/contexts/recent-records-context'
import { appConfig } from '@/config/app'
import { paths } from '@/paths'
import { dayjs } from '@/lib/dayjs'
import { RouterLink } from '@/components/core/link'
import { FileDropzone } from '@/components/core/file-dropzone'
import { FileIcon } from '@/components/core/file-icon'
import { useAuth } from '@/auth/AuthContext'
import { useSalesforceClient, useSalesforceQuery } from '@/hooks/use-salesforce'
import { AnimatedPage } from '@/components/core/animations'
import { AiTextAssist } from '@/components/core/ai-text-assist'
import { useRunValidation, completeReviewWork, triggerStageValidation, reopenReviewWork } from '@/hooks/use-validation-engine'
import Snackbar from '@mui/material/Snackbar'
import { EntityReviewPanel } from '@/components/dashboard/validations/entity-review-panel'
import { useDocumentSummarization } from '@/hooks/use-document-summarization'
import { ContractPDFDocument } from '@/components/dashboard/contract/contract-pdf-document'
import { pdf } from '@react-pdf/renderer'
import { GanttChart } from '@imola/gantt-chart'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

const metadata = { title: `Details | Contracts | Dashboard | ${appConfig.name}` }

const statusColorMap = {
  Draft: 'default',
  'Under Review': 'warning',
  'Approved For Procurement': 'info',
  'Submitted To Procurement': 'info',
  Awarded: 'info',
  Executed: 'success',
  Closed: 'default',
  Terminated: 'error',
}

// Linear lifecycle stages (Terminated is a branch, shown separately)
const CONTRACT_STEPS = [
  'Draft',
  'Under Review',
  'Approved For Procurement',
  'Submitted To Procurement',
  'Awarded',
  'Executed',
  'Closed',
]

const contractStepIcons = {
  Draft: ClockIcon,
  'Under Review': EyeIcon,
  'Approved For Procurement': SealCheckIcon,
  'Submitted To Procurement': PaperPlaneTiltIcon,
  Awarded: HandshakeIcon,
  Executed: GavelIcon,
  Closed: FlagCheckeredIcon,
  Terminated: XCircleIcon,
}

const ContractLifecycleConnector = styled(StepConnector)(() => ({
  '& .MuiStepConnector-line': {
    borderTopWidth: 3,
    borderRadius: 1,
    borderColor: 'var(--mui-palette-divider)',
  },
  '&.Mui-active .MuiStepConnector-line, &.Mui-completed .MuiStepConnector-line': {
    borderColor: 'var(--mui-palette-primary-main)',
  },
}))

function ContractStepIcon({ icon: Icon, active, completed, error }) {
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

function ContractLifecycleStepper({ status }) {
  const isTerminated = status === 'Terminated'

  if (isTerminated) {
    const Icon = contractStepIcons.Terminated
    return (
      <Card variant="outlined">
        <CardContent>
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'center', py: 1 }}>
            <Box sx={{ width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'var(--mui-palette-error-50, rgba(211, 47, 47, 0.08))', color: 'var(--mui-palette-error-main)' }}>
              <Icon weight="fill" fontSize="var(--icon-fontSize-lg)" />
            </Box>
            <Typography variant="subtitle1" color="error.main">Contract Terminated</Typography>
          </Stack>
        </CardContent>
      </Card>
    )
  }

  const activeIndex = CONTRACT_STEPS.indexOf(status)

  return (
    <Card variant="outlined">
      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Stepper
          activeStep={activeIndex}
          alternativeLabel
          connector={<ContractLifecycleConnector />}
        >
          {CONTRACT_STEPS.map((step, index) => {
            const Icon = contractStepIcons[step]
            const completed = index < activeIndex || (step === 'Closed' && activeIndex === CONTRACT_STEPS.length - 1)
            const active = index === activeIndex && step !== 'Closed'
            return (
              <Step key={step} completed={completed}>
                <StepLabel
                  StepIconComponent={() => (
                    <ContractStepIcon icon={Icon} active={active} completed={completed} />
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

function formatCurrency(value) {
  if (value == null) return '$0.00'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

export function Page() {
  const { contractId } = useParams()
  const { auth } = useAuth()
  const [currentTab, setCurrentTab] = React.useState('overview')
  const [reviewOpen, setReviewOpen] = React.useState(false)

  const { addRecentRecord } = useRecentRecords()

  const { data: contract, loading, error, refetch: refetchContract } = useSalesforceQuery(
    (client) => client.getContract(contractId),
    [contractId]
  )

  React.useEffect(() => {
    if (contract?.Name) {
      addRecentRecord({ id: contractId, name: contract.Name, label: 'Contract', path: `/dashboard/contracts/${contractId}` })
    }
  }, [contract?.Name, contractId, addRecentRecord])

  const { data: amendments, refetch: refetchAmendments } = useSalesforceQuery(
    (client) => client.getAmendments(contractId),
    [contractId]
  )

  const { data: documents, refetch: refetchDocuments } = useSalesforceQuery(
    (client) => client.getDocuments(contractId),
    [contractId]
  )

  const { data: events } = useSalesforceQuery(
    (client) => client.getContractEvents(contractId),
    [contractId]
  )

  const { data: funding, refetch: refetchFunding } = useSalesforceQuery(
    (client) => client.getContractFunding(contractId),
    [contractId]
  )

  const { data: comments, refetch: refetchComments } = useSalesforceQuery(
    (client) => client.getContractComments(contractId),
    [contractId]
  )

  const { data: taskOrders, refetch: refetchTaskOrders } = useSalesforceQuery(
    (client) => client.getContractTaskOrders(contractId),
    [contractId]
  )

  const { data: contractTerminations, refetch: refetchTerminations } = useSalesforceQuery(
    (client) => client.getContractTerminations(contractId),
    [contractId]
  )

  const { data: validationRequests, refetch: refetchValidations } = useSalesforceQuery(
    (client) => client.getValidationRequests('Contract', contractId),
    [contractId]
  )

  const { data: contractInvoices } = useSalesforceQuery(
    (client) => client.getContractInvoices(contractId),
    [contractId]
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
        Failed to load contract: {error.message}
      </Alert>
    )
  }

  if (!contract) {
    return (
      <Alert severity="warning" sx={{ m: 3 }}>
        Contract not found
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
        <Stack spacing={2}>
          <Stack spacing={1}>
            <div>
              <Link
                color="text.primary"
                component={RouterLink}
                href={paths.dashboard.contracts.list}
                sx={{ alignItems: 'center', display: 'inline-flex', gap: 1 }}
                variant="subtitle2"
              >
                <ArrowLeftIcon fontSize="var(--icon-fontSize-md)" />
                Contracts
              </Link>
            </div>
            <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} sx={{ alignItems: { lg: 'center' } }}>
              <Stack sx={{ flex: '1 1 auto' }} spacing={0.5}>
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                  <Typography variant="h4">{contract.Name}</Typography>
                  <Chip
                    color={statusColorMap[contract.cux_Status__c] || 'default'}
                    label={contract.cux_Status__c}
                    size="small"
                    variant="soft"
                  />
                </Stack>
                <Typography color="text.secondary" variant="body1">
                  {contract.cux_Title__c || 'Untitled'}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={2} sx={{ flexShrink: 0 }}>
                {[
                  { label: 'Authorized', value: contract.cux_Total_Authorized_Amount__c, color: 'primary' },
                  { label: 'Obligated', value: contract.cux_Total_Obligated_Amount__c, color: 'success' },
                  { label: 'Expended', value: contract.cux_Total_Expended_Amount__c, color: 'info' },
                ].map((item) => (
                  <Stack key={item.label} spacing={0} sx={{ textAlign: 'right', minWidth: 100 }}>
                    <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                    <Typography variant="h6" color={`${item.color}.main`}>{formatCurrency(item.value)}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Stack>
          </Stack>

          <ContractLifecycleStepper status={contract.cux_Status__c} />

          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Tabs value={currentTab} onChange={(_, val) => setCurrentTab(val)}>
              <Tab label="Overview" value="overview" />
              <Tab label={`Funding (${funding?.length || 0})`} value="funding" />
              <Tab label={`Task Orders (${taskOrders?.length || 0})`} value="taskOrders" />
              <Tab label={`Amendments (${amendments?.length || 0})`} value="amendments" />
              <Tab label="Termination" value="termination" />
              <Tab label={`Documents (${documents?.length || 0})`} value="documents" />
              <Tab label={`Events (${events?.length || 0})`} value="events" />
              <Tab label={`Notes (${comments?.length || 0})`} value="notes" />
              <Tab label="Contract Map" value="contractMap" />
            </Tabs>
            <Stack direction="row" spacing={1}>
              <GeneratePdfButton contract={contract} funding={funding} contractId={contractId} onGenerated={refetchDocuments} />
              <Button
                variant={reviewOpen ? 'contained' : 'outlined'}
                size="small"
                startIcon={<ShieldCheckIcon />}
                onClick={() => setReviewOpen((prev) => !prev)}
              >
                Contract Review
              </Button>
            </Stack>
          </Stack>

          {currentTab === 'overview' && <OverviewTab contract={contract} auth={auth} comments={comments} contractId={contractId} onCommentAdded={refetchComments} onContractUpdated={refetchContract} />}
          {currentTab === 'taskOrders' && <TaskOrdersTab taskOrders={taskOrders} contractId={contractId} contract={contract} onTaskOrderCreated={refetchTaskOrders} />}
          {currentTab === 'amendments' && <AmendmentsTab amendments={amendments} contractId={contractId} contract={contract} taskOrders={taskOrders} onAmendmentCreated={refetchAmendments} />}
          {currentTab === 'termination' && <TerminationTab contractId={contractId} contract={contract} terminations={contractTerminations} onRefresh={refetchTerminations} />}
          {currentTab === 'documents' && <DocumentsTab documents={documents} contractId={contractId} onDocumentAdded={refetchDocuments} />}
          {currentTab === 'events' && <EventsTab events={events} />}
          {currentTab === 'funding' && <FundingTab funding={funding} contractId={contractId} contractStart={contract.cux_Start_Date__c} contractEnd={contract.cux_End_Date__c} contractAuthorized={contract.cux_Total_Authorized_Amount__c} onFundingAdded={refetchFunding} />}
          {currentTab === 'notes' && <NotesTab comments={comments} contractId={contractId} auth={auth} onCommentAdded={refetchComments} />}
          {currentTab === 'contractMap' && <ContractMapTab contract={contract} funding={funding} amendments={amendments} taskOrders={taskOrders} invoices={contractInvoices} />}

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
              <Typography variant="h6">{contract.cux_Status__c ? `${contract.cux_Status__c} Checklist` : 'Contract Review'}</Typography>
              <IconButton onClick={() => setReviewOpen(false)} size="small">
                <XIcon />
              </IconButton>
            </Box>
            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
              <ContractReviewTab
                contractId={contractId}
                contract={contract}
                contractStatus={contract.cux_Status__c}
                validationRequests={validationRequests}
                taskOrders={taskOrders}
                documents={documents}
                onRefresh={refetchValidations}
                onContractUpdated={refetchContract}
                onCommentAdded={refetchComments}
                onDrawerClose={() => setReviewOpen(false)}
              />
            </Box>
          </Drawer>

        </Stack>
      </Box>
      </AnimatedPage>
    </React.Fragment>
  )
}

/* ─── Shared helpers ─── */
const fmtDate = (v) => v ? dayjs(v).format('MMM D, YYYY') : null
const fmtPct = (v) => v != null ? `${v}%` : null
const fmtCurrency = (v) => v != null ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v) : null
const val = (v) => (v != null && v !== '') ? v : '—'
const valColor = (v) => (v != null && v !== '') ? 'text.primary' : 'text.disabled'

// Statuses before "Submitted To Procurement" are editable
const EDITABLE_STATUSES = new Set(['Draft', 'Under Review', 'Approved For Procurement'])

// Picklist options for editable fields
const FIELD_OPTIONS = {
  cux_Contract_Type__c: ['Professional Services', 'Construction', 'Goods', 'Interagency', 'Other'],
  cux_Contract_Classification__c: ['New', 'Replacement'],
  cux_Project_Classification__c: ['NPS', 'PS', 'Not Applicable'],
  cux_Procurement_Method__c: ['Competitive Bid', 'Request for Proposal', 'Sole Source', 'Emergency', 'Interagency Agreement', 'Other'],
  cux_Risk_Level__c: ['Low', 'Moderate', 'High', 'Critical'],
  cux_Program__c: ['2010', '2080'],
  cux_Division__c: ['Admin', 'Executive', 'PPM&OE', 'Geotech', 'METS', 'Structure Construction', 'Bridge Design'],
  cux_EA_Phase__c: ['0', '1', '3', 'N'],
  cux_Functional_Area__c: ['DESD', 'DESC'],
  cux_Work_Bucket__c: ['TS', 'PH2', 'PTNR', 'RMI', 'SHOPP', 'STIP', 'TCRF', 'BOND CMIA', 'BOND STIP', 'BOND RTE 99', 'BOND SHOPP', 'Not Applicable'],
}


function PersonCard({ label, name, email, phone, avatar, instanceUrl }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      {name ? (
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mt: 0.5 }}>
          <Avatar src={avatar ? (avatar.startsWith('http') ? avatar : `${instanceUrl}${avatar}`) : undefined} sx={{ width: 36, height: 36 }}>
            {name?.[0]}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2" noWrap>{name}</Typography>
            {email ? <Typography variant="body2" color="text.secondary" noWrap><Link href={`mailto:${email}`} underline="hover">{email}</Link></Typography> : null}
            {phone ? <Typography variant="body2" color="text.secondary">{phone}</Typography> : null}
          </Box>
        </Stack>
      ) : (
        <Typography variant="subtitle2" color="text.disabled">—</Typography>
      )}
    </Box>
  )
}

function RecentNotes({ comments, auth, contractId, onCommentAdded }) {
  const client = useSalesforceClient()
  const [text, setText] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const recent = (comments || []).slice(0, 5)

  async function handleAdd() {
    if (!client || !text.trim()) return
    setSubmitting(true)
    try {
      await client.createContractComment({
        cux_Contract__c: contractId,
        cux_Comment_Text__c: text.trim(),
        cux_Commented_By__c: auth?.user?.id,
        cux_Comment_Timestamp__c: new Date().toISOString(),
        cux_Visibility__c: 'Internal',
      })
      setText('')
      onCommentAdded?.()
    } catch (err) {
      console.error('Failed to add comment:', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader
        avatar={<Avatar><ChatIcon fontSize="var(--Icon-fontSize)" /></Avatar>}
        title="Recent Notes"
      />
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
            <Avatar
              src={auth?.user?.avatar || undefined}
              sx={{ width: 32, height: 32, mt: 0.5 }}
            >
              {(auth?.user?.name || '?')[0]}
            </Avatar>
            <OutlinedInput
              multiline
              minRows={1}
              maxRows={4}
              placeholder="Write a note..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              size="small"
              sx={{ flex: 1 }}
              endAdornment={
                text.trim() ? (
                  <Button
                    size="small"
                    variant="contained"
                    disabled={submitting}
                    onClick={handleAdd}
                    sx={{ ml: 1, minWidth: 'auto', whiteSpace: 'nowrap' }}
                  >
                    {submitting ? '...' : 'Add'}
                  </Button>
                ) : null
              }
            />
          </Stack>
          {recent.length > 0 && (
            <>
              <Divider />
              <Stack spacing={2} divider={<Divider />}>
                {recent.map((c) => (
                  <Stack key={c.Id} direction="row" spacing={1.5}>
                    <Avatar
                      src={c.cux_Commented_By__r?.SmallPhotoUrl
                        ? (c.cux_Commented_By__r.SmallPhotoUrl.startsWith('http') ? c.cux_Commented_By__r.SmallPhotoUrl : `${auth?.instanceUrl}${c.cux_Commented_By__r.SmallPhotoUrl}`)
                        : undefined}
                      sx={{ width: 32, height: 32, mt: 0.25 }}
                    >
                      {(c.cux_Commented_By__r?.Name || '?')[0]}
                    </Avatar>
                    <Stack sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                        <Typography variant="subtitle2" noWrap>{c.cux_Commented_By__r?.Name || 'Unknown'}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {c.cux_Comment_Timestamp__c ? dayjs(c.cux_Comment_Timestamp__c).format('MMM D, YYYY') : ''}
                        </Typography>
                      </Stack>
                      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                        {(c.cux_Comment_Text__c || '').length > 200
                          ? c.cux_Comment_Text__c.slice(0, 200) + '...'
                          : c.cux_Comment_Text__c}
                      </Typography>
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}


function NarrativeCard({ narrative, editable, onSave }) {
  const [editing, setEditing] = React.useState(false)
  const [text, setText] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  function startEdit() {
    if (!editable) return
    setText(narrative || '')
    setEditing(true)
  }

  async function save() {
    setSaving(true)
    try {
      await onSave('cux_Narrative__c', text)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader title="Narrative" action={editable && !editing ? (
        <Button size="small" onClick={startEdit}>Edit</Button>
      ) : null} />
      <CardContent>
        {editing ? (
          <Stack spacing={1}>
            <OutlinedInput
              multiline
              minRows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              fullWidth
              autoFocus
            />
            <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
              <Button size="small" onClick={() => setEditing(false)}>Cancel</Button>
              <Button size="small" variant="contained" onClick={save} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </Stack>
          </Stack>
        ) : (
          <Typography
            variant="body2"
            color={narrative ? 'text.secondary' : 'text.disabled'}
            sx={{ whiteSpace: 'pre-wrap', ...(editable && { cursor: 'pointer' }) }}
            onClick={startEdit}
          >
            {narrative || '—'}
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   OVERVIEW — Two-column sidebar layout with batch edit/save
   Left 4-col sidebar with key info + people. Right 8-col with detail tables.
   Edit mode: all editable fields become inputs, single Save saves everything.
   ═══════════════════════════════════════════════════════════════════════════ */

// Renders a table cell that is either read-only or editable depending on mode
function EditableCell({ field, value, type = 'text', editing, changes, onFieldChange }) {
  if (!editing) {
    // Read-only display
    let display
    if (type === 'boolean') display = value ? 'Yes' : 'No'
    else if (type === 'date') display = fmtDate(value)
    else if (type === 'currency') display = fmtCurrency(value)
    else if (type === 'percent') display = fmtPct(value)
    else display = val(value)
    return <Typography variant="body2" sx={{ color: valColor(value), fontWeight: 500 }}>{display}</Typography>
  }

  const current = field in changes ? changes[field] : (value ?? '')
  const options = FIELD_OPTIONS[field]

  if (type === 'boolean') {
    return (
      <Switch
        checked={field in changes ? !!changes[field] : !!value}
        onChange={(e) => onFieldChange(field, e.target.checked)}
        size="small"
      />
    )
  }

  if (type === 'select' || options) {
    return (
      <Select
        size="small"
        value={current}
        onChange={(e) => onFieldChange(field, e.target.value)}
        fullWidth
        sx={{ minWidth: 140 }}
      >
        <MenuItem value=""><em>None</em></MenuItem>
        {(options || []).map((opt) => (
          <MenuItem key={opt} value={opt}>{opt}</MenuItem>
        ))}
      </Select>
    )
  }

  return (
    <OutlinedInput
      size="small"
      type={type === 'date' ? 'date' : type === 'currency' || type === 'percent' ? 'number' : 'text'}
      value={current}
      onChange={(e) => onFieldChange(field, e.target.value)}
      fullWidth
      sx={{ minWidth: 140 }}
    />
  )
}

function OverviewLayout2({ contract, auth, comments, contractId, onCommentAdded, editable, onBatchSave }) {
  const [editing, setEditing] = React.useState(false)
  const [changes, setChanges] = React.useState({})
  const [saving, setSaving] = React.useState(false)

  function startEdit() {
    setChanges({})
    setEditing(true)
  }

  function cancelEdit() {
    setChanges({})
    setEditing(false)
  }

  async function handleSave() {
    if (Object.keys(changes).length === 0) { setEditing(false); return }
    setSaving(true)
    try {
      // Normalize values before saving
      const payload = {}
      for (const [field, val] of Object.entries(changes)) {
        if (val === '') payload[field] = null
        else if (['cux_Total_Authorized_Amount__c', 'cux_DBE_Goal_Percent__c', 'cux_DVBE_Goal_Percent__c'].includes(field)) {
          payload[field] = val !== null ? parseFloat(val) : null
        } else {
          payload[field] = val
        }
      }
      await onBatchSave(payload)
      setEditing(false)
      setChanges({})
    } finally {
      setSaving(false)
    }
  }

  function onFieldChange(field, value) {
    setChanges((prev) => ({ ...prev, [field]: value }))
  }

  // Helper to render a table row — editable or read-only
  function row(label, field, value, opts = {}) {
    const { type = 'text', readOnly = false } = opts
    return (
      <TableRow key={label} sx={{ '&:last-child td': { border: 0 } }}>
        <TableCell sx={{ width: 200, color: 'text.secondary' }}>{label}</TableCell>
        <TableCell>
          {!readOnly && editing ? (
            <EditableCell field={field} value={value} type={type} editing={true} changes={changes} onFieldChange={onFieldChange} />
          ) : (
            <EditableCell field={field} value={value} type={type} editing={false} changes={{}} onFieldChange={() => {}} />
          )}
        </TableCell>
      </TableRow>
    )
  }

  const changeCount = Object.keys(changes).length

  return (
    <Grid container spacing={3}>
      {/* Edit / Save toolbar */}
      {editable && (
        <Grid size={{ xs: 12 }}>
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', alignItems: 'center' }}>
            {editing ? (
              <>
                {changeCount > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    {changeCount} field{changeCount !== 1 ? 's' : ''} modified
                  </Typography>
                )}
                <Button size="small" onClick={cancelEdit} disabled={saving}>Cancel</Button>
                <Button size="small" variant="contained" onClick={handleSave} disabled={saving || changeCount === 0}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            ) : (
              <Button size="small" variant="outlined" onClick={startEdit}>Edit</Button>
            )}
          </Stack>
        </Grid>
      )}

      {/* ── Left sidebar ── */}
      <Grid size={{ xs: 12, lg: 4 }}>
        <Stack spacing={3}>
          {/* Key Info */}
          <Card>
            <CardHeader title="Key Information" />
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableBody>
                  <TableRow sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell sx={{ width: 130, color: 'text.secondary' }}>Agreement #</TableCell>
                    <TableCell><Chip label={contract.Name} size="small" variant="soft" /></TableCell>
                  </TableRow>
                  {row('Type', 'cux_Contract_Type__c', contract.cux_Contract_Type__c, { type: 'select' })}
                  {row('Classification', 'cux_Contract_Classification__c', contract.cux_Contract_Classification__c, { type: 'select' })}
                  {row('Risk Level', 'cux_Risk_Level__c', contract.cux_Risk_Level__c, { type: 'select' })}
                  {row('Status Code', 'cux_Contract_Status_Code__c', contract.cux_Contract_Status_Code__c, { readOnly: true })}
                  {row('Start Date', 'cux_Start_Date__c', contract.cux_Start_Date__c, { type: 'date' })}
                  {row('End Date', 'cux_End_Date__c', contract.cux_End_Date__c, { type: 'date' })}
                  {row('Authorized', 'cux_Total_Authorized_Amount__c', contract.cux_Total_Authorized_Amount__c, { type: 'currency' })}
                </TableBody>
              </Table>
            </Box>
          </Card>

          {/* People */}
          <Card>
            <CardHeader title="People" />
            <CardContent>
              <Stack spacing={2.5}>
                <PersonCard
                  label="Contract Manager"
                  name={contract.cux_Contract_Manager__r?.Name}
                  email={contract.cux_Contract_Manager__r?.Email}
                  avatar={contract.cux_Contract_Manager__r?.SmallPhotoUrl}
                  instanceUrl={auth?.instanceUrl}
                />
                <Divider />
                <PersonCard
                  label="Vendor Contact"
                  name={contract.cux_Vendor_Contact__r?.Name}
                  email={contract.cux_Vendor_Contact__r?.Email}
                  phone={contract.cux_Vendor_Contact__r?.Phone}
                  avatar={contract.cux_Vendor_Contact__r?.PhotoUrl}
                  instanceUrl={auth?.instanceUrl}
                />
              </Stack>
            </CardContent>
          </Card>

          {/* Narrative */}
          <NarrativeCard narrative={contract.cux_Narrative__c} editable={editable} onSave={(field, value) => {
            if (editing) { onFieldChange(field, value) }
            else { onBatchSave({ [field]: value }) }
          }} />
        </Stack>
      </Grid>

      {/* ── Right content ── */}
      <Grid size={{ xs: 12, lg: 8 }}>
        <Stack spacing={3}>
          {/* Parties & Identifiers */}
          <Card>
            <CardHeader title="Parties & Identifiers" />
            <Box sx={{ overflowX: 'auto' }}>
              <Table sx={{ minWidth: 500 }}>
                <TableBody>
                  {row('Contracting Agency', 'cux_Contracting_Agency__c', contract.cux_Contracting_Agency__c)}
                  {row('Contractor (Vendor)', null, contract.cux_Account__r?.Name, { readOnly: true })}
                  {row('Purchasing Authority #', 'cux_Purchasing_Authority_Number__c', contract.cux_Purchasing_Authority_Number__c)}
                  {row('CMSS ID', 'cux_CMSS_Id__c', contract.cux_CMSS_Id__c)}
                  {row('Trans Doc Number', 'cux_Trans_Doc_Number__c', contract.cux_Trans_Doc_Number__c)}
                  {row('Procurement Method', 'cux_Procurement_Method__c', contract.cux_Procurement_Method__c, { type: 'select' })}
                  {row('Procurement Reference', 'cux_Procurement_Reference__c', contract.cux_Procurement_Reference__c)}
                  {row('Project Classification', 'cux_Project_Classification__c', contract.cux_Project_Classification__c, { type: 'select' })}
                  {row('HQ Contract', 'cux_Is_HQ__c', contract.cux_Is_HQ__c, { type: 'boolean' })}
                  {row('Program', 'cux_Program__c', contract.cux_Program__c, { type: 'select' })}
                </TableBody>
              </Table>
            </Box>
          </Card>

          {/* Financial & Term */}
          <Card>
            <CardHeader title="Financial & Term" />
            <Box sx={{ overflowX: 'auto' }}>
              <Table sx={{ minWidth: 500 }}>
                <TableBody>
                  {row('Total Authorized', 'cux_Total_Authorized_Amount__c', contract.cux_Total_Authorized_Amount__c, { type: 'currency' })}
                  {row('Total Obligated', null, contract.cux_Total_Obligated_Amount__c, { type: 'currency', readOnly: true })}
                  {row('Total Expended', null, contract.cux_Total_Expended_Amount__c, { type: 'currency', readOnly: true })}
                  {row('Current Fiscal Year', 'cux_Current_Fiscal_Year__c', contract.cux_Current_Fiscal_Year__c)}
                  {row('Start Date', 'cux_Start_Date__c', contract.cux_Start_Date__c, { type: 'date' })}
                  {row('End Date', 'cux_End_Date__c', contract.cux_End_Date__c, { type: 'date' })}
                  {row('Current Amendment', null, contract.cux_Current_Amendment__r?.Name, { readOnly: true })}
                  {row('Amendment Effective Date', null, contract.cux_Current_Amendment_Effective_Date__c, { type: 'date', readOnly: true })}
                </TableBody>
              </Table>
            </Box>
          </Card>

          {/* Organization */}
          <Card>
            <CardHeader title="Organization" />
            <Box sx={{ overflowX: 'auto' }}>
              <Table sx={{ minWidth: 500 }}>
                <TableBody>
                  {row('Business Unit', null, contract.cux_Business_Unit__r?.cux_Unit_Name__c, { readOnly: true })}
                </TableBody>
              </Table>
            </Box>
          </Card>

          {/* Compliance & Goals */}
          <Card>
            <CardHeader title="Compliance & Goals" />
            <Box sx={{ overflowX: 'auto' }}>
              <Table sx={{ minWidth: 500 }}>
                <TableBody>
                  {row('DGS Approval Status', null, contract.cux_DGS_Approval_Status__c, { readOnly: true })}
                  {row('DGS Exemption', 'cux_DGS_Exemption__c', contract.cux_DGS_Exemption__c)}
                  {row('DBE Goal', 'cux_DBE_Goal_Percent__c', contract.cux_DBE_Goal_Percent__c, { type: 'percent' })}
                  {row('DVBE Goal', 'cux_DVBE_Goal_Percent__c', contract.cux_DVBE_Goal_Percent__c, { type: 'percent' })}
                  {row('Retention Until', 'cux_Retention_Until__c', contract.cux_Retention_Until__c, { type: 'date' })}
                </TableBody>
              </Table>
            </Box>
          </Card>
        </Stack>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <RecentNotes comments={comments} auth={auth} contractId={contractId} onCommentAdded={onCommentAdded} />
      </Grid>
    </Grid>
  )
}



function OverviewTab({ contract, auth, comments, contractId, onCommentAdded, onContractUpdated }) {
  const client = useSalesforceClient()
  const editable = EDITABLE_STATUSES.has(contract.cux_Status__c)

  const handleBatchSave = React.useCallback(async (changedFields) => {
    if (!client || !changedFields || Object.keys(changedFields).length === 0) return
    await client.updateContract(contractId, changedFields)
    onContractUpdated?.()
  }, [client, contractId, onContractUpdated])

  return (
    <OverviewLayout2
      contract={contract}
      auth={auth}
      comments={comments}
      contractId={contractId}
      onCommentAdded={onCommentAdded}
      editable={editable}
      onBatchSave={handleBatchSave}
    />
  )
}

// ─── Task Orders Tab ───

const TASK_ORDER_TYPES = ['Emergency', 'Translab']

const toStatusColorMap = {
  Draft: 'default',
  'Under Review': 'warning',
  Approved: 'info',
  Active: 'success',
  Completed: 'success',
  Closed: 'default',
  Terminated: 'error',
}

function TaskOrdersTab({ taskOrders, contractId, contract, onTaskOrderCreated }) {
  const [dialogOpen, setDialogOpen] = React.useState(false)

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button startIcon={<PlusIcon />} variant="contained" onClick={() => setDialogOpen(true)}>
          New Task Order
        </Button>
      </Box>
      {taskOrders?.length ? (
        <Card>
          <Box sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 700 }}>
              <TableHead>
                <TableRow>
                  <TableCell>TO #</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell align="right">Authorized</TableCell>
                  <TableCell align="right">Invoiced</TableCell>
                  <TableCell>Assigned To</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {taskOrders.map((to) => (
                  <TableRow key={to.Id} hover>
                    <TableCell>
                      <Link color="text.primary" component={RouterLink} href={paths.dashboard.taskOrders.details(to.Id)} variant="subtitle2">
                        {to.Name}
                      </Link>
                    </TableCell>
                    <TableCell>{to.cux_Task_Order_Type__c || '—'}</TableCell>
                    <TableCell>
                      <Chip color={toStatusColorMap[to.cux_Status__c] || 'default'} label={to.cux_Status__c} size="small" variant="soft" />
                    </TableCell>
                    <TableCell>{to.cux_Start_Date__c ? dayjs(to.cux_Start_Date__c).format('MMM D, YYYY') : '—'}</TableCell>
                    <TableCell>{to.cux_End_Date__c ? dayjs(to.cux_End_Date__c).format('MMM D, YYYY') : '—'}</TableCell>
                    <TableCell align="right">{formatCurrency(to.cux_Authorized_Amount__c)}</TableCell>
                    <TableCell align="right">{formatCurrency(to.cux_Total_Invoiced_Amount__c)}</TableCell>
                    <TableCell>{to.cux_Assigned_To__r?.Name || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Card>
      ) : (
        <Card>
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary" variant="body2">No task orders</Typography>
          </Box>
        </Card>
      )}
      <CreateTaskOrderDialog
        contractId={contractId}
        contract={contract}
        taskOrders={taskOrders}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={onTaskOrderCreated}
      />
    </Stack>
  )
}

function CreateTaskOrderDialog({ contractId, contract, taskOrders, open, onClose, onSuccess }) {
  const client = useSalesforceClient()
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState(null)
  const [values, setValues] = React.useState({
    type: '',
    startDate: '',
    endDate: '',
    authorizedAmount: '',
    maxHours: '',
    scopeSummary: '',
  })

  const contractStart = contract?.cux_Start_Date__c || ''
  const contractEnd = contract?.cux_End_Date__c || ''
  const contractAuthorized = contract?.cux_Total_Authorized_Amount__c || 0
  const committedAmount = (taskOrders || []).reduce((sum, to) => sum + (to.cux_Authorized_Amount__c || 0), 0)
  const availableAmount = contractAuthorized - committedAmount

  // Validation helpers
  const dateErrors = React.useMemo(() => {
    const errs = {}
    if (values.startDate && contractStart && values.startDate < contractStart) {
      errs.startDate = `Must be on or after contract start (${dayjs(contractStart).format('MMM D, YYYY')})`
    }
    if (values.startDate && contractEnd && values.startDate > contractEnd) {
      errs.startDate = `Must be on or before contract end (${dayjs(contractEnd).format('MMM D, YYYY')})`
    }
    if (values.endDate && contractEnd && values.endDate > contractEnd) {
      errs.endDate = `Must be on or before contract end (${dayjs(contractEnd).format('MMM D, YYYY')})`
    }
    if (values.endDate && contractStart && values.endDate < contractStart) {
      errs.endDate = `Must be on or after contract start (${dayjs(contractStart).format('MMM D, YYYY')})`
    }
    if (values.startDate && values.endDate && values.endDate < values.startDate) {
      errs.endDate = 'End date must be after start date'
    }
    return errs
  }, [values.startDate, values.endDate, contractStart, contractEnd])

  const amountError = React.useMemo(() => {
    if (!values.authorizedAmount) return null
    const amt = Number(values.authorizedAmount)
    if (amt > availableAmount) {
      return `Exceeds available amount (${formatCurrency(availableAmount)} of ${formatCurrency(contractAuthorized)} remaining)`
    }
    return null
  }, [values.authorizedAmount, availableAmount, contractAuthorized])

  const hasValidationErrors = Object.keys(dateErrors).length > 0 || !!amountError

  function resetForm() {
    setValues({ type: '', startDate: '', endDate: '', authorizedAmount: '', maxHours: '', scopeSummary: '' })
    setError(null)
    setSubmitting(false)
  }

  function handleChange(field) {
    return (event) => setValues((prev) => ({ ...prev, [field]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!client || !values.type || hasValidationErrors) return

    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        cux_Contract__c: contractId,
        cux_Task_Order_Type__c: values.type,
        cux_Status__c: 'Draft',
      }
      if (values.startDate) payload.cux_Start_Date__c = values.startDate
      if (values.endDate) payload.cux_End_Date__c = values.endDate
      if (values.authorizedAmount) payload.cux_Authorized_Amount__c = Number(values.authorizedAmount)
      if (values.maxHours) payload.cux_Max_Authorized_Hours__c = Number(values.maxHours)
      if (values.scopeSummary) payload.cux_Scope_Summary__c = values.scopeSummary

      await client.createTaskOrder(payload)
      resetForm()
      onClose()
      if (onSuccess) onSuccess()
    } catch (err) {
      setError(err.response?.data?.[0]?.message || err.message)
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ component: 'form', onSubmit: handleSubmit }}>
      <DialogTitle>New Task Order</DialogTitle>
      <Divider />
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <FormControl fullWidth disabled>
            <InputLabel shrink>Contract</InputLabel>
            <OutlinedInput
              value={contract?.Name ? `${contract.Name} — ${contract.cux_Title__c || ''}` : contractId}
              label="Contract"
              notched
              readOnly
              sx={{ bgcolor: 'action.hover' }}
            />
          </FormControl>
          {contractStart || contractEnd ? (
            <Alert severity="info" variant="outlined" sx={{ py: 0.5 }}>
              Contract period: {contractStart ? dayjs(contractStart).format('MMM D, YYYY') : '—'} to {contractEnd ? dayjs(contractEnd).format('MMM D, YYYY') : '—'}
              {' · '}Available: {formatCurrency(availableAmount)} of {formatCurrency(contractAuthorized)}
            </Alert>
          ) : null}
          <FormControl fullWidth required>
            <InputLabel>Type</InputLabel>
            <Select value={values.type} onChange={handleChange('type')} label="Type">
              {TASK_ORDER_TYPES.map((t) => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Stack direction="row" spacing={2}>
            <FormControl fullWidth error={!!dateErrors.startDate}>
              <InputLabel shrink>Start Date</InputLabel>
              <OutlinedInput
                type="date"
                value={values.startDate}
                onChange={handleChange('startDate')}
                label="Start Date"
                notched
                inputProps={{ min: contractStart, max: contractEnd }}
              />
              {dateErrors.startDate ? <FormHelperText>{dateErrors.startDate}</FormHelperText> : null}
            </FormControl>
            <FormControl fullWidth error={!!dateErrors.endDate}>
              <InputLabel shrink>End Date</InputLabel>
              <OutlinedInput
                type="date"
                value={values.endDate}
                onChange={handleChange('endDate')}
                label="End Date"
                notched
                inputProps={{ min: contractStart, max: contractEnd }}
              />
              {dateErrors.endDate ? <FormHelperText>{dateErrors.endDate}</FormHelperText> : null}
            </FormControl>
          </Stack>
          <Stack direction="row" spacing={2}>
            <FormControl fullWidth error={!!amountError}>
              <InputLabel shrink>Authorized Amount</InputLabel>
              <OutlinedInput
                type="number"
                value={values.authorizedAmount}
                onChange={handleChange('authorizedAmount')}
                label="Authorized Amount"
                notched
                startAdornment={<Typography sx={{ mr: 0.5 }}>$</Typography>}
                inputProps={{ max: availableAmount }}
              />
              {amountError ? <FormHelperText>{amountError}</FormHelperText> : null}
            </FormControl>
            <FormControl fullWidth>
              <InputLabel shrink>Max Hours</InputLabel>
              <OutlinedInput type="number" value={values.maxHours} onChange={handleChange('maxHours')} label="Max Hours" notched />
            </FormControl>
          </Stack>
          <FormControl fullWidth>
            <InputLabel shrink>Scope Summary</InputLabel>
            <OutlinedInput
              multiline
              minRows={3}
              maxRows={6}
              value={values.scopeSummary}
              onChange={handleChange('scopeSummary')}
              label="Scope Summary"
              notched
              placeholder="Describe the scope of work..."
            />
          </FormControl>
        </Stack>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button color="secondary" onClick={() => { resetForm(); onClose() }}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={submitting || !values.type || hasValidationErrors}>
          {submitting ? 'Creating...' : 'Create Task Order'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ─── Amendments Tab ───

function AmendmentsTab({ amendments, contractId, contract, taskOrders, onAmendmentCreated }) {
  const [dialogOpen, setDialogOpen] = React.useState(false)

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button startIcon={<PlusIcon />} variant="contained" onClick={() => setDialogOpen(true)}>
          Create Amendment
        </Button>
      </Box>
      {amendments?.length ? (
        <Card>
          <Box sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 700 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Amendment #</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Effective Date</TableCell>
                  <TableCell align="right">Amount Change</TableCell>
                  <TableCell align="right">New Authorized</TableCell>
                  <TableCell>Approved By</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {amendments.map((amd) => (
                  <TableRow key={amd.Id} hover>
                    <TableCell>{amd.Name}</TableCell>
                    <TableCell>{amd.cux_Amendment_Type__c || '—'}</TableCell>
                    <TableCell>
                      <Chip label={amd.cux_Approval_Status__c} size="small" variant="soft" />
                    </TableCell>
                    <TableCell>
                      {amd.cux_Effective_Date__c ? dayjs(amd.cux_Effective_Date__c).format('MMM D, YYYY') : '—'}
                    </TableCell>
                    <TableCell align="right">{formatCurrency(amd.cux_Amount_Change__c)}</TableCell>
                    <TableCell align="right">{formatCurrency(amd.cux_New_Authorized_Amount__c)}</TableCell>
                    <TableCell>{amd.cux_Approved_By__r?.Name || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Card>
      ) : (
        <Card>
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary" variant="body2">No amendments</Typography>
          </Box>
        </Card>
      )}
      <CreateAmendmentDialog
        contractId={contractId}
        contract={contract}
        taskOrders={taskOrders}
        existingCount={amendments?.length || 0}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={onAmendmentCreated}
      />
    </Stack>
  )
}

const AMENDMENT_TYPES = [
  'Scope Modification',
  'Performance Period Modification',
  'Authorized Amount Modification',
  'Other',
]

function CreateAmendmentDialog({ contractId, contract, taskOrders, existingCount, open, onClose, onSuccess }) {
  const client = useSalesforceClient()
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState(null)
  const [values, setValues] = React.useState({
    amendmentTypes: [],
    amendmentDate: dayjs().format('YYYY-MM-DD'),
    effectiveDate: '',
    newAuthorizedAmount: '',

    newEndDate: '',
    otherDescription: '',
    narrative: '',
    reason: '',
  })

  const hasPerformancePeriod = values.amendmentTypes.includes('Performance Period Modification')
  const hasAuthorizedAmount = values.amendmentTypes.includes('Authorized Amount Modification')
  const hasOther = values.amendmentTypes.includes('Other')

  function resetForm() {
    setValues({
      amendmentTypes: [],
      amendmentDate: dayjs().format('YYYY-MM-DD'),
      effectiveDate: '',
      newAuthorizedAmount: '',
  
      newEndDate: '',
      otherDescription: '',
      narrative: '',
      reason: '',
    })
    setError(null)
    setSubmitting(false)
  }

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
    if (hasPerformancePeriod && !values.newEndDate) return
    if (hasAuthorizedAmount && !values.newAuthorizedAmount) return
    if (hasOther && !values.otherDescription) return

    if (hasPerformancePeriod && values.newEndDate) {
      const maxToEndDate = (taskOrders || [])
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
        cux_Contract__c: contractId,
        cux_Amendment_Number__c: String(existingCount + 1),
        cux_Amendment_Type__c: values.amendmentTypes.join(';'),
        cux_Amendment_Date__c: values.amendmentDate,
      }
      if (values.effectiveDate) payload.cux_Effective_Date__c = values.effectiveDate
      if (hasAuthorizedAmount && values.newAuthorizedAmount) payload.cux_New_Authorized_Amount__c = parseFloat(values.newAuthorizedAmount)

      if (hasPerformancePeriod && values.newEndDate) payload.cux_New_End_Date__c = values.newEndDate
      if (hasOther && values.otherDescription) payload.cux_Other_Description__c = values.otherDescription
      if (values.narrative) payload.cux_Amendment_Narrative__c = values.narrative
      if (values.reason) payload.cux_Reason__c = values.reason

      await client.createAmendment(payload)
      resetForm()
      onClose()
      if (onSuccess) onSuccess()
    } catch (err) {
      setError(err.response?.data?.[0]?.message || err.message)
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
      <DialogTitle>Create Amendment</DialogTitle>
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
                const maxToEndDate = (taskOrders || []).map((to) => to.cux_End_Date__c).filter(Boolean).sort().pop()
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
            <AiTextAssist
              text={values.narrative}
              onAccept={(enhanced) => setValues((prev) => ({ ...prev, narrative: enhanced }))}
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
            <AiTextAssist
              text={values.reason}
              onAccept={(enhanced) => setValues((prev) => ({ ...prev, reason: enhanced }))}
            />
          </FormControl>
        </Stack>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button color="secondary" onClick={() => { resetForm(); onClose() }}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={submitting || values.amendmentTypes.length === 0 || !values.amendmentDate}>
          {submitting ? 'Creating...' : 'Create Amendment'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ─── Termination & Settlement Tab ───

const terminationStatusColorMap = {
  Draft: 'default',
  Submitted: 'info',
  Approved: 'warning',
  Effective: 'success',
  Cancelled: 'error',
}

const settlementStatusColorMap = {
  Draft: 'default',
  'Under Review': 'warning',
  Approved: 'info',
  Executed: 'success',
  Closed: 'secondary',
}

const TERMINATION_TYPES = [
  'For Cause',
  'For Default',
  'For Convenience',
  'For Lack Of Funding',
]

function TerminationTab({ contractId, contract, terminations, onRefresh }) {
  const client = useSalesforceClient()
  const [createTermOpen, setCreateTermOpen] = React.useState(false)
  const [createSettOpen, setCreateSettOpen] = React.useState(false)
  const [actionLoading, setActionLoading] = React.useState(false)
  const [actionError, setActionError] = React.useState(null)

  // Filter out cancelled — find the active termination (one per contract)
  const activeTermination = (terminations || []).find((t) => t.cux_Status__c !== 'Cancelled')
  const hasTermination = !!activeTermination

  // Query settlement for this contract's termination
  const { data: settlements, refetch: refetchSettlements } = useSalesforceQuery(
    (client) => hasTermination ? client.getAllSettlements().then((all) =>
      all.filter((s) => s.cux_Contract__c === contractId)
    ) : Promise.resolve([]),
    [contractId, hasTermination]
  )

  const activeSettlement = (settlements || []).find((s) => s.cux_Status__c !== 'Cancelled')
  const canCreateSettlement = hasTermination && activeTermination.cux_Status__c === 'Approved' && !activeSettlement

  return (
    <Stack spacing={3}>
      {actionError && <Alert severity="error" onClose={() => setActionError(null)}>{actionError}</Alert>}

      {/* Termination Section */}
      <Card>
        <CardHeader
          title="Termination"
          action={
            !hasTermination ? (
              <Button size="small" startIcon={<PlusIcon />} variant="contained" onClick={() => setCreateTermOpen(true)}>
                Create Termination
              </Button>
            ) : null
          }
        />
        <Divider />
        {hasTermination ? (
          <CardContent>
            <Stack spacing={2}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Link component={RouterLink} href={paths.dashboard.terminations.details(activeTermination.Id)} variant="subtitle1">
                  {activeTermination.Name}
                </Link>
                <Chip
                  color={terminationStatusColorMap[activeTermination.cux_Status__c] || 'default'}
                  label={activeTermination.cux_Status__c}
                  size="small"
                  variant="soft"
                />
              </Stack>
              <Stack direction="row" spacing={4}>
                <Typography variant="body2" color="text.secondary">
                  Type: {activeTermination.cux_Termination_Type__c || '—'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Date: {activeTermination.cux_Termination_Date__c ? dayjs(activeTermination.cux_Termination_Date__c).format('MMM D, YYYY') : '—'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Settlement Required: {activeTermination.cux_Requires_Settlement__c ? 'Yes' : 'No'}
                </Typography>
              </Stack>
            </Stack>
          </CardContent>
        ) : (
          <CardContent>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              No termination has been initiated for this contract.
            </Typography>
          </CardContent>
        )}
      </Card>

      {/* Settlement Section — only shown when termination exists */}
      {hasTermination && (
        <Card>
          <CardHeader
            title="Settlement"
            action={
              canCreateSettlement ? (
                <Button size="small" startIcon={<PlusIcon />} variant="contained" onClick={() => setCreateSettOpen(true)}>
                  Create Settlement
                </Button>
              ) : null
            }
          />
          <Divider />
          {activeSettlement ? (
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Link component={RouterLink} href={paths.dashboard.settlements.details(activeSettlement.Id)} variant="subtitle1">
                    {activeSettlement.Name}
                  </Link>
                  <Chip
                    color={settlementStatusColorMap[activeSettlement.cux_Status__c] || 'default'}
                    label={activeSettlement.cux_Status__c}
                    size="small"
                    variant="soft"
                  />
                </Stack>
                <Stack direction="row" spacing={4}>
                  <Typography variant="body2" color="text.secondary">
                    Authorized: {formatCurrency(activeSettlement.cux_Authorized_Amount__c)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Effective: {activeSettlement.cux_Effective_Date__c ? dayjs(activeSettlement.cux_Effective_Date__c).format('MMM D, YYYY') : '—'}
                  </Typography>
                </Stack>
                {(activeSettlement.cux_Status__c === 'Executed' || activeSettlement.cux_Status__c === 'Approved') && (
                  <Box>
                    <Button
                      size="small"
                      variant="outlined"
                      component={RouterLink}
                      href={`${paths.dashboard.invoices.create}?taskOrderId=&settlementId=${activeSettlement.Id}&contractId=${contractId}`}
                    >
                      Create Invoice for Settlement
                    </Button>
                  </Box>
                )}
              </Stack>
            </CardContent>
          ) : (
            <CardContent>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                {activeTermination.cux_Status__c === 'Approved'
                  ? 'No settlement has been created yet.'
                  : 'Settlement can be created after the termination is approved.'}
              </Typography>
            </CardContent>
          )}
        </Card>
      )}

      {/* All terminations history */}
      {(terminations || []).length > 1 && (
        <Card>
          <CardHeader title="Termination History" />
          <Divider />
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Termination #</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Termination Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(terminations || []).map((t) => (
                <TableRow key={t.Id} hover>
                  <TableCell>
                    <Link component={RouterLink} href={paths.dashboard.terminations.details(t.Id)} variant="subtitle2">
                      {t.Name}
                    </Link>
                  </TableCell>
                  <TableCell>{t.cux_Termination_Type__c || '—'}</TableCell>
                  <TableCell>
                    <Chip color={terminationStatusColorMap[t.cux_Status__c] || 'default'} label={t.cux_Status__c} size="small" variant="soft" />
                  </TableCell>
                  <TableCell>{t.cux_Termination_Date__c ? dayjs(t.cux_Termination_Date__c).format('MMM D, YYYY') : '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Create Termination Dialog */}
      <CreateTerminationDialog
        contractId={contractId}
        open={createTermOpen}
        onClose={() => setCreateTermOpen(false)}
        onSuccess={onRefresh}
      />

      {/* Create Settlement Dialog */}
      {hasTermination && (
        <CreateSettlementDialog
          contractId={contractId}
          termination={activeTermination}
          open={createSettOpen}
          onClose={() => setCreateSettOpen(false)}
          onSuccess={refetchSettlements}
        />
      )}
    </Stack>
  )
}

function CreateTerminationDialog({ contractId, open, onClose, onSuccess }) {
  const client = useSalesforceClient()
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState(null)
  const [values, setValues] = React.useState({
    terminationType: '',
    terminationDate: '',
    reasonCode: '',
    narrative: '',
    requiresSettlement: true,
  })

  React.useEffect(() => {
    if (open) {
      setValues({ terminationType: '', terminationDate: '', reasonCode: '', narrative: '', requiresSettlement: true })
      setError(null)
    }
  }, [open])

  function handleChange(field) {
    return (event) => setValues((prev) => ({ ...prev, [field]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!client || !values.terminationType || !values.terminationDate) return

    setSubmitting(true)
    setError(null)
    try {
      await client.createTermination({
        cux_Parent_Type__c: 'Contract',
        cux_Contract__c: contractId,
        cux_Termination_Type__c: values.terminationType,
        cux_Termination_Date__c: values.terminationDate,
        cux_Reason_Code__c: values.reasonCode || null,
        cux_Narrative__c: values.narrative || null,
        cux_Requires_Settlement__c: values.requiresSettlement,
        cux_Status__c: 'Draft',
      })
      onClose()
      if (onSuccess) onSuccess()
    } catch (err) {
      setError(err.response?.data?.[0]?.message || err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ component: 'form', onSubmit: handleSubmit }}>
      <DialogTitle>Create Termination</DialogTitle>
      <Divider />
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <FormControl fullWidth required>
            <InputLabel>Termination Type</InputLabel>
            <Select value={values.terminationType} onChange={handleChange('terminationType')} label="Termination Type">
              {TERMINATION_TYPES.map((t) => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth required>
            <InputLabel shrink>Termination Date</InputLabel>
            <OutlinedInput type="date" value={values.terminationDate} onChange={handleChange('terminationDate')} label="Termination Date" notched />
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Reason Code</InputLabel>
            <OutlinedInput value={values.reasonCode} onChange={handleChange('reasonCode')} label="Reason Code" />
          </FormControl>
          <FormControl fullWidth>
            <InputLabel shrink>Narrative</InputLabel>
            <OutlinedInput
              multiline minRows={3} maxRows={6}
              value={values.narrative} onChange={handleChange('narrative')}
              label="Narrative" notched placeholder="Describe the reason for termination..."
            />
          </FormControl>
          <FormControlLabel
            control={<Switch checked={values.requiresSettlement} onChange={(e) => setValues((prev) => ({ ...prev, requiresSettlement: e.target.checked }))} />}
            label="Requires Settlement"
          />
        </Stack>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button color="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={submitting || !values.terminationType || !values.terminationDate}>
          {submitting ? 'Creating...' : 'Create Termination'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

function CreateSettlementDialog({ contractId, termination, open, onClose, onSuccess }) {
  const client = useSalesforceClient()
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState(null)
  const [values, setValues] = React.useState({
    authorizedAmount: '',
    effectiveDate: '',
    allowsPostTerminationInvoicing: false,
  })

  React.useEffect(() => {
    if (open && termination) {
      setValues({
        authorizedAmount: '',
        effectiveDate: termination.cux_Termination_Date__c || '',
        allowsPostTerminationInvoicing: false,
      })
      setError(null)
    }
  }, [open, termination])

  function handleChange(field) {
    return (event) => setValues((prev) => ({ ...prev, [field]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!client || !values.authorizedAmount || !values.effectiveDate) return

    setSubmitting(true)
    setError(null)
    try {
      await client.createSettlement({
        cux_Parent_Type__c: 'Contract',
        cux_Contract__c: contractId,
        cux_Termination__c: termination.Id,
        cux_Status__c: 'Draft',
        cux_Authorized_Amount__c: Number(values.authorizedAmount),
        cux_Effective_Date__c: values.effectiveDate,
        cux_Allows_Post_Termination_Invoicing__c: values.allowsPostTerminationInvoicing,
      })
      onClose()
      if (onSuccess) onSuccess()
    } catch (err) {
      setError(err.response?.data?.[0]?.message || err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ component: 'form', onSubmit: handleSubmit }}>
      <DialogTitle>Create Settlement</DialogTitle>
      <Divider />
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <Typography variant="body2" color="text.secondary">
            Creating settlement for termination {termination?.Name}
          </Typography>
          <FormControl fullWidth required>
            <InputLabel>Authorized Amount</InputLabel>
            <OutlinedInput
              type="number" value={values.authorizedAmount} onChange={handleChange('authorizedAmount')}
              label="Authorized Amount" inputProps={{ min: 0, step: 0.01 }}
              startAdornment={<Typography sx={{ mr: 0.5 }}>$</Typography>}
            />
          </FormControl>
          <FormControl fullWidth required>
            <InputLabel shrink>Effective Date</InputLabel>
            <OutlinedInput type="date" value={values.effectiveDate} onChange={handleChange('effectiveDate')} label="Effective Date" notched />
          </FormControl>
          <FormControlLabel
            control={<Switch checked={values.allowsPostTerminationInvoicing} onChange={(e) => setValues((prev) => ({ ...prev, allowsPostTerminationInvoicing: e.target.checked }))} />}
            label="Allow Post-Termination Invoicing"
          />
        </Stack>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button color="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={submitting || !values.authorizedAmount || !values.effectiveDate}>
          {submitting ? 'Creating...' : 'Create Settlement'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const DOCUMENT_TYPES = [
  'SOW',
  'Scope Description',
  'Funding Approval',
  'Budget Estimate',
  'Sole Source Justification',
  'Procurement Package',
  'Executed STD 213',
  'Executed STD 215',
  'Vendor Cost Proposal',
  'Vendor Rate Sheet',
  'Vendor Cost Breakdown',
  'Vendor Negotiated Price Worksheet',
  'Vendor Pricing Justification',
  'Vendor Other Cost Documentation',
  'Performance Evaluation',
  'Contract Agreement',
  'Other',
]

// ─── Generate PDF Button ───

function GeneratePdfButton({ contract, funding, contractId, onGenerated }) {
  const client = useSalesforceClient()
  const [generating, setGenerating] = React.useState(false)
  const [snack, setSnack] = React.useState(null)

  async function handleGenerate() {
    if (!client || generating) return

    setGenerating(true)
    try {
      const blob = await pdf(
        <ContractPDFDocument contract={contract} funding={funding || []} />
      ).toBlob()

      const fileName = `${contract.Name} - Contract Agreement.pdf`
      const file = new File([blob], fileName, { type: 'application/pdf' })

      // Upload to Salesforce as ContentVersion
      const cvResult = await client.uploadContentVersion(file)

      // Create contract document record
      await client.createDocument({
        cux_Contract__c: contractId,
        cux_File_Name__c: fileName,
        cux_Document_Type__c: 'Contract Agreement',
        cux_Version_Number__c: 1,
        cux_Content_Version_Id__c: cvResult.id,
        cux_Is_Official__c: true,
        cux_Uploaded_At__c: new Date().toISOString(),
      })

      setSnack({ message: 'Contract PDF generated and saved to Documents', severity: 'success' })
      if (onGenerated) onGenerated()
    } catch (err) {
      console.error('Failed to generate PDF:', err)
      const sfError = Array.isArray(err?.response?.data) ? err.response.data[0]?.message : err?.response?.data?.message
      setSnack({ message: `Failed to generate PDF: ${sfError || err.message || 'Unknown error'}`, severity: 'error' })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        startIcon={<FileTextIcon />}
        onClick={handleGenerate}
        disabled={generating}
      >
        {generating ? 'Generating...' : 'Generate PDF'}
      </Button>
      <Snackbar
        open={Boolean(snack)}
        autoHideDuration={6000}
        onClose={() => setSnack(null)}
        message={snack?.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  )
}

const DOC_SNACKBAR_MESSAGES = {
  extracting: 'Analyzing document with AI...',
  summarizing: 'Generating summary...',
  complete: 'Document summary generated',
  error: 'Could not generate document summary',
}

function DocumentsTab({ documents, contractId, onDocumentAdded }) {
  const client = useSalesforceClient()
  const [dialogOpen, setDialogOpen] = React.useState(false)

  const { startSummarization, summarizationStatus, summarizationError, resetStatus } =
    useDocumentSummarization(client, onDocumentAdded)

  const snackbarOpen = summarizationStatus !== 'idle'
  const snackbarSeverity = summarizationStatus === 'error' ? 'warning' : summarizationStatus === 'complete' ? 'success' : 'info'
  const snackbarMessage = summarizationStatus === 'error'
    ? (summarizationError || DOC_SNACKBAR_MESSAGES.error)
    : (DOC_SNACKBAR_MESSAGES[summarizationStatus] || '')

  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          startIcon={<PlusIcon />}
          variant="contained"
          onClick={() => setDialogOpen(true)}
        >
          Add Document
        </Button>
      </Box>
      {!documents?.length ? (
        <Card>
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary" variant="body2">No documents</Typography>
          </Box>
        </Card>
      ) : (
        <Card>
          <Box sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 700 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Document #</TableCell>
                  <TableCell>File Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Summary</TableCell>
                  <TableCell>Version</TableCell>
                  <TableCell>Official</TableCell>
                  <TableCell>Final</TableCell>
                  <TableCell>Uploaded By</TableCell>
                  <TableCell>Upload Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.Id} hover>
                    <TableCell>{doc.Name}</TableCell>
                    <TableCell>
                      {doc.cux_Content_Version_Id__c ? (
                        <Link
                          component="button"
                          onClick={() =>
                            client?.downloadContentVersion(
                              doc.cux_Content_Version_Id__c,
                              doc.cux_File_Name__c || 'download'
                            )
                          }
                          sx={{ cursor: 'pointer' }}
                        >
                          {doc.cux_File_Name__c || 'Download'}
                        </Link>
                      ) : (
                        doc.cux_File_Name__c || '—'
                      )}
                    </TableCell>
                    <TableCell>{doc.cux_Document_Type__c || '—'}</TableCell>
                    <TableCell sx={{ maxWidth: 250 }}>
                      {doc.cux_Short_Summary__c ? (
                        <Tooltip title={doc.cux_Short_Summary__c} placement="top">
                          <Typography variant="body2" noWrap>
                            {doc.cux_Short_Summary__c}
                          </Typography>
                        </Tooltip>
                      ) : '—'}
                    </TableCell>
                    <TableCell>{doc.cux_Version_Number__c || '—'}</TableCell>
                    <TableCell>{doc.cux_Is_Official__c ? 'Yes' : 'No'}</TableCell>
                    <TableCell>{doc.cux_Is_Final__c ? 'Yes' : 'No'}</TableCell>
                    <TableCell>{doc.cux_Uploaded_By__r?.Name || '—'}</TableCell>
                    <TableCell>
                      {doc.cux_Uploaded_At__c ? dayjs(doc.cux_Uploaded_At__c).format('MMM D, YYYY') : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Card>
      )}
      <AddDocumentDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        contractId={contractId}
        onSuccess={onDocumentAdded}
        startSummarization={startSummarization}
      />
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={summarizationStatus === 'complete' || summarizationStatus === 'error' ? 5000 : null}
        onClose={(_e, reason) => {
          if (reason === 'clickaway') return
          resetStatus()
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snackbarSeverity}
          variant="filled"
          onClose={resetStatus}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Stack>
  )
}

function bytesToSize(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = Math.max(decimals, 0)
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`
}

function AddDocumentDialog({ open, onClose, contractId, onSuccess, startSummarization }) {
  const client = useSalesforceClient()
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState(null)
  const [file, setFile] = React.useState(null)
  const [values, setValues] = React.useState({
    cux_File_Name__c: '',
    cux_Document_Type__c: '',
    cux_Version_Number__c: '1',
    cux_Is_Official__c: false,
    cux_Is_Final__c: false,
  })

  function handleChange(field) {
    return (event) => {
      setValues((prev) => ({ ...prev, [field]: event.target.value }))
    }
  }

  function handleSwitchChange(field) {
    return (event) => {
      setValues((prev) => ({ ...prev, [field]: event.target.checked }))
    }
  }

  const handleDrop = React.useCallback((acceptedFiles) => {
    const dropped = acceptedFiles[0]
    if (dropped) {
      setFile(dropped)
      setValues((prev) => ({
        ...prev,
        cux_File_Name__c: prev.cux_File_Name__c || dropped.name,
      }))
    }
  }, [])

  function handleRemoveFile() {
    setFile(null)
  }

  function resetForm() {
    setValues({
      cux_File_Name__c: '',
      cux_Document_Type__c: '',
      cux_Version_Number__c: '1',
      cux_Is_Official__c: false,
      cux_Is_Final__c: false,
    })
    setFile(null)
    setError(null)
    setSubmitting(false)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!client) return

    setSubmitting(true)
    setError(null)
    try {
      let contentVersionId = null

      if (file) {
        const cvResult = await client.uploadContentVersion(file)
        contentVersionId = cvResult.id
      }

      const payload = {
        cux_Contract__c: contractId,
        cux_File_Name__c: values.cux_File_Name__c,
        cux_Document_Type__c: values.cux_Document_Type__c,
        cux_Version_Number__c: values.cux_Version_Number__c || undefined,
        cux_Is_Official__c: values.cux_Is_Official__c,
        cux_Is_Final__c: values.cux_Is_Final__c,
        cux_Uploaded_At__c: new Date().toISOString(),
      }
      if (contentVersionId) {
        payload.cux_Content_Version_Id__c = contentVersionId
      }
      Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined || payload[key] === '') delete payload[key]
      })
      const result = await client.createDocument(payload)

      // Kick off AI summarization in the background (non-blocking, non-Invoice only)
      if (file && values.cux_Document_Type__c !== 'Invoice' && startSummarization) {
        startSummarization(file, result.id, values.cux_Document_Type__c)
      }

      resetForm()
      onClose()
      if (onSuccess) onSuccess()
    } catch (err) {
      setError(err.response?.data?.[0]?.message || err.message)
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={() => { resetForm(); onClose() }}
      maxWidth="sm"
      fullWidth
      PaperProps={{ component: 'form', onSubmit: handleSubmit }}
    >
      <DialogTitle>Add Document</DialogTitle>
      <Divider />
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <FileDropzone
            accept={{ '*/*': [] }}
            maxFiles={1}
            onDrop={handleDrop}
            caption="Max file size is 10 MB"
          />
          {file ? (
            <Stack
              direction="row"
              spacing={2}
              sx={{
                alignItems: 'center',
                border: '1px solid var(--mui-palette-divider)',
                borderRadius: 1,
                p: 1,
              }}
            >
              <FileIcon extension={file.name.split('.').pop()} />
              <Box sx={{ flex: '1 1 auto' }}>
                <Typography variant="subtitle2">{file.name}</Typography>
                <Typography color="text.secondary" variant="body2">
                  {bytesToSize(file.size)}
                </Typography>
              </Box>
              <Tooltip title="Remove">
                <IconButton onClick={handleRemoveFile}>
                  <XIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          ) : null}
          <FormControl fullWidth required>
            <InputLabel>File Name</InputLabel>
            <OutlinedInput
              label="File Name"
              placeholder="e.g. SOW_v1.pdf"
              value={values.cux_File_Name__c}
              onChange={handleChange('cux_File_Name__c')}
            />
          </FormControl>
          <FormControl fullWidth required>
            <InputLabel>Document Type</InputLabel>
            <Select
              label="Document Type"
              value={values.cux_Document_Type__c}
              onChange={handleChange('cux_Document_Type__c')}
            >
              {DOCUMENT_TYPES.map((type) => (
                <MenuItem key={type} value={type}>{type}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Version</InputLabel>
            <OutlinedInput
              label="Version"
              value={values.cux_Version_Number__c}
              onChange={handleChange('cux_Version_Number__c')}
            />
          </FormControl>
          <Stack direction="row" spacing={3}>
            <FormControlLabel
              control={
                <Switch
                  checked={values.cux_Is_Official__c}
                  onChange={handleSwitchChange('cux_Is_Official__c')}
                />
              }
              label="Official"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={values.cux_Is_Final__c}
                  onChange={handleSwitchChange('cux_Is_Final__c')}
                />
              }
              label="Final"
            />
          </Stack>
        </Stack>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button color="secondary" onClick={() => { resetForm(); onClose() }}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={submitting}>
          {submitting ? 'Uploading...' : 'Add Document'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const eventIconMap = {
  'Status Change': ArrowsClockwiseIcon,
  'Contract Created': FileTextIcon,
  'Contract Closed': CheckCircleIcon,
  'Contract Terminated': WarningIcon,
  'Amendment Applied': NoteIcon,
}

const eventColorMap = {
  'Contract Created': 'primary',
  'Contract Closed': 'success',
  'Contract Terminated': 'error',
  'Amendment Applied': 'info',
}

function EventsTab({ events }) {
  if (!events?.length) {
    return (
      <Card>
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary" variant="body2">No events</Typography>
        </Box>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader title="Event Timeline" />
      <Divider />
      <CardContent>
        <Timeline
          sx={{
            m: 0,
            p: 0,
            '& .MuiTimelineItem-root': { '&::before': { display: 'none' } },
            '& .MuiTimelineSeparator-root': { minWidth: 'unset' },
            '& .MuiTimelineDot-root': { background: 'transparent', border: 0, p: 0 },
            '& .MuiTimelineConnector-root': { minHeight: '16px' },
          }}
        >
          {events.map((evt, index) => {
            const Icon = eventIconMap[evt.cux_Event_Type__c] || ArrowsClockwiseIcon
            const color = eventColorMap[evt.cux_Event_Type__c] || 'primary'
            const hasStatusChange = evt.cux_Previous_Status__c && evt.cux_New_Status__c

            return (
              <TimelineItem key={evt.Id}>
                <TimelineSeparator>
                  <TimelineDot>
                    <Avatar
                      sx={{
                        bgcolor: `var(--mui-palette-${color}-main)`,
                        color: 'var(--mui-palette-common-white)',
                        height: 36,
                        width: 36,
                      }}
                    >
                      <Icon fontSize="var(--Icon-fontSize)" />
                    </Avatar>
                  </TimelineDot>
                  {index !== events.length - 1 ? <TimelineConnector /> : null}
                </TimelineSeparator>
                <TimelineContent sx={{ pb: 3 }}>
                  <Typography variant="subtitle2">{evt.cux_Event_Type__c}</Typography>
                  {hasStatusChange ? (
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 0.5 }}>
                      <Chip label={evt.cux_Previous_Status__c} size="small" variant="outlined" />
                      <Typography color="text.secondary" variant="caption">→</Typography>
                      <Chip
                        label={evt.cux_New_Status__c}
                        size="small"
                        color={statusColorMap[evt.cux_New_Status__c] || 'default'}
                        variant="soft"
                      />
                    </Stack>
                  ) : null}
                  <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                    {evt.cux_Performed_By__r?.Name ? (
                      <Typography color="text.secondary" variant="caption">
                        by {evt.cux_Performed_By__r.Name}
                      </Typography>
                    ) : null}
                    <Typography color="text.secondary" variant="caption">
                      {evt.cux_Event_Timestamp__c
                        ? dayjs(evt.cux_Event_Timestamp__c).format('MMM D, YYYY h:mm A')
                        : '—'}
                    </Typography>
                  </Stack>
                </TimelineContent>
              </TimelineItem>
            )
          })}
        </Timeline>
      </CardContent>
    </Card>
  )
}

function NotesTab({ comments, contractId, auth, onCommentAdded }) {
  const client = useSalesforceClient()
  const [text, setText] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)

  async function handleAddComment() {
    if (!client || !text.trim()) return
    setSubmitting(true)
    try {
      await client.createContractComment({
        cux_Contract__c: contractId,
        cux_Comment_Text__c: text.trim(),
        cux_Commented_By__c: auth?.user?.id,
        cux_Comment_Timestamp__c: new Date().toISOString(),
        cux_Visibility__c: 'Internal',
      })
      setText('')
      onCommentAdded?.()
    } catch (err) {
      console.error('Failed to add comment:', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Stack spacing={3}>
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="subtitle2">Add a Note</Typography>
            <OutlinedInput
              multiline
              minRows={3}
              placeholder="Write a note..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              fullWidth
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                size="small"
                disabled={!text.trim() || submitting}
                onClick={handleAddComment}
              >
                {submitting ? 'Saving...' : 'Add Note'}
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {comments?.length ? (
        <Stack spacing={2}>
          {comments.map((c) => (
            <Card key={c.Id}>
              <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                <Stack direction="row" spacing={2}>
                  <Avatar
                    src={c.cux_Commented_By__r?.SmallPhotoUrl
                      ? (c.cux_Commented_By__r.SmallPhotoUrl.startsWith('http') ? c.cux_Commented_By__r.SmallPhotoUrl : `${auth?.instanceUrl}${c.cux_Commented_By__r.SmallPhotoUrl}`)
                      : undefined}
                    sx={{ width: 36, height: 36 }}
                  >
                    {(c.cux_Commented_By__r?.Name || '?')[0]}
                  </Avatar>
                  <Stack sx={{ flex: 1 }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <Typography variant="subtitle2">{c.cux_Commented_By__r?.Name || 'Unknown'}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {c.cux_Comment_Timestamp__c ? dayjs(c.cux_Comment_Timestamp__c).format('MMM D, YYYY h:mm A') : '—'}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                      {c.cux_Comment_Text__c}
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      ) : (
        <Card>
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary" variant="body2">No notes yet</Typography>
          </Box>
        </Card>
      )}
    </Stack>
  )
}

function FundingTab({ funding, contractId, contractStart, contractEnd, contractAuthorized, onFundingAdded }) {
  const [dialogOpen, setDialogOpen] = React.useState(false)

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button startIcon={<PlusIcon />} variant="contained" onClick={() => setDialogOpen(true)}>
          Add Funding Source
        </Button>
      </Box>
      {funding?.length ? (
        <Card>
          <Box sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Record #</TableCell>
                  <TableCell>Funding Code</TableCell>
                  <TableCell>Fund Type</TableCell>
                  <TableCell>Fiscal Year</TableCell>
                  <TableCell>Primary</TableCell>
                  <TableCell align="right">Allocated</TableCell>
                  <TableCell align="right">Obligated</TableCell>
                  <TableCell align="right">Expended</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {funding.map((f) => (
                  <TableRow key={f.Id} hover>
                    <TableCell>{f.Name}</TableCell>
                    <TableCell>{f.cux_Funding_Code__r?.cux_Code__c || '—'}</TableCell>
                    <TableCell>{f.cux_Funding_Code__r?.cux_Fund_Type__c || '—'}</TableCell>
                    <TableCell>{f.cux_Fiscal_Year__c || '—'}</TableCell>
                    <TableCell>
                      {f.cux_Is_Primary__c ? <Chip label="Primary" size="small" color="primary" variant="soft" /> : null}
                    </TableCell>
                    <TableCell align="right">{formatCurrency(f.cux_Allocated_Amount__c)}</TableCell>
                    <TableCell align="right">{formatCurrency(f.cux_Obligated_Amount__c)}</TableCell>
                    <TableCell align="right">{formatCurrency(f.cux_Expended_Amount__c)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Card>
      ) : (
        <Card>
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary" variant="body2">No funding records</Typography>
          </Box>
        </Card>
      )}
      <AddFundingDialog
        contractId={contractId}
        contractStart={contractStart}
        contractEnd={contractEnd}
        contractAuthorized={contractAuthorized}
        existingFunding={funding}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={onFundingAdded}
      />
    </Stack>
  )
}

function AddFundingDialog({ contractId, contractStart, contractEnd, contractAuthorized, existingFunding, open, onClose, onSuccess }) {
  const client = useSalesforceClient()
  const { data: fundingCodes } = useSalesforceQuery((c) => c.getFundingCodes())
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState(null)
  const [values, setValues] = React.useState({
    fundingCode: '',
    fiscalYear: '',
    allocatedAmount: '',
    isPrimary: false,
  })

  const dateWarning = React.useMemo(() => {
    if (!values.fundingCode || !contractStart) return null
    const fund = fundingCodes?.find((fc) => fc.Id === values.fundingCode)
    if (!fund) return null

    const fundStart = fund.cux_Effective_Start__c
    const fundEnd = fund.cux_Effective_End__c
    if (!fundStart && !fundEnd) return null

    const cStart = new Date(contractStart)
    const cEnd = contractEnd ? new Date(contractEnd) : null

    const overlaps =
      (!fundStart || !cEnd || new Date(fundStart) <= cEnd) &&
      (!fundEnd || new Date(fundEnd) >= cStart)

    if (!overlaps) {
      const formatDate = (d) => dayjs(d).format('MMM YYYY')
      const range = [fundStart && formatDate(fundStart), fundEnd && formatDate(fundEnd)].filter(Boolean).join(' – ')
      return `Fund effective dates (${range}) do not overlap with contract dates. This fund may not cover the contract period.`
    }
    return null
  }, [values.fundingCode, fundingCodes, contractStart, contractEnd])

  const overFundingError = React.useMemo(() => {
    if (contractAuthorized == null || !values.allocatedAmount) return null
    const existingTotal = (existingFunding || []).reduce((sum, f) => sum + (f.cux_Allocated_Amount__c || 0), 0)
    const newTotal = existingTotal + Number(values.allocatedAmount)
    if (newTotal > contractAuthorized) {
      const over = newTotal - contractAuthorized
      return `Total allocated funding (${formatCurrency(newTotal)}) would exceed the contract authorized amount (${formatCurrency(contractAuthorized)}) by ${formatCurrency(over)}. Contracts cannot be over-funded.`
    }
    return null
  }, [values.allocatedAmount, contractAuthorized, existingFunding])

  function resetForm() {
    setValues({ fundingCode: '', fiscalYear: '', allocatedAmount: '', isPrimary: false })
    setError(null)
    setSubmitting(false)
  }

  function handleChange(field) {
    return (event) => setValues((prev) => ({ ...prev, [field]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!client || !values.fundingCode) return

    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        cux_Contract__c: contractId,
        cux_Funding_Code__c: values.fundingCode,
        cux_Is_Primary__c: values.isPrimary,
      }
      if (values.fiscalYear) payload.cux_Fiscal_Year__c = values.fiscalYear
      if (values.allocatedAmount) payload.cux_Allocated_Amount__c = Number(values.allocatedAmount)

      await client.createContractFunding(payload)
      resetForm()
      onClose()
      if (onSuccess) onSuccess()
    } catch (err) {
      setError(err.response?.data?.[0]?.message || err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Add Funding Source</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {error ? <Alert severity="error">{error}</Alert> : null}
            <FormControl required>
              <InputLabel>Fund</InputLabel>
              <Select value={values.fundingCode} onChange={handleChange('fundingCode')} label="Fund">
                {(fundingCodes || []).filter((fc) => fc.cux_Is_Active__c).map((fc) => {
                  const dates = [fc.cux_Effective_Start__c, fc.cux_Effective_End__c].filter(Boolean)
                  const dateLabel = dates.length ? ` — ${dates.map((d) => dayjs(d).format('MMM YYYY')).join(' – ')}` : ''
                  return (
                    <MenuItem key={fc.Id} value={fc.Id}>
                      {fc.cux_Fund_Name__c || fc.Name} ({fc.cux_Code__c}){dateLabel}
                    </MenuItem>
                  )
                })}
              </Select>
            </FormControl>
            {dateWarning ? <Alert severity="warning">{dateWarning}</Alert> : null}
            {overFundingError ? <Alert severity="error">{overFundingError}</Alert> : null}
            <FormControl>
              <InputLabel>Fiscal Year</InputLabel>
              <OutlinedInput label="Fiscal Year" value={values.fiscalYear} onChange={handleChange('fiscalYear')} placeholder="e.g. FY2025" />
            </FormControl>
            <FormControl>
              <InputLabel>Allocated Amount</InputLabel>
              <OutlinedInput label="Allocated Amount" type="number" value={values.allocatedAmount} onChange={handleChange('allocatedAmount')} />
            </FormControl>
            <FormControlLabel
              control={<Switch checked={values.isPrimary} onChange={(e) => setValues((prev) => ({ ...prev, isPrimary: e.target.checked }))} />}
              label="Primary funding source"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { resetForm(); onClose() }} disabled={submitting}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={submitting || !values.fundingCode || !!overFundingError}>
            {submitting ? 'Adding...' : 'Add'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

// ─── Contract Review Tab ───

// Status advancement map — each status maps to its next valid status
const STATUS_NEXT = {
  'Draft': 'Under Review',
  'Under Review': 'Approved For Procurement',
  'Approved For Procurement': 'Submitted To Procurement',
  'Submitted To Procurement': 'Awarded',
  'Awarded': 'Executed',
  'Executed': 'Closed',
}

// Reverse map — each status maps to its previous status
const STATUS_PREV = Object.fromEntries(Object.entries(STATUS_NEXT).map(([from, to]) => [to, from]))

function ContractReviewTab({ contractId, contract, contractStatus, validationRequests, taskOrders, documents, onRefresh, onContractUpdated, onCommentAdded, onDrawerClose }) {
  const client = useSalesforceClient()
  const { auth } = useAuth()
  const { run, loading: runLoading, result: runResult, error: runError } = useRunValidation()
  const [advanceLoading, setAdvanceLoading] = React.useState(false)
  const [advanceError, setAdvanceError] = React.useState(null)
  const [attestOpen, setAttestOpen] = React.useState(false)
  const [attestText, setAttestText] = React.useState('')
  const [closureOpen, setClosureOpen] = React.useState(false)

  // ─── Closure checklist (Executed → Closed) ───
  const [perfEvalSaving, setPerfEvalSaving] = React.useState(false)

  const closureChecks = React.useMemo(() => {
    if (contractStatus !== 'Executed') return []
    const CLOSED_STATUSES = new Set(['Terminated', 'Closed', 'Completed'])
    const allTOsClosed = (taskOrders || []).length > 0 && (taskOrders || []).every((to) => CLOSED_STATUSES.has(to.cux_Status__c))
    const perfEvalComplete = contract?.cux_Final_Perf_Eval_Complete__c === true
    const hasDocuments = (documents || []).length > 0
    return [
      { key: 'taskOrders', label: 'All Task Orders are terminated or closed', passed: allTOsClosed, auto: true },
      { key: 'perfEval', label: 'Performance Evaluation completed and stored', passed: perfEvalComplete, auto: false, toggleable: true },
      { key: 'documents', label: 'All requisite documents uploaded', passed: hasDocuments, auto: false },
    ]
  }, [contractStatus, taskOrders, documents, contract])

  const allClosureChecksPassed = closureChecks.length > 0 && closureChecks.every((c) => c.passed)

  async function handleTogglePerfEval() {
    if (!client) return
    setPerfEvalSaving(true)
    try {
      const newValue = !contract?.cux_Final_Perf_Eval_Complete__c
      await client.updateContract(contractId, { cux_Final_Perf_Eval_Complete__c: newValue })
      onContractUpdated?.()
    } catch (err) {
      console.error('Failed to update performance evaluation status:', err)
    } finally {
      setPerfEvalSaving(false)
    }
  }

  // Load results for the most recent request matching the current stage only
  const latestRequest = React.useMemo(() => {
    if (!validationRequests?.length) return null
    // Only show results for the current stage — never fall back to a different stage
    const stageFiltered = contractStatus
      ? validationRequests.filter((r) => r.cux_Stage__c === contractStatus)
      : validationRequests
    if (stageFiltered.length === 0) return null
    const completed = stageFiltered.filter((r) => r.cux_Status__c === 'Completed')
    return completed.length > 0
      ? completed.reduce((a, b) =>
          new Date(b.cux_Requested_At__c) > new Date(a.cux_Requested_At__c) ? b : a
        )
      : stageFiltered[0]
  }, [validationRequests, contractStatus])

  const { data: results, refetch: refetchResults } = useSalesforceQuery(
    (sfClient) => latestRequest ? sfClient.getValidationResults(latestRequest.Id) : Promise.resolve([]),
    [latestRequest?.Id]
  )

  async function handleRunValidation() {
    const result = await run({
      targetEntityType: 'Contract',
      targetEntityId: contractId,
      stage: contractStatus,
      idempotencyKey: `contract-${contractStatus}-${contractId}-${Date.now()}`,
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
      const sfError = err.response?.data
      console.error('Toggle checklist error:', JSON.stringify(sfError, null, 2))
      throw err
    }
  }

  function promptAdvance() {
    if (contractStatus === 'Executed') {
      setClosureOpen(true)
    } else {
      setAttestText('')
      setAttestOpen(true)
    }
  }

  async function handleAdvanceContract() {
    if (!client) return
    const nextStatus = STATUS_NEXT[contractStatus]
    if (!nextStatus) return
    setAttestOpen(false)
    setAdvanceLoading(true)
    setAdvanceError(null)
    try {
      // Save attestation as a contract note
      const attestationNote = attestText.trim()
        ? `Review attestation (${contractStatus} → ${nextStatus}): ${attestText.trim()}`
        : `Review attestation: ${contractStatus} checklist completed and approved for advancement to ${nextStatus}.`
      await client.createContractComment({
        cux_Contract__c: contractId,
        cux_Comment_Text__c: attestationNote,
        cux_Commented_By__c: auth?.user?.id,
        cux_Comment_Timestamp__c: new Date().toISOString(),
        cux_Visibility__c: 'Internal',
      })
      onCommentAdded?.()

      // Complete the current stage's review WorkTask
      if (auth?.user?.id) {
        await completeReviewWork(client, contractId, auth.user.id, contractStatus).catch((err) =>
          console.warn('Failed to complete review WorkTask:', err)
        )
      }
      await client.updateRecord('cux_Contract__c', contractId, { cux_Status__c: nextStatus })
      // Log the status change event
      await client.createRecord('cux_ContractEvent__c', {
        cux_Contract__c: contractId,
        cux_Event_Type__c: 'Status Changed',
        cux_Previous_Status__c: contractStatus,
        cux_New_Status__c: nextStatus,
        cux_Event_Detail__c: JSON.stringify({ trigger: 'validation_gate_passed' }),
        cux_Event_Timestamp__c: new Date().toISOString(),
      })
      // Trigger validation for the NEW stage
      await triggerStageValidation(client, 'Contract', contractId, nextStatus)
      // Refetch validation requests so the new stage's checklist appears
      onRefresh()
      onContractUpdated?.()
      onDrawerClose?.()
    } catch (err) {
      console.error('Advance contract error:', err.response?.data || err)
      setAdvanceError(err.response?.data?.[0]?.message || err.message || 'Failed to advance status')
    } finally {
      setAdvanceLoading(false)
    }
  }

  async function handleReturnContract(notes) {
    if (!client) return
    const prevStatus = STATUS_PREV[contractStatus]
    if (!prevStatus) return
    setAdvanceLoading(true)
    setAdvanceError(null)
    try {
      await client.updateRecord('cux_Contract__c', contractId, { cux_Status__c: prevStatus })
      await client.createRecord('cux_ContractEvent__c', {
        cux_Contract__c: contractId,
        cux_Event_Type__c: 'Status Changed',
        cux_Previous_Status__c: contractStatus,
        cux_New_Status__c: prevStatus,
        cux_Event_Detail__c: JSON.stringify({ trigger: 'validation_gate_failed', notes }),
        cux_Event_Timestamp__c: new Date().toISOString(),
      })
      // Reopen the completed review WorkTask and notify the original reviewer
      await reopenReviewWork(client, 'Contract', contractId, contractStatus, auth?.user?.id, notes)
        .catch((err) => console.warn('Failed to reopen review WorkTask:', err))
      onContractUpdated?.()
      onDrawerClose?.()
    } catch (err) {
      console.error('Return contract error:', err.response?.data || err)
      setAdvanceError(err.response?.data?.[0]?.message || err.message || 'Failed to return status')
    } finally {
      setAdvanceLoading(false)
    }
  }

  const canAdvance = contractStatus && STATUS_NEXT[contractStatus]
  const canReturn = contractStatus && STATUS_PREV[contractStatus]

  return (
    <>
    <EntityReviewPanel
      entityLabel="Contract"
      stage={contractStatus}
      validationRequests={validationRequests}
      results={results}
      onRunValidation={handleRunValidation}
      runLoading={runLoading}
      runResult={runResult}
      runError={runError}
      onRefresh={() => { onRefresh(); refetchResults() }}
      onToggleChecklistItem={handleToggleChecklistItem}
      onAdvance={canAdvance ? promptAdvance : undefined}
      onReturn={canReturn ? handleReturnContract : undefined}
      advanceLoading={advanceLoading}
      advanceError={advanceError}
      onReviewComplete={() => {
        if (client && auth?.user?.id) {
          completeReviewWork(client, contractId, auth.user.id, contractStatus).catch((err) =>
            console.warn('Failed to complete review WorkTask:', err)
          )
        }
      }}
    />

    {/* Close Contract card for Executed stage */}
    {contractStatus === 'Executed' && (
      <Card sx={{ borderLeft: 4, borderColor: 'info.main', mt: 2 }}>
        <CardContent>
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            <FlagCheckeredIcon size={32} weight="duotone" color="var(--mui-palette-info-main)" />
            <Stack sx={{ flex: 1 }}>
              <Typography variant="subtitle1">Contract Closure</Typography>
              <Typography variant="body2" color="text.secondary">
                Close this contract after verifying all closure requirements are met.
              </Typography>
            </Stack>
            <Button
              variant="contained"
              color="info"
              onClick={() => { setAttestText(''); setClosureOpen(true) }}
              disabled={advanceLoading}
              startIcon={<FlagCheckeredIcon />}
            >
              Close Contract
            </Button>
          </Stack>
        </CardContent>
      </Card>
    )}

    <Dialog open={attestOpen} onClose={() => setAttestOpen(false)} maxWidth="sm" fullWidth>
      <DialogTitle>Attestation Required</DialogTitle>
      <Divider />
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Alert severity="info" variant="outlined">
            You are advancing this contract from <strong>{contractStatus}</strong> to <strong>{STATUS_NEXT[contractStatus]}</strong>.
            Please confirm that the review has been completed.
          </Alert>
          <Typography variant="body2" color="text.secondary">
            I attest that I have reviewed all checklist items for the <strong>{contractStatus}</strong> stage
            and confirm the contract is ready to proceed.
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
        <Button variant="contained" color="success" onClick={handleAdvanceContract} disabled={advanceLoading}>
          {advanceLoading ? 'Advancing...' : 'Confirm & Advance'}
        </Button>
      </DialogActions>
    </Dialog>

    {/* Closure Checklist Dialog (Executed → Closed) */}
    <Dialog open={closureOpen} onClose={() => setClosureOpen(false)} maxWidth="sm" fullWidth>
      <DialogTitle>Contract Closure Checklist</DialogTitle>
      <Divider />
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Alert severity="info" variant="outlined">
            Before closing this contract, all closure requirements must be met.
          </Alert>
          {closureChecks.map((check) => (
            <Stack key={check.key} direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              {check.toggleable ? (
                <Checkbox
                  checked={check.passed}
                  onChange={handleTogglePerfEval}
                  disabled={perfEvalSaving}
                  size="small"
                  sx={{ p: 0 }}
                />
              ) : check.passed ? (
                <CheckCircleIcon color="var(--mui-palette-success-main)" weight="fill" fontSize="var(--icon-fontSize-md)" />
              ) : (
                <XCircleIcon color="var(--mui-palette-error-main)" weight="fill" fontSize="var(--icon-fontSize-md)" />
              )}
              <Stack spacing={0}>
                <Typography variant="body2" sx={{ fontWeight: check.passed ? 400 : 600 }}>
                  {check.label}
                </Typography>
                {check.auto && (
                  <Typography variant="caption" color="text.secondary">Automated check</Typography>
                )}
              </Stack>
            </Stack>
          ))}
          {!allClosureChecksPassed && (
            <Alert severity="warning" variant="outlined" sx={{ mt: 1 }}>
              Resolve all items above before closing this contract.
            </Alert>
          )}
          {allClosureChecksPassed && (
            <>
              <Divider />
              <Typography variant="body2" color="text.secondary">
                I attest that all closure requirements have been verified and this contract is ready to be closed.
              </Typography>
              <OutlinedInput
                multiline
                minRows={3}
                placeholder="Closure notes (optional)..."
                value={attestText}
                onChange={(e) => setAttestText(e.target.value)}
                fullWidth
              />
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setClosureOpen(false)}>Cancel</Button>
        <Button
          variant="contained"
          color="success"
          onClick={() => { setClosureOpen(false); handleAdvanceContract() }}
          disabled={!allClosureChecksPassed || advanceLoading}
        >
          {advanceLoading ? 'Closing...' : 'Close Contract'}
        </Button>
      </DialogActions>
    </Dialog>
    </>
  )
}

// ─── Contract Map Tab (Gantt Chart) ───

function ContractMapTab({ contract, funding, amendments, taskOrders, invoices }) {
  const chartRef = React.useRef(null)
  const [exporting, setExporting] = React.useState(false)

  const handleExportPdf = React.useCallback(async () => {
    if (!chartRef.current) return
    setExporting(true)
    try {
      // Temporarily expand ALL scrollable containers so html2canvas captures the full chart
      const el = chartRef.current
      const saved = []
      const expandAll = (node) => {
        if (!(node instanceof HTMLElement)) return
        const cs = window.getComputedStyle(node)
        if (cs.overflow !== 'visible' || cs.overflowX !== 'visible' || cs.overflowY !== 'visible' || node.scrollWidth > node.clientWidth || node.scrollHeight > node.clientHeight) {
          saved.push({ node, overflow: node.style.overflow, overflowX: node.style.overflowX, overflowY: node.style.overflowY, maxWidth: node.style.maxWidth, maxHeight: node.style.maxHeight, width: node.style.width, height: node.style.height })
          node.style.overflow = 'visible'
          node.style.overflowX = 'visible'
          node.style.overflowY = 'visible'
          node.style.maxWidth = 'none'
          node.style.maxHeight = 'none'
          if (node.scrollWidth > node.clientWidth) node.style.width = node.scrollWidth + 'px'
          if (node.scrollHeight > node.clientHeight) node.style.height = node.scrollHeight + 'px'
        }
        for (const child of node.children) expandAll(child)
      }
      expandAll(el)

      // Measure the fully-expanded size
      const fullW = el.scrollWidth
      const fullH = el.scrollHeight

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
        width: fullW,
        height: fullH,
        windowWidth: fullW,
        windowHeight: fullH,
      })

      // Restore all saved styles
      for (const s of saved) {
        s.node.style.overflow = s.overflow
        s.node.style.overflowX = s.overflowX
        s.node.style.overflowY = s.overflowY
        s.node.style.maxWidth = s.maxWidth
        s.node.style.maxHeight = s.maxHeight
        s.node.style.width = s.width
        s.node.style.height = s.height
      }

      const imgData = canvas.toDataURL('image/png')

      // US Letter landscape: 279.4 × 215.9 mm
      const pageW = 279.4
      const pageH = 215.9
      const margin = 10
      const contentW = pageW - margin * 2
      const headerH = 14 // space for title + date
      const contentH = pageH - margin * 2 - headerH

      // Scale the image to fit the page width; if it's taller, span multiple pages
      const ratio = contentW / canvas.width
      const imgTotalH = canvas.height * ratio

      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' })

      const totalPages = Math.ceil(imgTotalH / contentH)
      for (let page = 0; page < totalPages; page++) {
        if (page > 0) pdf.addPage('letter', 'landscape')

        // Header on every page
        pdf.setFontSize(12)
        pdf.setTextColor(0)
        pdf.text(`Contract Map — ${contract?.Name || ''}`, margin, margin + 5)
        pdf.setFontSize(8)
        pdf.setTextColor(120)
        pdf.text(`Exported ${new Date().toLocaleDateString()}${totalPages > 1 ? `  •  Page ${page + 1} of ${totalPages}` : ''}`, margin, margin + 10)
        pdf.setTextColor(0)

        // Clip the portion of the image for this page
        const srcY = (page * contentH) / ratio
        const srcH = Math.min(contentH / ratio, canvas.height - srcY)
        const sliceCanvas = document.createElement('canvas')
        sliceCanvas.width = canvas.width
        sliceCanvas.height = Math.round(srcH)
        const ctx = sliceCanvas.getContext('2d')
        ctx.drawImage(canvas, 0, Math.round(srcY), canvas.width, Math.round(srcH), 0, 0, canvas.width, Math.round(srcH))

        const sliceData = sliceCanvas.toDataURL('image/png')
        const sliceH = srcH * ratio
        pdf.addImage(sliceData, 'PNG', margin, margin + headerH, contentW, sliceH)
      }

      pdf.save(`contract-map-${contract?.Name || 'export'}.pdf`)
    } catch (err) {
      console.error('PDF export failed:', err)
    } finally {
      setExporting(false)
    }
  }, [contract])

  const ganttData = React.useMemo(() => {
    if (!contract) return null

    // Group invoices by task order
    const invoicesByTO = {}
    ;(invoices || []).forEach((inv) => {
      const toId = inv.cux_Task_Order__c
      if (!toId) return
      if (!invoicesByTO[toId]) invoicesByTO[toId] = []
      invoicesByTO[toId].push({
        id: inv.Id,
        name: inv.Name,
        startDate: inv.cux_Service_Period_Start__c || inv.cux_Invoice_Date__c,
        endDate: inv.cux_Service_Period_End__c || inv.cux_Service_Period_Start__c || inv.cux_Invoice_Date__c,
        amount: inv.cux_Amount__c || 0,
      })
    })

    return {
      id: contract.Id,
      name: `${contract.Name} — ${contract.cux_Title__c || 'Contract'}`,
      contractNumber: contract.Name,
      startDate: contract.cux_Start_Date__c,
      endDate: contract.cux_End_Date__c,
      funding: (funding || []).map((f) => ({
        id: f.Id,
        name: f.cux_Funding_Code__r?.cux_Fund_Name__c || f.cux_Funding_Source__c || f.cux_Funding_Code__r?.cux_Code__c || f.Name,
        amount: f.cux_Allocated_Amount__c || 0,
        startDate: f.cux_Start_Date__c || contract.cux_Start_Date__c,
        endDate: f.cux_End_Date__c || contract.cux_End_Date__c,
      })),
      amendments: (amendments || [])
        .filter((a) => a.cux_Amendment_Date__c || a.cux_Applied_At__c || a.CreatedDate)
        .map((a) => ({
          id: a.Id,
          executionDate: a.cux_Amendment_Date__c || a.cux_Applied_At__c?.substring(0, 10) || a.CreatedDate?.substring(0, 10),
          reason: a.cux_Amendment_Narrative__c || a.cux_Proposed_Changes__c || a.Name,
        })),
      taskOrders: (taskOrders || [])
        .filter((to) => to.cux_Start_Date__c && to.cux_End_Date__c)
        .map((to) => ({
          id: to.Id,
          name: `${to.Name} — ${to.cux_Task_Order_Type__c || 'Task Order'}`,
          startDate: to.cux_Start_Date__c,
          endDate: to.cux_End_Date__c,
          invoices: (invoicesByTO[to.Id] || []).filter((inv) => inv.startDate && inv.endDate),
        })),
    }
  }, [contract, funding, amendments, taskOrders, invoices])

  if (!ganttData || !contract?.cux_Start_Date__c || !contract?.cux_End_Date__c) {
    return (
      <Card>
        <CardContent>
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            Contract must have start and end dates to display the contract map.
          </Typography>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader
        title="Contract Map"
        subheader="Timeline of funding sources, task orders, amendments and invoices"
        action={
          <Button
            variant="outlined"
            size="small"
            disabled={exporting}
            onClick={handleExportPdf}
            startIcon={exporting ? <CircularProgress size={16} /> : <FileTextIcon />}
          >
            {exporting ? 'Exporting…' : 'Export PDF'}
          </Button>
        }
      />
      <Divider />
      <CardContent sx={{ p: 0 }} ref={chartRef}>
        {ganttData && <GanttChart data={{ contract: ganttData }} />}
      </CardContent>
    </Card>
  )
}
