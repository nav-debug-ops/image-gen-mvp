import { fetchAPI, safeJson } from './client'

export async function analyzeCampaign({ asin = '', marketplace, keyword = '', processingMode = 'fast' }) {
  const res = await fetchAPI('/api/campaigns/analyze', {
    method: 'POST',
    body: JSON.stringify({ asin, marketplace, keyword, processing_mode: processingMode }),
  })

  if (!res.ok) {
    const err = await safeJson(res)
    throw new Error(typeof err?.detail === 'string' ? err.detail : `Campaign analysis failed (${res.status})`)
  }

  return safeJson(res)
}

export async function generateInfographicBrief({ asin, marketplace = 'US' }) {
  const res = await fetchAPI('/api/campaigns/infographic-brief', {
    method: 'POST',
    body: JSON.stringify({ asin, marketplace }),
  })

  if (!res.ok) {
    const err = await safeJson(res)
    throw new Error(typeof err?.detail === 'string' ? err.detail : `Infographic brief failed (${res.status})`)
  }

  return safeJson(res)
}

export async function chatWithCampaign({ message, contextSummary = '', marketplace = 'US' }) {
  const res = await fetchAPI('/api/campaigns/chat', {
    method: 'POST',
    body: JSON.stringify({ message, context_summary: contextSummary, marketplace }),
  })

  if (!res.ok) {
    const err = await safeJson(res)
    throw new Error(typeof err?.detail === 'string' ? err.detail : `Chat failed (${res.status})`)
  }

  const data = await safeJson(res)
  return data?.reply || ''
}
