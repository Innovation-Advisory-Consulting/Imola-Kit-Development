import * as React from 'react'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import Grid from '@mui/material/Grid'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { CheckCircleIcon } from '@phosphor-icons/react/dist/ssr/CheckCircle'
import { ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock'
import { UserCirclePlusIcon } from '@phosphor-icons/react/dist/ssr/UserCirclePlus'
import { UsersIcon } from '@phosphor-icons/react/dist/ssr/Users'
import { WarningIcon } from '@phosphor-icons/react/dist/ssr/Warning'
import { Helmet } from 'react-helmet-async'

import { appConfig } from '@/config/app'
import { useSalesforceClient, useSalesforceQuery } from '@/hooks/use-salesforce'
import { dayjs } from '@/lib/dayjs'
import { AnimatedPage } from '@/components/core/animations'
import { SortableTableCell } from '@/components/core/sortable-table-cell'
import { useTableSort } from '@/hooks/use-table-sort'
import { EntityLink } from '@/components/dashboard/work/entity-link'

const metadata = { title: `Team Monitor | Dashboard | ${appConfig.name}` }

const priorityColor = { Critical: 'error', High: 'warning', Medium: 'info', Low: 'default' }
const statusColor = { 'Not Started': 'default', 'In Progress': 'info', Blocked: 'error' }

export function Page() {
  const client = useSalesforceClient()
  const [selected, setSelected] = React.useState(new Set())
  const [bulkAssignOpen, setBulkAssignOpen] = React.useState(false)

  const { data, loading, error, refetch } = useSalesforceQuery(
    async (c) => {
      const [workload, completed, overdue, allOpen, users] = await Promise.all([
        c.getTeamWorkload(),
        c.getTeamCompletedTasks(),
        c.getTeamOverdueTasks(),
        c.getAllOpenWorkTasks(),
        c.getActiveUsers(),
      ])
      return { workload, completed, overdue, allOpen, users }
    },
    []
  )

  const workload = data?.workload || []
  const completed = data?.completed || []
  const overdue = data?.overdue || []
  const allOpen = data?.allOpen || []
  const users = data?.users || []

  // Build a userId → photoUrl lookup from the users list
  const userPhotoMap = React.useMemo(() => {
    const m = new Map()
    users.forEach((u) => { if (u.SmallPhotoUrl) m.set(u.Id, u.SmallPhotoUrl) })
    return m
  }, [users])

  // Merge team data into per-user rows
  const teamRows = React.useMemo(() => {
    const map = new Map()
    workload.forEach((r) => {
      const id = r.cux_Assigned_To__c
      if (!map.has(id)) map.set(id, { id, name: r.Name || r.cux_Assigned_To__r?.Name || 'Unknown', open: 0, overdue: 0, completed30d: 0 })
      map.get(id).open += r.cnt
    })
    overdue.forEach((r) => {
      const id = r.cux_Assigned_To__c
      if (!map.has(id)) map.set(id, { id, name: r.Name || r.cux_Assigned_To__r?.Name || 'Unknown', open: 0, overdue: 0, completed30d: 0 })
      map.get(id).overdue += r.cnt
    })
    completed.forEach((r) => {
      const id = r.cux_Completed_By__c
      if (!map.has(id)) map.set(id, { id, name: r.Name || r.cux_Completed_By__r?.Name || 'Unknown', open: 0, overdue: 0, completed30d: 0 })
      map.get(id).completed30d += r.cnt
    })
    // Attach photo URLs
    for (const row of map.values()) {
      row.photoUrl = userPhotoMap.get(row.id)
    }
    return Array.from(map.values()).sort((a, b) => b.open - a.open)
  }, [workload, overdue, completed, userPhotoMap])

  const totalOpen = allOpen.length
  const totalOverdue = overdue.reduce((sum, r) => sum + r.cnt, 0)
  const totalCompleted30d = completed.reduce((sum, r) => sum + r.cnt, 0)
  const unassigned = allOpen.filter((t) => !t.cux_Assigned_To__c).length

  const { sortedData, sortKey, sortDirection, onSort } = useTableSort(allOpen, {
    defaultSortKey: 'cux_Due_Date__c',
    defaultDirection: 'asc',
  })

  return (
    <React.Fragment>
      <Helmet><title>{metadata.title}</title></Helmet>
      <AnimatedPage>
        <Box sx={{ maxWidth: 'var(--Content-maxWidth)', m: 'var(--Content-margin)', p: 'var(--Content-padding)', width: 'var(--Content-width)' }}>
          <Stack spacing={4}>
            <Typography variant="h4">Team Monitor</Typography>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>
            ) : error ? (
              <Alert severity="error">Failed to load team data: {error.message}</Alert>
            ) : (
              <React.Fragment>
                {/* Summary strip */}
                <Grid container spacing={3}>
                  {[
                    { label: 'Total Open', value: totalOpen, icon: <ClockIcon fontSize="var(--icon-fontSize-lg)" />, color: 'primary' },
                    { label: 'Overdue', value: totalOverdue, icon: <WarningIcon fontSize="var(--icon-fontSize-lg)" />, color: totalOverdue > 0 ? 'error' : 'primary' },
                    { label: 'Completed (30d)', value: totalCompleted30d, icon: <CheckCircleIcon fontSize="var(--icon-fontSize-lg)" />, color: 'success' },
                    { label: 'Unassigned', value: unassigned, icon: <UsersIcon fontSize="var(--icon-fontSize-lg)" />, color: unassigned > 0 ? 'warning' : 'primary' },
                  ].map((stat) => (
                    <Grid key={stat.label} size={{ xs: 6, md: 3 }}>
                      <Card sx={{ p: 2.5 }}>
                        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                          <Avatar sx={{ bgcolor: `var(--mui-palette-${stat.color}-50)`, color: `var(--mui-palette-${stat.color}-main)` }}>
                            {stat.icon}
                          </Avatar>
                          <div>
                            <Typography variant="h4">{stat.value}</Typography>
                            <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
                          </div>
                        </Stack>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                {/* Team workload */}
                {teamRows.length > 0 && (
                  <Card>
                    <CardHeader
                      avatar={<Avatar><UsersIcon fontSize="var(--Icon-fontSize)" /></Avatar>}
                      title="Team Workload"
                    />
                    <Box sx={{ overflowX: 'auto' }}>
                      <Table sx={{ minWidth: 500 }}>
                        <TableHead>
                          <TableRow>
                            <TableCell>Team Member</TableCell>
                            <TableCell align="right">Open Tasks</TableCell>
                            <TableCell align="right">Overdue</TableCell>
                            <TableCell align="right">Completed (30d)</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {teamRows.map((row) => (
                            <TableRow hover key={row.id}>
                              <TableCell>
                                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                                  <Avatar src={row.photoUrl || undefined} sx={{ '--Avatar-size': '32px', fontSize: '0.8rem' }}>{row.name?.[0]}</Avatar>
                                  <Typography variant="subtitle2">{row.name}</Typography>
                                </Stack>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="subtitle2">{row.open}</Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="subtitle2" color={row.overdue > 0 ? 'error' : 'text.primary'}>
                                  {row.overdue}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="subtitle2" color="success.main">{row.completed30d}</Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Box>
                  </Card>
                )}

                {/* All open tasks */}
                <Card>
                  <CardHeader
                    title={`All Open Tasks (${allOpen.length})`}
                    action={
                      selected.size > 0 ? (
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                          <Chip label={`${selected.size} selected`} size="small" variant="soft" color="primary" />
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<UserCirclePlusIcon />}
                            onClick={() => setBulkAssignOpen(true)}
                          >
                            {selected.size === 1 ? 'Assign' : `Assign (${selected.size})`}
                          </Button>
                          <Button
                            size="small"
                            color="secondary"
                            onClick={() => setSelected(new Set())}
                          >
                            Clear
                          </Button>
                        </Stack>
                      ) : null
                    }
                  />
                  {!allOpen.length ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                      <Typography color="text.secondary" variant="body2">No open tasks</Typography>
                    </Box>
                  ) : (
                    <Box sx={{ overflowX: 'auto' }}>
                      <Table sx={{ minWidth: 800 }}>
                        <TableHead>
                          <TableRow>
                            <TableCell padding="checkbox">
                              <Checkbox
                                indeterminate={selected.size > 0 && selected.size < sortedData.length}
                                checked={sortedData.length > 0 && selected.size === sortedData.length}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelected(new Set(sortedData.map((t) => t.Id)))
                                  } else {
                                    setSelected(new Set())
                                  }
                                }}
                              />
                            </TableCell>
                            <SortableTableCell sortKey="Name" activeSortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>Task #</SortableTableCell>
                            <SortableTableCell sortKey="cux_Title__c" activeSortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>Title</SortableTableCell>
                            <SortableTableCell sortKey="cux_Assigned_To__r.Name" activeSortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>Assignee</SortableTableCell>
                            <TableCell>Entity</TableCell>
                            <SortableTableCell sortKey="cux_Priority__c" activeSortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>Priority</SortableTableCell>
                            <SortableTableCell sortKey="cux_Status__c" activeSortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>Status</SortableTableCell>
                            <SortableTableCell sortKey="cux_Due_Date__c" activeSortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>Due Date</SortableTableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {sortedData.map((task) => {
                            const isOverdue = task.cux_Due_Date__c && dayjs(task.cux_Due_Date__c).isBefore(dayjs(), 'day')
                            const isSelected = selected.has(task.Id)
                            return (
                              <TableRow
                                hover
                                key={task.Id}
                                selected={isSelected}
                                onClick={() => {
                                  setSelected((prev) => {
                                    const next = new Set(prev)
                                    if (next.has(task.Id)) next.delete(task.Id)
                                    else next.add(task.Id)
                                    return next
                                  })
                                }}
                                sx={{ cursor: 'pointer' }}
                              >
                                <TableCell padding="checkbox">
                                  <Checkbox checked={isSelected} />
                                </TableCell>
                                <TableCell><Typography variant="subtitle2">{task.Name}</Typography></TableCell>
                                <TableCell><Typography variant="body2">{task.cux_Title__c || '\u2014'}</Typography></TableCell>
                                <TableCell>
                                  {task.cux_Assigned_To__r?.Name ? (
                                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                      <Avatar src={task.cux_Assigned_To__r.SmallPhotoUrl || undefined} sx={{ '--Avatar-size': '28px', fontSize: '0.7rem' }}>{task.cux_Assigned_To__r.Name[0]}</Avatar>
                                      <Typography variant="body2">{task.cux_Assigned_To__r.Name}</Typography>
                                    </Stack>
                                  ) : (
                                    <Chip label="Unassigned" size="small" variant="outlined" color="warning" />
                                  )}
                                </TableCell>
                                <TableCell>
                                  <EntityLink
                                    entityType={task.cux_Entity_Type__c}
                                    entityId={task.cux_Entity_Id__c}
                                    label={task.cux_Contract__r?.Name || task.cux_Task_Order__r?.Name}
                                  />
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
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </Box>
                  )}
                </Card>
              </React.Fragment>
            )}
          </Stack>
        </Box>
      </AnimatedPage>

      <BulkAssignDialog
        open={bulkAssignOpen}
        onClose={() => setBulkAssignOpen(false)}
        taskIds={selected}
        users={users}
        client={client}
        onAssigned={() => {
          setSelected(new Set())
          refetch()
        }}
      />
    </React.Fragment>
  )
}

function BulkAssignDialog({ open, onClose, taskIds, users, client, onAssigned }) {
  const [selectedUser, setSelectedUser] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState(null)

  React.useEffect(() => {
    if (open) {
      setSelectedUser('')
      setError(null)
    }
  }, [open])

  const count = taskIds.size

  async function handleSubmit(userId) {
    if (!client) return
    const assignTo = userId ?? selectedUser
    setSubmitting(true)
    setError(null)
    try {
      await Promise.all(
        Array.from(taskIds).map((id) =>
          client.updateRecord('cux_WorkTask__c', id, { cux_Assigned_To__c: assignTo || null })
        )
      )
      onAssigned?.()
      onClose()
    } catch (err) {
      setError(err.response?.data?.[0]?.message || err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Assign {count} Task{count !== 1 ? 's' : ''}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Select a team member to assign {count === 1 ? 'this task' : `these ${count} tasks`} to, or unassign them.
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Assignee</InputLabel>
            <Select
              label="Assignee"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              {(users || []).map((user) => (
                <MenuItem key={user.Id} value={user.Id}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Avatar src={user.SmallPhotoUrl} sx={{ '--Avatar-size': '24px', fontSize: '0.7rem' }}>
                      {user.Name?.[0]}
                    </Avatar>
                    <Typography variant="body2">{user.Name}</Typography>
                  </Stack>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {error && <FormHelperText error>{error}</FormHelperText>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button
          color="warning"
          onClick={() => handleSubmit(null)}
          disabled={submitting}
        >
          {submitting ? 'Processing...' : 'Unassign'}
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose} color="secondary">Cancel</Button>
        <Button
          variant="contained"
          onClick={() => handleSubmit()}
          disabled={submitting || !selectedUser}
        >
          {submitting ? 'Assigning...' : `Assign ${count} Task${count !== 1 ? 's' : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
