import { useState, useRef, useCallback } from 'react'
import { Upload, X, Image, GripVertical, Sliders } from 'lucide-react'

const ACCEPTED_FORMATS = ['image/png', 'image/jpeg', 'image/webp']
const MAX_IMAGES = 4
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const REFERENCE_TAGS = [
  { id: 'style', label: 'Style Reference', color: '#8b5cf6' },
  { id: 'composition', label: 'Composition', color: '#3b82f6' },
  { id: 'color', label: 'Color Palette', color: '#10b981' },
  { id: 'subject', label: 'Subject Reference', color: '#f59e0b' }
]

function ReferenceImageUpload({
  referenceImages,
  setReferenceImages,
  disabled = false
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)
  const dragCounter = useRef(0)

  // Convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // Process uploaded files
  const processFiles = useCallback(async (files) => {
    setError(null)
    const validFiles = []

    for (const file of files) {
      // Check format
      if (!ACCEPTED_FORMATS.includes(file.type)) {
        setError(`Invalid format: ${file.name}. Use PNG, JPG, or WEBP.`)
        continue
      }

      // Check size
      if (file.size > MAX_FILE_SIZE) {
        setError(`File too large: ${file.name}. Max 10MB.`)
        continue
      }

      // Check max count
      if (referenceImages.length + validFiles.length >= MAX_IMAGES) {
        setError(`Maximum ${MAX_IMAGES} reference images allowed.`)
        break
      }

      validFiles.push(file)
    }

    // Convert valid files to base64 and add to state
    const newImages = await Promise.all(
      validFiles.map(async (file) => {
        const base64 = await fileToBase64(file)
        return {
          id: `ref-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          name: file.name,
          base64,
          preview: URL.createObjectURL(file),
          strength: 75,
          tag: 'style',
          order: referenceImages.length + validFiles.indexOf(file)
        }
      })
    )

    setReferenceImages(prev => [...prev, ...newImages])
  }, [referenceImages, setReferenceImages])

  // Drag handlers
  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current++
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current--
    if (dragCounter.current === 0) {
      setIsDragging(false)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    dragCounter.current = 0

    if (disabled) return

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      processFiles(files)
    }
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0) {
      processFiles(files)
    }
    // Reset input
    e.target.value = ''
  }

  const handleRemoveImage = (id) => {
    setReferenceImages(prev => {
      const image = prev.find(img => img.id === id)
      if (image?.preview) {
        URL.revokeObjectURL(image.preview)
      }
      return prev.filter(img => img.id !== id)
    })
  }

  const handleStrengthChange = (id, strength) => {
    setReferenceImages(prev =>
      prev.map(img => img.id === id ? { ...img, strength } : img)
    )
  }

  const handleTagChange = (id, tag) => {
    setReferenceImages(prev =>
      prev.map(img => img.id === id ? { ...img, tag } : img)
    )
  }

  const handleReorder = (dragIndex, hoverIndex) => {
    setReferenceImages(prev => {
      const newImages = [...prev]
      const draggedImage = newImages[dragIndex]
      newImages.splice(dragIndex, 1)
      newImages.splice(hoverIndex, 0, draggedImage)
      return newImages.map((img, idx) => ({ ...img, order: idx }))
    })
  }

  const moveImage = (index, direction) => {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= referenceImages.length) return
    handleReorder(index, newIndex)
  }

  return (
    <div className="reference-upload-section">
      <div className="section-header">
        <h2>
          <Image size={14} />
          Reference Images
        </h2>
        <span className="image-count">{referenceImages.length}/{MAX_IMAGES}</span>
      </div>

      {/* Drop zone */}
      <div
        className={`drop-zone ${isDragging ? 'dragging' : ''} ${disabled ? 'disabled' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <Upload size={24} />
        <p>Drop images here or click to upload</p>
        <span className="drop-hint">PNG, JPG, WEBP up to 10MB</span>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_FORMATS.join(',')}
          multiple
          onChange={handleFileSelect}
          disabled={disabled}
          style={{ display: 'none' }}
        />
      </div>

      {error && <p className="upload-error">{error}</p>}

      {/* Reference image previews */}
      {referenceImages.length > 0 && (
        <div className="reference-images-list">
          {referenceImages.map((image, index) => (
            <ReferenceImageItem
              key={image.id}
              image={image}
              index={index}
              totalCount={referenceImages.length}
              onRemove={() => handleRemoveImage(image.id)}
              onStrengthChange={(strength) => handleStrengthChange(image.id, strength)}
              onTagChange={(tag) => handleTagChange(image.id, tag)}
              onMoveUp={() => moveImage(index, -1)}
              onMoveDown={() => moveImage(index, 1)}
              disabled={disabled}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ReferenceImageItem({
  image,
  index,
  totalCount,
  onRemove,
  onStrengthChange,
  onTagChange,
  onMoveUp,
  onMoveDown,
  disabled
}) {
  const [showControls, setShowControls] = useState(false)
  const currentTag = REFERENCE_TAGS.find(t => t.id === image.tag)

  return (
    <div
      className={`reference-image-item ${showControls ? 'expanded' : ''}`}
      style={{ '--tag-color': currentTag?.color || '#6b7280' }}
    >
      <div className="ref-image-main">
        <div className="ref-image-reorder">
          <button
            className="reorder-btn"
            onClick={onMoveUp}
            disabled={disabled || index === 0}
            title="Move up"
          >
            ▲
          </button>
          <span className="ref-order">{index + 1}</span>
          <button
            className="reorder-btn"
            onClick={onMoveDown}
            disabled={disabled || index === totalCount - 1}
            title="Move down"
          >
            ▼
          </button>
        </div>

        <div className="ref-image-preview">
          <img src={image.preview} alt={image.name} />
          <div
            className="ref-tag-indicator"
            style={{ backgroundColor: currentTag?.color }}
            title={currentTag?.label}
          />
        </div>

        <div className="ref-image-info">
          <span className="ref-image-name" title={image.name}>
            {image.name.length > 15 ? image.name.substring(0, 12) + '...' : image.name}
          </span>
          <span className="ref-image-strength">{image.strength}%</span>
        </div>

        <div className="ref-image-actions">
          <button
            className="ref-action-btn"
            onClick={() => setShowControls(!showControls)}
            disabled={disabled}
            title="Settings"
          >
            <Sliders size={14} />
          </button>
          <button
            className="ref-action-btn remove"
            onClick={onRemove}
            disabled={disabled}
            title="Remove"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {showControls && (
        <div className="ref-image-controls">
          <div className="control-group">
            <label>Influence Strength</label>
            <div className="strength-slider">
              <input
                type="range"
                min="0"
                max="100"
                value={image.strength}
                onChange={(e) => onStrengthChange(parseInt(e.target.value))}
                disabled={disabled}
              />
              <span className="strength-value">{image.strength}%</span>
            </div>
          </div>

          <div className="control-group">
            <label>Reference Type</label>
            <div className="tag-buttons">
              {REFERENCE_TAGS.map(tag => (
                <button
                  key={tag.id}
                  className={`tag-btn ${image.tag === tag.id ? 'active' : ''}`}
                  style={{
                    '--tag-color': tag.color,
                    backgroundColor: image.tag === tag.id ? tag.color : 'transparent'
                  }}
                  onClick={() => onTagChange(tag.id)}
                  disabled={disabled}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReferenceImageUpload
export { REFERENCE_TAGS }
