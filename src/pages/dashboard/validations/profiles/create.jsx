import * as React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid'
import InputLabel from '@mui/material/InputLabel'
import Link from '@mui/material/Link'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr/ArrowLeft'
import { Helmet } from 'react-helmet-async'
import { useNavigate } from 'react-router-dom'

import { appConfig } from '@/config/app'
import { paths } from '@/paths'
import { RouterLink } from '@/components/core/link'
import { useSalesforceClient, useSalesforceQuery } from '@/hooks/use-salesforce'
import { AnimatedPage } from '@/components/core/animations'

const metadata = { title: `Create | Validation Profiles | Dashboard | ${appConfig.name}` }

const TARGET_ENTITY_TYPES = ['Contract', 'Amendment', 'TaskOrder', 'Termination', 'Settlement', 'Invoice']

export function Page() {
  const navigate = useNavigate()
  const client = useSalesforceClient()
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState(null)
  const [isActive, setIsActive] = React.useState(true)
  const [targetEntity, setTargetEntity] = React.useState('')
  const [baselineTaskSetId, setBaselineTaskSetId] = React.useState('')
  const [ruleSetId, setRuleSetId] = React.useState('')

  const { data: taskSets, loading: taskSetsLoading } = useSalesforceQuery((c) => c.getBaselineTaskSets())
  const { data: ruleSets, loading: ruleSetsLoading } = useSalesforceQuery((c) => c.getRuleSets())

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!client) return

    const formData = new FormData(event.target)
    const data = {
      cux_Profile_Name__c: formData.get('profileName'),
      cux_Target_Entity_Type__c: targetEntity,
      cux_Version__c: formData.get('version'),
      cux_Is_Active__c: isActive,
      cux_Effective_Start__c: formData.get('effectiveStart') || undefined,
      cux_Effective_End__c: formData.get('effectiveEnd') || undefined,
      cux_Baseline_Task_Set__c: baselineTaskSetId || undefined,
      cux_Rule_Set__c: ruleSetId || undefined,
      cux_Ai_Validator_Set_Id__c: formData.get('aiValidatorSetId') || undefined,
    }

    // Remove undefined values
    Object.keys(data).forEach((key) => data[key] === undefined && delete data[key])

    setSaving(true)
    setError(null)

    try {
      const result = await client.createValidationProfile(data)
      navigate(paths.dashboard.validations.profiles.details(result.id))
    } catch (err) {
      setError(err.response?.data?.[0]?.message || err.message)
      setSaving(false)
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
                  href={paths.dashboard.validations.profiles.list}
                  sx={{ alignItems: 'center', display: 'inline-flex', gap: 1 }}
                  variant="subtitle2"
                >
                  <ArrowLeftIcon fontSize="var(--icon-fontSize-md)" />
                  Validation Profiles
                </Link>
              </div>
              <div>
                <Typography variant="h4">New Validation Profile</Typography>
              </div>
            </Stack>

            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                <Card>
                  <CardHeader title="Profile Information" />
                  <Divider />
                  <CardContent>
                    <Grid container spacing={3}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          label="Profile Name"
                          name="profileName"
                          required
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <FormControl fullWidth required>
                          <InputLabel>Target Entity Type</InputLabel>
                          <Select
                            label="Target Entity Type"
                            value={targetEntity}
                            onChange={(e) => setTargetEntity(e.target.value)}
                          >
                            {TARGET_ENTITY_TYPES.map((type) => (
                              <MenuItem key={type} value={type}>{type}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          label="Version"
                          name="version"
                          required
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={isActive}
                              onChange={(e) => setIsActive(e.target.checked)}
                            />
                          }
                          label="Active"
                          sx={{ mt: 1 }}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader title="Effective Dates" />
                  <Divider />
                  <CardContent>
                    <Grid container spacing={3}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          label="Effective Start"
                          name="effectiveStart"
                          type="date"
                          required
                          slotProps={{ inputLabel: { shrink: true } }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          label="Effective End"
                          name="effectiveEnd"
                          type="date"
                          slotProps={{ inputLabel: { shrink: true } }}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader title="Linked Configuration" />
                  <Divider />
                  <CardContent>
                    <Grid container spacing={3}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <FormControl fullWidth>
                          <InputLabel>Baseline Task Set</InputLabel>
                          <Select
                            label="Baseline Task Set"
                            value={baselineTaskSetId}
                            onChange={(e) => setBaselineTaskSetId(e.target.value)}
                            disabled={taskSetsLoading}
                            startAdornment={taskSetsLoading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
                          >
                            <MenuItem value="">
                              <em>None</em>
                            </MenuItem>
                            {(taskSets || []).map((ts) => (
                              <MenuItem key={ts.Id} value={ts.Id}>{ts.cux_Set_Name__c || ts.Name}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <FormControl fullWidth>
                          <InputLabel>Rule Set</InputLabel>
                          <Select
                            label="Rule Set"
                            value={ruleSetId}
                            onChange={(e) => setRuleSetId(e.target.value)}
                            disabled={ruleSetsLoading}
                            startAdornment={ruleSetsLoading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
                          >
                            <MenuItem value="">
                              <em>None</em>
                            </MenuItem>
                            {(ruleSets || []).map((rs) => (
                              <MenuItem key={rs.Id} value={rs.Id}>{rs.cux_Rule_Set_Name__c || rs.Name}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          label="AI Validator Set ID"
                          name="aiValidatorSetId"
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {error && (
                  <Typography color="error" variant="body2">
                    {error}
                  </Typography>
                )}

                <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
                  <Button
                    component={RouterLink}
                    href={paths.dashboard.validations.profiles.list}
                    color="secondary"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="contained" disabled={saving}>
                    {saving ? 'Creating...' : 'Create Profile'}
                  </Button>
                </Stack>
              </Stack>
            </form>
          </Stack>
        </Box>
      </AnimatedPage>
    </React.Fragment>
  )
}
