import * as React from 'react'

const MAX_RECENT = 3
const STORAGE_KEY = 'ik_recent_records'

function load() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function save(records) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch {
    // ignore
  }
}

const RecentRecordsContext = React.createContext(null)

export function RecentRecordsProvider({ children }) {
  const [records, setRecords] = React.useState(load)

  const addRecentRecord = React.useCallback(({ id, name, label, path }) => {
    setRecords((prev) => {
      const filtered = prev.filter((r) => r.id !== id)
      const next = [{ id, name, label, path }, ...filtered].slice(0, MAX_RECENT)
      save(next)
      return next
    })
  }, [])

  return (
    <RecentRecordsContext.Provider value={{ records, addRecentRecord }}>
      {children}
    </RecentRecordsContext.Provider>
  )
}

export function useRecentRecords() {
  const ctx = React.useContext(RecentRecordsContext)
  if (!ctx) throw new Error('useRecentRecords must be used within RecentRecordsProvider')
  return ctx
}
