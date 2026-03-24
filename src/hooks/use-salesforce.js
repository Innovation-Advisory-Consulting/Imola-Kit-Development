import * as React from 'react'

import { useAuth } from '@/auth/AuthContext'
import { createSalesforceClient } from '@/api/salesforce'

export function useSalesforceClient() {
  const { auth } = useAuth()

  const client = React.useMemo(() => {
    if (!auth?.accessToken || !auth?.instanceUrl) return null
    return createSalesforceClient(auth.instanceUrl, auth.accessToken)
  }, [auth?.accessToken, auth?.instanceUrl])

  return client
}

export function useSalesforceQuery(queryFn, deps = []) {
  const client = useSalesforceClient()
  const [data, setData] = React.useState(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(null)

  // Keep queryFn in a ref so the latest closure is always called
  const queryFnRef = React.useRef(queryFn)
  queryFnRef.current = queryFn

  const refetch = React.useCallback(() => {
    if (!client) return
    setLoading(true)
    setError(null)
    queryFnRef.current(client)
      .then((result) => {
        setData(result)
        setLoading(false)
      })
      .catch((err) => {
        setError(err)
        setLoading(false)
      })
  }, [client, ...deps])

  React.useEffect(() => {
    if (!client) {
      setLoading(false)
      return
    }
    refetch()
  }, [refetch])

  return { data, loading, error, refetch }
}
