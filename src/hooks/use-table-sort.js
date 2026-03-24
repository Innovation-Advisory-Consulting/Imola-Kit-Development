import { useState, useMemo } from 'react'

/**
 * Reusable table sorting hook.
 *
 * @param {Array} data — array of row objects
 * @param {Object} [options]
 * @param {string} [options.defaultSortKey] — initial sort column key
 * @param {'asc'|'desc'} [options.defaultDirection] — initial direction (default 'asc')
 * @returns {{ sortedData, sortKey, sortDirection, onSort }}
 *
 * Column keys use dot notation for nested fields (e.g. 'cux_Account__r.Name').
 */
export function useTableSort(data, { defaultSortKey = null, defaultDirection = 'asc' } = {}) {
  const [sortKey, setSortKey] = useState(defaultSortKey)
  const [sortDirection, setSortDirection] = useState(defaultDirection)

  const onSort = (key) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  const sortedData = useMemo(() => {
    if (!data || !sortKey) return data || []

    return [...data].sort((a, b) => {
      const aVal = resolveValue(a, sortKey)
      const bVal = resolveValue(b, sortKey)

      if (aVal == null && bVal == null) return 0
      if (aVal == null) return 1
      if (bVal == null) return -1

      let cmp = 0
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        cmp = aVal - bVal
      } else {
        cmp = String(aVal).localeCompare(String(bVal), undefined, { sensitivity: 'base' })
      }

      return sortDirection === 'asc' ? cmp : -cmp
    })
  }, [data, sortKey, sortDirection])

  return { sortedData, sortKey, sortDirection, onSort }
}

function resolveValue(obj, path) {
  return path.split('.').reduce((acc, part) => acc?.[part], obj)
}
