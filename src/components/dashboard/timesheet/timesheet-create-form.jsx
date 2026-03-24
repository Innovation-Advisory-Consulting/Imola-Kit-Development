import * as React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import Grid from '@mui/material/Grid'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import OutlinedInput from '@mui/material/OutlinedInput'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import { useNavigate } from 'react-router-dom'

import { paths } from '@/paths'
import { RouterLink } from '@/components/core/link'
import { useSalesforceClient } from '@/hooks/use-salesforce'
import { useSalesforceQuery } from '@/hooks/use-salesforce'
import { AiTextAssist } from '@/components/core/ai-text-assist'

const CATEGORIES = ['Labor', 'ODC', 'Travel']

export function TimesheetCreateForm() {
  const navigate = useNavigate()
  const client = useSalesforceClient()
  const { data: taskOrders } = useSalesforceQuery((c) => c.getTaskOrders())
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState(null)

  const [values, setValues] = React.useState({
    cux_Task_Order__c: '',
    cux_Worker_Name__c: '',
    cux_Work_Date__c: '',
    cux_Hours__c: '',
    cux_Hourly_Rate__c: '',
    cux_Category__c: '',
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
      const payload = { ...values }
      // Convert numeric fields
      if (payload.cux_Hours__c) {
        payload.cux_Hours__c = Number(payload.cux_Hours__c)
      } else {
        delete payload.cux_Hours__c
      }
      if (payload.cux_Hourly_Rate__c) {
        payload.cux_Hourly_Rate__c = Number(payload.cux_Hourly_Rate__c)
      } else {
        delete payload.cux_Hourly_Rate__c
      }
      // Remove empty strings
      Object.keys(payload).forEach((key) => {
        if (payload[key] === '') delete payload[key]
      })

      const result = await client.createTimesheet(payload)
      navigate(paths.dashboard.timesheets.details(result.id))
    } catch (err) {
      setError(err.response?.data?.[0]?.message || err.message)
      setSubmitting(false)
    }
  }

  // Filter for active task orders if possible
  const activeTaskOrders = (taskOrders || []).filter(
    (to) => to.cux_Status__c === 'Active' || !to.cux_Status__c
  )

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader title="Timesheet Information" />
        <Divider />
        <CardContent>
          <Grid container spacing={3}>
            <Grid size={{ md: 6, xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel>Task Order</InputLabel>
                <Select
                  label="Task Order"
                  value={values.cux_Task_Order__c}
                  onChange={handleChange('cux_Task_Order__c')}
                >
                  {activeTaskOrders.map((to) => (
                    <MenuItem key={to.Id} value={to.Id}>
                      {to.Name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ md: 6, xs: 12 }}>
              <FormControl fullWidth required>
                <InputLabel>Worker Name</InputLabel>
                <OutlinedInput
                  label="Worker Name"
                  value={values.cux_Worker_Name__c}
                  onChange={handleChange('cux_Worker_Name__c')}
                />
              </FormControl>
            </Grid>
            <Grid size={{ md: 6, xs: 12 }}>
              <FormControl fullWidth required>
                <InputLabel shrink>Work Date</InputLabel>
                <OutlinedInput
                  label="Work Date"
                  type="date"
                  value={values.cux_Work_Date__c}
                  onChange={handleChange('cux_Work_Date__c')}
                  notched
                />
              </FormControl>
            </Grid>
            <Grid size={{ md: 6, xs: 12 }}>
              <FormControl fullWidth required>
                <InputLabel>Hours</InputLabel>
                <OutlinedInput
                  label="Hours"
                  type="number"
                  inputProps={{ min: 0, step: 0.5 }}
                  value={values.cux_Hours__c}
                  onChange={handleChange('cux_Hours__c')}
                />
              </FormControl>
            </Grid>
            <Grid size={{ md: 6, xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel>Hourly Rate</InputLabel>
                <OutlinedInput
                  label="Hourly Rate"
                  type="number"
                  inputProps={{ min: 0, step: 0.01 }}
                  value={values.cux_Hourly_Rate__c}
                  onChange={handleChange('cux_Hourly_Rate__c')}
                />
              </FormControl>
            </Grid>
            <Grid size={{ md: 6, xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  label="Category"
                  value={values.cux_Category__c}
                  onChange={handleChange('cux_Category__c')}
                >
                  {CATEGORIES.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel>Description</InputLabel>
                <OutlinedInput
                  label="Description"
                  multiline
                  rows={3}
                  value={values.cux_Description__c}
                  onChange={handleChange('cux_Description__c')}
                />
                <AiTextAssist
                  text={values.cux_Description__c}
                  onAccept={(enhanced) => setValues((prev) => ({ ...prev, cux_Description__c: enhanced }))}
                />
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
        <Divider />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2, gap: 2 }}>
          {error ? (
            <FormHelperText error sx={{ flex: '1 1 auto', alignSelf: 'center' }}>
              {error}
            </FormHelperText>
          ) : null}
          <Button color="secondary" component={RouterLink} href={paths.dashboard.timesheets.list}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Timesheet'}
          </Button>
        </Box>
      </Card>
    </form>
  )
}
