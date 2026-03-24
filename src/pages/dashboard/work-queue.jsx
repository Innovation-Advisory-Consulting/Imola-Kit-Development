import * as React from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { FileTextIcon } from '@phosphor-icons/react/dist/ssr/FileText'
import { FolderOpenIcon } from '@phosphor-icons/react/dist/ssr/FolderOpen'
import { ReceiptIcon } from '@phosphor-icons/react/dist/ssr/Receipt'
import { Helmet } from 'react-helmet-async'

import { appConfig } from '@/config/app'
import { useAuth } from '@/auth/AuthContext'
import { useSalesforceQuery } from '@/hooks/use-salesforce'
import { dayjs } from '@/lib/dayjs'
import { AnimatedPage } from '@/components/core/animations'
import { SortableTableCell } from '@/components/core/sortable-table-cell'
import { useTableSort } from '@/hooks/use-table-sort'
import { EntityLink } from '@/components/dashboard/work/entity-link'

const metadata = { title: `Work Queue | Dashboard | ${appConfig.name}` }

const priorityColor = { Critical: 'error', High: 'warning', Medium: 'info', Low: 'default' }
const statusColor = { 'Not Started': 'default', 'In Progress': 'info', Blocked: 'error', Complete: 'success', Cancelled: 'default', 'Not Applicable': 'default' }

const ENTITY_SECTIONS = [
  { key: 'cux_Contract__c', label: 'Contracts', icon: FolderOpenIcon },
  { key: 'cux_TaskOrder__c', label: 'Task Orders', icon: FileTextIcon },
  { key: 'cux_Invoice__c', label: 'Invoices', icon: ReceiptIcon },
  { key: '_other', label: 'Other', icon: FileTextIcon },
]

function isClosedStatus(status) {
  return ['Complete', 'Cancelled', 'Not Applicable'].includes(status)
}

export function Page() {
  const { auth } = useAuth()
  const userId = auth?.user?.id
  const [tab, setTab] = React.useState('all')

  const { data: tasks, loading, error } = useSalesforceQuery(
    (c) => c.getMyAllWorkTasks(userId),
    [userId]
  )

  const filtered = React.useMemo(() => {
    if (!tasks) return []
    switch (tab) {
      case 'open':
        return tasks.filter((t) => !isClosedStatus(t.cux_Status__c))
      case 'completed':
        return tasks.filter((t) => t.cux_Status__c === 'Complete')
      case 'overdue':
        return tasks.filter(
          (t) =>
            t.cux_Due_Date__c &&
            dayjs(t.cux_Due_Date__c).isBefore(dayjs(), 'day') &&
            !isClosedStatus(t.cux_Status__c)
        )
      default:
        return tasks
    }
  }, [tasks, tab])

  const grouped = React.useMemo(() => {
    const groups = {}
    for (const section of ENTITY_SECTIONS) {
      groups[section.key] = []
    }
    for (const task of filtered) {
      const type = task.cux_Entity_Type__c
      if (groups[type]) {
        groups[type].push(task)
      } else {
        groups._other.push(task)
      }
    }
    return groups
  }, [filtered])

  const openCount = (tasks || []).filter((t) => !isClosedStatus(t.cux_Status__c)).length
  const completedCount = (tasks || []).filter((t) => t.cux_Status__c === 'Complete').length
  const overdueCount = (tasks || []).filter(
    (t) => t.cux_Due_Date__c && dayjs(t.cux_Due_Date__c).isBefore(dayjs(), 'day') && !isClosedStatus(t.cux_Status__c)
  ).length

  if (!userId) {
    return <Alert severity="warning" sx={{ m: 3 }}>User identity not available. Please re-login.</Alert>
  }

  return (
    <React.Fragment>
      <Helmet><title>{metadata.title}</title></Helmet>
      <AnimatedPage>
        <Box sx={{ maxWidth: 'var(--Content-maxWidth)', m: 'var(--Content-margin)', p: 'var(--Content-padding)', width: 'var(--Content-width)' }}>
          <Stack spacing={4}>
            <Typography variant="h4">Work Queue</Typography>

            <Card>
              <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 3 }}>
                <Tab label={`All (${(tasks || []).length})`} value="all" />
                <Tab label={`Open (${openCount})`} value="open" />
                <Tab label={`Completed (${completedCount})`} value="completed" />
                <Tab label={`Overdue (${overdueCount})`} value="overdue" />
              </Tabs>
            </Card>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ m: 2 }}>Failed to load tasks: {error.message}</Alert>
            ) : !filtered.length ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary" variant="body2">No tasks found</Typography>
              </Box>
            ) : (
              ENTITY_SECTIONS.map((section) => {
                const sectionTasks = grouped[section.key]
                if (!sectionTasks || sectionTasks.length === 0) return null
                return (
                  <EntityTaskTable
                    key={section.key}
                    label={section.label}
                    icon={section.icon}
                    tasks={sectionTasks}
                  />
                )
              })
            )}
          </Stack>
        </Box>
      </AnimatedPage>
    </React.Fragment>
  )
}

function EntityTaskTable({ label, icon: Icon, tasks }) {
  const { sortedData, sortKey, sortDirection, onSort } = useTableSort(tasks, {
    defaultSortKey: 'CreatedDate',
    defaultDirection: 'desc',
  })

  return (
    <Card>
      <CardHeader
        avatar={<Icon fontSize="var(--icon-fontSize-lg)" />}
        title={label}
        subheader={`${tasks.length} task${tasks.length !== 1 ? 's' : ''}`}
      />
      <Box sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: 800 }}>
          <TableHead>
            <TableRow>
              <SortableTableCell sortKey="Name" activeSortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>Task #</SortableTableCell>
              <SortableTableCell sortKey="cux_Title__c" activeSortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>Title</SortableTableCell>
              <TableCell>Entity</TableCell>
              <SortableTableCell sortKey="cux_Priority__c" activeSortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>Priority</SortableTableCell>
              <SortableTableCell sortKey="cux_Status__c" activeSortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>Status</SortableTableCell>
              <SortableTableCell sortKey="cux_Due_Date__c" activeSortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>Due Date</SortableTableCell>
              <TableCell>Role</TableCell>
              <SortableTableCell sortKey="CreatedDate" activeSortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>Created</SortableTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedData.map((task) => {
              const isOverdue = task.cux_Due_Date__c && dayjs(task.cux_Due_Date__c).isBefore(dayjs(), 'day') && !isClosedStatus(task.cux_Status__c)
              return (
                <TableRow hover key={task.Id}>
                  <TableCell>
                    <Typography variant="subtitle2">{task.Name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{task.cux_Title__c || '\u2014'}</Typography>
                  </TableCell>
                  <TableCell>
                    {task.cux_Task_Order__c ? (
                      <EntityLink entityType="cux_TaskOrder__c" entityId={task.cux_Task_Order__c} label={task.cux_Task_Order__r?.Name} />
                    ) : task.cux_Contract__c ? (
                      <EntityLink entityType="cux_Contract__c" entityId={task.cux_Contract__c} label={task.cux_Contract__r?.Name} />
                    ) : (
                      <Typography variant="body2" color="text.secondary">{task.cux_Entity_Type__c || '—'}</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip label={task.cux_Priority__c || 'Medium'} size="small" variant="soft" color={priorityColor[task.cux_Priority__c] || 'default'} />
                  </TableCell>
                  <TableCell>
                    <Chip label={task.cux_Status__c} size="small" variant="soft" color={statusColor[task.cux_Status__c] || 'default'} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color={isOverdue ? 'error' : 'text.primary'} sx={{ whiteSpace: 'nowrap', fontWeight: isOverdue ? 600 : 400 }}>
                      {task.cux_Due_Date__c ? dayjs(task.cux_Due_Date__c).format('MMM D, YYYY') : '\u2014'}
                    </Typography>
                  </TableCell>
                  <TableCell>{task.cux_Assigned_Role__c || '\u2014'}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                      {dayjs(task.CreatedDate).format('MMM D, YYYY')}
                    </Typography>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Box>
    </Card>
  )
}
