import * as React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import Grid from '@mui/material/Grid'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import OutlinedInput from '@mui/material/OutlinedInput'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Alert from '@mui/material/Alert'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { paths } from '@/paths'
import { RouterLink } from '@/components/core/link'
import { useSalesforceClient, useSalesforceQuery } from '@/hooks/use-salesforce'
import { triggerInitialValidation, assignReviewWork } from '@/hooks/use-validation-engine'
import { InvoiceAiScanner } from '@/components/dashboard/invoice/invoice-ai-scanner'
import { AiTextAssist } from '@/components/core/ai-text-assist'

const INVOICE_CATEGORIES = ['Labor', 'ODC', 'Travel', 'Materials', 'Subcontract', 'Other']
const ELIGIBLE_TO_STATUSES = new Set(['Active', 'Completed', 'Closed'])

function formatCurrency(value) {
  if (value == null) return '$0.00'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

export function InvoiceCreateForm() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const prefilledTaskOrderId = searchParams.get('taskOrderId')
  const client = useSalesforceClient()
  const { data: taskOrders } = useSalesforceQuery((c) => c.getTaskOrders())
  const { data: users } = useSalesforceQuery((c) => c.getActiveUsers())
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState(null)
  const [warnings, setWarnings] = React.useState([])
  const [warningsConfirmed, setWarningsConfirmed] = React.useState(false)
  const [scannedFile, setScannedFile] = React.useState(null)

  const eligibleTaskOrders = React.useMemo(
    () => (taskOrders || []).filter((to) => ELIGIBLE_TO_STATUSES.has(to.cux_Status__c)),
    [taskOrders]
  )

  const [values, setValues] = React.useState({
    cux_Task_Order__c: '',
    cux_Contract__c: '',
    cux_Amount__c: '',
    cux_Category__c: '',
    cux_Invoice_Date__c: '',
    cux_Received_Date__c: '',
    cux_Service_Period_Start__c: '',
    cux_Service_Period_End__c: '',
    cux_External_Invoice_Number__c: '',
    cux_Total_Hours__c: '',
    cux_Description__c: '',
    cux_Assigned_To__c: '',
  })

  // Pre-fill task order from URL query param (e.g. when creating from Task Order detail page)
  React.useEffect(() => {
    if (prefilledTaskOrderId && eligibleTaskOrders.length > 0) {
      const selectedTO = eligibleTaskOrders.find((to) => to.Id === prefilledTaskOrderId)
      if (selectedTO) {
        setValues((prev) => ({
          ...prev,
          cux_Task_Order__c: selectedTO.Id,
          cux_Contract__c: selectedTO.cux_Contract__c || '',
        }))
      }
    }
  }, [prefilledTaskOrderId, eligibleTaskOrders])

  function handleChange(field) {
    return (event) => {
      setValues((prev) => {
        const updated = { ...prev, [field]: event.target.value }
        // Auto-populate contract from the selected task order
        if (field === 'cux_Task_Order__c') {
          const selectedTO = eligibleTaskOrders.find((to) => to.Id === event.target.value)
          updated.cux_Contract__c = selectedTO?.cux_Contract__c || ''
        }
        return updated
      })
      // Reset warnings when user changes values
      if (warnings.length > 0) {
        setWarnings([])
        setWarningsConfirmed(false)
      }
    }
  }

  // Derive selected TO for helper text
  const selectedTO = React.useMemo(
    () => eligibleTaskOrders.find((to) => to.Id === values.cux_Task_Order__c),
    [eligibleTaskOrders, values.cux_Task_Order__c]
  )
  const toRemaining = selectedTO
    ? (selectedTO.cux_Authorized_Amount__c || 0) - (selectedTO.cux_Total_Invoiced_Amount__c || 0)
    : null

  async function handleSubmit(event) {
    event.preventDefault()
    if (!client) return

    setSubmitting(true)
    setError(null)
    try {
      const payload = { ...values }
      // Convert numbers
      if (payload.cux_Amount__c) {
        payload.cux_Amount__c = Number(payload.cux_Amount__c)
      } else {
        delete payload.cux_Amount__c
      }
      if (payload.cux_Total_Hours__c) {
        payload.cux_Total_Hours__c = Number(payload.cux_Total_Hours__c)
      } else {
        delete payload.cux_Total_Hours__c
      }
      // Remove empty strings
      Object.keys(payload).forEach((key) => {
        if (payload[key] === '') delete payload[key]
      })

      // ── Business Rule Validations ──

      // Rule 5: Hours required
      if (!payload.cux_Total_Hours__c) {
        setError('Total Hours is required.')
        setSubmitting(false)
        return
      }

      // Rule 2: Amount <= remaining TO balance
      const selectedTO = eligibleTaskOrders.find((to) => to.Id === payload.cux_Task_Order__c)
      if (selectedTO && payload.cux_Amount__c) {
        const remaining = (selectedTO.cux_Authorized_Amount__c || 0) - (selectedTO.cux_Total_Invoiced_Amount__c || 0)
        if (payload.cux_Amount__c > remaining) {
          setError(`Invoice amount exceeds the remaining Task Order balance (${formatCurrency(remaining)}).`)
          setSubmitting(false)
          return
        }
      }

      // Rule 3 & 4: Date warnings (soft — user can confirm and proceed)
      if (!warningsConfirmed) {
        const dateWarnings = []
        if (values.cux_Service_Period_End__c) {
          if (values.cux_Invoice_Date__c && values.cux_Invoice_Date__c < values.cux_Service_Period_End__c) {
            dateWarnings.push('Invoice Date is before the Service Period End date.')
          }
          if (values.cux_Received_Date__c && values.cux_Received_Date__c < values.cux_Service_Period_End__c) {
            dateWarnings.push('Received Date is before the Service Period End date.')
          }
        }

        // Performance period must fall within Task Order dates
        if (selectedTO?.cux_Start_Date__c && selectedTO?.cux_End_Date__c) {
          if (values.cux_Service_Period_Start__c && values.cux_Service_Period_Start__c < selectedTO.cux_Start_Date__c) {
            dateWarnings.push(`Service Period Start is before the Task Order start date (${selectedTO.cux_Start_Date__c}).`)
          }
          if (values.cux_Service_Period_End__c && values.cux_Service_Period_End__c > selectedTO.cux_End_Date__c) {
            dateWarnings.push(`Service Period End is after the Task Order end date (${selectedTO.cux_End_Date__c}).`)
          }
        }

        if (dateWarnings.length > 0) {
          setWarnings(dateWarnings)
          setSubmitting(false)
          return
        }
      }

      const result = await client.createInvoice(payload)
      await triggerInitialValidation(client, 'Invoice', result.id)

      // Assign review work + notify assignee
      if (payload.cux_Assigned_To__c) {
        assignReviewWork(client, 'Invoice', result.id, payload.cux_Assigned_To__c, payload.cux_Category__c || 'Invoice')
          .catch((err) => console.warn('Failed to assign review work:', err))
      }

      // Upload the scanned invoice file as an attachment
      if (scannedFile) {
        try {
          await client.uploadInvoiceAttachment(result.id, scannedFile)
        } catch (_) {
          // Non-blocking — invoice was created, attachment upload can be retried from detail page
        }
      }
      navigate(paths.dashboard.invoices.details(result.id))
    } catch (err) {
      setError(err.response?.data?.[0]?.message || err.message)
      setSubmitting(false)
    }
  }

  function handleAiApply(extracted, file) {
    setValues((prev) => {
      const updated = { ...prev }
      Object.keys(extracted).forEach((key) => {
        if (extracted[key] && key in updated) {
          updated[key] = extracted[key]
        }
      })
      return updated
    })
    if (file) {
      setScannedFile(file)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={3}>
      <InvoiceAiScanner onApply={handleAiApply} />
      <Card>
        <CardHeader title="Invoice Information" />
        <Divider />
        <CardContent>
          <Grid container spacing={3}>
            <Grid size={{ md: 6, xs: 12 }}>
              <FormControl fullWidth required>
                <InputLabel>Task Order</InputLabel>
                <Select
                  label="Task Order"
                  value={values.cux_Task_Order__c}
                  onChange={handleChange('cux_Task_Order__c')}
                >
                  {eligibleTaskOrders.map((to) => (
                    <MenuItem key={to.Id} value={to.Id}>
                      {to.Name} — {to.cux_Task_Order_Type__c || 'Task Order'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ md: 3, xs: 12 }}>
              <FormControl fullWidth required>
                <InputLabel>Amount</InputLabel>
                <OutlinedInput
                  label="Amount"
                  type="number"
                  inputProps={{ min: 0, step: 0.01 }}
                  value={values.cux_Amount__c}
                  onChange={handleChange('cux_Amount__c')}
                />
                {toRemaining != null ? (
                  <FormHelperText>Remaining TO balance: {formatCurrency(toRemaining)}</FormHelperText>
                ) : null}
              </FormControl>
            </Grid>
            <Grid size={{ md: 3, xs: 12 }}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  label="Category"
                  value={values.cux_Category__c}
                  onChange={handleChange('cux_Category__c')}
                >
                  {INVOICE_CATEGORIES.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ md: 3, xs: 12 }}>
              <FormControl fullWidth required>
                <InputLabel shrink>Invoice Date</InputLabel>
                <OutlinedInput
                  label="Invoice Date"
                  type="date"
                  value={values.cux_Invoice_Date__c}
                  onChange={handleChange('cux_Invoice_Date__c')}
                  notched
                />
              </FormControl>
            </Grid>
            <Grid size={{ md: 3, xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel shrink>Received Date</InputLabel>
                <OutlinedInput
                  label="Received Date"
                  type="date"
                  value={values.cux_Received_Date__c}
                  onChange={handleChange('cux_Received_Date__c')}
                  notched
                />
              </FormControl>
            </Grid>
            <Grid size={{ md: 3, xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel shrink>Service Period Start</InputLabel>
                <OutlinedInput
                  label="Service Period Start"
                  type="date"
                  value={values.cux_Service_Period_Start__c}
                  onChange={handleChange('cux_Service_Period_Start__c')}
                  notched
                />
              </FormControl>
            </Grid>
            <Grid size={{ md: 3, xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel shrink>Service Period End</InputLabel>
                <OutlinedInput
                  label="Service Period End"
                  type="date"
                  value={values.cux_Service_Period_End__c}
                  onChange={handleChange('cux_Service_Period_End__c')}
                  notched
                />
              </FormControl>
            </Grid>
            <Grid size={{ md: 3, xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel>External Invoice Number</InputLabel>
                <OutlinedInput
                  label="External Invoice Number"
                  value={values.cux_External_Invoice_Number__c}
                  onChange={handleChange('cux_External_Invoice_Number__c')}
                />
              </FormControl>
            </Grid>
            <Grid size={{ md: 3, xs: 12 }}>
              <FormControl fullWidth required>
                <InputLabel>Total Hours</InputLabel>
                <OutlinedInput
                  label="Total Hours"
                  type="number"
                  inputProps={{ min: 0, step: 0.25 }}
                  value={values.cux_Total_Hours__c}
                  onChange={handleChange('cux_Total_Hours__c')}
                />
              </FormControl>
            </Grid>
            <Grid size={{ md: 6, xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel>Assigned To</InputLabel>
                <Select
                  label="Assigned To"
                  value={values.cux_Assigned_To__c}
                  onChange={handleChange('cux_Assigned_To__c')}
                >
                  <MenuItem value="">Unassigned</MenuItem>
                  {(users || []).map((u) => (
                    <MenuItem key={u.Id} value={u.Id}>{u.Name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel>Description</InputLabel>
                <OutlinedInput
                  label="Description"
                  multiline
                  rows={4}
                  value={values.cux_Description__c}
                  onChange={handleChange('cux_Description__c')}
                />
                <AiTextAssist
                  text={values.cux_Description__c}
                  onAccept={(enhanced) => setValues((prev) => ({ ...prev, cux_Description__c: enhanced }))}
                />
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
        <Divider />
        {warnings.length > 0 ? (
          <Alert severity="warning" sx={{ mx: 2, mt: 1 }}>
            <Stack spacing={0.5}>
              {warnings.map((w, i) => (
                <span key={i}>{w}</span>
              ))}
            </Stack>
          </Alert>
        ) : null}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2, gap: 2 }}>
          {error ? (
            <FormHelperText error sx={{ flex: '1 1 auto', alignSelf: 'center' }}>
              {error}
            </FormHelperText>
          ) : null}
          <Button color="secondary" component={RouterLink} href={paths.dashboard.invoices.list}>
            Cancel
          </Button>
          {warnings.length > 0 && !warningsConfirmed ? (
            <Button
              variant="contained"
              color="warning"
              onClick={() => {
                setWarningsConfirmed(true)
                // Re-trigger submit after confirming warnings
                const form = document.querySelector('form')
                if (form) form.requestSubmit()
              }}
            >
              Proceed Anyway
            </Button>
          ) : (
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Invoice'}
            </Button>
          )}
        </Box>
      </Card>
      </Stack>
    </form>
  )
}
