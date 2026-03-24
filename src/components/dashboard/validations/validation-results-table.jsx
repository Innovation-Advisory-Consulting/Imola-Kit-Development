import * as React from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'

const outcomeColorMap = {
  PASS: 'success',
  WARN: 'warning',
  FAIL: 'error',
}

const severityColorMap = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'error',
}

const typeColorMap = {
  RULE: 'primary',
  CHECKLIST: 'default',
  DOCUMENT: 'info',
  AI: 'secondary',
}

export function ValidationResultsTable({ results, title = 'Validation Results' }) {
  if (!results || results.length === 0) {
    return (
      <Card>
        <CardHeader title={title} />
        <Divider />
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary" variant="body2">
            No validation results
          </Typography>
        </Box>
      </Card>
    )
  }

  const passCount = results.filter((r) => r.cux_Outcome__c === 'PASS').length
  const warnCount = results.filter((r) => r.cux_Outcome__c === 'WARN').length
  const failCount = results.filter((r) => r.cux_Outcome__c === 'FAIL').length

  return (
    <Card>
      <CardHeader
        title={title}
        subheader={
          <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
            <Chip label={`${passCount} pass`} color="success" size="small" variant="soft" />
            <Chip label={`${warnCount} warn`} color="warning" size="small" variant="soft" />
            <Chip label={`${failCount} fail`} color="error" size="small" variant="soft" />
          </Stack>
        }
      />
      <Divider />
      <Box sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: 700 }}>
          <TableHead>
            <TableRow>
              <TableCell>Result #</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Outcome</TableCell>
              <TableCell>Severity</TableCell>
              <TableCell>Message</TableCell>
              <TableCell>Exec Mode</TableCell>
              <TableCell>Rule / Task</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {results.map((result) => (
              <TableRow hover key={result.Id}>
                <TableCell>
                  <Typography variant="body2">{result.Name}</Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={result.cux_Result_Type__c}
                    color={typeColorMap[result.cux_Result_Type__c] || 'default'}
                    size="small"
                    variant="soft"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={result.cux_Outcome__c}
                    color={outcomeColorMap[result.cux_Outcome__c] || 'default'}
                    size="small"
                    variant="soft"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={result.cux_Severity__c}
                    color={severityColorMap[result.cux_Severity__c] || 'default'}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ maxWidth: 300 }} noWrap>
                    {result.cux_Message__c || '—'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{result.cux_Execution_Mode__c || '—'}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {result.cux_Rule_Id__c || result.cux_Baseline_Task_Template__r?.cux_Task_Code__c || '—'}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
      <Divider />
      <Box sx={{ px: 3, py: 2 }}>
        <Typography color="text.secondary" variant="body2">
          {results.length} result{results.length !== 1 ? 's' : ''}
        </Typography>
      </Box>
    </Card>
  )
}
