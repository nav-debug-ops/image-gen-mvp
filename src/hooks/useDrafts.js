import { useState, useCallback } from 'react'
import { saveDraft, listDrafts, deleteDraft } from '../api/drafts'

/**
 * Reusable hook for cloud draft save/load in content tools.
 *
 * Usage:
 *   const { drafts, saving, saved, panelOpen, save, loadDrafts, remove, togglePanel } = useDrafts('listing_copywriter')
 */
export function useDrafts(toolType) {
  const [drafts, setDrafts] = useState([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)   // flash state
  const [panelOpen, setPanelOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const save = useCallback(async ({ name, data, draftId = null }) => {
    setSaving(true)
    setError(null)
    try {
      const draft = await saveDraft({ toolType, name, data, draftId })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      return draft
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setSaving(false)
    }
  }, [toolType])

  const loadDrafts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await listDrafts(toolType)
      setDrafts(list)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [toolType])

  const remove = useCallback(async (draftId) => {
    try {
      await deleteDraft(draftId)
      setDrafts(prev => prev.filter(d => d.id !== draftId))
    } catch (err) {
      setError(err.message)
    }
  }, [])

  const togglePanel = useCallback(() => {
    setPanelOpen(prev => {
      if (!prev) loadDrafts()
      return !prev
    })
  }, [loadDrafts])

  return { drafts, saving, saved, panelOpen, loading, error, save, loadDrafts, remove, togglePanel }
}
