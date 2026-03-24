import * as React from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Collapse from '@mui/material/Collapse'
import Divider from '@mui/material/Divider'
import LinearProgress from '@mui/material/LinearProgress'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { RainierAiIcon } from '@/components/core/rainier-ai-icon'
import { CheckIcon } from '@phosphor-icons/react/dist/ssr/Check'
import { XIcon } from '@phosphor-icons/react/dist/ssr/X'
import { FileIcon } from '@/components/core/file-icon'
import { FileDropzone } from '@/components/core/file-dropzone'

const POLL_INTERVAL = 1500
const MAX_POLLS = 40

async function extractInvoiceData(file) {
  const endpoint = import.meta.env.VITE_AZURE_DOC_INTELLIGENCE_ENDPOINT
  const apiKey = import.meta.env.VITE_AZURE_DOC_INTELLIGENCE_KEY

  if (!endpoint || !apiKey) {
    throw new Error('Azure Document Intelligence is not configured. Set VITE_AZURE_DOC_INTELLIGENCE_ENDPOINT and VITE_AZURE_DOC_INTELLIGENCE_KEY.')
  }

  const analyzeUrl = `${endpoint}/documentintelligence/documentModels/prebuilt-invoice:analyze?api-version=2024-11-30`

  // POST the raw file to Document Intelligence
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

  // Poll until complete
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
      return mapDocIntelligenceResult(result)
    }

    if (result.status === 'failed') {
      throw new Error(result.error?.message || 'Document analysis failed')
    }
  }

  throw new Error('Document analysis timed out')
}

function mapDocIntelligenceResult(result) {
  const invoice = result.analyzeResult?.documents?.[0]?.fields || {}

  function getFieldValue(field) {
    if (!field) return null
    if (field.type === 'currency') return field.valueCurrency?.amount ?? field.content ?? null
    if (field.type === 'date') return field.valueDate || field.content || null
    if (field.type === 'string') return field.valueString || field.content || null
    if (field.type === 'number') return field.valueNumber ?? field.content ?? null
    return field.content || null
  }

  // Try to build a description from line items
  const items = invoice.Items?.valueArray || []
  const descriptions = items
    .map((item) => {
      const desc = item.valueObject?.Description
      return desc ? getFieldValue(desc) : null
    })
    .filter(Boolean)

  const description = descriptions.length > 0
    ? descriptions.join('; ')
    : getFieldValue(invoice.Description) || null

  // Map category from line items if available
  let category = null
  if (descriptions.length > 0) {
    const descLower = descriptions.join(' ').toLowerCase()
    if (descLower.includes('labor') || descLower.includes('hour') || descLower.includes('personnel')) {
      category = 'Labor'
    } else if (descLower.includes('travel') || descLower.includes('flight') || descLower.includes('hotel')) {
      category = 'Travel'
    } else if (descLower.includes('material') || descLower.includes('supply') || descLower.includes('equipment')) {
      category = 'Materials'
    } else if (descLower.includes('subcontract')) {
      category = 'Subcontract'
    }
  }

  // Extract total hours — multiple strategies
  let totalHours = null

  // Strategy 1: Line items with hour-related quantity/unit
  for (const item of items) {
    const qty = item.valueObject?.Quantity
    const unit = item.valueObject?.Unit
    const desc = item.valueObject?.Description
    const qtyVal = qty ? parseFloat(String(getFieldValue(qty)).replace(/[^0-9.]/g, '')) : NaN
    const unitVal = unit ? (getFieldValue(unit) || '').toLowerCase() : ''
    const descVal = desc ? (getFieldValue(desc) || '').toLowerCase() : ''

    if (!isNaN(qtyVal) && qtyVal > 0 && (
      unitVal.includes('hour') || unitVal.includes('hr') || unitVal.includes('hrs') ||
      descVal.includes('hour') || descVal.includes('labor') || descVal.includes('hrs')
    )) {
      totalHours = (totalHours || 0) + qtyVal
    }
  }

  // Strategy 2: Scan full document content for common hours patterns
  if (totalHours == null) {
    const content = result.analyzeResult?.content || ''
    const patterns = [
      /total\s*(?:hours?|hrs?)[\s:=\-]*(\d+[,.]?\d*)/gi,
      /(\d+[,.]?\d*)\s*(?:total\s+)?(?:hours?|hrs?)\s*(?:worked|billed|charged)/gi,
      /hours?\s*(?:worked|billed|charged)[\s:=\-]*(\d+[,.]?\d*)/gi,
      /(\d+[,.]?\d*)\s*hrs?\b/gi,
    ]

    for (const pattern of patterns) {
      let match
      while ((match = pattern.exec(content)) !== null) {
        const val = parseFloat(match[1].replace(',', ''))
        if (!isNaN(val) && val > 0 && val < 100000) {
          totalHours = (totalHours || 0) + val
        }
      }
      if (totalHours != null) break
    }
  }

  // Strategy 3: Tables — look for cells with "hours" header and numeric values
  if (totalHours == null) {
    const tables = result.analyzeResult?.tables || []
    for (const table of tables) {
      const headers = {}
      const dataCells = []
      for (const cell of table.cells) {
        if (cell.kind === 'columnHeader') {
          headers[cell.columnIndex] = (cell.content || '').toLowerCase()
        } else {
          dataCells.push(cell)
        }
      }
      const hoursColIdx = Object.entries(headers).find(
        ([, h]) => h.includes('hour') || h.includes('hrs') || h.includes('total hrs') || h.includes('time')
      )?.[0]

      if (hoursColIdx != null) {
        for (const cell of dataCells) {
          if (String(cell.columnIndex) === String(hoursColIdx)) {
            const val = parseFloat((cell.content || '').replace(/[^0-9.]/g, ''))
            if (!isNaN(val) && val > 0) {
              totalHours = (totalHours || 0) + val
            }
          }
        }
      }
    }
  }

  return {
    amount: getFieldValue(invoice.InvoiceTotal) ?? getFieldValue(invoice.AmountDue) ?? getFieldValue(invoice.SubTotal),
    category,
    totalHours,
    invoiceDate: getFieldValue(invoice.InvoiceDate),
    servicePeriodStart: getFieldValue(invoice.ServiceStartDate),
    servicePeriodEnd: getFieldValue(invoice.ServiceEndDate),
    externalInvoiceNumber: getFieldValue(invoice.InvoiceId),
    description,
    vendorName: getFieldValue(invoice.VendorName),
  }
}

export function InvoiceAiScanner({ onApply }) {
  const [file, setFile] = React.useState(null)
  const [scanning, setScanning] = React.useState(false)
  const [error, setError] = React.useState(null)
  const [extractedData, setExtractedData] = React.useState(null)

  function handleDrop(acceptedFiles) {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0])
      setExtractedData(null)
      setError(null)
    }
  }

  function handleRemoveFile() {
    setFile(null)
    setExtractedData(null)
    setError(null)
  }

  async function handleScan() {
    if (!file) return

    setScanning(true)
    setError(null)
    setExtractedData(null)

    try {
      const data = await extractInvoiceData(file)
      setExtractedData(data)
    } catch (err) {
      setError(err.message || 'Failed to extract invoice data')
    } finally {
      setScanning(false)
    }
  }

  function handleApply() {
    if (!extractedData || !onApply) return

    const fieldMap = {
      cux_Amount__c: extractedData.amount != null ? String(extractedData.amount) : '',
      cux_Category__c: extractedData.category || '',
      cux_Invoice_Date__c: extractedData.invoiceDate || '',
      cux_Service_Period_Start__c: extractedData.servicePeriodStart || '',
      cux_Service_Period_End__c: extractedData.servicePeriodEnd || '',
      cux_External_Invoice_Number__c: extractedData.externalInvoiceNumber || '',
      cux_Total_Hours__c: extractedData.totalHours != null ? String(extractedData.totalHours) : '',
      cux_Description__c: extractedData.description || '',
    }

    onApply(fieldMap, file)
    setExtractedData(null)
    setFile(null)
  }

  const fileExtension = file ? file.name.split('.').pop().toLowerCase() : null

  return (
    <Card>
      <CardHeader
        title={
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <RainierAiIcon sx={{ fontSize: 'var(--icon-fontSize-md)', color: 'var(--mui-palette-primary-main)' }} />
            <span>RainierAI Invoice Scanner</span>
          </Stack>
        }
        subheader="Upload an invoice image or PDF and let AI extract the details automatically"
      />
      <Divider />
      <CardContent>
        {!file ? (
          <FileDropzone
            accept={{ 'image/*': [], 'application/pdf': [] }}
            maxFiles={1}
            onDrop={handleDrop}
            caption="PNG, JPG, PDF up to 10MB"
          />
        ) : (
          <Stack spacing={2}>
            <Stack
              direction="row"
              spacing={2}
              sx={{
                alignItems: 'center',
                p: 2,
                borderRadius: 2,
                border: '1px solid var(--mui-palette-divider)',
                bgcolor: 'var(--mui-palette-background-level1)',
              }}
            >
              <FileIcon extension={fileExtension} />
              <Box sx={{ flex: '1 1 auto', minWidth: 0 }}>
                <Typography variant="subtitle2" noWrap>
                  {file.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {(file.size / 1024).toFixed(1)} KB
                </Typography>
              </Box>
              <Button size="small" color="secondary" onClick={handleRemoveFile} disabled={scanning}>
                Remove
              </Button>
            </Stack>

            {!extractedData && !scanning && (
              <Button
                variant="contained"
                onClick={handleScan}
                startIcon={<RainierAiIcon />}
                fullWidth
              >
                Scan with AI
              </Button>
            )}

            {scanning && (
              <Box>
                <LinearProgress sx={{ borderRadius: 1, mb: 1 }} />
                <Typography variant="caption" color="text.secondary">
                  Analyzing invoice with Document Intelligence...
                </Typography>
              </Box>
            )}

            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <Collapse in={Boolean(extractedData)} unmountOnExit>
              {extractedData && (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'var(--mui-palette-primary-50, rgba(38, 105, 179, 0.06))',
                    border: '1px solid var(--mui-palette-primary-200, rgba(38, 105, 179, 0.2))',
                  }}
                >
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
                    <RainierAiIcon sx={{ fontSize: 'var(--icon-fontSize-sm)', color: 'var(--mui-palette-primary-main)' }} />
                    <Typography variant="subtitle2" color="primary.main">
                      Extracted Data
                    </Typography>
                  </Stack>
                  <Stack spacing={1}>
                    {[
                      { label: 'Amount', value: extractedData.amount != null ? `$${extractedData.amount}` : null },
                      { label: 'Total Hours', value: extractedData.totalHours != null ? `${extractedData.totalHours} hrs` : null },
                      { label: 'Category', value: extractedData.category },
                      { label: 'Invoice Date', value: extractedData.invoiceDate },
                      { label: 'Service Period', value: extractedData.servicePeriodStart && extractedData.servicePeriodEnd ? `${extractedData.servicePeriodStart} to ${extractedData.servicePeriodEnd}` : extractedData.servicePeriodStart || extractedData.servicePeriodEnd },
                      { label: 'Invoice Number', value: extractedData.externalInvoiceNumber },
                      { label: 'Vendor', value: extractedData.vendorName },
                      { label: 'Description', value: extractedData.description },
                    ]
                      .filter((item) => item.value)
                      .map((item) => (
                        <Stack key={item.label} direction="row" spacing={1} sx={{ alignItems: 'baseline' }}>
                          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 110, fontWeight: 600 }}>
                            {item.label}:
                          </Typography>
                          <Typography variant="body2">{item.value}</Typography>
                        </Stack>
                      ))}
                  </Stack>
                  <Stack direction="row" spacing={1} sx={{ mt: 2, justifyContent: 'flex-end' }}>
                    <Button
                      size="small"
                      color="secondary"
                      startIcon={<XIcon fontSize="var(--icon-fontSize-sm)" />}
                      onClick={handleRemoveFile}
                    >
                      Discard
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<CheckIcon fontSize="var(--icon-fontSize-sm)" />}
                      onClick={handleApply}
                    >
                      Apply to Form
                    </Button>
                  </Stack>
                </Box>
              )}
            </Collapse>
          </Stack>
        )}
      </CardContent>
    </Card>
  )
}
