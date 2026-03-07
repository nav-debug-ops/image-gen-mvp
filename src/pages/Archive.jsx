import { useState, useEffect, useCallback } from 'react'
import {
  Archive as ArchiveIcon,
  Download,
  Trash2,
  BookmarkCheck,
  Loader2,
  Image,
  X,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { fetchAPI } from '../api/client'

const PAGE_SIZE = 20

function Archive() {
  const [images, setImages] = useState([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lightboxImg, setLightboxImg] = useState(null)
  const [removing, setRemoving] = useState({})   // { [imageId]: true }
  const [deleting, setDeleting] = useState({})   // { [imageId]: true }

  const fetchArchive = useCallback(async (off = 0) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchAPI(`/api/images/?archived=true&limit=${PAGE_SIZE}&offset=${off}`)
      if (!res.ok) throw new Error('Failed to load archive')
      const data = await res.json()
      setImages(data.images)
      setTotal(data.total)
      setOffset(off)
    } catch (err) {
      setError(err.message || 'Could not load archive')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchArchive(0) }, [fetchArchive])

  const handleDownload = async (img) => {
    try {
      const response = await fetch(img.image_url)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `archive-${img.id}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch { /* silent */ }
  }

  const handleRemoveFromArchive = async (img) => {
    setRemoving(prev => ({ ...prev, [img.id]: true }))
    try {
      await fetchAPI(`/api/images/${img.id}/archive`, { method: 'PATCH' })
      setImages(prev => prev.filter(i => i.id !== img.id))
      setTotal(prev => prev - 1)
      if (lightboxImg?.id === img.id) setLightboxImg(null)
    } catch { /* silent */ }
    finally { setRemoving(prev => ({ ...prev, [img.id]: false })) }
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

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1

  return (
    <div className="archive-page">
      <header className="page-header">
        <div>
          <h1><ArchiveIcon size={24} style={{ display: 'inline', marginRight: 8 }} />Archive</h1>
          <p>Images you saved from Main and Secondary Image Generators</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => fetchArchive(offset)}>
          <RefreshCw size={15} /> Refresh
        </button>
      </header>

      {loading && (
        <div className="archive-loading">
          <Loader2 size={32} className="spin" />
          <span>Loading archive…</span>
        </div>
      )}

      {!loading && error && (
        <div className="archive-error">
          <p>{error}</p>
          <button className="btn btn-secondary btn-sm" onClick={() => fetchArchive(offset)}>Try Again</button>
        </div>
      )}

      {!loading && !error && images.length === 0 && (
        <div className="archive-empty">
          <Image size={52} />
          <p>No saved images yet</p>
          <span>Click "Save to Archive" on any generated image to store it here</span>
        </div>
      )}

      {!loading && !error && images.length > 0 && (
        <>
          <div className="archive-meta">
            {total} image{total !== 1 ? 's' : ''} saved
          </div>

          <div className="archive-grid">
            {images.map(img => (
              <div key={img.id} className="archive-card" onClick={() => setLightboxImg(img)}>
                <img src={img.image_url} alt={img.prompt?.slice(0, 60)} loading="lazy" />
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
                      title="Remove from archive"
                      disabled={removing[img.id]}
                      onClick={() => handleRemoveFromArchive(img)}
                    >
                      {removing[img.id] ? <Loader2 size={15} className="spin" /> : <BookmarkCheck size={15} />}
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
                onClick={() => fetchArchive(offset - PAGE_SIZE)}
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button
                className="btn btn-ghost btn-sm"
                disabled={currentPage === totalPages}
                onClick={() => fetchArchive(offset + PAGE_SIZE)}
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
            <div className="lightbox-info">
              <span className="lightbox-template">{lightboxImg.provider} · {lightboxImg.aspect_ratio}</span>
              <span className="lightbox-meta">{new Date(lightboxImg.created_at).toLocaleString()}</span>
            </div>
            <div className="lightbox-actions">
              <button className="lightbox-btn lightbox-btn-download" onClick={() => handleDownload(lightboxImg)}>
                <Download size={17} /> Download
              </button>
              <button
                className="lightbox-btn lightbox-btn-save"
                onClick={() => handleRemoveFromArchive(lightboxImg)}
                disabled={removing[lightboxImg.id]}
              >
                {removing[lightboxImg.id]
                  ? <><Loader2 size={17} className="spin" /> Removing…</>
                  : <><BookmarkCheck size={17} /> Remove from Archive</>}
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
