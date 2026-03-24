import * as React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import InputLabel from '@mui/material/InputLabel'
import Link from '@mui/material/Link'
import OutlinedInput from '@mui/material/OutlinedInput'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr/ArrowLeft'
import { Helmet } from 'react-helmet-async'
import { useNavigate } from 'react-router-dom'

import { appConfig } from '@/config/app'
import { paths } from '@/paths'
import { RouterLink } from '@/components/core/link'
import { useSalesforceClient } from '@/hooks/use-salesforce'
import { AnimatedPage } from '@/components/core/animations'

const metadata = { title: `Create | Baseline Task Sets | Dashboard | ${appConfig.name}` }

export function Page() {
  const client = useSalesforceClient()
  const navigate = useNavigate()

  const [formData, setFormData] = React.useState({
    cux_Set_Name__c: '',
    cux_Description__c: '',
    cux_Is_Active__c: true,
    cux_Effective_Start__c: '',
    cux_Effective_End__c: '',
  })
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState(null)

  const handleChange = (field) => (event) => {
    const value = field === 'cux_Is_Active__c' ? event.target.checked : event.target.value
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const payload = { ...formData }
      if (!payload.cux_Effective_End__c) {
        delete payload.cux_Effective_End__c
      }
      const result = await client.createBaselineTaskSet(payload)
      navigate(paths.dashboard.validations.taskSets.details(result.id))
    } catch (err) {
      setError(err.message || 'Failed to create task set')
      setSubmitting(false)
    }
  }

  const isValid = formData.cux_Set_Name__c.trim() && formData.cux_Effective_Start__c

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
                href={paths.dashboard.validations.taskSets.list}
                sx={{ alignItems: 'center', display: 'inline-flex', gap: 1 }}
                variant="subtitle2"
              >
                <ArrowLeftIcon fontSize="var(--icon-fontSize-md)" />
                Baseline Task Sets
              </Link>
            </div>
            <div>
              <Typography variant="h4">New Task Set</Typography>
            </div>
          </Stack>

          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader title="Task Set Details" />
              <CardContent>
                <Stack spacing={3}>
                  {error && (
                    <Typography color="error" variant="body2">
                      {error}
                    </Typography>
                  )}
                  <FormControl fullWidth required>
                    <InputLabel>Set Name</InputLabel>
                    <OutlinedInput
                      label="Set Name"
                      name="cux_Set_Name__c"
                      value={formData.cux_Set_Name__c}
                      onChange={handleChange('cux_Set_Name__c')}
                    />
                  </FormControl>
                  <FormControl fullWidth>
                    <InputLabel>Description</InputLabel>
                    <OutlinedInput
                      label="Description"
                      name="cux_Description__c"
                      value={formData.cux_Description__c}
                      onChange={handleChange('cux_Description__c')}
                      multiline
                      minRows={3}
                    />
                  </FormControl>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.cux_Is_Active__c}
                        onChange={handleChange('cux_Is_Active__c')}
                      />
                    }
                    label="Is Active"
                  />
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                    <FormControl fullWidth required>
                      <InputLabel shrink>Effective Start</InputLabel>
                      <OutlinedInput
                        label="Effective Start"
                        name="cux_Effective_Start__c"
                        type="date"
                        value={formData.cux_Effective_Start__c}
                        onChange={handleChange('cux_Effective_Start__c')}
                        notched
                      />
                    </FormControl>
                    <FormControl fullWidth>
                      <InputLabel shrink>Effective End</InputLabel>
                      <OutlinedInput
                        label="Effective End"
                        name="cux_Effective_End__c"
                        type="date"
                        value={formData.cux_Effective_End__c}
                        onChange={handleChange('cux_Effective_End__c')}
                        notched
                      />
                    </FormControl>
                  </Stack>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      disabled={!isValid || submitting}
                      type="submit"
                      variant="contained"
                    >
                      {submitting ? 'Creating...' : 'Create Task Set'}
                    </Button>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </form>
        </Stack>
      </Box>
      </AnimatedPage>
    </React.Fragment>
  )
}
