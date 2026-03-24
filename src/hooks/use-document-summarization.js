import * as React from 'react'
import { extractDocumentText, summarizeDocument } from '@/api/azure-doc-intelligence'

/**
 * Hook for async document summarization after upload.
 * Extracts text via Azure Document Intelligence, summarizes via GPT-4o,
 * then updates the Salesforce record with summaries.
 *
 * @param {object} client - Salesforce client from useSalesforceClient()
 * @param {function} onComplete - Called after successful summarization (to refresh list)
 */
export function useDocumentSummarization(client, onComplete) {
  const [status, setStatus] = React.useState('idle')
  const [error, setError] = React.useState(null)

  const startSummarization = React.useCallback(
    async (file, documentRecordId, documentType) => {
      if (!file || !documentRecordId) return
      if (documentType === 'Invoice') return

      setStatus('extracting')
      setError(null)

      try {
        const text = await extractDocumentText(file)

        if (!text || text.trim().length === 0) {
          setStatus('idle')
          return
        }

        setStatus('summarizing')
        const result = await summarizeDocument(text, documentType)

        const updateData = {}
        if (result.shortSummary) updateData.cux_Short_Summary__c = result.shortSummary
        if (result.longSummary) updateData.cux_Long_Summary__c = result.longSummary
        if (result.tags) updateData.cux_Tags__c = result.tags

        if (Object.keys(updateData).length > 0) {
          await client.updateDocument(documentRecordId, updateData)
        }

        setStatus('complete')
        if (onComplete) onComplete()
      } catch (err) {
        console.error('Document summarization failed:', err)
        setStatus('error')
        setError(err.message || 'Summarization failed')
      }
    },
    [client, onComplete]
  )

  const resetStatus = React.useCallback(() => {
    setStatus('idle')
    setError(null)
  }, [])

  return {
    startSummarization,
    summarizationStatus: status,
    summarizationError: error,
    resetStatus,
  }
}
