import * as React from 'react'
import Avatar from '@mui/material/Avatar'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { useSalesforceClient, useSalesforceQuery } from '@/hooks/use-salesforce'
import { assignReviewWork } from '@/hooks/use-validation-engine'

/**
 * Dialog to assign or reassign a reviewer for a contract, task order, or invoice.
 *
 * Props:
 *   open, onClose, entityType ("Contract"|"Task Order"|"Invoice"),
 *   entityId, entityName, assignmentField ("cux_Contract_Manager__c"|"cux_Assigned_To__c"),
 *   sobjectName ("cux_Contract__c"|"cux_TaskOrder__c"|"cux_Invoice__c"),
 *   currentAssigneeId, onAssigned
 */
export function AssignReviewerDialog({
  open,
  onClose,
  entityType,
  entityId,
  entityName,
  assignmentField,
  sobjectName,
  currentAssigneeId,
  onAssigned,
}) {
  const client = useSalesforceClient()
  const { data: users } = useSalesforceQuery((c) => c.getActiveUsers())
  const [selectedUser, setSelectedUser] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState(null)

  // Reset selection when dialog opens
  React.useEffect(() => {
    if (open) {
      setSelectedUser(currentAssigneeId || '')
      setError(null)
    }
  }, [open, currentAssigneeId])

  async function handleSubmit() {
    if (!client || !selectedUser) return

    setSubmitting(true)
    setError(null)
    try {
      // Update the entity's assignment field
      await client.updateRecord(sobjectName, entityId, {
        [assignmentField]: selectedUser,
      })

      // Update review WorkTask + send notification
      await assignReviewWork(client, entityType, entityId, selectedUser, entityName)

      onAssigned?.()
      onClose()
    } catch (err) {
      setError(err.response?.data?.[0]?.message || err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const activeUsers = users || []

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        {currentAssigneeId ? 'Reassign' : 'Assign'} {entityType} Reviewer
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Select a reviewer for {entityName || `this ${entityType.toLowerCase()}`}. They will receive a notification.
          </Typography>
          <FormControl fullWidth required>
            <InputLabel>Reviewer</InputLabel>
            <Select
              label="Reviewer"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              {activeUsers.map((user) => (
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
        <Button onClick={onClose} color="secondary">Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting || !selectedUser || selectedUser === currentAssigneeId}
        >
          {submitting ? 'Assigning...' : 'Assign'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
