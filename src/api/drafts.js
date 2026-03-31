import { fetchAPI, safeJson } from './client'

export async function saveDraft({ toolType, name, data, draftId = null }) {
  const res = await fetchAPI('/api/drafts/', {
    method: 'POST',
    body: JSON.stringify({ tool_type: toolType, name, data, draft_id: draftId }),
  })
  if (!res.ok) {
    const err = await safeJson(res)
    throw new Error(err?.detail || `Save failed (${res.status})`)
  }
  return safeJson(res)
}

export async function listDrafts(toolType) {
  const url = toolType ? `/api/drafts/?tool_type=${encodeURIComponent(toolType)}` : '/api/drafts/'
  const res = await fetchAPI(url)
  if (!res.ok) throw new Error(`Failed to load drafts (${res.status})`)
  return safeJson(res)
}

export async function deleteDraft(draftId) {
  const res = await fetchAPI(`/api/drafts/${draftId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Delete failed (${res.status})`)
  return safeJson(res)
}
