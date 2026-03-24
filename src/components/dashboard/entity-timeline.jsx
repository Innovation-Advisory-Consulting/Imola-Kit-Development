import * as React from 'react'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Timeline from '@mui/lab/Timeline'
import TimelineConnector from '@mui/lab/TimelineConnector'
import TimelineContent from '@mui/lab/TimelineContent'
import TimelineDot from '@mui/lab/TimelineDot'
import TimelineItem from '@mui/lab/TimelineItem'
import TimelineSeparator from '@mui/lab/TimelineSeparator'
import { ArrowsClockwiseIcon } from '@phosphor-icons/react/dist/ssr/ArrowsClockwise'
import { CheckCircleIcon } from '@phosphor-icons/react/dist/ssr/CheckCircle'
import { FileTextIcon } from '@phosphor-icons/react/dist/ssr/FileText'
import { LightningIcon } from '@phosphor-icons/react/dist/ssr/Lightning'
import { LockIcon } from '@phosphor-icons/react/dist/ssr/Lock'
import { PaperPlaneTiltIcon } from '@phosphor-icons/react/dist/ssr/PaperPlaneTilt'
import { SealCheckIcon } from '@phosphor-icons/react/dist/ssr/SealCheck'
import { WarningIcon } from '@phosphor-icons/react/dist/ssr/Warning'
import { XCircleIcon } from '@phosphor-icons/react/dist/ssr/XCircle'
import { dayjs } from '@/lib/dayjs'

const eventIconMap = {
  'Status Changed': ArrowsClockwiseIcon,
  'Status Change': ArrowsClockwiseIcon,
  'Task Order Status Changed': ArrowsClockwiseIcon,
  'Task Order Activated': LightningIcon,
  'Task Order Completed': CheckCircleIcon,
  'Task Order Closed': LockIcon,
  'Task Order Terminated': XCircleIcon,
  'Task Order Submitted For Review': PaperPlaneTiltIcon,
  'Task Order Approved': SealCheckIcon,
  'Task Order Returned To Draft': ArrowsClockwiseIcon,
  'Supplement Status Changed': ArrowsClockwiseIcon,
  'Task Supplement Drafted': FileTextIcon,
  'Task Order Supplement Apply Rejected': XCircleIcon,
  'Termination Initiated': WarningIcon,
  'Termination Submitted': PaperPlaneTiltIcon,
  'Termination Approved': SealCheckIcon,
  'Termination Effective': CheckCircleIcon,
  'Settlement Drafted': FileTextIcon,
  'Settlement Submitted': PaperPlaneTiltIcon,
  'Settlement Approved': SealCheckIcon,
  'Settlement Executed': CheckCircleIcon,
  'Settlement Closed': LockIcon,
  'Document Uploaded': FileTextIcon,
  'Invoice Created': FileTextIcon,
  'Invoice Submitted': PaperPlaneTiltIcon,
  'Invoice Approved': SealCheckIcon,
  'Invoice Paid': CheckCircleIcon,
  'Invoice Rejected': XCircleIcon,
  'Invoice Void': XCircleIcon,
}

const eventColorMap = {
  'Status Changed': 'primary',
  'Status Change': 'primary',
  'Task Order Activated': 'success',
  'Task Order Completed': 'success',
  'Task Order Closed': 'info',
  'Task Order Terminated': 'error',
  'Task Order Submitted For Review': 'warning',
  'Task Order Approved': 'info',
  'Termination Initiated': 'error',
  'Termination Effective': 'error',
  'Settlement Approved': 'success',
  'Settlement Executed': 'success',
  'Document Uploaded': 'info',
  'Invoice Approved': 'success',
  'Invoice Paid': 'success',
  'Invoice Rejected': 'error',
}

const statusColorMap = {
  Draft: 'default',
  'Under Review': 'warning',
  Approved: 'info',
  Active: 'success',
  Completed: 'success',
  Closed: 'default',
  Terminated: 'error',
  Submitted: 'warning',
  Paid: 'success',
  Rejected: 'error',
  Executed: 'info',
}

export function EntityEventsTab({ events }) {
  if (!events?.length) {
    return (
      <Card>
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary" variant="body2">No events</Typography>
        </Box>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader title="Event Timeline" />
      <Divider />
      <CardContent>
        <Timeline
          sx={{
            m: 0,
            p: 0,
            '& .MuiTimelineItem-root': { '&::before': { display: 'none' } },
            '& .MuiTimelineSeparator-root': { minWidth: 'unset' },
            '& .MuiTimelineDot-root': { background: 'transparent', border: 0, p: 0 },
            '& .MuiTimelineConnector-root': { minHeight: '16px' },
          }}
        >
          {events.map((evt, index) => {
            const Icon = eventIconMap[evt.cux_Event_Type__c] || ArrowsClockwiseIcon
            const color = eventColorMap[evt.cux_Event_Type__c] || 'primary'
            const hasStatusChange = evt.cux_Previous_Status__c && evt.cux_New_Status__c

            return (
              <TimelineItem key={evt.Id}>
                <TimelineSeparator>
                  <TimelineDot>
                    <Avatar
                      sx={{
                        bgcolor: `var(--mui-palette-${color}-main)`,
                        color: 'var(--mui-palette-common-white)',
                        height: 36,
                        width: 36,
                      }}
                    >
                      <Icon fontSize="var(--Icon-fontSize)" />
                    </Avatar>
                  </TimelineDot>
                  {index !== events.length - 1 ? <TimelineConnector /> : null}
                </TimelineSeparator>
                <TimelineContent sx={{ pb: 3 }}>
                  <Typography variant="subtitle2">{evt.cux_Event_Type__c}</Typography>
                  {hasStatusChange ? (
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 0.5 }}>
                      <Chip label={evt.cux_Previous_Status__c} size="small" variant="outlined" />
                      <Typography color="text.secondary" variant="caption">&rarr;</Typography>
                      <Chip
                        label={evt.cux_New_Status__c}
                        size="small"
                        color={statusColorMap[evt.cux_New_Status__c] || 'default'}
                        variant="soft"
                      />
                    </Stack>
                  ) : null}
                  <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                    {evt.cux_Performed_By__r?.Name ? (
                      <Typography color="text.secondary" variant="caption">
                        by {evt.cux_Performed_By__r.Name}
                      </Typography>
                    ) : null}
                    <Typography color="text.secondary" variant="caption">
                      {evt.cux_Event_Timestamp__c
                        ? dayjs(evt.cux_Event_Timestamp__c).format('MMM D, YYYY h:mm A')
                        : '—'}
                    </Typography>
                  </Stack>
                </TimelineContent>
              </TimelineItem>
            )
          })}
        </Timeline>
      </CardContent>
    </Card>
  )
}
