import * as React from 'react'
import Box from '@mui/material/Box'
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
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import Link from '@mui/material/Link'
import MenuItem from '@mui/material/MenuItem'
import OutlinedInput from '@mui/material/OutlinedInput'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr/ArrowLeft'
import { PencilSimpleIcon } from '@phosphor-icons/react/dist/ssr/PencilSimple'
import { PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus'
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

const metadata = { title: `Details | Rule Sets | Dashboard | ${appConfig.name}` }

const TARGET_ENTITY_TYPES = ['Contract', 'Amendment', 'TaskOrder', 'Termination', 'Settlement', 'Invoice']
const RULE_TYPES = ['RULE', 'DOCUMENT', 'AI', 'CHECKLIST_GATE']
const SEVERITY_LEVELS = ['INFO', 'WARNING', 'ERROR', 'CRITICAL']
const EXECUTION_MODES = ['AUTOMATED', 'MANUAL', 'AI_ASSISTED', 'HYBRID']

const severityColorMap = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'error',
}

export function Page() {
  const { ruleSetId } = useParams()
  const client = useSalesforceClient()

  const { data: ruleSet, loading, error, refetch: refetchRuleSet } = useSalesforceQuery(
    (client) => client.getRuleSet(ruleSetId),
    [ruleSetId]
  )

  const { data: validationRules, refetch: refetchRules } = useSalesforceQuery(
    (client) => client.getValidationRules(ruleSetId),
    [ruleSetId]
  )

  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [ruleDialogOpen, setRuleDialogOpen] = React.useState(false)
  const [editingRule, setEditingRule] = React.useState(null)

  function handleAddRule() {
    setEditingRule(null)
    setRuleDialogOpen(true)
  }

  function handleEditRule(rule) {
    setEditingRule(rule)
    setRuleDialogOpen(true)
  }

  async function handleDeleteRule(ruleId) {
    if (!client) return
    try {
      await client.deleteValidationRule(ruleId)
      refetchRules()
    } catch (err) {
      // Silent fail — could add snackbar later
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
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        Failed to load rule set: {error.message}
      </Alert>
    )
  }

  if (!ruleSet) {
    return (
      <Alert severity="warning" sx={{ m: 3 }}>
        Rule set not found
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
          {/* Back link + header */}
          <Stack spacing={3}>
            <div>
              <Link
                color="text.primary"
                component={RouterLink}
                href={paths.dashboard.validations.ruleSets.list}
                sx={{ alignItems: 'center', display: 'inline-flex', gap: 1 }}
                variant="subtitle2"
              >
                <ArrowLeftIcon fontSize="var(--icon-fontSize-md)" />
                Rule Sets
              </Link>
            </div>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ alignItems: 'flex-start' }}>
              <Stack sx={{ flex: '1 1 auto' }} spacing={1}>
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                  <Typography variant="h4">{ruleSet.cux_Rule_Set_Name__c || ruleSet.Name}</Typography>
                  <Chip
                    color={ruleSet.cux_Is_Active__c ? 'success' : 'default'}
                    label={ruleSet.cux_Is_Active__c ? 'Active' : 'Inactive'}
                    size="small"
                    variant="soft"
                  />
                </Stack>
                <Typography color="text.secondary" variant="body1">
                  {ruleSet.Name}
                </Typography>
              </Stack>
              <Button
                startIcon={<PencilSimpleIcon />}
                variant="outlined"
                onClick={() => setEditDialogOpen(true)}
              >
                Edit
              </Button>
            </Stack>
          </Stack>

          {/* Detail card */}
          <Card>
            <CardHeader title="Rule Set Details" />
            <Divider />
            <PropertyList divider={<Divider />} sx={{ '--PropertyItem-padding': '12px 24px' }}>
              {[
                { key: 'Rule Set #', value: ruleSet.Name },
                { key: 'Rule Set Name', value: ruleSet.cux_Rule_Set_Name__c },
                { key: 'Target Entity', value: ruleSet.cux_Target_Entity_Type__c },
                { key: 'Version', value: ruleSet.cux_Version__c },
                { key: 'Description', value: ruleSet.cux_Description__c },
                {
                  key: 'Effective Start',
                  value: ruleSet.cux_Effective_Start__c ? dayjs(ruleSet.cux_Effective_Start__c).format('MMM D, YYYY') : null,
                },
                {
                  key: 'Effective End',
                  value: ruleSet.cux_Effective_End__c ? dayjs(ruleSet.cux_Effective_End__c).format('MMM D, YYYY') : null,
                },
                {
                  key: 'Created',
                  value: ruleSet.CreatedDate ? dayjs(ruleSet.CreatedDate).format('MMM D, YYYY h:mm A') : null,
                },
                {
                  key: 'Last Modified',
                  value: ruleSet.LastModifiedDate ? dayjs(ruleSet.LastModifiedDate).format('MMM D, YYYY h:mm A') : null,
                },
              ].map((item) => (
                <PropertyItem key={item.key} name={item.key} value={item.value} />
              ))}
            </PropertyList>
          </Card>

          {/* Validation Rules section */}
          <Card>
            <CardHeader
              title="Validation Rules"
              action={
                <Button startIcon={<PlusIcon />} variant="contained" size="small" onClick={handleAddRule}>
                  Add Rule
                </Button>
              }
            />
            <Divider />
            {!validationRules?.length ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary" variant="body2">
                  No validation rules found
                </Typography>
              </Box>
            ) : (
              <React.Fragment>
                <Box sx={{ overflowX: 'auto' }}>
                  <Table sx={{ minWidth: 900 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Sort #</TableCell>
                        <TableCell>Rule Code</TableCell>
                        <TableCell>Title</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Severity</TableCell>
                        <TableCell>Blocking</TableCell>
                        <TableCell>Exec Mode</TableCell>
                        <TableCell>Active</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {validationRules.map((rule) => (
                        <TableRow hover key={rule.Id} sx={{ '&:last-child td': { border: 0 } }}>
                          <TableCell>{rule.cux_Sort_Order__c ?? '\u2014'}</TableCell>
                          <TableCell>
                            <Typography variant="subtitle2">{rule.cux_Rule_Code__c || '\u2014'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ maxWidth: 200 }} noWrap>
                              {rule.cux_Title__c || '\u2014'}
                            </Typography>
                          </TableCell>
                          <TableCell>{rule.cux_Rule_Type__c || '\u2014'}</TableCell>
                          <TableCell>
                            <Chip
                              color={severityColorMap[rule.cux_Severity__c] || 'default'}
                              label={rule.cux_Severity__c || '\u2014'}
                              size="small"
                              variant="soft"
                            />
                          </TableCell>
                          <TableCell>{rule.cux_Blocking__c ? 'Yes' : 'No'}</TableCell>
                          <TableCell>{rule.cux_Execution_Default_Mode__c || '\u2014'}</TableCell>
                          <TableCell>
                            <Chip
                              color={rule.cux_Is_Active__c ? 'success' : 'default'}
                              label={rule.cux_Is_Active__c ? 'Active' : 'Inactive'}
                              size="small"
                              variant="soft"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
                              <Tooltip title="Edit">
                                <IconButton size="small" onClick={() => handleEditRule(rule)}>
                                  <PencilSimpleIcon fontSize="var(--icon-fontSize-md)" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton size="small" color="error" onClick={() => handleDeleteRule(rule.Id)}>
                                  <TrashIcon fontSize="var(--icon-fontSize-md)" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
                <Divider />
                <Box sx={{ px: 3, py: 2 }}>
                  <Typography color="text.secondary" variant="body2">
                    {validationRules.length} rule{validationRules.length !== 1 ? 's' : ''}
                  </Typography>
                </Box>
              </React.Fragment>
            )}
          </Card>
        </Stack>
      </Box>
      </AnimatedPage>

      {/* Edit Rule Set Dialog */}
      <EditRuleSetDialog
        ruleSet={ruleSet}
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSuccess={refetchRuleSet}
      />

      {/* Add/Edit Validation Rule Dialog */}
      <ValidationRuleDialog
        ruleSetId={ruleSetId}
        rule={editingRule}
        open={ruleDialogOpen}
        onClose={() => {
          setRuleDialogOpen(false)
          setEditingRule(null)
        }}
        onSuccess={refetchRules}
      />
    </React.Fragment>
  )
}

function EditRuleSetDialog({ ruleSet, open, onClose, onSuccess }) {
  const client = useSalesforceClient()
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState(null)
  const [values, setValues] = React.useState({
    ruleSetName: '',
    targetEntityType: '',
    version: '',
    description: '',
    isActive: true,
    effectiveStart: '',
    effectiveEnd: '',
  })

  React.useEffect(() => {
    if (ruleSet && open) {
      setValues({
        ruleSetName: ruleSet.cux_Rule_Set_Name__c || '',
        targetEntityType: ruleSet.cux_Target_Entity_Type__c || '',
        version: ruleSet.cux_Version__c || '',
        description: ruleSet.cux_Description__c || '',
        isActive: ruleSet.cux_Is_Active__c ?? true,
        effectiveStart: ruleSet.cux_Effective_Start__c || '',
        effectiveEnd: ruleSet.cux_Effective_End__c || '',
      })
      setError(null)
      setSubmitting(false)
    }
  }, [ruleSet, open])

  function handleChange(field) {
    return (event) => setValues((prev) => ({ ...prev, [field]: event.target.value }))
  }

  function handleSwitchChange(field) {
    return (event) => setValues((prev) => ({ ...prev, [field]: event.target.checked }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!client || !values.ruleSetName || !values.targetEntityType || !values.version || !values.effectiveStart) return

    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        cux_Rule_Set_Name__c: values.ruleSetName,
        cux_Target_Entity_Type__c: values.targetEntityType,
        cux_Version__c: values.version,
        cux_Description__c: values.description || null,
        cux_Is_Active__c: values.isActive,
        cux_Effective_Start__c: values.effectiveStart,
        cux_Effective_End__c: values.effectiveEnd || null,
      }
      await client.updateRuleSet(ruleSet.Id, payload)
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
      <DialogTitle>Edit Rule Set</DialogTitle>
      <Divider />
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <FormControl fullWidth required>
            <InputLabel>Rule Set Name</InputLabel>
            <OutlinedInput
              value={values.ruleSetName}
              onChange={handleChange('ruleSetName')}
              label="Rule Set Name"
            />
          </FormControl>
          <FormControl fullWidth required>
            <InputLabel>Target Entity Type</InputLabel>
            <Select
              value={values.targetEntityType}
              onChange={handleChange('targetEntityType')}
              label="Target Entity Type"
            >
              {TARGET_ENTITY_TYPES.map((type) => (
                <MenuItem key={type} value={type}>{type}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth required>
            <InputLabel>Version</InputLabel>
            <OutlinedInput
              value={values.version}
              onChange={handleChange('version')}
              label="Version"
            />
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Description</InputLabel>
            <OutlinedInput
              value={values.description}
              onChange={handleChange('description')}
              label="Description"
              multiline
              minRows={3}
            />
          </FormControl>
          <FormControlLabel
            control={
              <Switch
                checked={values.isActive}
                onChange={handleSwitchChange('isActive')}
              />
            }
            label="Is Active"
          />
          <FormControl fullWidth required>
            <InputLabel shrink>Effective Start</InputLabel>
            <OutlinedInput
              type="date"
              value={values.effectiveStart}
              onChange={handleChange('effectiveStart')}
              label="Effective Start"
              notched
            />
          </FormControl>
          <FormControl fullWidth>
            <InputLabel shrink>Effective End</InputLabel>
            <OutlinedInput
              type="date"
              value={values.effectiveEnd}
              onChange={handleChange('effectiveEnd')}
              label="Effective End"
              notched
            />
          </FormControl>
        </Stack>
      </DialogContent>
      <Divider />
      <DialogActions>
        <Button color="inherit" onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const INITIAL_RULE_VALUES = {
  ruleCode: '',
  title: '',
  description: '',
  ruleType: '',
  severity: '',
  blocking: false,
  executionMode: '',
  expression: '',
  handlerKey: '',
  sortOrder: '',
  isActive: true,
  effectiveStart: '',
  effectiveEnd: '',
}

function ValidationRuleDialog({ ruleSetId, rule, open, onClose, onSuccess }) {
  const client = useSalesforceClient()
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState(null)
  const [values, setValues] = React.useState(INITIAL_RULE_VALUES)

  const isEditing = Boolean(rule)

  React.useEffect(() => {
    if (open) {
      if (rule) {
        setValues({
          ruleCode: rule.cux_Rule_Code__c || '',
          title: rule.cux_Title__c || '',
          description: rule.cux_Description__c || '',
          ruleType: rule.cux_Rule_Type__c || '',
          severity: rule.cux_Severity__c || '',
          blocking: rule.cux_Blocking__c ?? false,
          executionMode: rule.cux_Execution_Default_Mode__c || '',
          expression: rule.cux_Expression__c || '',
          handlerKey: rule.cux_Handler_Key__c || '',
          sortOrder: rule.cux_Sort_Order__c != null ? String(rule.cux_Sort_Order__c) : '',
          isActive: rule.cux_Is_Active__c ?? true,
          effectiveStart: rule.cux_Effective_Start__c || '',
          effectiveEnd: rule.cux_Effective_End__c || '',
        })
      } else {
        setValues(INITIAL_RULE_VALUES)
      }
      setError(null)
      setSubmitting(false)
    }
  }, [rule, open])

  function handleChange(field) {
    return (event) => setValues((prev) => ({ ...prev, [field]: event.target.value }))
  }

  function handleSwitchChange(field) {
    return (event) => setValues((prev) => ({ ...prev, [field]: event.target.checked }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!client || !values.ruleCode || !values.title || !values.ruleType || !values.severity || !values.effectiveStart) return

    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        cux_Rule_Code__c: values.ruleCode,
        cux_Title__c: values.title,
        cux_Rule_Type__c: values.ruleType,
        cux_Severity__c: values.severity,
        cux_Blocking__c: values.blocking,
        cux_Is_Active__c: values.isActive,
        cux_Effective_Start__c: values.effectiveStart,
      }
      if (values.description) payload.cux_Description__c = values.description
      if (values.executionMode) payload.cux_Execution_Default_Mode__c = values.executionMode
      if (values.expression) payload.cux_Expression__c = values.expression
      if (values.handlerKey) payload.cux_Handler_Key__c = values.handlerKey
      if (values.sortOrder !== '') payload.cux_Sort_Order__c = Number(values.sortOrder)
      if (values.effectiveEnd) payload.cux_Effective_End__c = values.effectiveEnd

      if (isEditing) {
        await client.updateValidationRule(rule.Id, payload)
      } else {
        payload.cux_Rule_Set__c = ruleSetId
        await client.createValidationRule(payload)
      }

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
      <DialogTitle>{isEditing ? 'Edit Validation Rule' : 'Add Validation Rule'}</DialogTitle>
      <Divider />
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <FormControl fullWidth required>
            <InputLabel>Rule Code</InputLabel>
            <OutlinedInput
              value={values.ruleCode}
              onChange={handleChange('ruleCode')}
              label="Rule Code"
            />
          </FormControl>
          <FormControl fullWidth required>
            <InputLabel>Title</InputLabel>
            <OutlinedInput
              value={values.title}
              onChange={handleChange('title')}
              label="Title"
            />
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Description</InputLabel>
            <OutlinedInput
              value={values.description}
              onChange={handleChange('description')}
              label="Description"
              multiline
              minRows={2}
            />
          </FormControl>
          <FormControl fullWidth required>
            <InputLabel>Rule Type</InputLabel>
            <Select
              value={values.ruleType}
              onChange={handleChange('ruleType')}
              label="Rule Type"
            >
              {RULE_TYPES.map((type) => (
                <MenuItem key={type} value={type}>{type}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth required>
            <InputLabel>Severity</InputLabel>
            <Select
              value={values.severity}
              onChange={handleChange('severity')}
              label="Severity"
            >
              {SEVERITY_LEVELS.map((level) => (
                <MenuItem key={level} value={level}>{level}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Switch
                checked={values.blocking}
                onChange={handleSwitchChange('blocking')}
              />
            }
            label="Blocking"
          />
          <FormControl fullWidth>
            <InputLabel>Execution Default Mode</InputLabel>
            <Select
              value={values.executionMode}
              onChange={handleChange('executionMode')}
              label="Execution Default Mode"
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {EXECUTION_MODES.map((mode) => (
                <MenuItem key={mode} value={mode}>{mode}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Expression</InputLabel>
            <OutlinedInput
              value={values.expression}
              onChange={handleChange('expression')}
              label="Expression"
              multiline
              minRows={2}
              placeholder="For RULE type — enter validation expression"
            />
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Handler Key</InputLabel>
            <OutlinedInput
              value={values.handlerKey}
              onChange={handleChange('handlerKey')}
              label="Handler Key"
            />
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Sort Order</InputLabel>
            <OutlinedInput
              type="number"
              value={values.sortOrder}
              onChange={handleChange('sortOrder')}
              label="Sort Order"
            />
          </FormControl>
          <FormControlLabel
            control={
              <Switch
                checked={values.isActive}
                onChange={handleSwitchChange('isActive')}
              />
            }
            label="Is Active"
          />
          <FormControl fullWidth required>
            <InputLabel shrink>Effective Start</InputLabel>
            <OutlinedInput
              type="date"
              value={values.effectiveStart}
              onChange={handleChange('effectiveStart')}
              label="Effective Start"
              notched
            />
          </FormControl>
          <FormControl fullWidth>
            <InputLabel shrink>Effective End</InputLabel>
            <OutlinedInput
              type="date"
              value={values.effectiveEnd}
              onChange={handleChange('effectiveEnd')}
              label="Effective End"
              notched
            />
          </FormControl>
        </Stack>
      </DialogContent>
      <Divider />
      <DialogActions>
        <Button color="inherit" onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={submitting}>
          {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Rule'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
