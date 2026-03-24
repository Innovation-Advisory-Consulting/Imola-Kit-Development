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
import { useSalesforceClient, useSalesforceQuery } from '@/hooks/use-salesforce'
import { triggerInitialValidation, assignReviewWork } from '@/hooks/use-validation-engine'
import { AiTextAssist } from '@/components/core/ai-text-assist'

const TASK_ORDER_TYPES = ['Emergency', 'Translab']

export function TaskOrderCreateForm() {
  const navigate = useNavigate()
  const client = useSalesforceClient()
  const { data: contracts } = useSalesforceQuery((c) => c.getContracts())
  const { data: users } = useSalesforceQuery((c) => c.getActiveUsers())
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState(null)

  const [values, setValues] = React.useState({
    cux_Contract__c: '',
    cux_Task_Order_Type__c: '',
    cux_Start_Date__c: '',
    cux_End_Date__c: '',
    cux_Authorized_Amount__c: '',
    cux_Max_Authorized_Hours__c: '',
    cux_Scope_Summary__c: '',
    cux_Assigned_To__c: '',
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
      // Convert numbers
      if (payload.cux_Authorized_Amount__c) {
        payload.cux_Authorized_Amount__c = Number(payload.cux_Authorized_Amount__c)
      } else {
        delete payload.cux_Authorized_Amount__c
      }
      if (payload.cux_Max_Authorized_Hours__c) {
        payload.cux_Max_Authorized_Hours__c = Number(payload.cux_Max_Authorized_Hours__c)
      } else {
        delete payload.cux_Max_Authorized_Hours__c
      }
      // Remove empty strings
      Object.keys(payload).forEach((key) => {
        if (payload[key] === '') delete payload[key]
      })

      const result = await client.createTaskOrder(payload)
      await triggerInitialValidation(client, 'Task Order', result.id)

      // Assign review work + notify assignee
      if (payload.cux_Assigned_To__c) {
        assignReviewWork(client, 'Task Order', result.id, payload.cux_Assigned_To__c, payload.cux_Task_Order_Type__c || 'Task Order')
          .catch((err) => console.warn('Failed to assign review work:', err))
      }

      navigate(paths.dashboard.taskOrders.details(result.id))
    } catch (err) {
      setError(err.response?.data?.[0]?.message || err.message)
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader title="Task Order Information" />
        <Divider />
        <CardContent>
          <Grid container spacing={3}>
            <Grid size={{ md: 6, xs: 12 }}>
              <FormControl fullWidth required>
                <InputLabel>Contract</InputLabel>
                <Select
                  label="Contract"
                  value={values.cux_Contract__c}
                  onChange={handleChange('cux_Contract__c')}
                >
                  {(contracts || [])
                    .filter((c) => c.cux_Status__c === 'Executed')
                    .map((c) => (
                      <MenuItem key={c.Id} value={c.Id}>
                        {c.Name} — {c.cux_Title__c || 'Untitled'}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ md: 6, xs: 12 }}>
              <FormControl fullWidth required>
                <InputLabel>Type</InputLabel>
                <Select
                  label="Type"
                  value={values.cux_Task_Order_Type__c}
                  onChange={handleChange('cux_Task_Order_Type__c')}
                >
                  {TASK_ORDER_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ md: 4, xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel shrink>Start Date</InputLabel>
                <OutlinedInput
                  label="Start Date"
                  type="date"
                  value={values.cux_Start_Date__c}
                  onChange={handleChange('cux_Start_Date__c')}
                  notched
                />
              </FormControl>
            </Grid>
            <Grid size={{ md: 4, xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel shrink>End Date</InputLabel>
                <OutlinedInput
                  label="End Date"
                  type="date"
                  value={values.cux_End_Date__c}
                  onChange={handleChange('cux_End_Date__c')}
                  notched
                />
              </FormControl>
            </Grid>
            <Grid size={{ md: 4, xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel>Authorized Amount</InputLabel>
                <OutlinedInput
                  label="Authorized Amount"
                  type="number"
                  inputProps={{ min: 0, step: 0.01 }}
                  value={values.cux_Authorized_Amount__c}
                  onChange={handleChange('cux_Authorized_Amount__c')}
                />
              </FormControl>
            </Grid>
            <Grid size={{ md: 4, xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel>Assigned To</InputLabel>
                <Select
                  label="Assigned To"
                  value={values.cux_Assigned_To__c}
                  onChange={handleChange('cux_Assigned_To__c')}
                >
                  <MenuItem value="">Unassigned</MenuItem>
                  {(users || []).map((u) => (
                    <MenuItem key={u.Id} value={u.Id}>{u.Name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ md: 4, xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel>Max Authorized Hours</InputLabel>
                <OutlinedInput
                  label="Max Authorized Hours"
                  type="number"
                  inputProps={{ min: 0, step: 1 }}
                  value={values.cux_Max_Authorized_Hours__c}
                  onChange={handleChange('cux_Max_Authorized_Hours__c')}
                />
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel>Scope Summary</InputLabel>
                <OutlinedInput
                  label="Scope Summary"
                  multiline
                  rows={4}
                  value={values.cux_Scope_Summary__c}
                  onChange={handleChange('cux_Scope_Summary__c')}
                />
                <AiTextAssist
                  text={values.cux_Scope_Summary__c}
                  onAccept={(enhanced) => setValues((prev) => ({ ...prev, cux_Scope_Summary__c: enhanced }))}
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
          <Button color="secondary" component={RouterLink} href={paths.dashboard.taskOrders.list}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Task Order'}
          </Button>
        </Box>
      </Card>
    </form>
  )
}
