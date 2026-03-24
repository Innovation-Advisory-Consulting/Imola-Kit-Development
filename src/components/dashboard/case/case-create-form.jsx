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

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical']

const CATEGORIES = ['Billing', 'Technical', 'Compliance', 'General']

export function CaseCreateForm() {
  const navigate = useNavigate()
  const client = useSalesforceClient()
  const { data: accounts } = useSalesforceQuery((c) => c.getAccounts())
  const { data: contacts } = useSalesforceQuery((c) => c.getContacts())
  const { data: contracts } = useSalesforceQuery((c) => c.getContracts())
  const { data: users } = useSalesforceQuery((c) => c.getActiveUsers())
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState(null)

  const [values, setValues] = React.useState({
    cux_Subject__c: '',
    cux_Priority__c: '',
    cux_Category__c: '',
    cux_Account__c: '',
    cux_Contact__c: '',
    cux_Contract__c: '',
    cux_Assigned_To__c: '',
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
      // Remove empty strings
      Object.keys(payload).forEach((key) => {
        if (payload[key] === '') delete payload[key]
      })

      const result = await client.createCase(payload)
      navigate(paths.dashboard.cases.details(result.id))
    } catch (err) {
      setError(err.response?.data?.[0]?.message || err.message)
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader title="Case Information" />
        <Divider />
        <CardContent>
          <Grid container spacing={3}>
            <Grid size={{ md: 6, xs: 12 }}>
              <FormControl fullWidth required>
                <InputLabel>Subject</InputLabel>
                <OutlinedInput
                  label="Subject"
                  value={values.cux_Subject__c}
                  onChange={handleChange('cux_Subject__c')}
                />
              </FormControl>
            </Grid>
            <Grid size={{ md: 6, xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  label="Priority"
                  value={values.cux_Priority__c}
                  onChange={handleChange('cux_Priority__c')}
                >
                  {PRIORITIES.map((priority) => (
                    <MenuItem key={priority} value={priority}>
                      {priority}
                    </MenuItem>
                  ))}
                </Select>
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
            <Grid size={{ md: 6, xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel>Account</InputLabel>
                <Select
                  label="Account"
                  value={values.cux_Account__c}
                  onChange={handleChange('cux_Account__c')}
                >
                  {(accounts || []).map((account) => (
                    <MenuItem key={account.Id} value={account.Id}>
                      {account.Name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ md: 6, xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel>Contact</InputLabel>
                <Select
                  label="Contact"
                  value={values.cux_Contact__c}
                  onChange={handleChange('cux_Contact__c')}
                >
                  {(contacts || []).map((contact) => (
                    <MenuItem key={contact.Id} value={contact.Id}>
                      {contact.Name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ md: 6, xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel>Contract</InputLabel>
                <Select
                  label="Contract"
                  value={values.cux_Contract__c}
                  onChange={handleChange('cux_Contract__c')}
                >
                  {(contracts || []).map((contract) => (
                    <MenuItem key={contract.Id} value={contract.Id}>
                      {contract.Name} — {contract.cux_Title__c || 'Untitled'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ md: 6, xs: 12 }}>
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
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel>Description</InputLabel>
                <OutlinedInput
                  label="Description"
                  multiline
                  rows={4}
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
          <Button color="secondary" component={RouterLink} href={paths.dashboard.cases.list}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Case'}
          </Button>
        </Box>
      </Card>
    </form>
  )
}
