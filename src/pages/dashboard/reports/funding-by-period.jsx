import * as React from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Helmet } from 'react-helmet-async'

import { appConfig } from '@/config/app'
import { dayjs } from '@/lib/dayjs'
import { useSalesforceQuery } from '@/hooks/use-salesforce'
import { AnimatedPage } from '@/components/core/animations'
import { NoSsr } from '@/components/core/no-ssr'

const metadata = { title: `Funding by Period | Reports | ${appConfig.name}` }

function formatCurrency(value) {
  if (value == null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)
}

function formatCompact(value) {
  if (value == null) return '$0'
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value}`
}

function getQuarter(date) {
  const month = date.month()
  if (month < 3) return 'Q1'
  if (month < 6) return 'Q2'
  if (month < 9) return 'Q3'
  return 'Q4'
}

function getFiscalYear(date) {
  // Federal fiscal year: Oct-Sep. Oct 2024 = FY2025
  const month = date.month()
  const year = date.year()
  return month >= 9 ? `FY${year + 1}` : `FY${year}`
}

function groupByPeriod(funding, period) {
  const grouped = {}

  for (const f of funding) {
    let key
    const date = dayjs(f.CreatedDate)

    if (period === 'month') {
      key = date.format('YYYY-MM')
    } else if (period === 'quarter') {
      key = `${date.format('YYYY')}-${getQuarter(date)}`
    } else {
      // fiscal-year — use the cux_Fiscal_Year__c field if available
      key = f.cux_Fiscal_Year__c || getFiscalYear(date)
    }

    if (!grouped[key]) {
      grouped[key] = { period: key, allocated: 0, obligated: 0, expended: 0, count: 0 }
    }
    grouped[key].allocated += f.cux_Allocated_Amount__c || 0
    grouped[key].obligated += f.cux_Obligated_Amount__c || 0
    grouped[key].expended += f.cux_Expended_Amount__c || 0
    grouped[key].count += 1
  }

  return Object.values(grouped).sort((a, b) => a.period.localeCompare(b.period))
}

function groupByFundType(funding) {
  const grouped = {}

  for (const f of funding) {
    const type = f.cux_Funding_Code__r?.cux_Fund_Type__c || 'Unknown'
    if (!grouped[type]) {
      grouped[type] = { type, allocated: 0, obligated: 0, expended: 0, count: 0 }
    }
    grouped[type].allocated += f.cux_Allocated_Amount__c || 0
    grouped[type].obligated += f.cux_Obligated_Amount__c || 0
    grouped[type].expended += f.cux_Expended_Amount__c || 0
    grouped[type].count += 1
  }

  return Object.values(grouped).sort((a, b) => b.allocated - a.allocated)
}

const CHART_COLORS = {
  allocated: 'var(--mui-palette-primary-main)',
  obligated: 'var(--mui-palette-success-main)',
  expended: 'var(--mui-palette-info-main)',
}

const fundTypeColors = {
  'General Fund': 'info',
  'Federal Fund': 'warning',
  'Special Fund': 'success',
}

export function Page() {
  const { data: funding, loading, error } = useSalesforceQuery((client) => client.getAllFunding())
  const [period, setPeriod] = React.useState('fiscal-year')

  const periodData = React.useMemo(() => {
    if (!funding?.length) return []
    return groupByPeriod(funding, period)
  }, [funding, period])

  const fundTypeData = React.useMemo(() => {
    if (!funding?.length) return []
    return groupByFundType(funding)
  }, [funding])

  const totals = React.useMemo(() => {
    if (!funding?.length) return null
    return funding.reduce(
      (acc, f) => ({
        allocated: acc.allocated + (f.cux_Allocated_Amount__c || 0),
        obligated: acc.obligated + (f.cux_Obligated_Amount__c || 0),
        expended: acc.expended + (f.cux_Expended_Amount__c || 0),
      }),
      { allocated: 0, obligated: 0, expended: 0 }
    )
  }, [funding])

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
            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="h4">Funding by Period</Typography>
              <ToggleButtonGroup
                value={period}
                exclusive
                onChange={(_, val) => { if (val) setPeriod(val) }}
                size="small"
              >
                <ToggleButton value="month">Month</ToggleButton>
                <ToggleButton value="quarter">Quarter</ToggleButton>
                <ToggleButton value="fiscal-year">Fiscal Year</ToggleButton>
              </ToggleButtonGroup>
            </Stack>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error">Failed to load funding data: {error.message}</Alert>
            ) : !funding?.length ? (
              <Card>
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography color="text.secondary" variant="body2">No funding data found</Typography>
                </Box>
              </Card>
            ) : (
              <React.Fragment>
                {/* Summary cards */}
                <Grid container spacing={3}>
                  {[
                    { label: 'Total Allocated', value: totals?.allocated, color: 'primary' },
                    { label: 'Total Obligated', value: totals?.obligated, color: 'success' },
                    { label: 'Total Expended', value: totals?.expended, color: 'info' },
                    { label: 'Utilization Rate', value: totals?.allocated ? `${((totals.expended / totals.allocated) * 100).toFixed(1)}%` : '0%', color: 'warning', raw: true },
                  ].map((item) => (
                    <Grid key={item.label} size={{ xs: 6, md: 3 }}>
                      <Card>
                        <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                          <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                          <Typography variant="h5" color={`${item.color}.main`}>
                            {item.raw ? item.value : formatCurrency(item.value)}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                {/* Bar chart */}
                <Card>
                  <CardHeader
                    title={`Funding by ${period === 'month' ? 'Month' : period === 'quarter' ? 'Quarter' : 'Fiscal Year'}`}
                  />
                  <CardContent>
                    <NoSsr>
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={periodData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                          <YAxis tickFormatter={formatCompact} tick={{ fontSize: 12 }} />
                          <Tooltip
                            formatter={(value) => formatCurrency(value)}
                            contentStyle={{ borderRadius: 8, border: '1px solid var(--mui-palette-divider)' }}
                          />
                          <Legend />
                          <Bar dataKey="allocated" name="Allocated" fill={CHART_COLORS.allocated} radius={[4, 4, 0, 0]} />
                          <Bar dataKey="obligated" name="Obligated" fill={CHART_COLORS.obligated} radius={[4, 4, 0, 0]} />
                          <Bar dataKey="expended" name="Expended" fill={CHART_COLORS.expended} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </NoSsr>
                  </CardContent>
                </Card>

                {/* Period breakdown table */}
                <Card>
                  <CardHeader title="Period Breakdown" />
                  <Box sx={{ overflowX: 'auto' }}>
                    <Table sx={{ minWidth: 600 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell>Period</TableCell>
                          <TableCell align="center">Records</TableCell>
                          <TableCell align="right">Allocated</TableCell>
                          <TableCell align="right">Obligated</TableCell>
                          <TableCell align="right">Expended</TableCell>
                          <TableCell align="right">Utilization</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {periodData.map((row) => {
                          const utilization = row.allocated > 0 ? ((row.expended / row.allocated) * 100).toFixed(1) : 0
                          return (
                            <TableRow key={row.period} hover>
                              <TableCell>
                                <Typography variant="subtitle2">{row.period}</Typography>
                              </TableCell>
                              <TableCell align="center">{row.count}</TableCell>
                              <TableCell align="right">{formatCurrency(row.allocated)}</TableCell>
                              <TableCell align="right">{formatCurrency(row.obligated)}</TableCell>
                              <TableCell align="right">{formatCurrency(row.expended)}</TableCell>
                              <TableCell align="right">
                                <Chip
                                  label={`${utilization}%`}
                                  size="small"
                                  variant="soft"
                                  color={utilization >= 80 ? 'success' : utilization >= 50 ? 'warning' : 'error'}
                                />
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </Box>
                </Card>

                {/* Fund type summary */}
                <Card>
                  <CardHeader title="By Fund Type" />
                  <Box sx={{ overflowX: 'auto' }}>
                    <Table sx={{ minWidth: 600 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell>Fund Type</TableCell>
                          <TableCell align="center">Records</TableCell>
                          <TableCell align="right">Allocated</TableCell>
                          <TableCell align="right">Obligated</TableCell>
                          <TableCell align="right">Expended</TableCell>
                          <TableCell align="right">Utilization</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {fundTypeData.map((row) => {
                          const utilization = row.allocated > 0 ? ((row.expended / row.allocated) * 100).toFixed(1) : 0
                          return (
                            <TableRow key={row.type} hover>
                              <TableCell>
                                <Chip
                                  label={row.type}
                                  size="small"
                                  variant="soft"
                                  color={fundTypeColors[row.type] || 'default'}
                                />
                              </TableCell>
                              <TableCell align="center">{row.count}</TableCell>
                              <TableCell align="right">{formatCurrency(row.allocated)}</TableCell>
                              <TableCell align="right">{formatCurrency(row.obligated)}</TableCell>
                              <TableCell align="right">{formatCurrency(row.expended)}</TableCell>
                              <TableCell align="right">
                                <Chip
                                  label={`${utilization}%`}
                                  size="small"
                                  variant="soft"
                                  color={utilization >= 80 ? 'success' : utilization >= 50 ? 'warning' : 'error'}
                                />
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </Box>
                </Card>
              </React.Fragment>
            )}
          </Stack>
        </Box>
      </AnimatedPage>
    </React.Fragment>
  )
}
