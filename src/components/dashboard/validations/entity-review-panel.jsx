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
import Switch from '@mui/material/Switch'
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

import { LockIcon } from '@phosphor-icons/react/dist/ssr/Lock'
import { ShieldCheckIcon } from '@phosphor-icons/react/dist/ssr/ShieldCheck'
import { WarningCircleIcon } from '@phosphor-icons/react/dist/ssr/WarningCircle'
import { dayjs } from '@/lib/dayjs'

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
  // Exclude gate results and legacy RULE results — only checklist and document items matter
  const actionable = results.filter((r) => !r.cux_Rule_Id__c?.includes('GATE') && r.cux_Result_Type__c !== 'RULE')
  const total = actionable.length
  const completed = actionable.filter((r) => r.cux_Outcome__c === 'PASS').length
  const progress = total > 0 ? (completed / total) * 100 : 0

  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          flex: 1,
          height: 8,
          borderRadius: 4,
          bgcolor: 'action.hover',
          '& .MuiLinearProgress-bar': {
            borderRadius: 4,
            bgcolor: progress === 100 ? 'success.main' : 'primary.main',
          },
        }}
      />
      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
        {completed}/{total}
      </Typography>
    </Stack>
  )
}

function ReviewSection({ title, icon: Icon, results, onToggleItem, updatingIds, defaultExpanded = true }) {
  if (!results || results.length === 0) return null

  const passCount = results.filter((r) => r.cux_Outcome__c === 'PASS').length
  const allPassed = passCount === results.length

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
                : 'var(--mui-palette-warning-main)'
            }
          />
          <Typography variant="subtitle1" sx={{ flex: 1 }}>
            {title}
          </Typography>
          <Chip
            label={`${passCount}/${results.length}`}
            size="small"
            color={allPassed ? 'success' : 'warning'}
            variant="soft"
          />
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 0 }}>
        <List disablePadding>
          {results
            .sort((a, b) => (severityWeight[b.cux_Severity__c] || 0) - (severityWeight[a.cux_Severity__c] || 0))
            .map((result) => {
              const isCompleted = result.cux_Outcome__c === 'PASS'
              const isManual = result.cux_Execution_Mode__c === 'MANUAL'
              const isUpdating = updatingIds.has(result.Id)
              const taskTitle = extractTaskTitle(result.cux_Message__c)

              const StatusIcon = isCompleted ? CheckCircleIcon : WarningCircleIcon
              const statusColor = isCompleted ? 'success' : 'warning'

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
                          color={`var(--mui-palette-${statusColor}-main)`}
                        />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={taskTitle}
                      primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                      secondary={isCompleted ? 'Completed' : 'Not completed'}
                      secondaryTypographyProps={{ variant: 'caption' }}
                      sx={{ mr: 1 }}
                    />
                    {isManual && !isUpdating && (
                      <Switch
                        checked={isCompleted}
                        onChange={() => onToggleItem(result.Id, isCompleted ? 'WARN' : 'PASS')}
                        size="small"
                        color="success"
                      />
                    )}
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

  // Only consider non-gate, non-RULE results for gate computation
  const actionable = results.filter((r) => !r.cux_Rule_Id__c?.includes('GATE') && r.cux_Result_Type__c !== 'RULE')

  // Items are either completed (PASS) or not completed
  const incomplete = actionable.filter((r) => r.cux_Outcome__c !== 'PASS')
  const allowed = incomplete.length === 0

  return {
    allowed,
    message: allowed
      ? 'All review items completed — eligible for approval'
      : `${incomplete.length} incomplete item${incomplete.length !== 1 ? 's' : ''} remaining`,
    incompleteItems: incomplete,
  }
}

function ApprovalGateSummary({ results, entityLabel, onAdvance, onReturn, advanceLoading }) {
  const gate = React.useMemo(() => computeLiveGate(results), [results])
  const [returnOpen, setReturnOpen] = React.useState(false)
  const [returnNotes, setReturnNotes] = React.useState('')

  if (!gate) return null

  const hasIncomplete = gate.incompleteItems.length > 0

  function handleReturnSubmit() {
    if (!returnNotes.trim()) return
    onReturn(returnNotes.trim())
    setReturnOpen(false)
    setReturnNotes('')
  }

  return (
    <>
      <Card
        sx={{
          borderLeft: 4,
          borderColor: gate.allowed ? 'success.main' : 'warning.main',
        }}
      >
        <CardContent>
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            {gate.allowed ? (
              <ShieldCheckIcon size={32} weight="duotone" color="var(--mui-palette-success-main)" />
            ) : (
              <LockIcon size={32} weight="duotone" color="var(--mui-palette-warning-main)" />
            )}
            <Stack sx={{ flex: 1 }}>
              <Typography variant="subtitle1">
                {gate.allowed ? 'Ready for Approval' : 'Checklist Incomplete'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {gate.message}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1}>
              {gate.allowed && onAdvance ? (
                <Button
                  variant="contained"
                  color="success"
                  onClick={onAdvance}
                  disabled={advanceLoading}
                  startIcon={advanceLoading ? <CircularProgress size={16} /> : <ShieldCheckIcon />}
                >
                  {advanceLoading ? 'Advancing...' : `Advance ${entityLabel}`}
                </Button>
              ) : gate.allowed ? (
                <Chip
                  label="COMPLETE"
                  color="success"
                  variant="soft"
                />
              ) : (
                <>
                  {hasIncomplete && onReturn && (
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
                    label={`${gate.incompleteItems.length} REMAINING`}
                    color="warning"
                    variant="soft"
                  />
                </>
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Dialog open={returnOpen} onClose={() => setReturnOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Return {entityLabel} to Previous Status</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Provide a reason for returning this {entityLabel.toLowerCase()}. This will be recorded in the event log.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={3}
            label="Reason for return"
            placeholder={`Describe why this ${entityLabel.toLowerCase()} is being returned...`}
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

export function EntityReviewPanel({
  entityLabel = 'Contract',
  stage,
  validationRequests,
  results: resultsProp,
  onRunValidation,
  runLoading,
  runResult,
  runError,
  onRefresh,
  onToggleChecklistItem,
  onAdvance,
  onReturn,
  advanceLoading,
  advanceError,
  onReviewComplete,
}) {
  const [updatingIds, setUpdatingIds] = React.useState(new Set())
  const [localResults, setLocalResults] = React.useState([])

  // Sync from prop
  React.useEffect(() => {
    if (resultsProp) setLocalResults(resultsProp)
  }, [resultsProp])

  const results = localResults

  // Use the most recent completed request for the current stage only
  const latestRequest = React.useMemo(() => {
    if (!validationRequests?.length) return null
    // Only show results for the current stage — never fall back to a different stage
    const stageFiltered = stage
      ? validationRequests.filter((r) => r.cux_Stage__c === stage)
      : validationRequests
    if (stageFiltered.length === 0) return null
    const completed = stageFiltered.filter((r) => r.cux_Status__c === 'Completed')
    return completed.length > 0
      ? completed.reduce((a, b) =>
          new Date(b.cux_Requested_At__c) > new Date(a.cux_Requested_At__c) ? b : a
        )
      : stageFiltered[0]
  }, [validationRequests, stage])

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
      // Check if all actionable items are now PASS → auto-complete review work task
      if (outcome === 'PASS') {
        // Read the optimistically-updated results (applied synchronously above)
        const actionable = localResults
          .map((r) => (r.Id === resultId ? { ...r, cux_Outcome__c: outcome } : r))
          .filter((r) => !r.cux_Rule_Id__c?.includes('GATE') && r.cux_Result_Type__c !== 'RULE')
        const allPassed = actionable.length > 0 && actionable.every((r) => r.cux_Outcome__c === 'PASS')
        if (allPassed) onReviewComplete?.()
      }
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

  const hasNoValidation = !latestRequest

  // Compute live status from current results
  const liveGate = React.useMemo(() => computeLiveGate(results), [results])
  const liveOutcome = liveGate?.allowed ? 'PASS' : 'WARN'

  return (
    <Stack spacing={3}>
      {/* Run / Re-run Validation + Progress */}
      <Card>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                onClick={onRunValidation}
                disabled={runLoading}
                startIcon={runLoading ? <CircularProgress size={14} /> : <ShieldCheckIcon size={16} />}
                size="small"
              >
                {runLoading ? 'Running...' : hasNoValidation ? 'Start Review' : 'Re-run'}
              </Button>
              {stage && (
                <Chip label={stage} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
              )}
              {latestRequest && (
                <Chip
                  label={liveOutcome === 'PASS' ? 'PASS' : liveOutcome}
                  color={liveOutcome === 'PASS' ? 'success' : liveOutcome === 'FAIL' ? 'error' : 'warning'}
                  size="small"
                  variant="soft"
                />
              )}
              {latestRequest && (
                <Typography variant="caption" color="text.secondary">
                  {dayjs(latestRequest.cux_Requested_At__c).format('MMM D, h:mm A')}
                </Typography>
              )}
              {runError && (
                <Typography color="error" variant="caption">
                  {runError.message}
                </Typography>
              )}
            </Stack>
            {!hasNoValidation && results.length > 0 && <ProgressSummary results={results} />}
          </Stack>
        </CardContent>
      </Card>

      {hasNoValidation ? (
        <Alert severity="info" icon={<ShieldCheckIcon />}>
          No validation has been run yet. Click &quot;Start Review&quot; to generate the checklist.
        </Alert>
      ) : (
        <>
          {/* Approval Gate — computed live from current results */}
          <ApprovalGateSummary results={results} entityLabel={entityLabel} onAdvance={onAdvance} onReturn={onReturn} advanceLoading={advanceLoading} />
          {advanceError && <Alert severity="error" sx={{ mt: 1 }}>{advanceError}</Alert>}

          {/* Review Sections */}
          {results.length > 0 ? (
            <Card>
              <CardHeader
                title="Review Checklist"
                subheader={`Complete each item to advance ${entityLabel.toLowerCase()} toward approval`}
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
                          secondary={
                            (req.cux_Stage__c ? `[${req.cux_Stage__c}] · ` : '') +
                            dayjs(req.cux_Requested_At__c).format('MMM D, YYYY h:mm A')
                          }
                          primaryTypographyProps={{ variant: 'body2' }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', flexShrink: 0 }}>
                          {req.cux_Stage__c && (
                            <Chip
                              label={req.cux_Stage__c}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem', height: 22 }}
                            />
                          )}
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
                        </Stack>
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
