import * as React from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import Link from '@mui/material/Link'
import MenuItem from '@mui/material/MenuItem'
import OutlinedInput from '@mui/material/OutlinedInput'
import Select from '@mui/material/Select'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus'
import { XIcon } from '@phosphor-icons/react/dist/ssr/X'
import { dayjs } from '@/lib/dayjs'
import { FileIcon } from '@/components/core/file-icon'
import { FileDropzone } from '@/components/core/file-dropzone'
import { useSalesforceClient } from '@/hooks/use-salesforce'
import { useDocumentSummarization } from '@/hooks/use-document-summarization'

const DOCUMENT_TYPES = [
  'SOW',
  'Scope Description',
  'Funding Approval',
  'Budget Estimate',
  'Sole Source Justification',
  'Procurement Package',
  'Executed STD 213',
  'Executed STD 215',
  'Vendor Cost Proposal',
  'Vendor Rate Sheet',
  'Vendor Cost Breakdown',
  'Vendor Negotiated Price Worksheet',
  'Vendor Pricing Justification',
  'Vendor Other Cost Documentation',
  'Performance Evaluation',
  'Contract Agreement',
  'Invoice',
  'Timesheet',
  'Correspondence',
  'Other',
]

function bytesToSize(bytes, decimals = 2) {
  if (!bytes || bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

const SNACKBAR_MESSAGES = {
  extracting: 'Analyzing document with AI...',
  summarizing: 'Generating summary...',
  complete: 'Document summary generated',
  error: 'Could not generate document summary',
}

export function EntityDocumentsTab({ documents, contractId, entityType, entityId, onDocumentAdded }) {
  const client = useSalesforceClient()
  const [dialogOpen, setDialogOpen] = React.useState(false)

  const { startSummarization, summarizationStatus, summarizationError, resetStatus } =
    useDocumentSummarization(client, onDocumentAdded)

  const snackbarOpen = summarizationStatus !== 'idle'
  const snackbarSeverity = summarizationStatus === 'error' ? 'warning' : summarizationStatus === 'complete' ? 'success' : 'info'
  const snackbarMessage = summarizationStatus === 'error'
    ? (summarizationError || SNACKBAR_MESSAGES.error)
    : (SNACKBAR_MESSAGES[summarizationStatus] || '')

  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          startIcon={<PlusIcon />}
          variant="contained"
          onClick={() => setDialogOpen(true)}
        >
          Add Document
        </Button>
      </Box>
      {!documents?.length ? (
        <Card>
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary" variant="body2">No documents</Typography>
          </Box>
        </Card>
      ) : (
        <Card>
          <Box sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 700 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Document #</TableCell>
                  <TableCell>File Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Summary</TableCell>
                  <TableCell>Version</TableCell>
                  <TableCell>Official</TableCell>
                  <TableCell>Final</TableCell>
                  <TableCell>Uploaded By</TableCell>
                  <TableCell>Upload Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.Id} hover>
                    <TableCell>{doc.Name}</TableCell>
                    <TableCell>
                      {doc.cux_Content_Version_Id__c ? (
                        <Link
                          component="button"
                          onClick={() =>
                            client?.downloadContentVersion(
                              doc.cux_Content_Version_Id__c,
                              doc.cux_File_Name__c || 'download'
                            )
                          }
                          sx={{ cursor: 'pointer' }}
                        >
                          {doc.cux_File_Name__c || 'Download'}
                        </Link>
                      ) : (
                        doc.cux_File_Name__c || '—'
                      )}
                    </TableCell>
                    <TableCell>{doc.cux_Document_Type__c || '—'}</TableCell>
                    <TableCell sx={{ maxWidth: 250 }}>
                      {doc.cux_Short_Summary__c ? (
                        <Tooltip title={doc.cux_Short_Summary__c} placement="top">
                          <Typography variant="body2" noWrap>
                            {doc.cux_Short_Summary__c}
                          </Typography>
                        </Tooltip>
                      ) : '—'}
                    </TableCell>
                    <TableCell>{doc.cux_Version_Number__c || '—'}</TableCell>
                    <TableCell>{doc.cux_Is_Official__c ? 'Yes' : 'No'}</TableCell>
                    <TableCell>{doc.cux_Is_Final__c ? 'Yes' : 'No'}</TableCell>
                    <TableCell>{doc.cux_Uploaded_By__r?.Name || '—'}</TableCell>
                    <TableCell>
                      {doc.cux_Uploaded_At__c ? dayjs(doc.cux_Uploaded_At__c).format('MMM D, YYYY') : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Card>
      )}
      <AddEntityDocumentDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        contractId={contractId}
        entityType={entityType}
        entityId={entityId}
        onSuccess={onDocumentAdded}
        startSummarization={startSummarization}
      />
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={summarizationStatus === 'complete' || summarizationStatus === 'error' ? 5000 : null}
        onClose={(_e, reason) => {
          if (reason === 'clickaway') return
          resetStatus()
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snackbarSeverity}
          variant="filled"
          onClose={resetStatus}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Stack>
  )
}

function AddEntityDocumentDialog({ open, onClose, contractId, entityType, entityId, onSuccess, startSummarization }) {
  const client = useSalesforceClient()
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState(null)
  const [file, setFile] = React.useState(null)
  const [values, setValues] = React.useState({
    cux_File_Name__c: '',
    cux_Document_Type__c: '',
    cux_Version_Number__c: '1',
    cux_Is_Official__c: false,
    cux_Is_Final__c: false,
  })

  function handleChange(field) {
    return (event) => setValues((prev) => ({ ...prev, [field]: event.target.value }))
  }

  function handleSwitchChange(field) {
    return (event) => setValues((prev) => ({ ...prev, [field]: event.target.checked }))
  }

  const handleDrop = React.useCallback((acceptedFiles) => {
    const dropped = acceptedFiles[0]
    if (dropped) {
      setFile(dropped)
      setValues((prev) => ({
        ...prev,
        cux_File_Name__c: prev.cux_File_Name__c || dropped.name,
      }))
    }
  }, [])

  function resetForm() {
    setValues({
      cux_File_Name__c: '',
      cux_Document_Type__c: '',
      cux_Version_Number__c: '1',
      cux_Is_Official__c: false,
      cux_Is_Final__c: false,
    })
    setFile(null)
    setError(null)
    setSubmitting(false)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!client) return

    setSubmitting(true)
    setError(null)
    try {
      let contentVersionId = null
      if (file) {
        const cvResult = await client.uploadContentVersion(file)
        contentVersionId = cvResult.id
      }

      const payload = {
        cux_Contract__c: contractId,
        cux_Related_Entity_Type__c: entityType,
        cux_Related_Entity_Id__c: entityId,
        cux_File_Name__c: values.cux_File_Name__c,
        cux_Document_Type__c: values.cux_Document_Type__c,
        cux_Version_Number__c: values.cux_Version_Number__c || undefined,
        cux_Is_Official__c: values.cux_Is_Official__c,
        cux_Is_Final__c: values.cux_Is_Final__c,
        cux_Uploaded_At__c: new Date().toISOString(),
      }
      if (contentVersionId) {
        payload.cux_Content_Version_Id__c = contentVersionId
      }
      Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined || payload[key] === '') delete payload[key]
      })
      const result = await client.createDocument(payload)

      // Kick off AI summarization in the background (non-blocking, non-Invoice only)
      if (file && values.cux_Document_Type__c !== 'Invoice' && startSummarization) {
        startSummarization(file, result.id, values.cux_Document_Type__c)
      }

      resetForm()
      onClose()
      if (onSuccess) onSuccess()
    } catch (err) {
      setError(err.response?.data?.[0]?.message || err.message)
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={() => { resetForm(); onClose() }}
      maxWidth="sm"
      fullWidth
      PaperProps={{ component: 'form', onSubmit: handleSubmit }}
    >
      <DialogTitle>Add Document</DialogTitle>
      <Divider />
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <FileDropzone
            accept={{ '*/*': [] }}
            maxFiles={1}
            onDrop={handleDrop}
            caption="Max file size is 10 MB"
          />
          {file ? (
            <Stack
              direction="row"
              spacing={2}
              sx={{
                alignItems: 'center',
                border: '1px solid var(--mui-palette-divider)',
                borderRadius: 1,
                p: 1,
              }}
            >
              <FileIcon extension={file.name.split('.').pop()} />
              <Box sx={{ flex: '1 1 auto' }}>
                <Typography variant="subtitle2">{file.name}</Typography>
                <Typography color="text.secondary" variant="body2">
                  {bytesToSize(file.size)}
                </Typography>
              </Box>
              <Tooltip title="Remove">
                <IconButton onClick={() => setFile(null)}>
                  <XIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          ) : null}
          <FormControl fullWidth required>
            <InputLabel>File Name</InputLabel>
            <OutlinedInput
              label="File Name"
              placeholder="e.g. SOW_v1.pdf"
              value={values.cux_File_Name__c}
              onChange={handleChange('cux_File_Name__c')}
            />
          </FormControl>
          <FormControl fullWidth required>
            <InputLabel>Document Type</InputLabel>
            <Select
              label="Document Type"
              value={values.cux_Document_Type__c}
              onChange={handleChange('cux_Document_Type__c')}
            >
              {DOCUMENT_TYPES.map((type) => (
                <MenuItem key={type} value={type}>{type}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Version</InputLabel>
            <OutlinedInput
              label="Version"
              value={values.cux_Version_Number__c}
              onChange={handleChange('cux_Version_Number__c')}
            />
          </FormControl>
          <Stack direction="row" spacing={3}>
            <FormControlLabel
              control={<Switch checked={values.cux_Is_Official__c} onChange={handleSwitchChange('cux_Is_Official__c')} />}
              label="Official"
            />
            <FormControlLabel
              control={<Switch checked={values.cux_Is_Final__c} onChange={handleSwitchChange('cux_Is_Final__c')} />}
              label="Final"
            />
          </Stack>
        </Stack>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button color="secondary" onClick={() => { resetForm(); onClose() }}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={submitting}>
          {submitting ? 'Uploading...' : 'Add Document'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
