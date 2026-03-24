import * as React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import { PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus'
import { Helmet } from 'react-helmet-async'

import { appConfig } from '@/config/app'
import { paths } from '@/paths'
import { dayjs } from '@/lib/dayjs'
import { RouterLink } from '@/components/core/link'
import { useSalesforceQuery } from '@/hooks/use-salesforce'
import { useTableSort } from '@/hooks/use-table-sort'
import { SortableTableCell } from '@/components/core/sortable-table-cell'
import { AnimatedPage } from '@/components/core/animations'

const metadata = { title: `Rule Sets | Dashboard | ${appConfig.name}` }

export function Page() {
  const { data: ruleSets, loading, error } = useSalesforceQuery((client) => client.getRuleSets())
  const { sortedData, sortKey, sortDirection, onSort } = useTableSort(ruleSets, { defaultSortKey: 'Name', defaultDirection: 'desc' })

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
              <Typography variant="h4">Rule Sets</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                component={RouterLink}
                href={paths.dashboard.validations.ruleSets.create}
                startIcon={<PlusIcon />}
                variant="contained"
              >
                New Rule Set
              </Button>
            </Box>
          </Stack>

          <Card>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ m: 2 }}>
                Failed to load rule sets: {error.message}
              </Alert>
            ) : !ruleSets?.length ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary" variant="body2">
                  No rule sets found
                </Typography>
              </Box>
            ) : (
              <React.Fragment>
                <Box sx={{ overflowX: 'auto' }}>
                  <Table sx={{ minWidth: 900 }}>
                    <TableHead>
                      <TableRow>
                        <SortableTableCell sortKey="Name" activeSortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>Rule Set #</SortableTableCell>
                        <SortableTableCell sortKey="cux_Rule_Set_Name__c" activeSortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>Rule Set Name</SortableTableCell>
                        <SortableTableCell sortKey="cux_Target_Entity_Type__c" activeSortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>Target Entity</SortableTableCell>
                        <SortableTableCell sortKey="cux_Version__c" activeSortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>Version</SortableTableCell>
                        <SortableTableCell sortKey="cux_Is_Active__c" activeSortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>Status</SortableTableCell>
                        <SortableTableCell sortKey="cux_Effective_Start__c" activeSortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>Effective Start</SortableTableCell>
                        <SortableTableCell sortKey="LastModifiedDate" activeSortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>Modified</SortableTableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sortedData.map((ruleSet) => (
                        <TableRow hover key={ruleSet.Id} sx={{ '&:last-child td': { border: 0 } }}>
                          <TableCell>
                            <Link
                              color="text.primary"
                              component={RouterLink}
                              href={paths.dashboard.validations.ruleSets.details(ruleSet.Id)}
                              variant="subtitle2"
                            >
                              {ruleSet.Name}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ maxWidth: 250 }} noWrap>
                              {ruleSet.cux_Rule_Set_Name__c || '\u2014'}
                            </Typography>
                          </TableCell>
                          <TableCell>{ruleSet.cux_Target_Entity_Type__c || '\u2014'}</TableCell>
                          <TableCell>{ruleSet.cux_Version__c || '\u2014'}</TableCell>
                          <TableCell>
                            <Chip
                              color={ruleSet.cux_Is_Active__c ? 'success' : 'default'}
                              label={ruleSet.cux_Is_Active__c ? 'Active' : 'Inactive'}
                              size="small"
                              variant="soft"
                            />
                          </TableCell>
                          <TableCell>
                            {ruleSet.cux_Effective_Start__c
                              ? dayjs(ruleSet.cux_Effective_Start__c).format('MMM D, YYYY')
                              : '\u2014'}
                          </TableCell>
                          <TableCell>
                            {ruleSet.LastModifiedDate
                              ? dayjs(ruleSet.LastModifiedDate).format('MMM D, YYYY')
                              : '\u2014'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
                <Divider />
                <Box sx={{ px: 3, py: 2 }}>
                  <Typography color="text.secondary" variant="body2">
                    {ruleSets.length} rule set{ruleSets.length !== 1 ? 's' : ''}
                  </Typography>
                </Box>
              </React.Fragment>
            )}
          </Card>
        </Stack>
      </Box>
      </AnimatedPage>
    </React.Fragment>
  )
}
