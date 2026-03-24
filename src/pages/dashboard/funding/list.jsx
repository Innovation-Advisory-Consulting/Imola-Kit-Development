import * as React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import OutlinedInput from '@mui/material/OutlinedInput'
import Select from '@mui/material/Select'
import Switch from '@mui/material/Switch'
import Link from '@mui/material/Link'
import { Plus as PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus'
import { Helmet } from 'react-helmet-async'

import { appConfig } from '@/config/app'
import { paths } from '@/paths'
import { dayjs } from '@/lib/dayjs'
import { useSalesforceQuery } from '@/hooks/use-salesforce'
import { useSalesforceClient } from '@/hooks/use-salesforce'
import { RouterLink } from '@/components/core/link'
import { DataTableView } from '@/components/core/data-table-view'
import { AnimatedPage } from '@/components/core/animations'

const metadata = { title: `Funds | Dashboard | ${appConfig.name}` }

const FUND_TYPES = ['General Fund', 'Special Fund', 'Federal Fund', 'Bond Fund', 'Reimbursement Fund']

const fundTypeColors = {
  'General Fund': 'info',
  'Federal Fund': 'warning',
  'Special Fund': 'success',
  'Bond Fund': 'secondary',
  'Reimbursement Fund': 'default',
}

function formatDate(value) {
  if (!value) return '\u2014'
  return dayjs(value).format('MMM D, YYYY')
}

function formatCurrency(value) {
  if (value == null) return '\u2014'
  return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const columns = [
  {
    id: 'fundName',
    label: 'Fund Name',
    sortKey: 'cux_Fund_Name__c',
    field: 'cux_Fund_Name__c',
    width: '200px',
    formatter: (row) => (
      <Link component={RouterLink} href={paths.dashboard.funding.details(row.Id)} variant="subtitle2" underline="hover">
        {row.cux_Fund_Name__c || row.Name}
      </Link>
    ),
    exportValue: (row) => row.cux_Fund_Name__c || row.Name || '',
  },
  {
    id: 'code',
    label: 'Code',
    sortKey: 'cux_Code__c',
    field: 'cux_Code__c',
  },
  {
    id: 'fundType',
    label: 'Fund Type',
    sortKey: 'cux_Fund_Type__c',
    field: 'cux_Fund_Type__c',
    formatter: (row) =>
      row.cux_Fund_Type__c ? (
        <Chip label={row.cux_Fund_Type__c} size="small" variant="soft" color={fundTypeColors[row.cux_Fund_Type__c] || 'default'} />
      ) : '\u2014',
  },
  {
    id: 'amount',
    label: 'Budget',
    sortKey: 'cux_Amount__c',
    field: 'cux_Amount__c',
    align: 'right',
    formatter: (row) => formatCurrency(row.cux_Amount__c),
    exportValue: (row) => row.cux_Amount__c ?? '',
  },
  {
    id: 'totalAllocated',
    label: 'Allocated',
    sortKey: '_totalAllocated',
    field: '_totalAllocated',
    align: 'right',
    formatter: (row) => formatCurrency(row._totalAllocated || 0),
    exportValue: (row) => row._totalAllocated || 0,
  },
  {
    id: 'availableBalance',
    label: 'Available',
    sortKey: '_availableBalance',
    field: '_availableBalance',
    align: 'right',
    formatter: (row) => {
      const available = (row.cux_Amount__c || 0) - (row._totalAllocated || 0)
      return (
        <Typography
          variant="body2"
          sx={{ color: available > 0 ? 'success.main' : available < 0 ? 'error.main' : 'text.secondary' }}
        >
          {formatCurrency(available)}
        </Typography>
      )
    },
    exportValue: (row) => (row.cux_Amount__c || 0) - (row._totalAllocated || 0),
  },
  {
    id: 'effectiveStart',
    label: 'Effective Start',
    sortKey: 'cux_Effective_Start__c',
    field: 'cux_Effective_Start__c',
    formatter: (row) => formatDate(row.cux_Effective_Start__c),
    filterable: false,
  },
  {
    id: 'effectiveEnd',
    label: 'Effective End',
    sortKey: 'cux_Effective_End__c',
    field: 'cux_Effective_End__c',
    formatter: (row) => formatDate(row.cux_Effective_End__c),
    filterable: false,
  },
  {
    id: 'retiredOn',
    label: 'Retired On',
    sortKey: 'cux_Retired_On__c',
    field: 'cux_Retired_On__c',
    formatter: (row) => formatDate(row.cux_Retired_On__c),
    filterable: false,
    hidden: true,
  },
  {
    id: 'status',
    label: 'Status',
    sortKey: 'cux_Is_Active__c',
    field: 'cux_Is_Active__c',
    formatter: (row) => (
      <Chip
        label={row.cux_Is_Active__c ? 'Active' : 'Inactive'}
        size="small"
        variant="soft"
        color={row.cux_Is_Active__c ? 'success' : 'default'}
      />
    ),
    exportValue: (row) => row.cux_Is_Active__c ? 'Active' : 'Inactive',
  },
]

const INITIAL_VALUES = {
  fundName: '',
  code: '',
  fundType: '',
  amount: '',
  effectiveStart: '',
  effectiveEnd: '',
  isActive: true,
}

function AddFundDialog({ open, onClose, onSuccess }) {
  const client = useSalesforceClient()
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState(null)
  const [values, setValues] = React.useState(INITIAL_VALUES)

  React.useEffect(() => {
    if (open) {
      setValues(INITIAL_VALUES)
      setError(null)
    }
  }, [open])

  function handleChange(field) {
    return (event) => setValues((prev) => ({ ...prev, [field]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!client || !values.fundName || !values.code) return

    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        cux_Fund_Name__c: values.fundName,
        cux_Code__c: values.code,
        cux_Is_Active__c: values.isActive,
      }
      if (values.fundType) payload.cux_Fund_Type__c = values.fundType
      if (values.amount) payload.cux_Amount__c = parseFloat(values.amount)
      if (values.effectiveStart) payload.cux_Effective_Start__c = values.effectiveStart
      if (values.effectiveEnd) payload.cux_Effective_End__c = values.effectiveEnd

      await client.createFundingCode(payload)
      onClose()
      if (onSuccess) onSuccess()
    } catch (err) {
      setError(err.response?.data?.[0]?.message || err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ component: 'form', onSubmit: handleSubmit }}
    >
      <DialogTitle>Add Fund</DialogTitle>
      <Divider />
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}

          <FormControl fullWidth required>
            <InputLabel>Fund Name</InputLabel>
            <OutlinedInput
              value={values.fundName}
              onChange={handleChange('fundName')}
              label="Fund Name"
              placeholder="e.g. General Operating Fund"
            />
          </FormControl>

          <FormControl fullWidth required>
            <InputLabel>Code</InputLabel>
            <OutlinedInput
              value={values.code}
              onChange={handleChange('code')}
              label="Code"
              placeholder="e.g. GF-001"
            />
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Fund Type</InputLabel>
            <Select
              value={values.fundType}
              onChange={handleChange('fundType')}
              label="Fund Type"
            >
              {FUND_TYPES.map((t) => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Amount</InputLabel>
            <OutlinedInput
              type="number"
              value={values.amount}
              onChange={handleChange('amount')}
              label="Amount"
              inputProps={{ min: 0, step: 0.01 }}
              startAdornment={<Typography sx={{ mr: 0.5 }}>$</Typography>}
            />
          </FormControl>

          <Stack direction="row" spacing={2}>
            <FormControl fullWidth>
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
          </Stack>

          <FormControlLabel
            control={
              <Switch
                checked={values.isActive}
                onChange={(e) => setValues((prev) => ({ ...prev, isActive: e.target.checked }))}
              />
            }
            label="Active"
          />
        </Stack>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button color="secondary" onClick={onClose}>Cancel</Button>
        <Button
          type="submit"
          variant="contained"
          disabled={submitting || !values.fundName || !values.code}
        >
          {submitting ? 'Creating...' : 'Create Fund'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export function Page() {
  const { data: funds, loading, error, refetch } = useSalesforceQuery((client) => client.getFundingCodes())
  const { data: allocTotals } = useSalesforceQuery((client) => client.getFundAllocationTotals())
  const [addOpen, setAddOpen] = React.useState(false)

  const enrichedFunds = React.useMemo(() => {
    if (!funds) return []
    const totalsMap = {}
    if (allocTotals) {
      for (const row of allocTotals) {
        totalsMap[row.fundId] = row.totalAllocated || 0
      }
    }
    return funds.map((f) => ({
      ...f,
      _totalAllocated: totalsMap[f.Id] || 0,
      _availableBalance: (f.cux_Amount__c || 0) - (totalsMap[f.Id] || 0),
    }))
  }, [funds, allocTotals])

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
            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h4">Funds</Typography>
              <Button variant="contained" startIcon={<PlusIcon />} onClick={() => setAddOpen(true)}>
                Add Fund
              </Button>
            </Stack>

            <Card>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Alert severity="error" sx={{ m: 2 }}>
                  Failed to load funds: {error.message}
                </Alert>
              ) : (
                <DataTableView
                  columns={columns}
                  rows={enrichedFunds}
                  entityLabel="Funds"
                  defaultSortKey="cux_Fund_Name__c"
                  defaultSortDirection="asc"
                  quickViewConfig={{
                    titleField: 'cux_Fund_Name__c',
                    subtitleField: 'cux_Fund_Type__c',
                    subtitleColorMap: fundTypeColors,
                    sections: [
                      {
                        title: 'Fund Information',
                        fields: [
                          { label: 'Fund Name', field: 'cux_Fund_Name__c' },
                          { label: 'Code', field: 'cux_Code__c' },
                          { label: 'Fund Type', field: 'cux_Fund_Type__c' },
                          { label: 'Budget', field: 'cux_Amount__c', type: 'currency' },
                          { label: 'Total Allocated', field: '_totalAllocated', type: 'currency' },
                          { label: 'Available Balance', field: '_availableBalance', type: 'currency' },
                          { label: 'Status', field: 'cux_Is_Active__c', type: 'boolean' },
                        ],
                      },
                      {
                        title: 'Schedule',
                        fields: [
                          { label: 'Effective Start', field: 'cux_Effective_Start__c', type: 'date' },
                          { label: 'Effective End', field: 'cux_Effective_End__c', type: 'date' },
                          { label: 'Retired On', field: 'cux_Retired_On__c', type: 'date' },
                        ],
                      },
                    ],
                  }}
                />
              )}
            </Card>
          </Stack>
        </Box>
      </AnimatedPage>

      <AddFundDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={refetch}
      />
    </React.Fragment>
  )
}
