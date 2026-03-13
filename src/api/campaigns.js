import { fetchAPI, safeJson } from './client'

export async function analyzeCampaign({ asin, marketplace }) {
  const res = await fetchAPI('/api/campaigns/analyze', {
    method: 'POST',
    body: JSON.stringify({ asin, marketplace }),
  })

  if (!res.ok) {
    const err = await safeJson(res)
    throw new Error(typeof err?.detail === 'string' ? err.detail : `Campaign analysis failed (${res.status})`)
  }

  return safeJson(res)
}
