import * as React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
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
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr/ArrowLeft'
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

const metadata = { title: `Details | Validation Profiles | Dashboard | ${appConfig.name}` }

const TARGET_ENTITY_TYPES = ['Contract', 'Amendment', 'TaskOrder', 'Termination', 'Settlement', 'Invoice']

export function Page() {
  const { profileId } = useParams()
  const [editOpen, setEditOpen] = React.useState(false)

  const { data: profile, loading, error, refetch } = useSalesforceQuery(
    (client) => client.getValidationProfile(profileId),
    [profileId]
  )

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
        Failed to load validation profile: {error.message}
      </Alert>
    )
  }

  if (!profile) {
    return (
      <Alert severity="warning" sx={{ m: 3 }}>
        Validation profile not found
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
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ alignItems: 'flex-start' }}>
                <Stack sx={{ flex: '1 1 auto' }} spacing={1}>
                  <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                    <Typography variant="h4">
                      {profile.cux_Profile_Name__c || profile.Name}
                    </Typography>
                    <Chip
                      color={profile.cux_Is_Active__c ? 'success' : 'default'}
                      label={profile.cux_Is_Active__c ? 'Active' : 'Inactive'}
                      size="small"
                      variant="soft"
                    />
                  </Stack>
                  <Typography color="text.secondary" variant="body1">
                    {profile.Name}
                  </Typography>
                </Stack>
                <Button variant="outlined" onClick={() => setEditOpen(true)}>
                  Edit
                </Button>
              </Stack>
            </Stack>

            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card>
                  <CardHeader title="Profile Details" />
                  <Divider />
                  <PropertyList divider={<Divider />} sx={{ '--PropertyItem-padding': '12px 24px' }}>
                    {[
                      { key: 'Target Entity Type', value: profile.cux_Target_Entity_Type__c },
                      { key: 'Version', value: profile.cux_Version__c },
                      { key: 'Effective Start', value: profile.cux_Effective_Start__c ? dayjs(profile.cux_Effective_Start__c).format('MMM D, YYYY') : null },
                      { key: 'Effective End', value: profile.cux_Effective_End__c ? dayjs(profile.cux_Effective_End__c).format('MMM D, YYYY') : null },
                      { key: 'AI Validator Set ID', value: profile.cux_Ai_Validator_Set_Id__c },
                    ].map((item) => (
                      <PropertyItem key={item.key} name={item.key} value={item.value || '\u2014'} />
                    ))}
                  </PropertyList>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card>
                  <CardHeader title="Linked Configuration" />
                  <Divider />
                  <PropertyList divider={<Divider />} sx={{ '--PropertyItem-padding': '12px 24px' }}>
                    {[
                      { key: 'Baseline Task Set', value: profile.cux_Baseline_Task_Set__r?.cux_Set_Name__c },
                      { key: 'Rule Set', value: profile.cux_Rule_Set__r?.cux_Rule_Set_Name__c },
                    ].map((item) => (
                      <PropertyItem key={item.key} name={item.key} value={item.value || '\u2014'} />
                    ))}
                  </PropertyList>
                  <Divider />
                  <CardHeader title="Record Info" />
                  <Divider />
                  <PropertyList divider={<Divider />} sx={{ '--PropertyItem-padding': '12px 24px' }}>
                    {[
                      { key: 'Created', value: profile.CreatedDate ? dayjs(profile.CreatedDate).format('MMM D, YYYY h:mm A') : null },
                      { key: 'Last Modified', value: profile.LastModifiedDate ? dayjs(profile.LastModifiedDate).format('MMM D, YYYY h:mm A') : null },
                    ].map((item) => (
                      <PropertyItem key={item.key} name={item.key} value={item.value || '\u2014'} />
                    ))}
                  </PropertyList>
                </Card>
              </Grid>
            </Grid>
          </Stack>
        </Box>
      </AnimatedPage>

      {editOpen && (
        <EditProfileDialog
          profile={profile}
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSaved={() => {
            setEditOpen(false)
            refetch()
          }}
        />
      )}
    </React.Fragment>
  )
}

function EditProfileDialog({ profile, open, onClose, onSaved }) {
  const client = useSalesforceClient()
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState(null)
  const [isActive, setIsActive] = React.useState(profile.cux_Is_Active__c ?? true)
  const [targetEntity, setTargetEntity] = React.useState(profile.cux_Target_Entity_Type__c || '')
  const [baselineTaskSetId, setBaselineTaskSetId] = React.useState(profile.cux_Baseline_Task_Set__c || '')
  const [ruleSetId, setRuleSetId] = React.useState(profile.cux_Rule_Set__c || '')

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
      cux_Effective_Start__c: formData.get('effectiveStart') || null,
      cux_Effective_End__c: formData.get('effectiveEnd') || null,
      cux_Baseline_Task_Set__c: baselineTaskSetId || null,
      cux_Rule_Set__c: ruleSetId || null,
      cux_Ai_Validator_Set_Id__c: formData.get('aiValidatorSetId') || null,
    }

    setSaving(true)
    setError(null)

    try {
      await client.updateValidationProfile(profile.Id, data)
      onSaved()
    } catch (err) {
      setError(err.response?.data?.[0]?.message || err.message)
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Edit Validation Profile</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1 }}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Profile Name"
                  name="profileName"
                  defaultValue={profile.cux_Profile_Name__c || ''}
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
                  defaultValue={profile.cux_Version__c || ''}
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
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Effective Start"
                  name="effectiveStart"
                  type="date"
                  defaultValue={profile.cux_Effective_Start__c || ''}
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
                  defaultValue={profile.cux_Effective_End__c || ''}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
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
                  defaultValue={profile.cux_Ai_Validator_Set_Id__c || ''}
                />
              </Grid>
            </Grid>

            {error && (
              <Typography color="error" variant="body2">
                {error}
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="secondary">Cancel</Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
