import * as React from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import { Helmet } from 'react-helmet-async'

import { appConfig } from '@/config/app'
import { useSalesforceQuery } from '@/hooks/use-salesforce'
import { AnimatedPage } from '@/components/core/animations'

const metadata = { title: `Amendment Reasons | Reference Data | Dashboard | ${appConfig.name}` }

export function Page() {
  const { data: reasons, loading, error } = useSalesforceQuery((client) => client.getAmendmentReasons())

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
          <Typography variant="h4">Amendment Reasons</Typography>
          <Card>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ m: 2 }}>
                Failed to load amendment reasons: {error.message}
              </Alert>
            ) : !reasons?.length ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary" variant="body2">No amendment reasons found</Typography>
              </Box>
            ) : (
              <Box sx={{ overflowX: 'auto' }}>
                <Table sx={{ minWidth: 500 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Code</TableCell>
                      <TableCell>Reason Name</TableCell>
                      <TableCell>Sort Order</TableCell>
                      <TableCell>Active</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reasons.map((reason) => (
                      <TableRow key={reason.Id} hover>
                        <TableCell>{reason.cux_Code__c}</TableCell>
                        <TableCell>{reason.cux_Reason_Name__c}</TableCell>
                        <TableCell>{reason.cux_Sort_Order__c}</TableCell>
                        <TableCell>
                          <Chip
                            color={reason.cux_Is_Active__c ? 'success' : 'default'}
                            label={reason.cux_Is_Active__c ? 'Active' : 'Inactive'}
                            size="small"
                            variant="soft"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}
          </Card>
        </Stack>
      </Box>
      </AnimatedPage>
    </React.Fragment>
  )
}
