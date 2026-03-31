import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Archive as ArchiveIcon,
  Download,
  Trash2,
  BookmarkCheck,
  Bookmark,
  Loader2,
  Image,
  X,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
  PackageOpen,
  Search,
  ArrowUpDown,
} from 'lucide-react'
import { fetchAPI, safeJson } from '../api/client'
import { downloadAsZip } from '../utils/downloadZip'

const PAGE_SIZE = 24

function Archive() {
  const [tab, setTab] = useState('all')
  const [images, setImages] = useState([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lightboxImg, setLightboxImg] = useState(null)
  const [toggling, setToggling] = useState({})
  const [deleting, setDeleting] = useState({})
  const [selected, setSelected] = useState(new Set())
  const [zipLoading, setZipLoading] = useState(false)
  const [providerFilter, setProviderFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const searchDebounceRef = useRef(null)

  const fetchImages = useCallback(async (
    off = 0,
    currentTab = tab,
    provider = providerFilter,
    search = searchQuery,
    sort = sortBy,
  ) => {
    setLoading(true)
    setError(null)
    setSelected(new Set())
    try {
      const archived = currentTab === 'saved'
      let url = `/api/images/?archived=${archived}&limit=${PAGE_SIZE}&offset=${off}&sort_by=${sort}`
      if (provider) url += `&provider=${encodeURIComponent(provider)}`
      if (search.trim()) url += `&search=${encodeURIComponent(search.trim())}`
      const res = await fetchAPI(url)
      if (!res.ok) throw new Error('Failed to load images')
      const data = await safeJson(res)
      if (!data) throw new Error('Empty response from server')
      setImages(data.images)
      setTotal(data.total)
      setOffset(off)
    } catch (err) {
      setError(err.message || 'Could not load images')
    } finally {
      setLoading(false)
    }
  }, [tab, providerFilter, searchQuery, sortBy])

  useEffect(() => { fetchImages(0) }, [fetchImages])

  const handleTabChange = (newTab) => {
    setTab(newTab)
    fetchImages(0, newTab, providerFilter, searchQuery, sortBy)
  }

  const handleProviderChange = (p) => {
    setProviderFilter(p)
    fetchImages(0, tab, p, searchQuery, sortBy)
  }

  const handleSortChange = (s) => {
    setSortBy(s)
    fetchImages(0, tab, providerFilter, searchQuery, s)
  }

  const handleSearchChange = (e) => {
    const val = e.target.value
    setSearchQuery(val)
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    searchDebounceRef.current = setTimeout(() => {
      fetchImages(0, tab, providerFilter, val, sortBy)
    }, 400)
  }

  const handleSearchClear = () => {
    setSearchQuery('')
    fetchImages(0, tab, providerFilter, '', sortBy)
  }

  const handleDownload = async (img) => {
    try {
      const response = await fetch(img.image_url)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `image-${img.id}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch { /* silent */ }
  }

  const handleToggleArchive = async (img) => {
    setToggling(prev => ({ ...prev, [img.id]: true }))
    try {
      await fetchAPI(`/api/images/${img.id}/archive`, { method: 'PATCH' })
      // In 'saved' tab, remove from list after unarchiving. In 'all', update icon.
      if (tab === 'saved') {
        setImages(prev => prev.filter(i => i.id !== img.id))
        setTotal(prev => prev - 1)
        if (lightboxImg?.id === img.id) setLightboxImg(null)
      } else {
        setImages(prev => prev.map(i => i.id === img.id ? { ...i, is_archived: !i.is_archived } : i))
        if (lightboxImg?.id === img.id) setLightboxImg(prev => ({ ...prev, is_archived: !prev.is_archived }))
      }
    } catch { /* silent */ }
    finally { setToggling(prev => ({ ...prev, [img.id]: false })) }
  }

  const handleDelete = async (img) => {
    if (!window.confirm('Permanently delete this image? This cannot be undone.')) return
    setDeleting(prev => ({ ...prev, [img.id]: true }))
    try {
      await fetchAPI(`/api/images/${img.id}`, { method: 'DELETE' })
      setImages(prev => prev.filter(i => i.id !== img.id))
      setTotal(prev => prev - 1)
      if (lightboxImg?.id === img.id) setLightboxImg(null)
    } catch { /* silent */ }
    finally { setDeleting(prev => ({ ...prev, [img.id]: false })) }
  }

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === images.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(images.map(i => i.id)))
    }
  }

  const handleBulkDownload = async () => {
    const toDownload = images.filter(i => selected.has(i.id)).map(i => ({
      url: i.image_url,
      id: i.id,
      typeName: i.provider,
    }))
    if (!toDownload.length) return
    setZipLoading(true)
    try {
      await downloadAsZip(toDownload, 'gallery-export')
    } catch { /* silent */ }
    finally { setZipLoading(false) }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1
  const allSelected = images.length > 0 && selected.size === images.length

  // Derive available providers from current images for filter dropdown
  const providers = [...new Set(images.map(i => i.provider).filter(Boolean))]

  return (
    <div className="archive-page">
      <header className="page-header">
        <div>
          <h1>
            <PackageOpen size={24} style={{ display: 'inline', marginRight: 8 }} />
            Gallery
          </h1>
          <p>All generated images — save your favourites to the archive</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => fetchImages(offset)}>
          <RefreshCw size={15} /> Refresh
        </button>
      </header>

      {/* Tabs + filter bar */}
      <div className="gallery-toolbar">
        <div className="gallery-tabs">
          <button
            className={`gallery-tab ${tab === 'all' ? 'active' : ''}`}
            onClick={() => handleTabChange('all')}
          >
            All Generated
          </button>
          <button
            className={`gallery-tab ${tab === 'saved' ? 'active' : ''}`}
            onClick={() => handleTabChange('saved')}
          >
            <ArchiveIcon size={14} /> Saved
          </button>
        </div>

        <div className="gallery-filter-row">
          {/* Search */}
          <div className="gallery-search-wrap">
            <Search size={14} className="gallery-search-icon" />
            <input
              className="gallery-search-input"
              type="text"
              placeholder="Search prompts…"
              value={searchQuery}
              onChange={handleSearchChange}
            />
            {searchQuery && (
              <button className="gallery-search-clear" onClick={handleSearchClear}>
                <X size={13} />
              </button>
            )}
          </div>

          {/* Provider filter */}
          <select
            className="gallery-filter-select"
            value={providerFilter}
            onChange={e => handleProviderChange(e.target.value)}
          >
            <option value="">All providers</option>
            <option value="gemini">Gemini</option>
            <option value="replicate">Replicate</option>
            <option value="openai">OpenAI</option>
          </select>

          {/* Sort */}
          <div className="gallery-sort-wrap">
            <ArrowUpDown size={13} />
            <select
              className="gallery-filter-select"
              value={sortBy}
              onChange={e => handleSortChange(e.target.value)}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="provider">By provider</option>
            </select>
          </div>

          {selected.size > 0 && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleBulkDownload}
              disabled={zipLoading}
            >
              {zipLoading
                ? <><Loader2 size={14} className="spin" /> Zipping…</>
                : <><Download size={14} /> ZIP ({selected.size})</>}
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="archive-loading">
          <Loader2 size={32} className="spin" />
          <span>Loading…</span>
        </div>
      )}

      {!loading && error && (
        <div className="archive-error">
          <p>{error}</p>
          <button className="btn btn-secondary btn-sm" onClick={() => fetchImages(offset)}>Try Again</button>
        </div>
      )}

      {!loading && !error && images.length === 0 && (
        <div className="archive-empty">
          <Image size={52} />
          <p>{tab === 'saved' ? 'No saved images yet' : 'No generated images yet'}</p>
          <span>
            {tab === 'saved'
              ? 'Click the bookmark icon on any image to save it here'
              : 'Generate images from the Main or Secondary Image Generator'}
          </span>
        </div>
      )}

      {!loading && !error && images.length > 0 && (
        <>
          <div className="archive-meta">
            <label className="gallery-select-all" onClick={toggleSelectAll}>
              {allSelected ? <CheckSquare size={16} /> : <Square size={16} />}
              {allSelected ? 'Deselect all' : 'Select all'}
            </label>
            <span>{total} image{total !== 1 ? 's' : ''}</span>
          </div>

          <div className="archive-grid">
            {images.map(img => (
              <div
                key={img.id}
                className={`archive-card ${selected.has(img.id) ? 'selected' : ''}`}
                onClick={() => setLightboxImg(img)}
              >
                <img src={img.image_url} alt={img.prompt?.slice(0, 60)} loading="lazy" />

                {/* Select checkbox */}
                <div
                  className="archive-card-checkbox"
                  onClick={e => { e.stopPropagation(); toggleSelect(img.id) }}
                >
                  {selected.has(img.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                </div>

                <div className="archive-card-overlay">
                  <div className="archive-card-actions" onClick={e => e.stopPropagation()}>
                    <button
                      className="archive-action-btn"
                      title="Download"
                      onClick={() => handleDownload(img)}
                    >
                      <Download size={15} />
                    </button>
                    <button
                      className="archive-action-btn"
                      title={img.is_archived ? 'Remove from saved' : 'Save to archive'}
                      disabled={toggling[img.id]}
                      onClick={() => handleToggleArchive(img)}
                    >
                      {toggling[img.id]
                        ? <Loader2 size={15} className="spin" />
                        : img.is_archived ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                    </button>
                    <button
                      className="archive-action-btn archive-action-delete"
                      title="Delete permanently"
                      disabled={deleting[img.id]}
                      onClick={() => handleDelete(img)}
                    >
                      {deleting[img.id] ? <Loader2 size={15} className="spin" /> : <Trash2 size={15} />}
                    </button>
                  </div>
                </div>

                <div className="archive-card-info">
                  <span className="archive-card-provider">{img.provider}</span>
                  <span className="archive-card-date">{new Date(img.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="archive-pagination">
              <button
                className="btn btn-ghost btn-sm"
                disabled={currentPage === 1}
                onClick={() => fetchImages(offset - PAGE_SIZE)}
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button
                className="btn btn-ghost btn-sm"
                disabled={currentPage === totalPages}
                onClick={() => fetchImages(offset + PAGE_SIZE)}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Lightbox */}
      {lightboxImg && (
        <div className="lightbox-overlay" onClick={() => setLightboxImg(null)}>
          <div className="lightbox-modal" onClick={e => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setLightboxImg(null)}>
              <X size={20} />
            </button>
            <div className="lightbox-image-wrap">
              <img src={lightboxImg.image_url} alt={lightboxImg.prompt?.slice(0, 80)} />
            </div>
            {lightboxImg.prompt && (
              <div className="lightbox-prompt">{lightboxImg.prompt}</div>
            )}
            <div className="lightbox-info">
              <span className="lightbox-template">{lightboxImg.provider} · {lightboxImg.model}</span>
              <span className="lightbox-meta">{new Date(lightboxImg.created_at).toLocaleString()}</span>
            </div>
            <div className="lightbox-actions">
              <button className="lightbox-btn lightbox-btn-download" onClick={() => handleDownload(lightboxImg)}>
                <Download size={17} /> Download
              </button>
              <button
                className="lightbox-btn lightbox-btn-save"
                onClick={() => handleToggleArchive(lightboxImg)}
                disabled={toggling[lightboxImg.id]}
              >
                {toggling[lightboxImg.id]
                  ? <><Loader2 size={17} className="spin" /> Saving…</>
                  : lightboxImg.is_archived
                    ? <><BookmarkCheck size={17} /> Saved</>
                    : <><Bookmark size={17} /> Save</>}
              </button>
              <button
                className="lightbox-btn"
                style={{ background: '#c0392b', color: '#fff' }}
                onClick={() => handleDelete(lightboxImg)}
                disabled={deleting[lightboxImg.id]}
              >
                {deleting[lightboxImg.id]
                  ? <><Loader2 size={17} className="spin" /> Deleting…</>
                  : <><Trash2 size={17} /> Delete</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Archive
