import * as React from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Collapse from '@mui/material/Collapse'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import LinearProgress from '@mui/material/LinearProgress'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { CheckCircleIcon } from '@phosphor-icons/react/dist/ssr/CheckCircle'
import { DownloadSimpleIcon } from '@phosphor-icons/react/dist/ssr/DownloadSimple'
import { UploadIcon } from '@phosphor-icons/react/dist/ssr/Upload'
import { WarningIcon } from '@phosphor-icons/react/dist/ssr/Warning'
import { WarningCircleIcon } from '@phosphor-icons/react/dist/ssr/WarningCircle'
import { XCircleIcon } from '@phosphor-icons/react/dist/ssr/XCircle'
import { ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock'

import { RainierAiIcon } from '@/components/core/rainier-ai-icon'
import { FileIcon } from '@/components/core/file-icon'
import { FileDropzone } from '@/components/core/file-dropzone'
import { dayjs } from '@/lib/dayjs'

const POLL_INTERVAL = 1500
const MAX_POLLS = 40

// ─── Document Intelligence: extract timesheet data from uploaded file ───
async function extractTimesheetData(file) {
  const endpoint = import.meta.env.VITE_AZURE_DOC_INTELLIGENCE_ENDPOINT
  const apiKey = import.meta.env.VITE_AZURE_DOC_INTELLIGENCE_KEY

  if (!endpoint || !apiKey) {
    throw new Error('Azure Document Intelligence is not configured.')
  }

  // Use the general document model to extract tables/text from timesheets
  const analyzeUrl = `${endpoint}/documentintelligence/documentModels/prebuilt-layout:analyze?api-version=2024-11-30`

  const postResponse = await fetch(analyzeUrl, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': apiKey,
      'Content-Type': file.type || 'application/octet-stream',
    },
    body: file,
  })

  if (!postResponse.ok) {
    const errorData = await postResponse.json().catch(() => ({}))
    throw new Error(errorData.error?.message || `Document Intelligence request failed with status ${postResponse.status}`)
  }

  const operationLocation = postResponse.headers.get('Operation-Location')
  if (!operationLocation) {
    throw new Error('No Operation-Location header in response')
  }

  for (let i = 0; i < MAX_POLLS; i++) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL))

    const pollResponse = await fetch(operationLocation, {
      headers: { 'Ocp-Apim-Subscription-Key': apiKey },
    })

    if (!pollResponse.ok) {
      throw new Error(`Polling failed with status ${pollResponse.status}`)
    }

    const result = await pollResponse.json()

    if (result.status === 'succeeded') {
      return parseTimesheetFromLayout(result, file.name)
    }

    if (result.status === 'failed') {
      throw new Error(result.error?.message || 'Document analysis failed')
    }
  }

  throw new Error('Document analysis timed out')
}

function parseTimesheetFromLayout(result, fileName) {
  const tables = result.analyzeResult?.tables || []
  const content = result.analyzeResult?.content || ''

  // Extract hours from tables
  const entries = []
  let totalHours = 0

  for (const table of tables) {
    const headers = []
    const rows = {}

    for (const cell of table.cells) {
      if (cell.kind === 'columnHeader') {
        headers[cell.columnIndex] = cell.content?.toLowerCase().trim()
      } else {
        if (!rows[cell.rowIndex]) rows[cell.rowIndex] = {}
        rows[cell.rowIndex][cell.columnIndex] = cell.content?.trim()
      }
    }

    // Find hours-related columns
    const hoursColIdx = headers.findIndex((h) =>
      h && (h.includes('hour') || h.includes('hrs') || h.includes('time') || h.includes('total'))
    )
    const nameColIdx = headers.findIndex((h) =>
      h && (h.includes('name') || h.includes('employee') || h.includes('worker') || h.includes('resource'))
    )
    const dateColIdx = headers.findIndex((h) =>
      h && (h.includes('date') || h.includes('day') || h.includes('period'))
    )

    for (const rowIdx of Object.keys(rows)) {
      const row = rows[rowIdx]
      const hoursStr = hoursColIdx >= 0 ? row[hoursColIdx] : null
      const hours = hoursStr ? parseFloat(hoursStr.replace(/[^0-9.]/g, '')) : 0

      if (hours > 0) {
        entries.push({
          name: nameColIdx >= 0 ? row[nameColIdx] : null,
          date: dateColIdx >= 0 ? row[dateColIdx] : null,
          hours,
        })
        totalHours += hours
      }
    }
  }

  // Fallback: try to find total hours from content text if no table entries
  if (entries.length === 0) {
    const hoursMatch = content.match(/total\s*(?:hours?)?\s*[:\-=]?\s*(\d+\.?\d*)/i)
    if (hoursMatch) {
      totalHours = parseFloat(hoursMatch[1])
      entries.push({ name: null, date: null, hours: totalHours })
    }
  }

  return {
    fileName,
    entries,
    totalHours,
    rawContent: content.substring(0, 2000),
  }
}

// ─── AI cross-reference via Azure OpenAI ───
async function crossReferenceTimesheets(invoice, timesheetResults) {
  const endpoint = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT
  const apiKey = import.meta.env.VITE_AZURE_OPENAI_API_KEY
  const deployment = import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT || 'gpt-4o'

  if (!endpoint || !apiKey) {
    throw new Error('Azure OpenAI is not configured.')
  }

  const invoiceSummary = {
    invoiceNumber: invoice.Name,
    amount: invoice.cux_Amount__c,
    totalHoursCharged: invoice.cux_Total_Hours__c,
    category: invoice.cux_Category__c,
    servicePeriodStart: invoice.cux_Service_Period_Start__c,
    servicePeriodEnd: invoice.cux_Service_Period_End__c,
    description: invoice.cux_Description__c,
  }

  const timesheetSummary = timesheetResults.map((ts) => ({
    fileName: ts.fileName,
    totalHours: ts.totalHours,
    entries: ts.entries.slice(0, 50),
  }))

  const grandTotalHours = timesheetResults.reduce((sum, ts) => sum + ts.totalHours, 0)

  const invoiceHours = invoiceSummary.totalHoursCharged
  const hoursComparison = invoiceHours != null
    ? `The invoice claims ${invoiceHours} total hours. The timesheets show ${grandTotalHours} total hours. Difference: ${(grandTotalHours - invoiceHours).toFixed(2)} hours.`
    : `The invoice does not specify total hours. The timesheets show ${grandTotalHours} total hours.`

  const prompt = `You are a contract compliance auditor assistant for CloudCoro CRM. Analyze the following invoice and its supporting timesheets, then produce a verification report.

INVOICE:
${JSON.stringify(invoiceSummary, null, 2)}

TIMESHEETS (${timesheetResults.length} files, Grand Total: ${grandTotalHours} hours):
${JSON.stringify(timesheetSummary, null, 2)}

HOURS COMPARISON:
${hoursComparison}

Produce a clear, structured report with these sections:
1. SUMMARY - Brief overview of what was reviewed
2. HOURS ANALYSIS - Compare the invoice's Total Hours Charged (${invoiceHours ?? 'not specified'}) against the ${grandTotalHours} hours found across all timesheets. Highlight whether they match, and by how much they differ.
3. AMOUNT VERIFICATION - If the invoice category is "Labor", check if hours * any detected rates match the invoice amount. For other categories, note the invoice amount and what the timesheets support.
4. DATE COVERAGE - Check if timesheet dates fall within the service period. Flag any dates outside the range.
5. FINDINGS - List any issues, discrepancies, or concerns (use bullet points)
6. RECOMMENDATION - Pass, Pass with Notes, or Fail with explanation

Use plain text, no markdown. Keep it concise and professional.`

  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-08-01-preview`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: 'You are RainierAI, a contract compliance verification assistant. Produce clear, factual verification reports.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 2000,
      temperature: 0.2,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error?.message || `API request failed with status ${response.status}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content?.trim() || 'No report generated.'
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getVerificationStatus(invoiceHours, timesheetHours) {
  if (invoiceHours == null || invoiceHours === 0) {
    return { severity: 'warning', label: 'No Hours on Invoice', message: 'Invoice has no total hours specified — cannot verify against timesheets.' }
  }
  if (timesheetHours === 0) {
    return { severity: 'warning', label: 'No Hours Extracted', message: 'Could not extract hours from timesheets.' }
  }
  const diff = Math.abs(timesheetHours - invoiceHours)
  const pct = (diff / invoiceHours) * 100
  if (diff === 0) {
    return { severity: 'success', label: 'Hours Match', message: `Timesheet hours (${timesheetHours}) match the invoice exactly.` }
  }
  if (pct <= 2) {
    return { severity: 'success', label: 'Hours Match', message: `Timesheet hours (${timesheetHours.toFixed(1)}) are within ${pct.toFixed(1)}% of invoice hours (${invoiceHours}).` }
  }
  if (pct <= 10) {
    return { severity: 'warning', label: 'Minor Discrepancy', message: `Timesheet hours (${timesheetHours.toFixed(1)}) differ from invoice hours (${invoiceHours}) by ${diff.toFixed(1)} hrs (${pct.toFixed(1)}%).` }
  }
  return { severity: 'error', label: 'Hours Mismatch', message: `Timesheet hours (${timesheetHours.toFixed(1)}) differ from invoice hours (${invoiceHours}) by ${diff.toFixed(1)} hrs (${pct.toFixed(1)}%).` }
}

const statusIcons = {
  success: CheckCircleIcon,
  warning: WarningCircleIcon,
  error: XCircleIcon,
}

const statusColors = {
  success: {
    bg: 'var(--mui-palette-success-50, rgba(16, 185, 129, 0.08))',
    border: 'var(--mui-palette-success-200, rgba(16, 185, 129, 0.3))',
    color: 'var(--mui-palette-success-main, #10b981)',
  },
  warning: {
    bg: 'var(--mui-palette-warning-50, rgba(255, 197, 4, 0.08))',
    border: 'var(--mui-palette-warning-200, rgba(255, 197, 4, 0.3))',
    color: 'var(--mui-palette-warning-main, #ffc504)',
  },
  error: {
    bg: 'var(--mui-palette-error-50, rgba(207, 76, 58, 0.08))',
    border: 'var(--mui-palette-error-200, rgba(207, 76, 58, 0.3))',
    color: 'var(--mui-palette-error-main, #cf4c3a)',
  },
}

function VerificationReportCard({ report, invoiceHours, timesheetHours, invoiceAmount }) {
  const status = getVerificationStatus(invoiceHours, timesheetHours)
  const StatusIcon = statusIcons[status.severity]
  const colors = statusColors[status.severity]

  return (
    <Box sx={{ borderRadius: 2, overflow: 'hidden', border: `1px solid ${colors.border}` }}>
      {/* Status Banner */}
      <Box
        sx={{
          px: 2.5,
          py: 2,
          bgcolor: colors.bg,
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1 }}>
          <StatusIcon fontSize="var(--icon-fontSize-lg)" style={{ color: colors.color }} weight="fill" />
          <Typography variant="h6" sx={{ color: colors.color }}>
            {status.label}
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {status.message}
        </Typography>

        {/* Quick stats row */}
        <Stack direction="row" spacing={3} sx={{ mt: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Invoice Hours</Typography>
            <Typography variant="h6">
              {invoiceHours != null && invoiceHours > 0 ? `${invoiceHours} hrs` : '—'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Timesheet Hours</Typography>
            <Typography variant="h6">
              {timesheetHours > 0 ? `${timesheetHours.toFixed(1)} hrs` : '—'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Difference</Typography>
            <Typography variant="h6" sx={{ color: colors.color }}>
              {invoiceHours != null && invoiceHours > 0 && timesheetHours > 0
                ? `${timesheetHours - invoiceHours > 0 ? '+' : ''}${(timesheetHours - invoiceHours).toFixed(1)} hrs`
                : '—'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Invoice Amount</Typography>
            <Typography variant="h6">
              {invoiceAmount != null ? `$${Number(invoiceAmount).toLocaleString()}` : '—'}
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Report body */}
      <Box sx={{ p: 2.5 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
          <RainierAiIcon sx={{ fontSize: 'var(--icon-fontSize-sm)', color: 'var(--mui-palette-primary-main)' }} />
          <Typography variant="subtitle2" color="primary.main">
            RainierAI Verification Report
          </Typography>
        </Stack>
        <Typography
          variant="body2"
          sx={{
            whiteSpace: 'pre-wrap',
            bgcolor: 'var(--mui-palette-background-level1)',
            p: 2,
            borderRadius: 1,
            border: '1px solid var(--mui-palette-divider)',
            maxHeight: 400,
            overflowY: 'auto',
            lineHeight: 1.7,
          }}
        >
          {report}
        </Typography>
      </Box>
    </Box>
  )
}

export function InvoiceTimesheets({ invoice, client }) {
  const [attachments, setAttachments] = React.useState([])
  const [loadingAttachments, setLoadingAttachments] = React.useState(true)
  const [uploading, setUploading] = React.useState(false)
  const [showDropzone, setShowDropzone] = React.useState(false)
  const [error, setError] = React.useState(null)

  // AI scanning state
  const [scanning, setScanning] = React.useState(false)
  const [scanProgress, setScanProgress] = React.useState({ current: 0, total: 0 })
  const [timesheetResults, setTimesheetResults] = React.useState([])
  const [crossRefReport, setCrossRefReport] = React.useState(null)
  const [crossRefLoading, setCrossRefLoading] = React.useState(false)
  const [crossRefError, setCrossRefError] = React.useState(null)

  const fetchAttachments = React.useCallback(async () => {
    if (!client || !invoice?.Id) return
    try {
      const data = await client.getInvoiceAttachments(invoice.Id)
      setAttachments(data || [])
    } catch {
      // Ignore — may not have any attachments yet
      setAttachments([])
    } finally {
      setLoadingAttachments(false)
    }
  }, [client, invoice?.Id])

  React.useEffect(() => {
    fetchAttachments()
  }, [fetchAttachments])

  async function handleDrop(acceptedFiles) {
    if (!client || !invoice?.Id || acceptedFiles.length === 0) return

    setUploading(true)
    setError(null)

    try {
      for (const file of acceptedFiles) {
        await client.uploadInvoiceAttachment(invoice.Id, file)
      }
      await fetchAttachments()
      setShowDropzone(false)
    } catch (err) {
      setError(err.response?.data?.[0]?.message || err.message || 'Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  function handleDownload(attachment) {
    const versionId = attachment.ContentDocument.LatestPublishedVersionId
    const fileName = `${attachment.ContentDocument.Title}.${attachment.ContentDocument.FileExtension}`
    client.downloadContentVersion(versionId, fileName)
  }

  async function handleScanAll() {
    if (attachments.length === 0) return

    setScanning(true)
    setTimesheetResults([])
    setCrossRefReport(null)
    setCrossRefError(null)
    setScanProgress({ current: 0, total: attachments.length })

    const results = []

    for (let i = 0; i < attachments.length; i++) {
      const att = attachments[i]
      setScanProgress({ current: i + 1, total: attachments.length })

      try {
        // Download the file as blob
        const versionId = att.ContentDocument.LatestPublishedVersionId
        const downloadUrl = client.getContentVersionDownloadUrl(versionId)

        const response = await fetch(downloadUrl, {
          headers: { Authorization: `Bearer ${client.accessToken}` },
        })
        const blob = await response.blob()

        const ext = att.ContentDocument.FileExtension?.toLowerCase()
        let mimeType = 'application/octet-stream'
        if (ext === 'pdf') mimeType = 'application/pdf'
        else if (['png', 'jpg', 'jpeg'].includes(ext)) mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}`

        const file = new File([blob], `${att.ContentDocument.Title}.${ext}`, { type: mimeType })
        const data = await extractTimesheetData(file)
        results.push(data)
      } catch (err) {
        results.push({
          fileName: `${att.ContentDocument.Title}.${att.ContentDocument.FileExtension}`,
          entries: [],
          totalHours: 0,
          error: err.message,
        })
      }
    }

    setTimesheetResults(results)
    setScanning(false)
  }

  async function handleCrossReference() {
    if (timesheetResults.length === 0) return

    setCrossRefLoading(true)
    setCrossRefError(null)
    setCrossRefReport(null)

    try {
      const report = await crossReferenceTimesheets(invoice, timesheetResults)
      setCrossRefReport(report)
    } catch (err) {
      setCrossRefError(err.message || 'Failed to generate cross-reference report')
    } finally {
      setCrossRefLoading(false)
    }
  }

  const grandTotalHours = timesheetResults.reduce((sum, ts) => sum + ts.totalHours, 0)
  const hasErrors = timesheetResults.some((ts) => ts.error)
  const hasResults = timesheetResults.length > 0

  return (
    <Card>
      <CardHeader
        title={
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <ClockIcon fontSize="var(--icon-fontSize-md)" />
            <span>Timesheets</span>
            {attachments.length > 0 && (
              <Chip label={attachments.length} size="small" variant="soft" color="primary" />
            )}
          </Stack>
        }
        subheader="Upload timesheet documents and use RainierAI to verify hours against the invoice"
        action={
          <Button
            size="small"
            startIcon={<UploadIcon />}
            onClick={() => setShowDropzone(!showDropzone)}
            disabled={uploading}
          >
            Upload
          </Button>
        }
      />
      <Divider />
      <CardContent>
        <Stack spacing={2}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Collapse in={showDropzone} unmountOnExit>
            <Box sx={{ mb: 2 }}>
              <FileDropzone
                accept={{ 'image/*': [], 'application/pdf': [] }}
                maxFiles={10}
                onDrop={handleDrop}
                caption="PNG, JPG, PDF — upload one or more timesheet files"
                disabled={uploading}
              />
              {uploading && <LinearProgress sx={{ mt: 1, borderRadius: 1 }} />}
            </Box>
          </Collapse>

          {loadingAttachments ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : attachments.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
              No timesheets uploaded yet. Click Upload to add timesheet documents.
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>File</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell>Uploaded</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {attachments.map((att) => {
                  const doc = att.ContentDocument
                  return (
                    <TableRow key={att.ContentDocumentId} hover>
                      <TableCell>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                          <FileIcon extension={doc.FileExtension} />
                          <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                            {doc.Title}.{doc.FileExtension}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {formatFileSize(doc.ContentSize)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {dayjs(doc.CreatedDate).format('MMM D, YYYY')}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => handleDownload(att)}>
                          <DownloadSimpleIcon fontSize="var(--icon-fontSize-sm)" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}

          {/* AI Scan Section */}
          {attachments.length > 0 && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Divider />

              {!hasResults && !scanning && (
                <Button
                  variant="contained"
                  onClick={handleScanAll}
                  startIcon={<RainierAiIcon />}
                  fullWidth
                >
                  Scan All Timesheets with RainierAI
                </Button>
              )}

              {scanning && (
                <Box>
                  <LinearProgress
                    variant="determinate"
                    value={(scanProgress.current / scanProgress.total) * 100}
                    sx={{ borderRadius: 1, mb: 1 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Scanning timesheet {scanProgress.current} of {scanProgress.total}...
                  </Typography>
                </Box>
              )}

              {hasResults && (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'var(--mui-palette-background-level1)',
                    border: '1px solid var(--mui-palette-divider)',
                  }}
                >
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
                    <RainierAiIcon sx={{ fontSize: 'var(--icon-fontSize-sm)', color: 'var(--mui-palette-primary-main)' }} />
                    <Typography variant="subtitle2" color="primary.main">
                      Timesheet Scan Results
                    </Typography>
                  </Stack>

                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>File</TableCell>
                        <TableCell align="right">Hours</TableCell>
                        <TableCell align="right">Entries</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {timesheetResults.map((ts, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 180 }}>
                              {ts.fileName}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {ts.totalHours.toFixed(1)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" color="text.secondary">
                              {ts.entries.length}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {ts.error ? (
                              <Chip label="Error" size="small" color="error" variant="soft" />
                            ) : ts.totalHours > 0 ? (
                              <Chip label="Extracted" size="small" color="success" variant="soft" />
                            ) : (
                              <Chip label="No hours found" size="small" color="warning" variant="soft" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell>
                          <Typography variant="subtitle2">Grand Total</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="subtitle2">{grandTotalHours.toFixed(1)} hrs</Typography>
                        </TableCell>
                        <TableCell />
                        <TableCell />
                      </TableRow>
                    </TableBody>
                  </Table>

                  <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={handleScanAll}
                    >
                      Re-scan
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<RainierAiIcon />}
                      onClick={handleCrossReference}
                      disabled={crossRefLoading}
                    >
                      Cross-Reference & Generate Report
                    </Button>
                  </Stack>
                </Box>
              )}

              {crossRefLoading && (
                <Box>
                  <LinearProgress sx={{ borderRadius: 1, mb: 1 }} />
                  <Typography variant="caption" color="text.secondary">
                    RainierAI is cross-referencing timesheets against the invoice...
                  </Typography>
                </Box>
              )}

              {crossRefError && (
                <Alert severity="error" onClose={() => setCrossRefError(null)}>
                  {crossRefError}
                </Alert>
              )}

              <Collapse in={Boolean(crossRefReport)} unmountOnExit>
                {crossRefReport && (
                  <VerificationReportCard
                    report={crossRefReport}
                    invoiceHours={invoice.cux_Total_Hours__c}
                    timesheetHours={grandTotalHours}
                    invoiceAmount={invoice.cux_Amount__c}
                  />
                )}
              </Collapse>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}
