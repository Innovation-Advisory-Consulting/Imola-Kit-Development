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
import Grid from '@mui/material/Grid'
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

const metadata = { title: `Details | Baseline Task Sets | Dashboard | ${appConfig.name}` }

const ASSIGNEE_ROLES = [
  'Contract Specialist',
  'Contracting Officer',
  'Program Manager',
  'Finance Analyst',
  'Legal Reviewer',
  'Compliance Officer',
]

const SEVERITY_LEVELS = ['INFO', 'WARNING', 'ERROR', 'CRITICAL']

const severityColorMap = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'error',
}

const EMPTY_TEMPLATE_FORM = {
  cux_Task_Code__c: '',
  cux_Title__c: '',
  cux_Description__c: '',
  cux_Default_Assignee_Role__c: '',
  cux_Required__c: true,
  cux_Severity_If_Incomplete__c: 'ERROR',
  cux_Sort_Order__c: '',
}

export function Page() {
  const { taskSetId } = useParams()
  const client = useSalesforceClient()

  const { data: taskSet, loading, error, refetch: refetchTaskSet } = useSalesforceQuery(
    (c) => c.getBaselineTaskSet(taskSetId),
    [taskSetId]
  )
  const { data: templates, loading: templatesLoading, refetch: refetchTemplates } = useSalesforceQuery(
    (c) => c.getBaselineTaskTemplates(taskSetId),
    [taskSetId]
  )

  // Edit task set dialog
  const [editOpen, setEditOpen] = React.useState(false)
  const [editData, setEditData] = React.useState({})
  const [editSubmitting, setEditSubmitting] = React.useState(false)

  // Template dialog (add/edit)
  const [templateDialogOpen, setTemplateDialogOpen] = React.useState(false)
  const [templateForm, setTemplateForm] = React.useState(EMPTY_TEMPLATE_FORM)
  const [editingTemplateId, setEditingTemplateId] = React.useState(null)
  const [templateSubmitting, setTemplateSubmitting] = React.useState(false)

  const handleOpenEdit = () => {
    setEditData({
      cux_Set_Name__c: taskSet.cux_Set_Name__c || '',
      cux_Description__c: taskSet.cux_Description__c || '',
      cux_Is_Active__c: !!taskSet.cux_Is_Active__c,
      cux_Effective_Start__c: taskSet.cux_Effective_Start__c || '',
      cux_Effective_End__c: taskSet.cux_Effective_End__c || '',
    })
    setEditOpen(true)
  }

  const handleEditChange = (field) => (event) => {
    const value = field === 'cux_Is_Active__c' ? event.target.checked : event.target.value
    setEditData((prev) => ({ ...prev, [field]: value }))
  }

  const handleEditSubmit = async () => {
    setEditSubmitting(true)
    try {
      const payload = { ...editData }
      if (!payload.cux_Effective_End__c) {
        delete payload.cux_Effective_End__c
      }
      await client.updateBaselineTaskSet(taskSetId, payload)
      setEditOpen(false)
      refetchTaskSet()
    } catch (err) {
      console.error('Failed to update task set:', err)
    } finally {
      setEditSubmitting(false)
    }
  }

  // Template handlers
  const handleOpenAddTemplate = () => {
    setTemplateForm(EMPTY_TEMPLATE_FORM)
    setEditingTemplateId(null)
    setTemplateDialogOpen(true)
  }

  const handleOpenEditTemplate = (template) => {
    setTemplateForm({
      cux_Task_Code__c: template.cux_Task_Code__c || '',
      cux_Title__c: template.cux_Title__c || '',
      cux_Description__c: template.cux_Description__c || '',
      cux_Default_Assignee_Role__c: template.cux_Default_Assignee_Role__c || '',
      cux_Required__c: !!template.cux_Required__c,
      cux_Severity_If_Incomplete__c: template.cux_Severity_If_Incomplete__c || 'ERROR',
      cux_Sort_Order__c: template.cux_Sort_Order__c ?? '',
    })
    setEditingTemplateId(template.Id)
    setTemplateDialogOpen(true)
  }

  const handleTemplateChange = (field) => (event) => {
    const value = field === 'cux_Required__c' ? event.target.checked : event.target.value
    setTemplateForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleTemplateSubmit = async () => {
    setTemplateSubmitting(true)
    try {
      const payload = {
        ...templateForm,
        cux_Sort_Order__c: templateForm.cux_Sort_Order__c !== '' ? Number(templateForm.cux_Sort_Order__c) : null,
      }
      if (!payload.cux_Default_Assignee_Role__c) {
        delete payload.cux_Default_Assignee_Role__c
      }
      if (editingTemplateId) {
        await client.updateBaselineTaskTemplate(editingTemplateId, payload)
      } else {
        payload.cux_Baseline_Task_Set__c = taskSetId
        await client.createBaselineTaskTemplate(payload)
      }
      setTemplateDialogOpen(false)
      refetchTemplates()
    } catch (err) {
      console.error('Failed to save template:', err)
    } finally {
      setTemplateSubmitting(false)
    }
  }

  const handleDeleteTemplate = async (templateId) => {
    try {
      await client.deleteBaselineTaskTemplate(templateId)
      refetchTemplates()
    } catch (err) {
      console.error('Failed to delete template:', err)
    }
  }

  const templateFormValid =
    templateForm.cux_Task_Code__c.trim() &&
    templateForm.cux_Title__c.trim() &&
    templateForm.cux_Severity_If_Incomplete__c

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
        Failed to load task set: {error.message}
      </Alert>
    )
  }

  if (!taskSet) {
    return (
      <Alert severity="warning" sx={{ m: 3 }}>
        Task set not found
      </Alert>
    )
  }

  const sortedTemplates = [...(templates || [])].sort(
    (a, b) => (a.cux_Sort_Order__c ?? 9999) - (b.cux_Sort_Order__c ?? 9999)
  )

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
          {/* Header */}
          <Stack spacing={3}>
            <div>
              <Link
                color="text.primary"
                component={RouterLink}
                href={paths.dashboard.validations.taskSets.list}
                sx={{ alignItems: 'center', display: 'inline-flex', gap: 1 }}
                variant="subtitle2"
              >
                <ArrowLeftIcon fontSize="var(--icon-fontSize-md)" />
                Baseline Task Sets
              </Link>
            </div>
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography variant="h4">{taskSet.cux_Set_Name__c || taskSet.Name}</Typography>
              <Typography color="text.secondary" variant="subtitle1">
                {taskSet.Name}
              </Typography>
              <Chip
                color={taskSet.cux_Is_Active__c ? 'success' : 'default'}
                label={taskSet.cux_Is_Active__c ? 'Active' : 'Inactive'}
                size="small"
                variant="soft"
              />
            </Stack>
          </Stack>

          {/* Detail Card */}
          <Card>
            <CardHeader
              title="Task Set Details"
              action={
                <Button variant="outlined" size="small" onClick={handleOpenEdit}>
                  Edit
                </Button>
              }
            />
            <Divider />
            <CardContent>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <PropertyList>
                    <PropertyItem name="Set Name" value={taskSet.cux_Set_Name__c || '\u2014'} />
                    <PropertyItem name="Description" value={taskSet.cux_Description__c || '\u2014'} />
                    <PropertyItem
                      name="Effective Start"
                      value={taskSet.cux_Effective_Start__c ? dayjs(taskSet.cux_Effective_Start__c).format('MMM D, YYYY') : '\u2014'}
                    />
                  </PropertyList>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <PropertyList>
                    <PropertyItem
                      name="Effective End"
                      value={taskSet.cux_Effective_End__c ? dayjs(taskSet.cux_Effective_End__c).format('MMM D, YYYY') : '\u2014'}
                    />
                    <PropertyItem
                      name="Created"
                      value={taskSet.CreatedDate ? dayjs(taskSet.CreatedDate).format('MMM D, YYYY h:mm A') : '\u2014'}
                    />
                    <PropertyItem
                      name="Last Modified"
                      value={taskSet.LastModifiedDate ? dayjs(taskSet.LastModifiedDate).format('MMM D, YYYY h:mm A') : '\u2014'}
                    />
                  </PropertyList>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Task Templates Card */}
          <Card>
            <CardHeader
              title="Task Templates"
              action={
                <Button
                  startIcon={<PlusIcon />}
                  variant="contained"
                  size="small"
                  onClick={handleOpenAddTemplate}
                >
                  Add Template
                </Button>
              }
            />
            <Divider />
            {templatesLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : !sortedTemplates.length ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary" variant="body2">
                  No task templates yet
                </Typography>
              </Box>
            ) : (
              <React.Fragment>
                <Box sx={{ overflowX: 'auto' }}>
                  <Table sx={{ minWidth: 800 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Sort #</TableCell>
                        <TableCell>Task Code</TableCell>
                        <TableCell>Title</TableCell>
                        <TableCell>Required</TableCell>
                        <TableCell>Severity</TableCell>
                        <TableCell>Assignee Role</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sortedTemplates.map((template) => (
                        <TableRow hover key={template.Id} sx={{ '&:last-child td': { border: 0 } }}>
                          <TableCell>{template.cux_Sort_Order__c ?? '\u2014'}</TableCell>
                          <TableCell>
                            <Typography variant="subtitle2">{template.cux_Task_Code__c || '\u2014'}</Typography>
                          </TableCell>
                          <TableCell>{template.cux_Title__c || '\u2014'}</TableCell>
                          <TableCell>
                            <Chip
                              color={template.cux_Required__c ? 'success' : 'default'}
                              label={template.cux_Required__c ? 'Yes' : 'No'}
                              size="small"
                              variant="soft"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              color={severityColorMap[template.cux_Severity_If_Incomplete__c] || 'default'}
                              label={template.cux_Severity_If_Incomplete__c || '\u2014'}
                              size="small"
                              variant="soft"
                            />
                          </TableCell>
                          <TableCell>{template.cux_Default_Assignee_Role__c || '\u2014'}</TableCell>
                          <TableCell align="right">
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => handleOpenEditTemplate(template)}>
                                <PencilSimpleIcon fontSize="var(--icon-fontSize-md)" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton size="small" color="error" onClick={() => handleDeleteTemplate(template.Id)}>
                                <TrashIcon fontSize="var(--icon-fontSize-md)" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
                <Divider />
                <Box sx={{ px: 3, py: 2 }}>
                  <Typography color="text.secondary" variant="body2">
                    {sortedTemplates.length} template{sortedTemplates.length !== 1 ? 's' : ''}
                  </Typography>
                </Box>
              </React.Fragment>
            )}
          </Card>
        </Stack>
      </Box>
      </AnimatedPage>

      {/* Edit Task Set Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Task Set</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1 }}>
            <FormControl fullWidth required>
              <InputLabel>Set Name</InputLabel>
              <OutlinedInput
                label="Set Name"
                value={editData.cux_Set_Name__c || ''}
                onChange={handleEditChange('cux_Set_Name__c')}
              />
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Description</InputLabel>
              <OutlinedInput
                label="Description"
                value={editData.cux_Description__c || ''}
                onChange={handleEditChange('cux_Description__c')}
                multiline
                minRows={3}
              />
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={!!editData.cux_Is_Active__c}
                  onChange={handleEditChange('cux_Is_Active__c')}
                />
              }
              label="Is Active"
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
              <FormControl fullWidth required>
                <InputLabel shrink>Effective Start</InputLabel>
                <OutlinedInput
                  label="Effective Start"
                  type="date"
                  value={editData.cux_Effective_Start__c || ''}
                  onChange={handleEditChange('cux_Effective_Start__c')}
                  notched
                />
              </FormControl>
              <FormControl fullWidth>
                <InputLabel shrink>Effective End</InputLabel>
                <OutlinedInput
                  label="Effective End"
                  type="date"
                  value={editData.cux_Effective_End__c || ''}
                  onChange={handleEditChange('cux_Effective_End__c')}
                  notched
                />
              </FormControl>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setEditOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleEditSubmit}
            disabled={!editData.cux_Set_Name__c?.trim() || !editData.cux_Effective_Start__c || editSubmitting}
          >
            {editSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Template Dialog */}
      <Dialog open={templateDialogOpen} onClose={() => setTemplateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingTemplateId ? 'Edit Template' : 'Add Template'}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1 }}>
            <FormControl fullWidth required>
              <InputLabel>Task Code</InputLabel>
              <OutlinedInput
                label="Task Code"
                value={templateForm.cux_Task_Code__c}
                onChange={handleTemplateChange('cux_Task_Code__c')}
              />
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel>Title</InputLabel>
              <OutlinedInput
                label="Title"
                value={templateForm.cux_Title__c}
                onChange={handleTemplateChange('cux_Title__c')}
              />
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Description</InputLabel>
              <OutlinedInput
                label="Description"
                value={templateForm.cux_Description__c}
                onChange={handleTemplateChange('cux_Description__c')}
                multiline
                minRows={3}
              />
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Default Assignee Role</InputLabel>
              <Select
                label="Default Assignee Role"
                value={templateForm.cux_Default_Assignee_Role__c}
                onChange={handleTemplateChange('cux_Default_Assignee_Role__c')}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {ASSIGNEE_ROLES.map((role) => (
                  <MenuItem key={role} value={role}>
                    {role}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={templateForm.cux_Required__c}
                  onChange={handleTemplateChange('cux_Required__c')}
                />
              }
              label="Required"
            />
            <FormControl fullWidth required>
              <InputLabel>Severity If Incomplete</InputLabel>
              <Select
                label="Severity If Incomplete"
                value={templateForm.cux_Severity_If_Incomplete__c}
                onChange={handleTemplateChange('cux_Severity_If_Incomplete__c')}
              >
                {SEVERITY_LEVELS.map((level) => (
                  <MenuItem key={level} value={level}>
                    {level}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel shrink>Sort Order</InputLabel>
              <OutlinedInput
                label="Sort Order"
                type="number"
                value={templateForm.cux_Sort_Order__c}
                onChange={handleTemplateChange('cux_Sort_Order__c')}
                notched
              />
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setTemplateDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleTemplateSubmit}
            disabled={!templateFormValid || templateSubmitting}
          >
            {templateSubmitting ? 'Saving...' : editingTemplateId ? 'Save Changes' : 'Add Template'}
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  )
}
