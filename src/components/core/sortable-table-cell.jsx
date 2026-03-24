import * as React from 'react'
import TableCell from '@mui/material/TableCell'
import TableSortLabel from '@mui/material/TableSortLabel'

/**
 * Drop-in replacement for TableCell in table headers that adds sort controls.
 *
 * @param {Object} props
 * @param {string} props.sortKey — the data field key this column sorts by
 * @param {string} props.activeSortKey — currently active sort key
 * @param {'asc'|'desc'} props.sortDirection — current direction
 * @param {Function} props.onSort — called with sortKey when clicked
 * @param {React.ReactNode} props.children — column label
 * @param {string} [props.align] — cell alignment
 */
export function SortableTableCell({ sortKey, activeSortKey, sortDirection, onSort, children, align, ...rest }) {
  const active = activeSortKey === sortKey

  return (
    <TableCell align={align} sortDirection={active ? sortDirection : false} {...rest}>
      <TableSortLabel
        active={active}
        direction={active ? sortDirection : 'asc'}
        onClick={() => onSort(sortKey)}
      >
        {children}
      </TableSortLabel>
    </TableCell>
  )
}
