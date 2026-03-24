import * as React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import OutlinedInput from '@mui/material/OutlinedInput'
import Select from '@mui/material/Select'
import Switch from '@mui/material/Switch'
import { ArrowLeft as ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr/ArrowLeft'
import { PencilSimple as PencilSimpleIcon } from '@phosphor-icons/react/dist/ssr/PencilSimple'
import { Helmet } from 'react-helmet-async'
import { useParams } from 'react-router-dom'

import { useRecentRecords } from '@/contexts/recent-records-context'
import { appConfig } from '@/config/app'
import { paths } from '@/paths'
import { dayjs } from '@/lib/dayjs'
import { RouterLink } from '@/components/core/link'
import { PropertyItem } from '@/components/core/property-item'
import { PropertyList } from '@/components/core/property-list'
import { useSalesforceQuery, useSalesforceClient } from '@/hooks/use-salesforce'
import { AnimatedPage } from '@/components/core/animations'

const metadata = { title: `Fund Details | Dashboard | ${appConfig.name}` }

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

// ─── Summary Cards ───

function SummaryCards({ fund, allocations }) {
  const budget = fund.cux_Amount__c || 0
  const totalAllocated = (allocations || []).reduce((sum, a) => sum + (a.cux_Allocated_Amount__c || 0), 0)
  const available = budget - totalAllocated
  const totalObligated = (allocations || []).reduce((sum, a) => sum + (a.cux_Obligated_Amount__c || 0), 0)
  const totalExpended = (allocations || []).reduce((sum, a) => sum + (a.cux_Expended_Amount__c || 0), 0)

  const cards = [
    { label: 'Total Budget', value: budget, color: 'text.primary' },
    { label: 'Total Allocated', value: totalAllocated, color: totalAllocated > budget ? 'error.main' : 'warning.main' },
    { label: 'Available Balance', value: available, color: available > 0 ? 'success.main' : 'error.main' },
    { label: 'Total Obligated', value: totalObligated, color: 'text.secondary' },
    { label: 'Total Expended', value: totalExpended, color: 'text.secondary' },
  ]

  return (
    <Grid container spacing={3}>
      {cards.map((c) => (
        <Grid key={c.label} size={{ xs: 6, sm: 4, lg: 2.4 }}>
          <Card sx={{ p: 2.5, textAlign: 'center' }}>
            <Typography variant="overline" color="text.secondary">{c.label}</Typography>
            <Typography variant="h5" sx={{ color: c.color, mt: 0.5 }}>
              {formatCurrency(c.value)}
            </Typography>
          </Card>
        </Grid>
      ))}
    </Grid>
  )
}

// ─── Allocations Tab ───

function AllocationsTab({ allocations, loading }) {
  const [fiscalYear, setFiscalYear] = React.useState('all')

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    )
  }

  const allYears = [...new Set((allocations || []).map((a) => a.cux_Fiscal_Year__c).filter(Boolean))].sort()
  const filtered = fiscalYear === 'all' ? (allocations || []) : (allocations || []).filter((a) => a.cux_Fiscal_Year__c === fiscalYear)

  const totals = filtered.reduce(
    (acc, a) => ({
      allocated: acc.allocated + (a.cux_Allocated_Amount__c || 0),
      obligated: acc.obligated + (a.cux_Obligated_Amount__c || 0),
      expended: acc.expended + (a.cux_Expended_Amount__c || 0),
    }),
    { allocated: 0, obligated: 0, expended: 0 }
  )

  return (
    <Card>
      <CardHeader
        title="Contract Allocations"
        action={
          allYears.length > 0 ? (
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <Select value={fiscalYear} onChange={(e) => setFiscalYear(e.target.value)}>
                <MenuItem value="all">All Fiscal Years</MenuItem>
                {allYears.map((fy) => (
                  <MenuItem key={fy} value={fy}>{fy}</MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : null
        }
      />
      <Divider />
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Contract</TableCell>
            <TableCell>Fiscal Year</TableCell>
            <TableCell align="right">Allocated</TableCell>
            <TableCell align="right">Obligated</TableCell>
            <TableCell align="right">Expended</TableCell>
            <TableCell align="center">Primary</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} align="center">
                <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                  No allocations found.
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((a) => (
              <TableRow key={a.Id} hover>
                <TableCell>
                  <Link
                    component={RouterLink}
                    href={paths.dashboard.contracts.details(a.cux_Contract__c)}
                    variant="subtitle2"
                    underline="hover"
                  >
                    {a.cux_Contract__r?.Name || a.cux_Contract__c}
                  </Link>
                  {a.cux_Contract__r?.cux_Title__c ? (
                    <Typography variant="caption" color="text.secondary" display="block">
                      {a.cux_Contract__r.cux_Title__c}
                    </Typography>
                  ) : null}
                </TableCell>
                <TableCell>{a.cux_Fiscal_Year__c || '\u2014'}</TableCell>
                <TableCell align="right">{formatCurrency(a.cux_Allocated_Amount__c)}</TableCell>
                <TableCell align="right">{formatCurrency(a.cux_Obligated_Amount__c)}</TableCell>
                <TableCell align="right">{formatCurrency(a.cux_Expended_Amount__c)}</TableCell>
                <TableCell align="center">
                  {a.cux_Is_Primary__c ? <Chip label="Primary" size="small" color="info" variant="soft" /> : '\u2014'}
                </TableCell>
              </TableRow>
            ))
          )}
          {filtered.length > 0 ? (
            <TableRow>
              <TableCell colSpan={2}>
                <Typography variant="subtitle2" fontWeight={700}>
                  Total ({filtered.length} allocation{filtered.length !== 1 ? 's' : ''})
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="subtitle2" fontWeight={700}>{formatCurrency(totals.allocated)}</Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="subtitle2" fontWeight={700}>{formatCurrency(totals.obligated)}</Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="subtitle2" fontWeight={700}>{formatCurrency(totals.expended)}</Typography>
              </TableCell>
              <TableCell />
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </Card>
  )
}

// ─── Details Tab ───

function DetailsTab({ fund }) {
  return (
    <Grid container spacing={4}>
      <Grid size={{ lg: 6, xs: 12 }}>
        <Card>
          <CardHeader title="Fund Information" />
          <Divider />
          <PropertyList divider={<Divider />} sx={{ '--PropertyItem-padding': '12px 24px' }}>
            <PropertyItem name="Fund Name" value={fund.cux_Fund_Name__c} />
            <PropertyItem name="Code" value={fund.cux_Code__c} />
            <PropertyItem name="Fund Type" value={fund.cux_Fund_Type__c} />
            <PropertyItem name="Total Budget" value={formatCurrency(fund.cux_Amount__c)} />
            <PropertyItem name="Status" value={fund.cux_Is_Active__c ? 'Active' : 'Inactive'} />
          </PropertyList>
        </Card>
      </Grid>
      <Grid size={{ lg: 6, xs: 12 }}>
        <Card>
          <CardHeader title="Schedule" />
          <Divider />
          <PropertyList divider={<Divider />} sx={{ '--PropertyItem-padding': '12px 24px' }}>
            <PropertyItem name="Effective Start" value={formatDate(fund.cux_Effective_Start__c)} />
            <PropertyItem name="Effective End" value={formatDate(fund.cux_Effective_End__c)} />
            <PropertyItem name="Retired On" value={formatDate(fund.cux_Retired_On__c)} />
            <PropertyItem name="Created" value={formatDate(fund.CreatedDate)} />
            <PropertyItem name="Last Modified" value={formatDate(fund.LastModifiedDate)} />
          </PropertyList>
        </Card>
      </Grid>
    </Grid>
  )
}

// ─── Edit Dialog ───

function EditFundDialog({ fund, open, onClose, onSuccess }) {
  const client = useSalesforceClient()
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState(null)
  const [values, setValues] = React.useState({
    fundName: '',
    code: '',
    fundType: '',
    amount: '',
    effectiveStart: '',
    effectiveEnd: '',
    isActive: true,
  })

  React.useEffect(() => {
    if (open && fund) {
      setValues({
        fundName: fund.cux_Fund_Name__c || '',
        code: fund.cux_Code__c || '',
        fundType: fund.cux_Fund_Type__c || '',
        amount: fund.cux_Amount__c ?? '',
        effectiveStart: fund.cux_Effective_Start__c || '',
        effectiveEnd: fund.cux_Effective_End__c || '',
        isActive: fund.cux_Is_Active__c ?? true,
      })
      setError(null)
    }
  }, [open, fund])

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
        cux_Fund_Type__c: values.fundType || null,
        cux_Amount__c: values.amount ? parseFloat(values.amount) : null,
        cux_Effective_Start__c: values.effectiveStart || null,
        cux_Effective_End__c: values.effectiveEnd || null,
        cux_Is_Active__c: values.isActive,
      }
      await client.updateFundingCode(fund.Id, payload)
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
      <DialogTitle>Edit Fund</DialogTitle>
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
            />
          </FormControl>

          <FormControl fullWidth required>
            <InputLabel>Code</InputLabel>
            <OutlinedInput
              value={values.code}
              onChange={handleChange('code')}
              label="Code"
            />
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Fund Type</InputLabel>
            <Select
              value={values.fundType}
              onChange={handleChange('fundType')}
              label="Fund Type"
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {FUND_TYPES.map((t) => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Total Budget</InputLabel>
            <OutlinedInput
              type="number"
              value={values.amount}
              onChange={handleChange('amount')}
              label="Total Budget"
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
          {submitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ─── Main Page ───

export function Page() {
  const { fundId } = useParams()
  const { addRecentRecord } = useRecentRecords()

  const { data: fund, loading, error, refetch } = useSalesforceQuery(
    (client) => client.getFundingCode(fundId),
    [fundId]
  )

  React.useEffect(() => {
    if (fund?.cux_Fund_Name__c || fund?.Name) {
      addRecentRecord({ id: fundId, name: fund.cux_Fund_Name__c || fund.Name, label: 'Fund', path: `/dashboard/funding/${fundId}` })
    }
  }, [fund?.cux_Fund_Name__c, fund?.Name, fundId, addRecentRecord])
  const { data: allocations, loading: allocLoading } = useSalesforceQuery(
    (client) => client.getFundAllocations(fundId),
    [fundId]
  )
  const [editOpen, setEditOpen] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState('details')

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
        Failed to load fund: {error.message}
      </Alert>
    )
  }

  if (!fund) {
    return (
      <Alert severity="warning" sx={{ m: 3 }}>
        Fund not found
      </Alert>
    )
  }

  const isActive = fund.cux_Is_Active__c

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
            {/* Header */}
            <Stack spacing={3}>
              <div>
                <Link
                  color="text.primary"
                  component={RouterLink}
                  href={paths.dashboard.funding.list}
                  sx={{ alignItems: 'center', display: 'inline-flex', gap: 1 }}
                  variant="subtitle2"
                >
                  <ArrowLeftIcon fontSize="var(--icon-fontSize-md)" />
                  Funds
                </Link>
              </div>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ alignItems: 'flex-start' }}>
                <Stack sx={{ flex: '1 1 auto' }} spacing={1}>
                  <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                    <Typography variant="h4">{fund.cux_Fund_Name__c || fund.Name}</Typography>
                    <Chip
                      color={isActive ? 'success' : 'default'}
                      label={isActive ? 'Active' : 'Inactive'}
                      size="small"
                      variant="soft"
                    />
                    {fund.cux_Fund_Type__c ? (
                      <Chip
                        color={fundTypeColors[fund.cux_Fund_Type__c] || 'default'}
                        label={fund.cux_Fund_Type__c}
                        size="small"
                        variant="soft"
                      />
                    ) : null}
                  </Stack>
                  <Typography color="text.secondary" variant="body1">
                    {fund.cux_Code__c}
                  </Typography>
                </Stack>
                <Button
                  variant="outlined"
                  startIcon={<PencilSimpleIcon />}
                  onClick={() => setEditOpen(true)}
                >
                  Edit
                </Button>
              </Stack>
            </Stack>

            {/* Summary Cards */}
            <SummaryCards fund={fund} allocations={allocations} />

            {/* Tabs */}
            <div>
              <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
                <Tab label="Details" value="details" />
                <Tab label={`Allocations (${allocations?.length || 0})`} value="allocations" />
              </Tabs>
              <Divider />
            </div>

            {activeTab === 'details' ? <DetailsTab fund={fund} /> : null}
            {activeTab === 'allocations' ? <AllocationsTab allocations={allocations} loading={allocLoading} /> : null}
          </Stack>
        </Box>
      </AnimatedPage>

      <EditFundDialog
        fund={fund}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSuccess={refetch}
      />
    </React.Fragment>
  )
}
