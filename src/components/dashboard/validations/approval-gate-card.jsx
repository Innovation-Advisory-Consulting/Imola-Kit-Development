import * as React from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { CheckCircleIcon } from '@phosphor-icons/react/dist/ssr/CheckCircle'
import { WarningCircleIcon } from '@phosphor-icons/react/dist/ssr/WarningCircle'
import { XCircleIcon } from '@phosphor-icons/react/dist/ssr/XCircle'

export function ApprovalGateCard({ gate, loading, error }) {
  if (loading) {
    return (
      <Card>
        <CardHeader title="Approval Gate" />
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader title="Approval Gate" />
        <CardContent>
          <Alert severity="error">{error.message}</Alert>
        </CardContent>
      </Card>
    )
  }

  if (!gate) return null

  const statusColor = gate.allowed ? 'success' : 'error'
  const StatusIcon = gate.allowed ? CheckCircleIcon : XCircleIcon

  return (
    <Card>
      <CardHeader
        title="Approval Gate"
        action={
          <Chip
            icon={<StatusIcon />}
            label={gate.allowed ? 'Eligible' : 'Blocked'}
            color={statusColor}
            variant="soft"
            size="small"
          />
        }
      />
      <Divider />
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            {gate.message}
          </Typography>

          {gate.blockingFindings?.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Blocking Findings ({gate.blockingFindings.length})
              </Typography>
              <List dense disablePadding>
                {gate.blockingFindings.map((f) => (
                  <ListItem key={f.resultId} disableGutters>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <XCircleIcon color="var(--mui-palette-error-main)" fontSize="var(--icon-fontSize-md)" />
                    </ListItemIcon>
                    <ListItemText
                      primary={f.message}
                      secondary={`Rule: ${f.ruleId} | Severity: ${f.severity}`}
                      primaryTypographyProps={{ variant: 'body2' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {gate.requiredTasksIncomplete?.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Incomplete Required Tasks ({gate.requiredTasksIncomplete.length})
              </Typography>
              <List dense disablePadding>
                {gate.requiredTasksIncomplete.map((t) => (
                  <ListItem key={t.resultId} disableGutters>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <WarningCircleIcon color="var(--mui-palette-warning-main)" fontSize="var(--icon-fontSize-md)" />
                    </ListItemIcon>
                    <ListItemText
                      primary={t.message}
                      secondary={`Task: ${t.taskCode}`}
                      primaryTypographyProps={{ variant: 'body2' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {gate.allowed && gate.blockingFindings?.length === 0 && gate.requiredTasksIncomplete?.length === 0 && (
            <Alert severity="success" icon={<CheckCircleIcon />}>
              All validation checks passed. This entity is eligible for approval.
            </Alert>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}
