import axios from 'axios'

const docIntelEndpoint = import.meta.env.VITE_AZURE_DOC_INTELLIGENCE_ENDPOINT
const docIntelKey = import.meta.env.VITE_AZURE_DOC_INTELLIGENCE_KEY

const openaiEndpoint = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT
const openaiKey = import.meta.env.VITE_AZURE_OPENAI_API_KEY
const openaiDeployment = import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT || 'gpt-4o'
const openaiApiVersion = '2024-06-01'

const POLL_INTERVAL = 1500
const MAX_POLLS = 40
const MAX_TEXT_LENGTH = 100000

/**
 * Extract text from a document using Azure Document Intelligence (prebuilt-read).
 * Supports PDF, images, Word, and other common document formats.
 */
export async function extractDocumentText(file) {
  if (!docIntelEndpoint || !docIntelKey) {
    throw new Error(
      'Azure Document Intelligence is not configured. Set VITE_AZURE_DOC_INTELLIGENCE_ENDPOINT and VITE_AZURE_DOC_INTELLIGENCE_KEY.'
    )
  }

  const analyzeUrl = `${docIntelEndpoint}/documentintelligence/documentModels/prebuilt-read:analyze?api-version=2024-11-30`

  const postResponse = await fetch(analyzeUrl, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': docIntelKey,
      'Content-Type': file.type || 'application/octet-stream',
    },
    body: file,
  })

  if (!postResponse.ok) {
    const errorData = await postResponse.json().catch(() => ({}))
    throw new Error(
      errorData.error?.message ||
        `Document Intelligence request failed with status ${postResponse.status}`
    )
  }

  const operationLocation = postResponse.headers.get('Operation-Location')
  if (!operationLocation) {
    throw new Error('No Operation-Location header in response')
  }

  for (let i = 0; i < MAX_POLLS; i++) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL))

    const pollResponse = await fetch(operationLocation, {
      headers: { 'Ocp-Apim-Subscription-Key': docIntelKey },
    })

    if (!pollResponse.ok) {
      throw new Error(`Polling failed with status ${pollResponse.status}`)
    }

    const result = await pollResponse.json()

    if (result.status === 'succeeded') {
      return result.analyzeResult?.content || ''
    }

    if (result.status === 'failed') {
      throw new Error(result.error?.message || 'Document analysis failed')
    }
  }

  throw new Error('Document analysis timed out')
}

/**
 * Summarize extracted document text using Azure OpenAI GPT-4o.
 * Returns { shortSummary, longSummary, tags }.
 */
export async function summarizeDocument(text, documentType) {
  if (!openaiEndpoint || !openaiKey) {
    throw new Error(
      'Azure OpenAI is not configured. Set VITE_AZURE_OPENAI_ENDPOINT and VITE_AZURE_OPENAI_API_KEY.'
    )
  }

  const truncatedText =
    text.length > MAX_TEXT_LENGTH
      ? text.slice(0, MAX_TEXT_LENGTH) + '\n\n[Document truncated for analysis]'
      : text

  const systemPrompt = `You are a document analysis assistant for government contract management.
Analyze the provided document text and produce a structured summary.

The document type is: "${documentType}"

Return a valid JSON object with exactly these three fields:
{
  "shortSummary": "A concise one-line summary of the document (max 250 characters)",
  "longSummary": "A detailed multi-paragraph summary covering the key points, scope, obligations, and important details of the document",
  "tags": ["keyword1", "keyword2", "keyword3"]
}

Rules:
- shortSummary must not exceed 250 characters
- longSummary should be thorough but focused on the most important content
- tags should be 3-8 relevant keywords for search and categorization
- Return ONLY the JSON object, no markdown fencing or extra text`

  const url = `${openaiEndpoint}/openai/deployments/${openaiDeployment}/chat/completions?api-version=${openaiApiVersion}`

  const response = await axios.post(
    url,
    {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: truncatedText },
      ],
      max_tokens: 4000,
      temperature: 0.3,
    },
    {
      headers: {
        'api-key': openaiKey,
        'Content-Type': 'application/json',
      },
    }
  )

  const content = response.data.choices[0].message.content.trim()

  // Strip markdown code fences if present
  const jsonStr = content.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')

  const parsed = JSON.parse(jsonStr)

  return {
    shortSummary: (parsed.shortSummary || '').slice(0, 255),
    longSummary: parsed.longSummary || '',
    tags: Array.isArray(parsed.tags) ? parsed.tags.join(', ').slice(0, 255) : '',
  }
}
