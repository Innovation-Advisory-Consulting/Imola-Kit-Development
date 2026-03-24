import * as React from 'react'
import Avatar from '@mui/material/Avatar'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import OutlinedInput from '@mui/material/OutlinedInput'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import FormHelperText from '@mui/material/FormHelperText'

import { useSalesforceClient } from '@/hooks/use-salesforce'

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical']

const ENTITY_TYPES = [
  { value: 'cux_Contract__c', label: 'Contract' },
  { value: 'cux_TaskOrder__c', label: 'Task Order' },
  { value: 'cux_Invoice__c', label: 'Invoice' },
  { value: 'cux_Case__c', label: 'Case' },
]

export function AssignWorkDialog({ open, onClose, onCreated, users = [] }) {
  const client = useSalesforceClient()
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState(null)

  const [values, setValues] = React.useState({
    cux_Title__c: '',
    cux_Assigned_To__c: '',
    cux_Priority__c: 'Medium',
    cux_Due_Date__c: '',
    cux_Entity_Type__c: '',
    cux_Entity_Id__c: '',
    cux_Description__c: '',
  })

  function handleChange(field) {
    return (event) => {
      setValues((prev) => ({ ...prev, [field]: event.target.value }))
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!client) return

    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        cux_Title__c: values.cux_Title__c,
        cux_Assigned_To__c: values.cux_Assigned_To__c || undefined,
        cux_Priority__c: values.cux_Priority__c,
        cux_Due_Date__c: values.cux_Due_Date__c || undefined,
        cux_Entity_Type__c: values.cux_Entity_Type__c || undefined,
        cux_Entity_Id__c: values.cux_Entity_Id__c || undefined,
        cux_Description__c: values.cux_Description__c || undefined,
        cux_Status__c: 'Not Started',
      }
      Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key])

      await client.createWorkTask(payload)
      setValues({
        cux_Title__c: '',
        cux_Assigned_To__c: '',
        cux_Priority__c: 'Medium',
        cux_Due_Date__c: '',
        cux_Entity_Type__c: '',
        cux_Entity_Id__c: '',
        cux_Description__c: '',
      })
      onCreated?.()
      onClose()
    } catch (err) {
      setError(err.response?.data?.[0]?.message || err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Assign Work</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl fullWidth required>
              <InputLabel>Title</InputLabel>
              <OutlinedInput
                label="Title"
                value={values.cux_Title__c}
                onChange={handleChange('cux_Title__c')}
              />
            </FormControl>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Assign To</InputLabel>
                  <Select
                    label="Assign To"
                    value={values.cux_Assigned_To__c}
                    onChange={handleChange('cux_Assigned_To__c')}
                  >
                    {users.map((user) => (
                      <MenuItem key={user.Id} value={user.Id}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                          <Avatar src={user.SmallPhotoUrl} sx={{ '--Avatar-size': '24px', fontSize: '0.7rem' }}>
                            {user.Name?.[0]}
                          </Avatar>
                          <Typography variant="body2">{user.Name}</Typography>
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    label="Priority"
                    value={values.cux_Priority__c}
                    onChange={handleChange('cux_Priority__c')}
                  >
                    {PRIORITIES.map((p) => (
                      <MenuItem key={p} value={p}>{p}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <FormControl fullWidth>
              <InputLabel shrink>Due Date</InputLabel>
              <OutlinedInput
                label="Due Date"
                type="date"
                notched
                value={values.cux_Due_Date__c}
                onChange={handleChange('cux_Due_Date__c')}
              />
            </FormControl>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Related Entity Type</InputLabel>
                  <Select
                    label="Related Entity Type"
                    value={values.cux_Entity_Type__c}
                    onChange={handleChange('cux_Entity_Type__c')}
                  >
                    <MenuItem value="">None</MenuItem>
                    {ENTITY_TYPES.map((et) => (
                      <MenuItem key={et.value} value={et.value}>{et.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Entity Record ID</InputLabel>
                  <OutlinedInput
                    label="Entity Record ID"
                    value={values.cux_Entity_Id__c}
                    onChange={handleChange('cux_Entity_Id__c')}
                    placeholder="Paste Salesforce ID"
                  />
                </FormControl>
              </Grid>
            </Grid>

            <FormControl fullWidth>
              <InputLabel>Description</InputLabel>
              <OutlinedInput
                label="Description"
                multiline
                rows={3}
                value={values.cux_Description__c}
                onChange={handleChange('cux_Description__c')}
              />
            </FormControl>

            {error && (
              <FormHelperText error>{error}</FormHelperText>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="secondary">Cancel</Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? 'Assigning...' : 'Assign'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
