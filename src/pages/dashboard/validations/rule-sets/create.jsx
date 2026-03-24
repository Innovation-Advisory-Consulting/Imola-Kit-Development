import * as React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import InputLabel from '@mui/material/InputLabel'
import Link from '@mui/material/Link'
import MenuItem from '@mui/material/MenuItem'
import OutlinedInput from '@mui/material/OutlinedInput'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr/ArrowLeft'
import { Helmet } from 'react-helmet-async'
import { useNavigate } from 'react-router-dom'

import { appConfig } from '@/config/app'
import { paths } from '@/paths'
import { RouterLink } from '@/components/core/link'
import { useSalesforceClient } from '@/hooks/use-salesforce'
import { AnimatedPage } from '@/components/core/animations'

const metadata = { title: `Create | Rule Sets | Dashboard | ${appConfig.name}` }

const TARGET_ENTITY_TYPES = ['Contract', 'Amendment', 'TaskOrder', 'Termination', 'Settlement', 'Invoice']

export function Page() {
  const client = useSalesforceClient()
  const navigate = useNavigate()
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
        cux_Is_Active__c: values.isActive,
        cux_Effective_Start__c: values.effectiveStart,
      }
      if (values.description) payload.cux_Description__c = values.description
      if (values.effectiveEnd) payload.cux_Effective_End__c = values.effectiveEnd

      const result = await client.createRuleSet(payload)
      navigate(paths.dashboard.validations.ruleSets.details(result.id))
    } catch (err) {
      setError(err.response?.data?.[0]?.message || err.message)
      setSubmitting(false)
    }
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
            <div>
              <Typography variant="h4">New Rule Set</Typography>
            </div>
          </Stack>
          <Card>
            <CardHeader title="Rule Set Details" />
            <Divider />
            <CardContent>
              <form onSubmit={handleSubmit}>
                <Stack spacing={3}>
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
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button type="submit" variant="contained" disabled={submitting}>
                      {submitting ? 'Creating...' : 'Create Rule Set'}
                    </Button>
                  </Box>
                </Stack>
              </form>
            </CardContent>
          </Card>
        </Stack>
      </Box>
      </AnimatedPage>
    </React.Fragment>
  )
}
