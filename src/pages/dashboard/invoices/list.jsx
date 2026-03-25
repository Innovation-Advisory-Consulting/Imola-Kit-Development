import * as React from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { Helmet } from 'react-helmet-async'

import { appConfig } from '@/config/app'
import { paths } from '@/paths'
import { RouterLink } from '@/components/core/link'
import { AnimatedPage } from '@/components/core/animations'

const metadata = { title: `Invoices | Dashboard | ${appConfig.name}` }

const statusColorMap = {
  Draft: 'default',
  Review: 'warning',
  Approval: 'info',
  Paid: 'success',
  Rejected: 'error',
  Void: 'default',
}

function formatCurrency(value) {
  if (value == null) return '$0.00'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

const demoInvoices = [
  { Id: '1', Name: 'INV-0001', cux_Status__c: 'Paid', cux_Amount__c: 15000, cux_Category__c: 'Labor', cux_Invoice_Date__c: '2025-01-15' },
  { Id: '2', Name: 'INV-0002', cux_Status__c: 'Review', cux_Amount__c: 8500, cux_Category__c: 'ODC', cux_Invoice_Date__c: '2025-02-01' },
  { Id: '3', Name: 'INV-0003', cux_Status__c: 'Draft', cux_Amount__c: 22000, cux_Category__c: 'Labor', cux_Invoice_Date__c: '2025-02-15' },
  { Id: '4', Name: 'INV-0004', cux_Status__c: 'Approval', cux_Amount__c: 5200, cux_Category__c: 'Travel', cux_Invoice_Date__c: '2025-03-01' },
]

export function Page() {
  return (
    <React.Fragment>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>
      <AnimatedPage>
        <Box
          sx={{
            maxWidth: 'var(--Content-maxWidth)',
            m: 'var(--Content-margin)',
            p: 'var(--Content-padding)',
            width: 'var(--Content-width)',
          }}
        >
          <Stack spacing={4}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ alignItems: 'flex-start' }}>
              <Box sx={{ flex: '1 1 auto' }}>
                <Typography variant="h4">Invoices</Typography>
              </Box>
            </Stack>

            <Card>
              <Box sx={{ overflowX: 'auto' }}>
                <Table sx={{ minWidth: 700 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Invoice #</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell>Invoice Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {demoInvoices.map((row) => (
                      <TableRow hover key={row.Id}>
                        <TableCell>
                          <Link color="text.primary" component={RouterLink} href={paths.dashboard.invoices.details(row.Id)} variant="subtitle2">
                            {row.Name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Chip color={statusColorMap[row.cux_Status__c] || 'default'} label={row.cux_Status__c} size="small" variant="soft" />
                        </TableCell>
                        <TableCell>{row.cux_Category__c || '\u2014'}</TableCell>
                        <TableCell align="right">{formatCurrency(row.cux_Amount__c)}</TableCell>
                        <TableCell>{row.cux_Invoice_Date__c || '\u2014'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Card>
          </Stack>
        </Box>
      </AnimatedPage>
    </React.Fragment>
  )
}
