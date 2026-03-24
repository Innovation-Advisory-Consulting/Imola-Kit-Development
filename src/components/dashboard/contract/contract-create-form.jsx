import * as React from 'react'
import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Divider from '@mui/material/Divider'
import Checkbox from '@mui/material/Checkbox'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormHelperText from '@mui/material/FormHelperText'
import Grid from '@mui/material/Grid'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import OutlinedInput from '@mui/material/OutlinedInput'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useNavigate } from 'react-router-dom'

import { paths } from '@/paths'
import { RouterLink } from '@/components/core/link'
import { AiTextAssist } from '@/components/core/ai-text-assist'
import { useAuth } from '@/auth/AuthContext'
import { useSalesforceClient, useSalesforceQuery } from '@/hooks/use-salesforce'
import { triggerInitialValidation, assignReviewWork } from '@/hooks/use-validation-engine'

const CONTRACT_TYPES = ['Professional Services', 'Construction', 'Goods', 'Interagency', 'Other']

const PROCUREMENT_METHODS = [
  'Competitive Bid',
  'Request for Proposal',
  'Sole Source',
  'Emergency',
  'Interagency Agreement',
  'Other',
]

const CONTRACT_CLASSIFICATIONS = ['New', 'Replacement']

const PROGRAMS = ['2010', '2080']

const RISK_LEVELS = ['Low', 'Moderate', 'High', 'Critical']

const DIVISIONS = ['Admin', 'Executive', 'PPM&OE', 'Geotech', 'METS', 'Structure Construction', 'Bridge Design']

const EA_PHASES = ['0', '1', '3', 'N']

const FUNCTIONAL_AREAS = ['DESD', 'DESC']

const PROJECT_CLASSIFICATIONS = ['NPS', 'PS', 'Not Applicable']

const WORK_BUCKETS = [
  'TS', 'PH2', 'PTNR', 'RMI', 'SHOPP', 'STIP', 'TCRF',
  'BOND CMIA', 'BOND STIP', 'BOND RTE 99', 'BOND SHOPP', 'Not Applicable',
]

export function ContractCreateForm() {
  const navigate = useNavigate()
  const { auth } = useAuth()
  const client = useSalesforceClient()
  const { data: businessUnits } = useSalesforceQuery((c) => c.getBusinessUnits())
  const { data: accounts } = useSalesforceQuery((c) => c.getAccounts())
  const { data: users } = useSalesforceQuery((c) => c.getActiveUsers())
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState(null)

  const [values, setValues] = React.useState({
    // Contract Details
    cux_Title__c: '',
    cux_Contract_Type__c: '',
    cux_Contract_Classification__c: '',
    cux_Replaced_Contract__c: '',
    cux_Program__c: '',
    cux_Is_HQ__c: false,
    cux_Procurement_Method__c: '',
    cux_Procurement_Reference__c: '',
    cux_Risk_Level__c: '',
    // Organization
    cux_Business_Unit__c: '',
    cux_Contracting_Agency__c: '',
    // Classification & Work
    cux_Project_Classification__c: '',
    // Parties
    cux_Account__c: '',
    cux_Vendor_Contact__c: '',
    cux_Contract_Manager__c: '',
    cux_Parent_Contract__c: '',
    // Dates & Financials
    cux_Start_Date__c: '',
    cux_End_Date__c: '',
    cux_Total_Authorized_Amount__c: '',
    cux_DBE_Goal_Percent__c: '',
    cux_DVBE_Goal_Percent__c: '',
    // DGS
    cux_DGS_Exemption__c: '',
    // Narrative
    cux_Narrative__c: '',
  })

  // Fetch active contracts for the "Replaces" picker
  const { data: activeContracts } = useSalesforceQuery(
    (c) => c.query(
      `SELECT Id, Name, cux_Title__c, cux_Account__r.Name FROM cux_Contract__c WHERE cux_Status__c = 'Active' ORDER BY Name LIMIT 100`
    ),
  )

  // Fetch all contracts for the "Parent Contract" picker
  const { data: allContracts } = useSalesforceQuery(
    (c) => c.query(
      `SELECT Id, Name, cux_Title__c, cux_Account__r.Name FROM cux_Contract__c ORDER BY Name LIMIT 200`
    ),
  )

  // Load contacts for selected vendor
  const { data: vendorContacts } = useSalesforceQuery(
    (c) => values.cux_Account__c ? c.getAccountContacts(values.cux_Account__c) : Promise.resolve([]),
    [values.cux_Account__c]
  )

  function handleChange(field) {
    return (event) => {
      setValues((prev) => {
        const next = { ...prev, [field]: event.target.value }
        // Clear vendor contact when vendor changes
        if (field === 'cux_Account__c') {
          next.cux_Vendor_Contact__c = ''
        }
        // Clear replaced contract when classification changes away from Replacement
        if (field === 'cux_Contract_Classification__c' && event.target.value !== 'Replacement') {
          next.cux_Replaced_Contract__c = ''
        }
        return next
      })
    }
  }

  // Numeric fields that need conversion before submit
  const NUMERIC_FIELDS = [
    'cux_Total_Authorized_Amount__c',
    'cux_DBE_Goal_Percent__c',
    'cux_DVBE_Goal_Percent__c',
  ]

  async function handleSubmit(event) {
    event.preventDefault()
    if (!client) return

    setSubmitting(true)
    setError(null)
    try {
      const payload = { ...values }
      NUMERIC_FIELDS.forEach((f) => {
        if (payload[f]) payload[f] = Number(payload[f])
      })
      // Remove empty strings (but keep false booleans)
      Object.keys(payload).forEach((key) => {
        if (payload[key] === '') delete payload[key]
      })

      const result = await client.createContract(payload)

      // Trigger initial validation checklist (creates review WorkTask)
      await triggerInitialValidation(client, 'Contract', result.id)

      // Assign review work + notify contract manager
      if (payload.cux_Contract_Manager__c) {
        assignReviewWork(client, 'Contract', result.id, payload.cux_Contract_Manager__c, payload.cux_Title__c || 'New Contract')
          .catch((err) => console.warn('Failed to assign review work:', err))
      }

      navigate(paths.dashboard.contracts.details(result.id))
    } catch (err) {
      setError(err.response?.data?.[0]?.message || err.message)
      setSubmitting(false)
    }
  }

  const activeBusinessUnits = (businessUnits || []).filter((bu) => bu.cux_Is_Active__c)
  const activeUsers = users || []
  const accountList = accounts || []
  const contactList = vendorContacts || []

  function contractOptionLabel(opt) {
    return `${opt.Name} — ${opt.cux_Title__c || 'Untitled'}${opt.cux_Account__r?.Name ? ` (${opt.cux_Account__r.Name})` : ''}`
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={3}>
        {/* ─── Contract Details ─── */}
        <Card>
          <CardHeader title="Contract Details" />
          <Divider />
          <CardContent>
            <Grid container spacing={3}>
              <Grid size={{ md: 6, xs: 12 }}>
                <FormControl fullWidth required>
                  <InputLabel>Title</InputLabel>
                  <OutlinedInput
                    label="Title"
                    value={values.cux_Title__c}
                    onChange={handleChange('cux_Title__c')}
                  />
                </FormControl>
              </Grid>
              <Grid size={{ md: 3, xs: 12 }}>
                <FormControl fullWidth required>
                  <InputLabel>Contract Type</InputLabel>
                  <Select
                    label="Contract Type"
                    value={values.cux_Contract_Type__c}
                    onChange={handleChange('cux_Contract_Type__c')}
                  >
                    {CONTRACT_TYPES.map((type) => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ md: 3, xs: 12 }}>
                <FormControl fullWidth>
                  <InputLabel>Classification</InputLabel>
                  <Select
                    label="Classification"
                    value={values.cux_Contract_Classification__c}
                    onChange={handleChange('cux_Contract_Classification__c')}
                  >
                    {CONTRACT_CLASSIFICATIONS.map((c) => (
                      <MenuItem key={c} value={c}>{c}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              {values.cux_Contract_Classification__c === 'Replacement' && (
                <Grid size={{ md: 4, xs: 12 }}>
                  <Autocomplete
                    options={activeContracts || []}
                    getOptionLabel={contractOptionLabel}
                    value={(activeContracts || []).find((c) => c.Id === values.cux_Replaced_Contract__c) || null}
                    onChange={(_, newVal) => setValues((prev) => ({ ...prev, cux_Replaced_Contract__c: newVal?.Id || '' }))}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Replaces Contract"
                        required
                        helperText="Select the active contract being replaced"
                      />
                    )}
                    isOptionEqualToValue={(opt, val) => opt.Id === val.Id}
                  />
                </Grid>
              )}
              <Grid size={{ md: 4, xs: 12 }}>
                <FormControl fullWidth required>
                  <InputLabel>Program</InputLabel>
                  <Select
                    label="Program"
                    value={values.cux_Program__c}
                    onChange={handleChange('cux_Program__c')}
                  >
                    {PROGRAMS.map((p) => (
                      <MenuItem key={p} value={p}>{p}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ md: 4, xs: 12 }} sx={{ display: 'flex', alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={values.cux_Is_HQ__c}
                      onChange={(e) => setValues((prev) => ({ ...prev, cux_Is_HQ__c: e.target.checked }))}
                    />
                  }
                  label="HQ Contract"
                />
              </Grid>
              <Grid size={{ md: 4, xs: 12 }}>
                <FormControl fullWidth>
                  <InputLabel>Procurement Method</InputLabel>
                  <Select
                    label="Procurement Method"
                    value={values.cux_Procurement_Method__c}
                    onChange={handleChange('cux_Procurement_Method__c')}
                  >
                    {PROCUREMENT_METHODS.map((method) => (
                      <MenuItem key={method} value={method}>{method}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ md: 4, xs: 12 }}>
                <FormControl fullWidth>
                  <InputLabel>Procurement Reference</InputLabel>
                  <OutlinedInput
                    label="Procurement Reference"
                    value={values.cux_Procurement_Reference__c}
                    onChange={handleChange('cux_Procurement_Reference__c')}
                    placeholder="e.g. RFP-2025-001"
                  />
                </FormControl>
              </Grid>
              <Grid size={{ md: 4, xs: 12 }}>
                <FormControl fullWidth>
                  <InputLabel>Risk Level</InputLabel>
                  <Select
                    label="Risk Level"
                    value={values.cux_Risk_Level__c}
                    onChange={handleChange('cux_Risk_Level__c')}
                  >
                    {RISK_LEVELS.map((level) => (
                      <MenuItem key={level} value={level}>{level}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* ─── Organization ─── */}
        <Card>
          <CardHeader title="Organization" />
          <Divider />
          <CardContent>
            <Grid container spacing={3}>
              <Grid size={{ md: 4, xs: 12 }}>
                <FormControl fullWidth>
                  <InputLabel>Business Unit</InputLabel>
                  <Select
                    label="Business Unit"
                    value={values.cux_Business_Unit__c}
                    onChange={handleChange('cux_Business_Unit__c')}
                  >
                    {activeBusinessUnits.map((bu) => (
                      <MenuItem key={bu.Id} value={bu.Id}>
                        {bu.cux_Code__c} — {bu.cux_Unit_Name__c}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ md: 4, xs: 12 }}>
                <FormControl fullWidth>
                  <InputLabel>Contracting Agency</InputLabel>
                  <OutlinedInput
                    label="Contracting Agency"
                    value={values.cux_Contracting_Agency__c}
                    onChange={handleChange('cux_Contracting_Agency__c')}
                  />
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* ─── Classification & Work ─── */}
        <Card>
          <CardHeader title="Classification & Work" />
          <Divider />
          <CardContent>
            <Grid container spacing={3}>
              <Grid size={{ md: 3, xs: 12 }}>
                <FormControl fullWidth>
                  <InputLabel>Project Classification</InputLabel>
                  <Select
                    label="Project Classification"
                    value={values.cux_Project_Classification__c}
                    onChange={handleChange('cux_Project_Classification__c')}
                  >
                    {PROJECT_CLASSIFICATIONS.map((pc) => (
                      <MenuItem key={pc} value={pc}>{pc}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ md: 4, xs: 12 }}>
                <FormControl fullWidth>
                  <InputLabel>DGS Exemption</InputLabel>
                  <OutlinedInput
                    label="DGS Exemption"
                    value={values.cux_DGS_Exemption__c}
                    onChange={handleChange('cux_DGS_Exemption__c')}
                  />
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* ─── Parties ─── */}
        <Card>
          <CardHeader title="Parties" />
          <Divider />
          <CardContent>
            <Grid container spacing={3}>
              <Grid size={{ md: 4, xs: 12 }}>
                <FormControl fullWidth>
                  <InputLabel>Vendor</InputLabel>
                  <Select
                    label="Vendor"
                    value={values.cux_Account__c}
                    onChange={handleChange('cux_Account__c')}
                  >
                    {accountList.map((a) => (
                      <MenuItem key={a.Id} value={a.Id}>{a.Name}</MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>Company or organization</FormHelperText>
                </FormControl>
              </Grid>
              <Grid size={{ md: 4, xs: 12 }}>
                <FormControl fullWidth disabled={!values.cux_Account__c}>
                  <InputLabel>Vendor Contact</InputLabel>
                  <Select
                    label="Vendor Contact"
                    value={values.cux_Vendor_Contact__c}
                    onChange={handleChange('cux_Vendor_Contact__c')}
                  >
                    {contactList.map((c) => (
                      <MenuItem key={c.Id} value={c.Id}>
                        {c.FirstName} {c.LastName}{c.Title ? ` — ${c.Title}` : ''}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>{values.cux_Account__c ? 'Contacts for selected vendor' : 'Select a vendor first'}</FormHelperText>
                </FormControl>
              </Grid>
              <Grid size={{ md: 4, xs: 12 }}>
                <FormControl fullWidth>
                  <InputLabel>Contract Manager</InputLabel>
                  <Select
                    label="Contract Manager"
                    value={values.cux_Contract_Manager__c}
                    onChange={handleChange('cux_Contract_Manager__c')}
                  >
                    {activeUsers.map((u) => (
                      <MenuItem key={u.Id} value={u.Id}>{u.Name}</MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>Internal contract manager</FormHelperText>
                </FormControl>
              </Grid>
              <Grid size={{ md: 4, xs: 12 }}>
                <Autocomplete
                  options={allContracts || []}
                  getOptionLabel={contractOptionLabel}
                  value={(allContracts || []).find((c) => c.Id === values.cux_Parent_Contract__c) || null}
                  onChange={(_, newVal) => setValues((prev) => ({ ...prev, cux_Parent_Contract__c: newVal?.Id || '' }))}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Parent Contract"
                      helperText="Master agreement or umbrella contract"
                    />
                  )}
                  isOptionEqualToValue={(opt, val) => opt.Id === val.Id}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* ─── Dates & Financials ─── */}
        <Card>
          <CardHeader title="Dates & Financials" />
          <Divider />
          <CardContent>
            <Grid container spacing={3}>
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
                    value={values.cux_Total_Authorized_Amount__c}
                    onChange={handleChange('cux_Total_Authorized_Amount__c')}
                  />
                </FormControl>
              </Grid>
              <Grid size={{ md: 4, xs: 12 }}>
                <FormControl fullWidth>
                  <InputLabel>DBE Goal %</InputLabel>
                  <OutlinedInput
                    label="DBE Goal %"
                    type="number"
                    inputProps={{ min: 0, max: 100, step: 0.01 }}
                    value={values.cux_DBE_Goal_Percent__c}
                    onChange={handleChange('cux_DBE_Goal_Percent__c')}
                  />
                </FormControl>
              </Grid>
              <Grid size={{ md: 4, xs: 12 }}>
                <FormControl fullWidth>
                  <InputLabel>DVBE Goal %</InputLabel>
                  <OutlinedInput
                    label="DVBE Goal %"
                    type="number"
                    inputProps={{ min: 0, max: 100, step: 0.01 }}
                    value={values.cux_DVBE_Goal_Percent__c}
                    onChange={handleChange('cux_DVBE_Goal_Percent__c')}
                  />
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* ─── Narrative ─── */}
        <Card>
          <CardHeader title="Narrative" />
          <Divider />
          <CardContent>
            <FormControl fullWidth>
              <InputLabel>Narrative</InputLabel>
              <OutlinedInput
                label="Narrative"
                multiline
                rows={4}
                value={values.cux_Narrative__c}
                onChange={handleChange('cux_Narrative__c')}
              />
            </FormControl>
            <AiTextAssist
              text={values.cux_Narrative__c}
              onAccept={(enhanced) => setValues((prev) => ({ ...prev, cux_Narrative__c: enhanced }))}
            />
          </CardContent>
        </Card>

        {/* ─── Actions ─── */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          {error ? (
            <FormHelperText error sx={{ flex: '1 1 auto', alignSelf: 'center' }}>
              {error}
            </FormHelperText>
          ) : null}
          <Button color="secondary" component={RouterLink} href={paths.dashboard.contracts.list}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Contract'}
          </Button>
        </Box>
      </Stack>
    </form>
  )
}
