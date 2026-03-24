import * as React from 'react'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import LinearProgress from '@mui/material/LinearProgress'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import { CurrencyDollarIcon } from '@phosphor-icons/react/dist/ssr/CurrencyDollar'
import { FileTextIcon } from '@phosphor-icons/react/dist/ssr/FileText'
import { FolderOpenIcon } from '@phosphor-icons/react/dist/ssr/FolderOpen'
import { TrendUpIcon } from '@phosphor-icons/react/dist/ssr/TrendUp'
import { WarningIcon } from '@phosphor-icons/react/dist/ssr/Warning'
import { PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus'
import { Helmet } from 'react-helmet-async'

import { appConfig } from '@/config/app'
import { paths } from '@/paths'
import { dayjs } from '@/lib/dayjs'
import { RouterLink } from '@/components/core/link'
import { useAuth } from '@/auth/AuthContext'
import { useSalesforceClient, useSalesforceQuery } from '@/hooks/use-salesforce'
import { DataTableView } from '@/components/core/data-table-view'
import { AnimatedPage } from '@/components/core/animations'

const metadata = { title: `Contracts | Dashboard | ${appConfig.name}` }

const statusColorMap = {
  Draft: 'default',
  'Under Review': 'warning',
  'Approved For Procurement': 'info',
  'Submitted To Procurement': 'info',
  Awarded: 'info',
  Executed: 'success',
  Active: 'success',
  Closed: 'default',
  Terminated: 'error',
}

function formatCurrency(value) {
  if (value == null) return '$0.00'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

const columns = [
  {
    id: 'name',
    label: 'Contract #',
    sortKey: 'Name',
    field: 'Name',
    width: '120px',
    formatter: (row) => (
      <Link color="text.primary" component={RouterLink} href={paths.dashboard.contracts.details(row.Id)} variant="subtitle2">
        {row.Name}
      </Link>
    ),
  },
  {
    id: 'title',
    label: 'Title',
    sortKey: 'cux_Title__c',
    field: 'cux_Title__c',
    width: '250px',
    formatter: (row) => (
      <Typography variant="body2" sx={{ maxWidth: 250 }} noWrap>{row.cux_Title__c || '\u2014'}</Typography>
    ),
  },
  {
    id: 'status',
    label: 'Status',
    sortKey: 'cux_Status__c',
    field: 'cux_Status__c',
    width: '150px',
    formatter: (row) => (
      <Chip color={statusColorMap[row.cux_Status__c] || 'default'} label={row.cux_Status__c} size="small" variant="soft" />
    ),
  },
  {
    id: 'type',
    label: 'Type',
    sortKey: 'cux_Contract_Type__c',
    field: 'cux_Contract_Type__c',
  },
  {
    id: 'vendor',
    label: 'Vendor',
    sortKey: 'cux_Account__r.Name',
    field: 'cux_Account__r.Name',
    formatter: (row) => row.cux_Account__r?.Name || '\u2014',
    exportValue: (row) => row.cux_Account__r?.Name || '',
  },
  {
    id: 'businessUnit',
    label: 'Business Unit',
    sortKey: 'cux_Business_Unit__r.cux_Unit_Name__c',
    field: 'cux_Business_Unit__r.cux_Unit_Name__c',
    formatter: (row) => row.cux_Business_Unit__r?.cux_Unit_Name__c || '\u2014',
    exportValue: (row) => row.cux_Business_Unit__r?.cux_Unit_Name__c || '',
  },
  {
    id: 'authorized',
    label: 'Authorized',
    sortKey: 'cux_Total_Authorized_Amount__c',
    field: 'cux_Total_Authorized_Amount__c',
    align: 'right',
    formatter: (row) => formatCurrency(row.cux_Total_Authorized_Amount__c),
    exportValue: (row) => row.cux_Total_Authorized_Amount__c || 0,
  },
  {
    id: 'startDate',
    label: 'Start Date',
    sortKey: 'cux_Start_Date__c',
    field: 'cux_Start_Date__c',
    formatter: (row) => row.cux_Start_Date__c ? dayjs(row.cux_Start_Date__c).format('MMM D, YYYY') : '\u2014',
    filterable: false,
  },
  {
    id: 'endDate',
    label: 'End Date',
    sortKey: 'cux_End_Date__c',
    field: 'cux_End_Date__c',
    formatter: (row) => row.cux_End_Date__c ? dayjs(row.cux_End_Date__c).format('MMM D, YYYY') : '\u2014',
    filterable: false,
  },
]

export function Page() {
  const { auth } = useAuth()
  const client = useSalesforceClient()
  const { data: contracts, loading, error } = useSalesforceQuery((c) => c.getContracts())

  const notesConfig = React.useMemo(() => {
    if (!client) return null
    return {
      getComments: (contractId) => client.getContractComments(contractId),
      createComment: (contractId, text) => client.createContractComment({
        cux_Contract__c: contractId,
        cux_Comment_Text__c: text,
        cux_Commented_By__c: auth?.user?.id,
        cux_Comment_Timestamp__c: new Date().toISOString(),
        cux_Visibility__c: 'Internal',
      }),
      user: auth?.user,
      instanceUrl: auth?.instanceUrl,
    }
  }, [client, auth])

  const activityConfig = React.useMemo(() => {
    if (!client) return null
    return {
      getEvents: (contractId) => client.getContractEvents(contractId),
      iconMap: null,
      colorMap: {
        'Contract Created': 'primary',
        'Contract Closed': 'success',
        'Contract Terminated': 'error',
        'Amendment Applied': 'info',
      },
      statusColorMap,
    }
  }, [client])

  const documentsConfig = React.useMemo(() => {
    if (!client) return null
    return {
      getDocuments: (contractId) => client.getDocuments(contractId),
      onDownload: (contentVersionId, fileName) => client.downloadContentVersion(contentVersionId, fileName),
    }
  }, [client])

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
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ alignItems: 'flex-start' }}>
            <Box sx={{ flex: '1 1 auto' }}>
              <Typography variant="h4">Contracts</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                component={RouterLink}
                href={paths.dashboard.contracts.create}
                startIcon={<PlusIcon />}
                variant="contained"
              >
                New Contract
              </Button>
            </Box>
          </Stack>

          {!loading && !error && contracts?.length > 0 && (
            <ContractAnalytics contracts={contracts} />
          )}

          <Card>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ m: 2 }}>
                Failed to load contracts: {error.message}
              </Alert>
            ) : (
              <DataTableView
                columns={columns}
                rows={contracts || []}
                entityLabel="Contracts"
                defaultSortKey="Name"
                quickViewConfig={{
                  titleField: 'Name',
                  subtitleField: 'cux_Status__c',
                  subtitleColorMap: statusColorMap,
                  detailsPath: (row) => paths.dashboard.contracts.details(row.Id),
                  notesConfig,
                  activityConfig,
                  documentsConfig,
                  sections: [
                    {
                      title: 'Contract Information',
                      fields: [
                        { label: 'Title', field: 'cux_Title__c' },
                        { label: 'Type', field: 'cux_Contract_Type__c' },
                        { label: 'Status', field: 'cux_Status__c' },
                        { label: 'Vendor', field: 'cux_Account__r.Name' },
                        { label: 'Business Unit', field: 'cux_Business_Unit__r.cux_Unit_Name__c' },
                      ],
                    },
                    {
                      title: 'Schedule',
                      fields: [
                        { label: 'Start Date', field: 'cux_Start_Date__c', type: 'date' },
                        { label: 'End Date', field: 'cux_End_Date__c', type: 'date' },
                      ],
                    },
                    {
                      title: 'Financials',
                      fields: [
                        { label: 'Authorized Amount', field: 'cux_Total_Authorized_Amount__c', type: 'currency' },
                        { label: 'Expended Amount', field: 'cux_Total_Expended_Amount__c', type: 'currency' },
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
    </React.Fragment>
  )
}

function formatCompact(value) {
  if (value == null) return '$0'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

function ContractAnalytics({ contracts }) {
  const total = contracts.length
  const active = contracts.filter((c) => c.cux_Status__c === 'Active').length
  const draft = contracts.filter((c) => c.cux_Status__c === 'Draft').length
  const totalAuthorized = contracts.reduce((sum, c) => sum + (c.cux_Total_Authorized_Amount__c || 0), 0)
  const totalExpended = contracts.reduce((sum, c) => sum + (c.cux_Total_Expended_Amount__c || 0), 0)
  const utilization = totalAuthorized > 0 ? Math.round((totalExpended / totalAuthorized) * 100) : 0
  const expiringSoon = contracts.filter((c) => {
    if (!c.cux_End_Date__c || c.cux_Status__c !== 'Active') return false
    const daysLeft = dayjs(c.cux_End_Date__c).diff(dayjs(), 'day')
    return daysLeft >= 0 && daysLeft <= 90
  }).length

  return (
    <Stack spacing={3}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard icon={FolderOpenIcon} label="Total Contracts" value={total} detail={`${active} active, ${draft} draft`} color="primary" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard icon={CurrencyDollarIcon} label="Total Authorized" value={formatCompact(totalAuthorized)} detail={`${formatCompact(totalExpended)} expended`} color="success" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={TrendUpIcon}
            label="Budget Utilization"
            value={`${utilization}%`}
            detail={
              <LinearProgress
                variant="determinate"
                value={Math.min(utilization, 100)}
                color={utilization > 90 ? 'error' : utilization > 70 ? 'warning' : 'primary'}
                sx={{ height: 6, borderRadius: 3, mt: 0.5 }}
              />
            }
            color="info"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard icon={WarningIcon} label="Expiring Soon" value={expiringSoon} detail="within 90 days" color={expiringSoon > 0 ? 'warning' : 'success'} />
        </Grid>
      </Grid>
    </Stack>
  )
}

function StatCard({ icon: Icon, label, value, detail, color = 'primary' }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            <Avatar
              sx={{
                bgcolor: `var(--mui-palette-${color}-50)`,
                color: `var(--mui-palette-${color}-main)`,
                '--Avatar-size': '48px',
              }}
            >
              <Icon fontSize="var(--icon-fontSize-lg)" />
            </Avatar>
            <Box>
              <Typography color="text.secondary" variant="body2">{label}</Typography>
              <Typography variant="h4">{value}</Typography>
            </Box>
          </Stack>
          {typeof detail === 'string' ? (
            <Typography color="text.secondary" variant="body2">{detail}</Typography>
          ) : (
            detail
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}

function BreakdownCard({ title, data, colorMap }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1])
  const total = entries.reduce((sum, [, count]) => sum + count, 0)

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="subtitle2" sx={{ mb: 2 }}>{title}</Typography>
        <Stack spacing={1.5}>
          {entries.map(([name, count]) => {
            const pct = total > 0 ? Math.round((count / total) * 100) : 0
            const chipColor = colorMap?.[name] || 'default'
            return (
              <Stack key={name} spacing={0.5}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip label={name} size="small" color={chipColor} variant="soft" />
                  <Typography variant="body2" color="text.secondary">
                    {count} ({pct}%)
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={pct}
                  color={chipColor === 'default' ? 'inherit' : chipColor}
                  sx={{ height: 4, borderRadius: 2 }}
                />
              </Stack>
            )
          })}
        </Stack>
      </CardContent>
    </Card>
  )
}
