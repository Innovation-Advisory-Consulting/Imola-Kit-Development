import * as React from 'react'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import TextField from '@mui/material/TextField'
import LinearProgress from '@mui/material/LinearProgress'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { CaretDownIcon } from '@phosphor-icons/react/dist/ssr/CaretDown'
import { CheckCircleIcon } from '@phosphor-icons/react/dist/ssr/CheckCircle'
import { ClipboardTextIcon } from '@phosphor-icons/react/dist/ssr/ClipboardText'
import { FileTextIcon } from '@phosphor-icons/react/dist/ssr/FileText'
import { GearSixIcon } from '@phosphor-icons/react/dist/ssr/GearSix'
import { LockIcon } from '@phosphor-icons/react/dist/ssr/Lock'
import { ShieldCheckIcon } from '@phosphor-icons/react/dist/ssr/ShieldCheck'
import { WarningCircleIcon } from '@phosphor-icons/react/dist/ssr/WarningCircle'
import { XCircleIcon } from '@phosphor-icons/react/dist/ssr/XCircle'

import { dayjs } from '@/lib/dayjs'

const outcomeConfig = {
  PASS: { color: 'success', icon: CheckCircleIcon, label: 'Passed' },
  WARN: { color: 'warning', icon: WarningCircleIcon, label: 'Needs Review' },
  FAIL: { color: 'error', icon: XCircleIcon, label: 'Failed' },
}

const severityWeight = { CRITICAL: 4, ERROR: 3, WARNING: 2, INFO: 1 }

function groupResults(results) {
  const checklist = []
  const rules = []
  const documents = []
  const gates = []

  for (const r of results) {
    if (r.cux_Result_Type__c === 'CHECKLIST') {
      checklist.push(r)
    } else if (r.cux_Result_Type__c === 'DOCUMENT') {
      documents.push(r)
    } else if (r.cux_Rule_Id__c?.includes('GATE')) {
      gates.push(r)
    } else {
      rules.push(r)
    }
  }

  return { checklist, rules, documents, gates }
}

function extractTaskTitle(message) {
  if (!message) return 'Untitled task'
  let text = message
    .replace(/^Checklist task pending:\s*/i, '')
    .replace(/^Checklist task verified:\s*/i, '')
    .replace(/^Document check pending:\s*/i, '')
    .replace(/^Expression evaluation deferred:\s*/i, '')
    .replace(/^All conditions satisfied:\s*/i, '')
    .replace(/^Failed conditions:\s*/i, 'Failed: ')

  // If the result is still a raw expression (legacy data), humanize it
  if (/^cux_\w+__c\s*(!=|==|>|<|>=|<=)/.test(text)) {
    text = humanizeExpression(text)
  }
  return text
}

/** Turn a raw field expression like "cux_Title__c != null" into readable text. */
function humanizeExpression(expr) {
  return expr
    .replace(/\bcux_(\w+?)__c\b/g, (_, name) => name.replace(/_/g, ' '))
    .replace(/\s*!=\s*null\b/g, ' is present')
    .replace(/\s*==\s*null\b/g, ' is empty')
    .replace(/\s*>\s*0\b/g, ' is greater than zero')
    .replace(/\bAND\b/g, 'and')
}

function ProgressSummary({ results }) {
  // Exclude gate results — gates are derived, not independent items
  const actionable = results.filter((r) => !r.cux_Rule_Id__c?.includes('GATE'))
  const total = actionable.length
  const passed = actionable.filter((r) => r.cux_Outcome__c === 'PASS').length
  const failed = actionable.filter((r) => r.cux_Outcome__c === 'FAIL').length
  const pending = total - passed - failed
  const progress = total > 0 ? (passed / total) * 100 : 0

  return (
    <Card>
      <CardContent sx={{ py: 2.5 }}>
        <Stack spacing={2}>
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Review Progress</Typography>
            <Typography variant="h6" color={progress === 100 ? 'success.main' : 'text.secondary'}>
              {Math.round(progress)}%
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 10,
              borderRadius: 5,
              bgcolor: 'action.hover',
              '& .MuiLinearProgress-bar': {
                borderRadius: 5,
                bgcolor: progress === 100 ? 'success.main' : 'primary.main',
              },
            }}
          />
          <Stack direction="row" spacing={3}>
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
              <CheckCircleIcon color="var(--mui-palette-success-main)" size={16} />
              <Typography variant="body2">{passed} completed</Typography>
            </Stack>
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
              <WarningCircleIcon color="var(--mui-palette-warning-main)" size={16} />
              <Typography variant="body2">{pending} pending</Typography>
            </Stack>
            {failed > 0 && (
              <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                <XCircleIcon color="var(--mui-palette-error-main)" size={16} />
                <Typography variant="body2">{failed} failed</Typography>
              </Stack>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}

function ReviewSection({ title, icon: Icon, results, onToggleItem, updatingIds, defaultExpanded = true }) {
  if (!results || results.length === 0) return null

  const passCount = results.filter((r) => r.cux_Outcome__c === 'PASS').length
  const allPassed = passCount === results.length
  const failCount = results.filter((r) => r.cux_Outcome__c === 'FAIL').length

  return (
    <Accordion defaultExpanded={defaultExpanded} disableGutters sx={{ '&:before': { display: 'none' } }}>
      <AccordionSummary expandIcon={<CaretDownIcon />}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', width: '100%', pr: 2 }}>
          <Icon
            size={22}
            weight="duotone"
            color={
              allPassed
                ? 'var(--mui-palette-success-main)'
                : failCount > 0
                  ? 'var(--mui-palette-error-main)'
                  : 'var(--mui-palette-warning-main)'
            }
          />
          <Typography variant="subtitle1" sx={{ flex: 1 }}>
            {title}
          </Typography>
          <Chip
            label={`${passCount}/${results.length}`}
            size="small"
            color={allPassed ? 'success' : failCount > 0 ? 'error' : 'warning'}
            variant="soft"
          />
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 0 }}>
        <List disablePadding>
          {results
            .sort((a, b) => (severityWeight[b.cux_Severity__c] || 0) - (severityWeight[a.cux_Severity__c] || 0))
            .map((result) => {
              const config = outcomeConfig[result.cux_Outcome__c] || outcomeConfig.WARN
              const StatusIcon = config.icon
              const outcome = result.cux_Outcome__c
              const isManual = result.cux_Execution_Mode__c === 'MANUAL'
              const isUpdating = updatingIds.has(result.Id)
              const taskTitle = extractTaskTitle(result.cux_Message__c)

              const secondaryText = isManual
                ? outcome === 'PASS' ? 'Verified by reviewer'
                  : outcome === 'FAIL' ? 'Rejected by reviewer'
                  : 'Pending review'
                : config.label

              return (
                <React.Fragment key={result.Id}>
                  <ListItem sx={{ py: 1.5, px: 2 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {isUpdating ? (
                        <CircularProgress size={20} />
                      ) : (
                        <StatusIcon
                          size={22}
                          weight="fill"
                          color={`var(--mui-palette-${config.color}-main)`}
                        />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={taskTitle}
                      primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                      secondary={secondaryText}
                      secondaryTypographyProps={{ variant: 'caption' }}
                      sx={{ mr: 1 }}
                    />
                    {isManual && !isUpdating && (
                      <Typography variant="caption" sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
                        {outcome !== 'PASS' && (
                          <Typography component="span" variant="caption" sx={{ color: 'success.main', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }} onClick={() => onToggleItem(result.Id, 'PASS')}>Approve</Typography>
                        )}
                        {outcome !== 'PASS' && outcome !== 'FAIL' && ' | '}
                        {outcome !== 'FAIL' && (
                          <Typography component="span" variant="caption" sx={{ color: 'error.main', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }} onClick={() => onToggleItem(result.Id, 'FAIL')}>Reject</Typography>
                        )}
                        {outcome !== 'WARN' && ' | '}
                        {outcome !== 'WARN' && (
                          <Typography component="span" variant="caption" sx={{ color: 'text.secondary', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }} onClick={() => onToggleItem(result.Id, 'WARN')}>Reset</Typography>
                        )}
                      </Typography>
                    )}
                    <Chip
                      label={result.cux_Rule_Id__c}
                      size="small"
                      variant="soft"
                      sx={{ fontSize: '0.7rem', height: 22, ml: 1, flexShrink: 0 }}
                    />
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              )
            })}
        </List>
      </AccordionDetails>
    </Accordion>
  )
}

/**
 * Computes approval gate status dynamically from current results.
 * This ensures the gate reflects real-time checklist toggles.
 */
function computeLiveGate(results) {
  if (!results || results.length === 0) return null

  // Only consider non-gate results for gate computation
  const actionable = results.filter((r) => !r.cux_Rule_Id__c?.includes('GATE'))

  // All non-PASS items block approval (checklist, documents, rules — everything must pass)
  const incomplete = actionable.filter((r) => r.cux_Outcome__c !== 'PASS')
  const allowed = incomplete.length === 0

  return {
    allowed,
    message: allowed
      ? 'All review items completed — contract is eligible for approval'
      : `Approval blocked: ${incomplete.length} incomplete item${incomplete.length !== 1 ? 's' : ''}`,
    blockingFindings: incomplete.filter((r) => r.cux_Outcome__c === 'FAIL'),
    requiredTasksIncomplete: incomplete.filter((r) => r.cux_Outcome__c !== 'FAIL'),
  }
}

function ApprovalGateSummary({ results, onAdvanceContract, onReturnContract, advanceLoading }) {
  const gate = React.useMemo(() => computeLiveGate(results), [results])
  const [returnOpen, setReturnOpen] = React.useState(false)
  const [returnNotes, setReturnNotes] = React.useState('')

  if (!gate) return null

  const hasFails = gate.blockingFindings.length > 0

  function handleReturnSubmit() {
    if (!returnNotes.trim()) return
    onReturnContract(returnNotes.trim())
    setReturnOpen(false)
    setReturnNotes('')
  }

  return (
    <>
      <Card
        sx={{
          borderLeft: 4,
          borderColor: gate.allowed ? 'success.main' : 'error.main',
        }}
      >
        <CardContent>
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            {gate.allowed ? (
              <ShieldCheckIcon size={32} weight="duotone" color="var(--mui-palette-success-main)" />
            ) : (
              <LockIcon size={32} weight="duotone" color="var(--mui-palette-error-main)" />
            )}
            <Stack sx={{ flex: 1 }}>
              <Typography variant="subtitle1">
                {gate.allowed ? 'Ready for Approval' : 'Approval Blocked'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {gate.message}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1}>
              {gate.allowed && onAdvanceContract ? (
                <Button
                  variant="contained"
                  color="success"
                  onClick={onAdvanceContract}
                  disabled={advanceLoading}
                  startIcon={advanceLoading ? <CircularProgress size={16} /> : <ShieldCheckIcon />}
                >
                  {advanceLoading ? 'Advancing...' : 'Advance Contract'}
                </Button>
              ) : (
                <>
                  {hasFails && onReturnContract && (
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => setReturnOpen(true)}
                      disabled={advanceLoading}
                      size="small"
                    >
                      Return to Previous Status
                    </Button>
                  )}
                  <Chip
                    label="BLOCKED"
                    color="error"
                    variant="soft"
                  />
                </>
              )}
            </Stack>
          </Stack>

          {!gate.allowed && (gate.blockingFindings.length > 0 || gate.requiredTasksIncomplete.length > 0) && (
            <Box sx={{ mt: 2, pl: 6 }}>
              {gate.blockingFindings.length > 0 && (
                <Typography variant="caption" color="error.main">
                  {gate.blockingFindings.length} blocking finding{gate.blockingFindings.length !== 1 ? 's' : ''}
                </Typography>
              )}
              {gate.requiredTasksIncomplete.length > 0 && (
                <Typography variant="caption" color="warning.main" sx={{ display: 'block' }}>
                  {gate.requiredTasksIncomplete.length} incomplete required task{gate.requiredTasksIncomplete.length !== 1 ? 's' : ''}
                </Typography>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog open={returnOpen} onClose={() => setReturnOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Return Contract to Previous Status</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Provide a reason for returning this contract. This will be recorded in the contract event log.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={3}
            label="Reason for return"
            placeholder="Describe why this contract is being returned..."
            value={returnNotes}
            onChange={(e) => setReturnNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReturnOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleReturnSubmit}
            disabled={!returnNotes.trim() || advanceLoading}
          >
            {advanceLoading ? 'Returning...' : 'Confirm Return'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export function ContractReviewPanel({
  contractId,
  validationRequests,
  results: resultsProp,
  onRunValidation,
  runLoading,
  runResult,
  runError,
  onRefresh,
  onToggleChecklistItem,
  onAdvanceContract,
  onReturnContract,
  advanceLoading,
}) {
  const [updatingIds, setUpdatingIds] = React.useState(new Set())
  const [localResults, setLocalResults] = React.useState([])

  // Sync from prop
  React.useEffect(() => {
    if (resultsProp) setLocalResults(resultsProp)
  }, [resultsProp])

  const results = localResults

  // Use the most recent completed request
  const latestRequest = React.useMemo(() => {
    if (!validationRequests?.length) return null
    const completed = validationRequests.filter((r) => r.cux_Status__c === 'Completed')
    return completed.length > 0
      ? completed.reduce((a, b) =>
          new Date(b.cux_Requested_At__c) > new Date(a.cux_Requested_At__c) ? b : a
        )
      : validationRequests[0]
  }, [validationRequests])

  const grouped = React.useMemo(() => groupResults(results), [results])

  async function handleToggleItem(resultId, outcome) {
    setUpdatingIds((prev) => new Set(prev).add(resultId))
    const statusMap = { PASS: 'Pass', FAIL: 'Fail', WARN: 'Manual Review Required' }
    // Optimistic update
    setLocalResults((prev) =>
      prev.map((r) =>
        r.Id === resultId
          ? {
              ...r,
              cux_Outcome__c: outcome,
              cux_Result_Status__c: statusMap[outcome] || 'Manual Review Required',
            }
          : r
      )
    )
    try {
      await onToggleChecklistItem(resultId, outcome)
    } catch {
      // Revert on error
      if (resultsProp) setLocalResults(resultsProp)
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev)
        next.delete(resultId)
        return next
      })
    }
  }

  const hasNoValidation = !validationRequests?.length

  // Compute live status from current results
  const liveGate = React.useMemo(() => computeLiveGate(results), [results])
  const liveOutcome = liveGate?.allowed ? 'PASS' : results.some((r) => r.cux_Outcome__c === 'FAIL') ? 'FAIL' : 'WARN'

  return (
    <Stack spacing={3}>
      {/* Run / Re-run Validation */}
      <Card>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' } }}>
            <Button
              variant="contained"
              onClick={onRunValidation}
              disabled={runLoading}
              startIcon={runLoading ? <CircularProgress size={16} /> : <ShieldCheckIcon />}
              size="large"
            >
              {runLoading ? 'Running Validation...' : hasNoValidation ? 'Start Contract Review' : 'Re-run Validation'}
            </Button>
            {latestRequest && (
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Chip
                  label={liveOutcome === 'PASS' ? 'PASS' : liveOutcome}
                  color={liveOutcome === 'PASS' ? 'success' : liveOutcome === 'FAIL' ? 'error' : 'warning'}
                  size="small"
                  variant="soft"
                />
                <Typography variant="caption" color="text.secondary">
                  Last run: {dayjs(latestRequest.cux_Requested_At__c).format('MMM D, h:mm A')}
                </Typography>
              </Stack>
            )}
            {runError && (
              <Typography color="error" variant="body2">
                {runError.message}
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>

      {hasNoValidation ? (
        <Alert severity="info" icon={<ShieldCheckIcon />}>
          No validation has been run for this contract yet. Click "Start Contract Review" to generate the review checklist
          and run automated validation rules.
        </Alert>
      ) : (
        <>
          {/* Progress Summary */}
          {results.length > 0 && <ProgressSummary results={results} />}

          {/* Approval Gate — computed live from current results */}
          <ApprovalGateSummary results={results} onAdvanceContract={onAdvanceContract} onReturnContract={onReturnContract} advanceLoading={advanceLoading} />

          {/* Review Sections */}
          {results.length > 0 ? (
            <Card>
              <CardHeader
                title="Review Checklist"
                subheader="Complete each item to advance contract toward approval"
              />
              <Divider />
              <ReviewSection
                title="Manual Verification"
                icon={ClipboardTextIcon}
                results={grouped.checklist}
                onToggleItem={handleToggleItem}
                updatingIds={updatingIds}
              />
              <ReviewSection
                title="Document Requirements"
                icon={FileTextIcon}
                results={grouped.documents}
                onToggleItem={handleToggleItem}
                updatingIds={updatingIds}
              />
              <ReviewSection
                title="Automated Rule Checks"
                icon={GearSixIcon}
                results={grouped.rules}
                onToggleItem={handleToggleItem}
                updatingIds={updatingIds}
                defaultExpanded={grouped.rules.some((r) => r.cux_Outcome__c !== 'PASS')}
              />
              {/* Gate status is shown dynamically in ApprovalGateSummary above */}
            </Card>
          ) : null}

          {/* History (collapsed) */}
          {validationRequests?.length > 1 && (
            <Accordion disableGutters sx={{ '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<CaretDownIcon />}>
                <Typography variant="subtitle2" color="text.secondary">
                  Validation History ({validationRequests.length} runs)
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                <List disablePadding dense>
                  {validationRequests.map((req) => (
                    <React.Fragment key={req.Id}>
                      <ListItem>
                        <ListItemText
                          primary={`${req.Name} — ${req.cux_Outcome__c || req.cux_Status__c}`}
                          secondary={dayjs(req.cux_Requested_At__c).format('MMM D, YYYY h:mm A')}
                          primaryTypographyProps={{ variant: 'body2' }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                        <Chip
                          label={req.cux_Outcome__c || req.cux_Status__c}
                          size="small"
                          variant="soft"
                          color={
                            req.cux_Outcome__c === 'PASS'
                              ? 'success'
                              : req.cux_Outcome__c === 'FAIL'
                                ? 'error'
                                : 'warning'
                          }
                        />
                      </ListItem>
                      <Divider component="li" />
                    </React.Fragment>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          )}
        </>
      )}
    </Stack>
  )
}
