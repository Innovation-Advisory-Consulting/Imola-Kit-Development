import * as React from 'react'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import InputLabel from '@mui/material/InputLabel'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import OutlinedInput from '@mui/material/OutlinedInput'
import Popover from '@mui/material/Popover'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import TableSortLabel from '@mui/material/TableSortLabel'
import Tabs from '@mui/material/Tabs'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { DotsSixVerticalIcon } from '@phosphor-icons/react/dist/ssr/DotsSixVertical'
import { EqualsIcon } from '@phosphor-icons/react/dist/ssr/Equals'
import { ColumnsIcon } from '@phosphor-icons/react/dist/ssr/Columns'
import { ExportIcon } from '@phosphor-icons/react/dist/ssr/Export'
import { FileCsvIcon } from '@phosphor-icons/react/dist/ssr/FileCsv'
import { FilePdfIcon } from '@phosphor-icons/react/dist/ssr/FilePdf'
import { FunnelIcon } from '@phosphor-icons/react/dist/ssr/Funnel'
import { PrinterIcon } from '@phosphor-icons/react/dist/ssr/Printer'
import { MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass'
import { XIcon } from '@phosphor-icons/react/dist/ssr/X'
import { TrashIcon } from '@phosphor-icons/react/dist/ssr/Trash'
import { ArrowSquareOutIcon } from '@phosphor-icons/react/dist/ssr/ArrowSquareOut'
import { LightningIcon } from '@phosphor-icons/react/dist/ssr/Lightning'
import { FileTextIcon } from '@phosphor-icons/react/dist/ssr/FileText'
import { ClockCounterClockwiseIcon } from '@phosphor-icons/react/dist/ssr/ClockCounterClockwise'
import { NoteIcon } from '@phosphor-icons/react/dist/ssr/Note'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { dayjs } from '@/lib/dayjs'

/**
 * Enhanced data table with toolbar: search, column filters, column visibility,
 * CSV export, density toggle, drag-to-reorder columns, sorting, and pagination.
 *
 * Column definition shape:
 * {
 *   id: string,          — unique key (required)
 *   label: string,       — header label
 *   sortKey: string,     — data field for sorting (dot-notation supported)
 *   field: string,       — simple data field for search/export
 *   align: string,       — 'left' | 'right' | 'center'
 *   width: string,       — e.g. '150px'
 *   hidden: boolean,     — initially hidden
 *   filterable: boolean, — show in filter menu (default true)
 *   formatter: (row) => ReactNode,  — custom cell renderer
 *   exportValue: (row) => string,   — custom export value
 * }
 *
 * Quick View config shape (optional — enables row-click drawer):
 * {
 *   titleField: string,           — field path for drawer title
 *   subtitleField: string,        — field path for subtitle chip
 *   subtitleColorMap: object,     — color map for subtitle chip
 *   detailsPath: (row) => string, — link to full detail page
 *   sections: [{ title: string, fields: [{ label, field, type?, formatter? }] }],
 *   onDelete: (row) => void,      — optional delete handler
 * }
 */
export function DataTableView({
  columns: columnDefs,
  rows = [],
  rowKey = 'Id',
  entityLabel = 'items',
  searchPlaceholder,
  defaultSortKey,
  defaultSortDirection = 'desc',
  filterOptions,
  onRowClick,
  quickViewConfig,
}) {
  // ─── Column order & visibility ───
  const [columnOrder, setColumnOrder] = React.useState(() => columnDefs.map((c) => c.id))
  const [hiddenColumns, setHiddenColumns] = React.useState(() => {
    const hidden = new Set()
    columnDefs.forEach((c) => { if (c.hidden) hidden.add(c.id) })
    return hidden
  })

  // Sync column order when columnDefs change
  React.useEffect(() => {
    setColumnOrder((prev) => {
      const ids = new Set(columnDefs.map((c) => c.id))
      const kept = prev.filter((id) => ids.has(id))
      const added = columnDefs.map((c) => c.id).filter((id) => !kept.includes(id))
      return [...kept, ...added]
    })
  }, [columnDefs])

  const columnMap = React.useMemo(() => {
    const map = {}
    columnDefs.forEach((c) => { map[c.id] = c })
    return map
  }, [columnDefs])

  const visibleColumns = React.useMemo(
    () => columnOrder.filter((id) => !hiddenColumns.has(id) && columnMap[id]),
    [columnOrder, hiddenColumns, columnMap]
  )

  // ─── Search ───
  const [search, setSearch] = React.useState('')

  // ─── Filters ───
  const [activeFilters, setActiveFilters] = React.useState({})

  // ─── Sort ───
  const [sortKey, setSortKey] = React.useState(defaultSortKey || null)
  const [sortDirection, setSortDirection] = React.useState(defaultSortDirection)

  function handleSort(key) {
    if (sortKey === key) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  // ─── Density ───
  const [density, setDensity] = React.useState('standard')
  const densityPadding = {
    compact: { py: 0.5, px: 1 },
    standard: { py: 1, px: 2 },
    comfortable: { py: 1.75, px: 2 },
  }

  // ─── Pagination ───
  const [page, setPage] = React.useState(0)
  const [rowsPerPage, setRowsPerPage] = React.useState(10)

  // ─── Toolbar Popovers ───
  const [filterAnchor, setFilterAnchor] = React.useState(null)
  const [filterColumn, setFilterColumn] = React.useState('')
  const [filterValues, setFilterValues] = React.useState([])
  const [columnsAnchor, setColumnsAnchor] = React.useState(null)
  const [densityAnchor, setDensityAnchor] = React.useState(null)
  const [exportAnchor, setExportAnchor] = React.useState(null)

  // ─── Quick View ───
  const [quickViewRow, setQuickViewRow] = React.useState(null)
  const [quickViewTab, setQuickViewTab] = React.useState('overview')

  function handleRowClick(row) {
    if (quickViewConfig) {
      setQuickViewRow(row)
      setQuickViewTab('overview')
    } else if (onRowClick) {
      onRowClick(row)
    }
  }

  // ─── Drag state ───
  const [dragIdx, setDragIdx] = React.useState(null)
  const [dragOverIdx, setDragOverIdx] = React.useState(null)

  // ─── Process data: search → filter → sort → paginate ───
  const processedRows = React.useMemo(() => {
    let data = rows

    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      data = data.filter((row) =>
        columnDefs.some((col) => {
          const val = col.field ? resolveValue(row, col.field) : null
          return val != null && String(val).toLowerCase().includes(q)
        })
      )
    }

    // Filters (each filter is an array of allowed values)
    Object.entries(activeFilters).forEach(([field, values]) => {
      if (!values || values.length === 0) return
      data = data.filter((row) => {
        const val = resolveValue(row, field)
        return val != null && values.includes(String(val))
      })
    })

    // Sort
    if (sortKey) {
      data = [...data].sort((a, b) => {
        const aVal = resolveValue(a, sortKey)
        const bVal = resolveValue(b, sortKey)
        if (aVal == null && bVal == null) return 0
        if (aVal == null) return 1
        if (bVal == null) return -1
        let cmp = typeof aVal === 'number' && typeof bVal === 'number'
          ? aVal - bVal
          : String(aVal).localeCompare(String(bVal), undefined, { sensitivity: 'base' })
        return sortDirection === 'asc' ? cmp : -cmp
      })
    }

    return data
  }, [rows, search, activeFilters, sortKey, sortDirection, columnDefs])

  const paginatedRows = React.useMemo(
    () => processedRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [processedRows, page, rowsPerPage]
  )

  // Reset to first page on search/filter change
  React.useEffect(() => { setPage(0) }, [search, activeFilters])

  // ─── Export CSV ───
  function handleExportCsv() {
    const cols = visibleColumns.map((id) => columnMap[id])
    const header = cols.map((c) => `"${(c.label || c.id).replace(/"/g, '""')}"`)
    const csvRows = processedRows.map((row) =>
      cols.map((c) => {
        const val = c.exportValue ? c.exportValue(row) : c.field ? resolveValue(row, c.field) : ''
        return `"${String(val ?? '').replace(/"/g, '""')}"`
      })
    )
    const csv = [header.join(','), ...csvRows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${entityLabel.toLowerCase().replace(/\s+/g, '-')}-export.csv`
    a.click()
    URL.revokeObjectURL(url)
    setExportAnchor(null)
  }

  // ─── Export PDF ───
  function handleExportPdf() {
    const cols = visibleColumns.map((id) => columnMap[id])
    const doc = new jsPDF({ orientation: cols.length > 6 ? 'landscape' : 'portrait' })

    doc.setFontSize(14)
    doc.text(entityLabel, 14, 18)
    doc.setFontSize(8)
    doc.setTextColor(128)
    doc.text(`Exported ${new Date().toLocaleDateString()} — ${processedRows.length} records`, 14, 24)

    autoTable(doc, {
      startY: 30,
      head: [cols.map((c) => c.label || c.id)],
      body: processedRows.map((row) =>
        cols.map((c) => {
          const val = c.exportValue ? c.exportValue(row) : c.field ? resolveValue(row, c.field) : ''
          return String(val ?? '—')
        })
      ),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    })

    doc.save(`${entityLabel.toLowerCase().replace(/\s+/g, '-')}-export.pdf`)
    setExportAnchor(null)
  }

  // ─── Print ───
  function handlePrint() {
    const cols = visibleColumns.map((id) => columnMap[id])
    const title = entityLabel
    const html = `
      <html><head><title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { font-size: 18px; margin-bottom: 12px; }
        table { border-collapse: collapse; width: 100%; font-size: 12px; }
        th, td { border: 1px solid #ddd; padding: 6px 10px; text-align: left; }
        th { background: #f5f5f5; font-weight: 600; }
        tr:nth-child(even) { background: #fafafa; }
        @media print { body { margin: 0; } }
      </style></head><body>
      <h1>${title}</h1>
      <table>
        <thead><tr>${cols.map((c) => `<th>${c.label || c.id}</th>`).join('')}</tr></thead>
        <tbody>${processedRows.map((row) =>
          `<tr>${cols.map((c) => {
            const val = c.exportValue ? c.exportValue(row) : c.field ? resolveValue(row, c.field) : ''
            return `<td>${String(val ?? '—')}</td>`
          }).join('')}</tr>`
        ).join('')}</tbody>
      </table></body></html>`
    const win = window.open('', '_blank')
    win.document.write(html)
    win.document.close()
    win.onload = () => { win.print(); win.close() }
    setExportAnchor(null)
  }

  // ─── Column drag handlers ───
  function handleDragStart(e, idx) {
    setDragIdx(idx)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e, idx) {
    e.preventDefault()
    setDragOverIdx(idx)
  }

  function handleDrop(e, dropIdx) {
    e.preventDefault()
    if (dragIdx == null || dragIdx === dropIdx) {
      setDragIdx(null)
      setDragOverIdx(null)
      return
    }
    setColumnOrder((prev) => {
      const visIds = prev.filter((id) => !hiddenColumns.has(id) && columnMap[id])
      const hidIds = prev.filter((id) => hiddenColumns.has(id) || !columnMap[id])
      const item = visIds[dragIdx]
      const newVis = visIds.filter((_, i) => i !== dragIdx)
      newVis.splice(dropIdx, 0, item)
      return [...newVis, ...hidIds]
    })
    setDragIdx(null)
    setDragOverIdx(null)
  }

  // ─── Compute available filter values ───
  const computedFilterOptions = React.useMemo(() => {
    if (filterOptions) return filterOptions
    const opts = {}
    columnDefs.forEach((col) => {
      if (col.filterable === false || !col.field) return
      const values = new Set()
      rows.forEach((row) => {
        const val = resolveValue(row, col.field)
        if (val != null && String(val).trim()) values.add(String(val))
      })
      if (values.size > 0 && values.size <= 30) {
        opts[col.field] = { label: col.label, values: [...values].sort() }
      }
    })
    return opts
  }, [filterOptions, columnDefs, rows])

  const activeFilterCount = Object.values(activeFilters).filter((v) => v && v.length > 0).length

  return (
    <React.Fragment>
      {/* ─── Toolbar ─── */}
      <Stack
        direction="row"
        spacing={1}
        sx={{ px: 2, py: 1.5, alignItems: 'center', flexWrap: 'wrap', gap: 1 }}
      >
        {/* Search */}
        <OutlinedInput
          placeholder={searchPlaceholder || `Search ${entityLabel.toLowerCase()}...`}
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          startAdornment={
            <InputAdornment position="start">
              <MagnifyingGlassIcon fontSize="var(--icon-fontSize-md)" />
            </InputAdornment>
          }
          sx={{ maxWidth: 300, flex: '1 1 200px' }}
        />

        {/* Active filter chips */}
        {Object.entries(activeFilters).map(([field, values]) =>
          values && values.length > 0 ? (
            <Chip
              key={field}
              label={`${computedFilterOptions[field]?.label || field}: ${values.length === 1 ? values[0] : `${values.length} selected`}`}
              size="small"
              onDelete={() => setActiveFilters((prev) => ({ ...prev, [field]: [] }))}
            />
          ) : null
        )}

        <Box sx={{ flex: '1 1 auto' }} />

        {/* Filter */}
        <Tooltip title="Filter">
          <IconButton onClick={(e) => setFilterAnchor(e.currentTarget)} size="small">
            <FunnelIcon fontSize="var(--icon-fontSize-md)" />
            {activeFilterCount > 0 && (
              <Box
                sx={{
                  position: 'absolute', top: 2, right: 2, width: 8, height: 8,
                  borderRadius: '50%', bgcolor: 'primary.main',
                }}
              />
            )}
          </IconButton>
        </Tooltip>

        {/* Column visibility */}
        <Tooltip title="Columns">
          <IconButton onClick={(e) => setColumnsAnchor(e.currentTarget)} size="small">
            <ColumnsIcon fontSize="var(--icon-fontSize-md)" />
          </IconButton>
        </Tooltip>

        {/* Export */}
        <Tooltip title="Export">
          <IconButton onClick={(e) => setExportAnchor(e.currentTarget)} size="small">
            <ExportIcon fontSize="var(--icon-fontSize-md)" />
          </IconButton>
        </Tooltip>

        {/* Density */}
        <Tooltip title="Density">
          <IconButton onClick={(e) => setDensityAnchor(e.currentTarget)} size="small">
            <EqualsIcon fontSize="var(--icon-fontSize-md)" />
          </IconButton>
        </Tooltip>
      </Stack>

      <Divider />

      {/* ─── Table ─── */}
      <Box sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: 900 }}>
          <TableHead>
            <TableRow>
              {visibleColumns.map((colId, idx) => {
                const col = columnMap[colId]
                const active = sortKey === col.sortKey
                const isDragOver = dragOverIdx === idx && dragIdx !== idx

                return (
                  <TableCell
                    key={colId}
                    align={col.align}
                    sx={{
                      width: col.width, minWidth: col.width, maxWidth: col.width,
                      cursor: 'grab', userSelect: 'none', ...densityPadding[density],
                      ...(isDragOver && {
                        borderLeft: '2px solid',
                        borderLeftColor: 'primary.main',
                      }),
                    }}
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDrop={(e) => handleDrop(e, idx)}
                    onDragEnd={() => { setDragIdx(null); setDragOverIdx(null) }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box
                        className="drag-handle"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          color: 'text.disabled',
                          cursor: 'grab',
                          '&:hover': { color: 'text.secondary' },
                        }}
                      >
                        <DotsSixVerticalIcon size={14} />
                      </Box>
                      {col.sortKey ? (
                        <TableSortLabel
                          active={active}
                          direction={active ? sortDirection : 'asc'}
                          onClick={() => handleSort(col.sortKey)}
                        >
                          {col.label}
                        </TableSortLabel>
                      ) : (
                        col.label
                      )}
                    </Box>
                  </TableCell>
                )
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length} sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary" variant="body2">
                    {search || activeFilterCount > 0
                      ? `No ${entityLabel.toLowerCase()} match your search or filters`
                      : `No ${entityLabel.toLowerCase()} found`}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedRows.map((row) => {
                const id = typeof rowKey === 'function' ? rowKey(row) : row[rowKey]
                return (
                  <TableRow
                    hover
                    key={id}
                    sx={{
                      '&:last-child td': { border: 0 },
                      ...((onRowClick || quickViewConfig) && { cursor: 'pointer' }),
                      ...(quickViewRow && (typeof rowKey === 'function' ? rowKey(quickViewRow) : quickViewRow[rowKey]) === id && {
                        bgcolor: 'var(--mui-palette-action-selected)',
                      }),
                    }}
                    onClick={() => handleRowClick(row)}
                  >
                    {visibleColumns.map((colId) => {
                      const col = columnMap[colId]
                      return (
                        <TableCell key={colId} align={col.align} sx={{ ...densityPadding[density] }}>
                          {col.formatter
                            ? col.formatter(row)
                            : col.field
                              ? (resolveValue(row, col.field) ?? '\u2014')
                              : '\u2014'}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Box>

      {/* ─── Pagination ─── */}
      <TablePagination
        component="div"
        count={processedRows.length}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={(_, p) => setPage(p)}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0) }}
        rowsPerPageOptions={[10, 25, 50, 100]}
      />

      {/* ─── Filter Popover ─── */}
      <Popover
        anchorEl={filterAnchor}
        open={Boolean(filterAnchor)}
        onClose={() => { setFilterAnchor(null); setFilterColumn(''); setFilterValues([]) }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { width: 280 } } }}
      >
        <Stack spacing={2} sx={{ p: 2 }}>
          <Typography variant="subtitle2">Add Filter</Typography>
          <FormControl fullWidth size="small">
            <InputLabel>Column</InputLabel>
            <Select
              label="Column"
              value={filterColumn}
              onChange={(e) => {
                const col = e.target.value
                setFilterColumn(col)
                setFilterValues(activeFilters[col] || [])
              }}
            >
              {Object.entries(computedFilterOptions).map(([field, opt]) => (
                <MenuItem key={field} value={field}>{opt.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small" disabled={!filterColumn}>
            <InputLabel>Value</InputLabel>
            <Select
              label="Value"
              multiple
              value={filterValues}
              onChange={(e) => setFilterValues(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
              renderValue={(selected) => selected.length === 1 ? selected[0] : `${selected.length} selected`}
            >
              {filterColumn && computedFilterOptions[filterColumn]?.values.map((v) => (
                <MenuItem key={v} value={v}>
                  <Checkbox size="small" checked={filterValues.includes(v)} />
                  <Typography variant="body2">{v}</Typography>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Divider />
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
            <Button
              size="small"
              color="secondary"
              onClick={() => { setFilterAnchor(null); setFilterColumn(''); setFilterValues([]) }}
            >
              Cancel
            </Button>
            <Button
              size="small"
              variant="contained"
              disabled={!filterColumn || filterValues.length === 0}
              onClick={() => {
                setActiveFilters((prev) => ({ ...prev, [filterColumn]: filterValues }))
                setFilterAnchor(null)
                setFilterColumn('')
                setFilterValues([])
              }}
            >
              Apply
            </Button>
          </Stack>
        </Stack>
      </Popover>

      {/* ─── Columns Popover ─── */}
      <Popover
        anchorEl={columnsAnchor}
        open={Boolean(columnsAnchor)}
        onClose={() => setColumnsAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { width: 240, maxHeight: 400 } } }}
      >
        <Stack sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Toggle Columns</Typography>
          {columnDefs.map((col) => (
            <FormControlLabel
              key={col.id}
              control={
                <Checkbox
                  size="small"
                  checked={!hiddenColumns.has(col.id)}
                  onChange={() =>
                    setHiddenColumns((prev) => {
                      const next = new Set(prev)
                      if (next.has(col.id)) next.delete(col.id)
                      else next.add(col.id)
                      return next
                    })
                  }
                />
              }
              label={<Typography variant="body2">{col.label}</Typography>}
            />
          ))}
        </Stack>
      </Popover>

      {/* ─── Export Menu ─── */}
      <Menu
        anchorEl={exportAnchor}
        open={Boolean(exportAnchor)}
        onClose={() => setExportAnchor(null)}
      >
        <MenuItem onClick={handleExportCsv}>
          <FileCsvIcon style={{ marginRight: 8 }} fontSize="var(--icon-fontSize-md)" />
          Export CSV
        </MenuItem>
        <MenuItem onClick={handleExportPdf}>
          <FilePdfIcon style={{ marginRight: 8 }} fontSize="var(--icon-fontSize-md)" />
          Export PDF
        </MenuItem>
        <Divider />
        <MenuItem onClick={handlePrint}>
          <PrinterIcon style={{ marginRight: 8 }} fontSize="var(--icon-fontSize-md)" />
          Print
        </MenuItem>
      </Menu>

      {/* ─── Density Popover ─── */}
      <Popover
        anchorEl={densityAnchor}
        open={Boolean(densityAnchor)}
        onClose={() => setDensityAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { width: 180 } } }}
      >
        <Stack sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Density</Typography>
          <RadioGroup value={density} onChange={(e) => { setDensity(e.target.value); setDensityAnchor(null) }}>
            <FormControlLabel value="compact" control={<Radio size="small" />} label={<Typography variant="body2">Compact</Typography>} />
            <FormControlLabel value="standard" control={<Radio size="small" />} label={<Typography variant="body2">Standard</Typography>} />
            <FormControlLabel value="comfortable" control={<Radio size="small" />} label={<Typography variant="body2">Comfortable</Typography>} />
          </RadioGroup>
        </Stack>
      </Popover>

      {/* ─── Quick View Drawer ─── */}
      {quickViewConfig && (
        <QuickViewDrawer
          row={quickViewRow}
          tab={quickViewTab}
          onTabChange={setQuickViewTab}
          onClose={() => setQuickViewRow(null)}
          config={quickViewConfig}
          entityLabel={entityLabel}
        />
      )}
    </React.Fragment>
  )
}

function resolveValue(obj, path) {
  return path.split('.').reduce((acc, part) => acc?.[part], obj)
}

function formatQuickViewValue(value, type) {
  if (value == null || value === '') return '\u2014'
  if (type === 'date') return dayjs(value).format('MMM D, YYYY')
  if (type === 'currency') return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
  if (type === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}

function QuickViewDrawer({ row, tab, onTabChange, onClose, config, entityLabel }) {
  const open = Boolean(row)
  const title = row ? resolveValue(row, config.titleField) : ''
  const subtitle = row && config.subtitleField ? resolveValue(row, config.subtitleField) : null
  const chipColor = subtitle && config.subtitleColorMap ? (config.subtitleColorMap[subtitle] || 'default') : 'default'

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      hideBackdrop
      disableScrollLock
      slotProps={{ paper: { sx: { width: { xs: '100%', sm: 460 }, boxShadow: 8 } } }}
    >
      {row && (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header */}
          <Box sx={{ px: 3, pt: 3, pb: 0 }}>
            <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <Box sx={{ flex: 1, minWidth: 0, pr: 2 }}>
                <Typography variant="h6" noWrap>{title || entityLabel}</Typography>
                {subtitle && (
                  <Chip label={subtitle} size="small" color={chipColor} variant="soft" sx={{ mt: 0.5 }} />
                )}
              </Box>
              <IconButton onClick={onClose} size="small" sx={{ mt: -0.5 }}>
                <XIcon fontSize="var(--icon-fontSize-md)" />
              </IconButton>
            </Stack>
          </Box>

          {/* Tabs */}
          <Box sx={{ px: 3 }}>
            <Tabs
              value={tab}
              onChange={(_, v) => onTabChange(v)}
              sx={{ minHeight: 40, mt: 1 }}
            >
              <Tab label="Overview" value="overview" sx={{ minHeight: 40, textTransform: 'none' }} />
              <Tab label="Documents" value="documents" sx={{ minHeight: 40, textTransform: 'none' }} />
              <Tab label="Activity" value="activity" sx={{ minHeight: 40, textTransform: 'none' }} />
              <Tab label="Notes" value="notes" sx={{ minHeight: 40, textTransform: 'none' }} />
            </Tabs>
          </Box>

          <Divider />

          {/* Tab Content */}
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {tab === 'overview' && (
              <QuickViewOverview row={row} config={config} />
            )}
            {tab === 'documents' && (
              config.documentsConfig ? (
                <QuickViewDocuments row={row} documentsConfig={config.documentsConfig} />
              ) : (
                <QuickViewPlaceholder
                  icon={<FileTextIcon size={40} />}
                  title="Documents"
                  description="No documents attached to this record."
                />
              )
            )}
            {tab === 'activity' && (
              config.activityConfig ? (
                <QuickViewActivity row={row} activityConfig={config.activityConfig} />
              ) : (
                <QuickViewPlaceholder
                  icon={<ClockCounterClockwiseIcon size={40} />}
                  title="Activity"
                  description="No activity recorded for this record."
                />
              )
            )}
            {tab === 'notes' && (
              config.notesConfig ? (
                <QuickViewNotes row={row} notesConfig={config.notesConfig} />
              ) : (
                <QuickViewPlaceholder
                  icon={<NoteIcon size={40} />}
                  title="Notes"
                  description="No notes added to this record."
                />
              )
            )}
          </Box>

          {/* Footer */}
          <Divider />
          <Box sx={{ px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              {config.onDelete && (
                <Button
                  color="error"
                  size="small"
                  startIcon={<TrashIcon />}
                  onClick={() => config.onDelete(row)}
                >
                  Delete
                </Button>
              )}
            </Box>
            <Stack direction="row" spacing={1}>
              {config.detailsPath && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ArrowSquareOutIcon />}
                  href={config.detailsPath(row)}
                >
                  Open
                </Button>
              )}
              <Button size="small" variant="text" onClick={onClose}>
                Close
              </Button>
            </Stack>
          </Box>
        </Box>
      )}
    </Drawer>
  )
}

function QuickViewOverview({ row, config }) {
  return (
    <Box sx={{ px: 3, py: 2 }}>
      {/* AI-Assisted Data Entry hint */}
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2, fontStyle: 'italic' }}>
        Click any field below to edit it inline. Press Enter to save or Escape to cancel.
      </Typography>

      <Button
        variant="outlined"
        size="small"
        startIcon={<LightningIcon />}
        fullWidth
        sx={{ mb: 3, justifyContent: 'flex-start', textTransform: 'none', borderStyle: 'dashed' }}
      >
        AI-Assisted Data Entry
      </Button>

      {config.sections?.map((section) => (
        <Box key={section.title} sx={{ mb: 3 }}>
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ display: 'block', mb: 1.5, letterSpacing: '0.08em' }}
          >
            {section.title}
          </Typography>
          <Stack spacing={0} divider={<Divider />}>
            {section.fields.map((field) => {
              const rawValue = resolveValue(row, field.field)
              const displayValue = field.formatter
                ? field.formatter(rawValue, row)
                : formatQuickViewValue(rawValue, field.type)

              return (
                <Box
                  key={field.field}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 1.5,
                    px: 0.5,
                    borderRadius: 1,
                    cursor: 'default',
                    '&:hover': { bgcolor: 'var(--mui-palette-action-hover)' },
                    transition: 'background-color 0.15s',
                  }}
                >
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 130, flexShrink: 0 }}>
                    {field.label}
                  </Typography>
                  <Typography variant="body2" sx={{ textAlign: 'right', wordBreak: 'break-word' }}>
                    {displayValue}
                  </Typography>
                </Box>
              )
            })}
          </Stack>
        </Box>
      ))}
    </Box>
  )
}

function QuickViewPlaceholder({ icon, title, description }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        px: 3,
        color: 'text.disabled',
      }}
    >
      {icon}
      <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5, textAlign: 'center' }}>
        {description}
      </Typography>
    </Box>
  )
}

function QuickViewNotes({ row, notesConfig }) {
  const { getComments, createComment, user, instanceUrl } = notesConfig
  const [comments, setComments] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [text, setText] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const rowId = row?.Id

  React.useEffect(() => {
    if (!rowId || !getComments) return
    let cancelled = false
    setLoading(true)
    getComments(rowId).then((data) => {
      if (!cancelled) { setComments(data || []); setLoading(false) }
    }).catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [rowId, getComments])

  async function handleAdd() {
    if (!text.trim() || !createComment) return
    setSubmitting(true)
    try {
      await createComment(rowId, text.trim())
      setText('')
      const data = await getComments(rowId)
      setComments(data || [])
    } catch (err) {
      console.error('Failed to add note:', err)
    } finally {
      setSubmitting(false)
    }
  }

  function resolvePhoto(url) {
    if (!url) return undefined
    return url.startsWith('http') ? url : `${instanceUrl}${url}`
  }

  return (
    <Box sx={{ px: 3, py: 2 }}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
          <Avatar src={user?.avatar || undefined} sx={{ width: 32, height: 32, mt: 0.5 }}>
            {(user?.name || '?')[0]}
          </Avatar>
          <OutlinedInput
            multiline
            minRows={1}
            maxRows={4}
            placeholder="Write a note..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            size="small"
            sx={{ flex: 1 }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && text.trim()) { e.preventDefault(); handleAdd() } }}
          />
          {text.trim() && (
            <Button size="small" variant="contained" disabled={submitting} onClick={handleAdd} sx={{ mt: 0.5 }}>
              {submitting ? '...' : 'Add'}
            </Button>
          )}
        </Stack>

        {loading ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>Loading...</Typography>
        ) : comments.length === 0 ? (
          <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', py: 4 }}>No notes yet</Typography>
        ) : (
          <Stack spacing={2} divider={<Divider />}>
            {comments.map((c) => (
              <Stack key={c.Id} direction="row" spacing={1.5}>
                <Avatar
                  src={resolvePhoto(c.cux_Commented_By__r?.SmallPhotoUrl)}
                  sx={{ width: 32, height: 32, mt: 0.25 }}
                >
                  {(c.cux_Commented_By__r?.Name || '?')[0]}
                </Avatar>
                <Stack sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Typography variant="subtitle2" noWrap>{c.cux_Commented_By__r?.Name || 'Unknown'}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {c.cux_Comment_Timestamp__c ? dayjs(c.cux_Comment_Timestamp__c).format('MMM D, YYYY h:mm A') : ''}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', mt: 0.25 }}>
                    {c.cux_Comment_Text__c}
                  </Typography>
                </Stack>
              </Stack>
            ))}
          </Stack>
        )}
      </Stack>
    </Box>
  )
}

function QuickViewActivity({ row, activityConfig }) {
  const { getEvents, iconMap, colorMap, statusColorMap } = activityConfig
  const [events, setEvents] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const rowId = row?.Id

  React.useEffect(() => {
    if (!rowId || !getEvents) return
    let cancelled = false
    setLoading(true)
    getEvents(rowId).then((data) => {
      if (!cancelled) { setEvents(data || []); setLoading(false) }
    }).catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [rowId, getEvents])

  if (loading) {
    return <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>Loading...</Typography>
  }

  if (!events.length) {
    return (
      <QuickViewPlaceholder
        icon={<ClockCounterClockwiseIcon size={40} />}
        title="Activity"
        description="No activity recorded for this record."
      />
    )
  }

  return (
    <Box sx={{ px: 3, py: 2 }}>
      <Stack spacing={0}>
        {events.map((evt, index) => {
          const Icon = iconMap?.[evt.cux_Event_Type__c] || ClockCounterClockwiseIcon
          const color = colorMap?.[evt.cux_Event_Type__c] || 'primary'
          const hasStatusChange = evt.cux_Previous_Status__c && evt.cux_New_Status__c

          return (
            <Stack key={evt.Id} direction="row" spacing={1.5} sx={{ position: 'relative' }}>
              {/* Connector line */}
              {index !== events.length - 1 && (
                <Box sx={{
                  position: 'absolute',
                  left: 15,
                  top: 36,
                  bottom: 0,
                  width: 2,
                  bgcolor: 'var(--mui-palette-divider)',
                }} />
              )}
              {/* Icon */}
              <Avatar
                sx={{
                  bgcolor: `var(--mui-palette-${color}-main)`,
                  color: 'var(--mui-palette-common-white)',
                  height: 32,
                  width: 32,
                  flexShrink: 0,
                }}
              >
                <Icon fontSize="var(--Icon-fontSize)" />
              </Avatar>
              {/* Content */}
              <Stack sx={{ flex: 1, pb: 2.5 }}>
                <Typography variant="subtitle2" sx={{ fontSize: '0.8125rem' }}>{evt.cux_Event_Type__c}</Typography>
                {hasStatusChange && (
                  <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', mt: 0.25 }}>
                    <Chip label={evt.cux_Previous_Status__c} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                    <Typography color="text.secondary" variant="caption">{'\u2192'}</Typography>
                    <Chip
                      label={evt.cux_New_Status__c}
                      size="small"
                      color={statusColorMap?.[evt.cux_New_Status__c] || 'default'}
                      variant="soft"
                      sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                  </Stack>
                )}
                {evt.cux_Event_Detail__c && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, fontSize: '0.75rem' }}>
                    {evt.cux_Event_Detail__c}
                  </Typography>
                )}
                <Stack direction="row" spacing={1} sx={{ mt: 0.25 }}>
                  {evt.cux_Performed_By__r?.Name && (
                    <Typography color="text.secondary" variant="caption">by {evt.cux_Performed_By__r.Name}</Typography>
                  )}
                  <Typography color="text.secondary" variant="caption">
                    {evt.cux_Event_Timestamp__c ? dayjs(evt.cux_Event_Timestamp__c).format('MMM D, YYYY h:mm A') : '\u2014'}
                  </Typography>
                </Stack>
              </Stack>
            </Stack>
          )
        })}
      </Stack>
    </Box>
  )
}

function QuickViewDocuments({ row, documentsConfig }) {
  const { getDocuments, onDownload } = documentsConfig
  const [documents, setDocuments] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const rowId = row?.Id

  React.useEffect(() => {
    if (!rowId || !getDocuments) return
    let cancelled = false
    setLoading(true)
    getDocuments(rowId).then((data) => {
      if (!cancelled) { setDocuments(data || []); setLoading(false) }
    }).catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [rowId, getDocuments])

  if (loading) {
    return <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>Loading...</Typography>
  }

  if (!documents.length) {
    return (
      <QuickViewPlaceholder
        icon={<FileTextIcon size={40} />}
        title="Documents"
        description="No documents attached to this record."
      />
    )
  }

  return (
    <Box sx={{ px: 3, py: 2 }}>
      <Stack spacing={1.5}>
        {documents.map((doc) => (
          <Stack
            key={doc.Id}
            direction="row"
            spacing={1.5}
            sx={{
              p: 1.5,
              borderRadius: 1,
              border: '1px solid var(--mui-palette-divider)',
              alignItems: 'center',
            }}
          >
            <Avatar variant="rounded" sx={{ bgcolor: 'var(--mui-palette-primary-50)', color: 'var(--mui-palette-primary-main)', width: 36, height: 36 }}>
              <FileTextIcon fontSize="var(--Icon-fontSize)" />
            </Avatar>
            <Stack sx={{ flex: 1, minWidth: 0 }}>
              {doc.cux_Content_Version_Id__c && onDownload ? (
                <Typography
                  variant="subtitle2"
                  noWrap
                  sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' }, color: 'var(--mui-palette-primary-main)' }}
                  onClick={() => onDownload(doc.cux_Content_Version_Id__c, doc.cux_File_Name__c || 'download')}
                >
                  {doc.cux_File_Name__c || doc.Name}
                </Typography>
              ) : (
                <Typography variant="subtitle2" noWrap>{doc.cux_File_Name__c || doc.Name}</Typography>
              )}
              <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', mt: 0.25 }}>
                {doc.cux_Document_Type__c && (
                  <Chip label={doc.cux_Document_Type__c} size="small" variant="soft" sx={{ height: 20, fontSize: '0.7rem' }} />
                )}
                {doc.cux_Is_Official__c && (
                  <Chip label="Official" size="small" color="success" variant="soft" sx={{ height: 20, fontSize: '0.7rem' }} />
                )}
                {doc.cux_Is_Final__c && (
                  <Chip label="Final" size="small" color="info" variant="soft" sx={{ height: 20, fontSize: '0.7rem' }} />
                )}
              </Stack>
            </Stack>
            <Stack sx={{ alignItems: 'flex-end', flexShrink: 0 }}>
              {doc.cux_Version_Number__c && (
                <Typography variant="caption" color="text.secondary">v{doc.cux_Version_Number__c}</Typography>
              )}
              <Typography variant="caption" color="text.secondary">
                {doc.cux_Uploaded_At__c ? dayjs(doc.cux_Uploaded_At__c).format('MMM D, YYYY') : ''}
              </Typography>
            </Stack>
          </Stack>
        ))}
      </Stack>
    </Box>
  )
}
