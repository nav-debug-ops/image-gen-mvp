import { Heart, Download, Package, AlertCircle } from 'lucide-react'

const IMAGE_TYPE_LABELS = {
  main: 'Main Image',
  lifestyle: 'Lifestyle',
  infographic: 'Infographic',
  detail: 'Detail Shot',
  comparison: 'Comparison'
}

function ImageDisplay({ image, isLoading, loadingProgress, error, onSave, isFavorited }) {
  const handleDownload = async () => {
    if (!image?.imageUrl) return

    try {
      const response = await fetch(image.imageUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const typeLabel = image.imageType ? `-${image.imageType}` : ''
      a.download = `amazon-listing${typeLabel}-${image.id}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download failed:', err)
    }
  }

  return (
    <div className="image-display">
      <div className="image-container">
        {isLoading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p className="loading-text">
              {loadingProgress?.message || 'Generating listing image...'}
            </p>
            {loadingProgress && loadingProgress.progress > 0 && (
              <div className="progress-container">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${loadingProgress.progress}%` }}
                  />
                </div>
                <p className="progress-message">{loadingProgress.progress}% complete</p>
              </div>
            )}
          </div>
        ) : error ? (
          <div className="error-message">
            <AlertCircle size={48} />
            <p>{error}</p>
          </div>
        ) : image ? (
          <img
            src={image.imageUrl}
            alt={image.prompt}
            className="generated-image"
          />
        ) : (
          <div className="image-placeholder">
            <Package size={64} />
            <p>Describe your product and click Generate</p>
            <span className="placeholder-hint">Select image type, category, and add product details</span>
          </div>
        )}
      </div>

      {image && !isLoading && !error && (
        <>
          <div className="image-actions">
            <button
              className={`action-btn ${isFavorited ? 'favorited' : ''}`}
              onClick={onSave}
            >
              <Heart size={16} fill={isFavorited ? 'currentColor' : 'none'} />
              {isFavorited ? 'Saved' : 'Save to Gallery'}
            </button>
            <button className="action-btn" onClick={handleDownload}>
              <Download size={16} />
              Download
            </button>
          </div>
          <div className="image-info">
            {image.imageType && (
              <span className="type-badge">{IMAGE_TYPE_LABELS[image.imageType]}</span>
            )}
            {image.productCategory && (
              <span className="category-badge">{image.productCategory}</span>
            )}
            {image.provider && image.provider !== 'demo' && (
              <span className="provider-badge">{image.provider}</span>
            )}
          </div>
          <p className="image-prompt">"{image.prompt}"</p>
        </>
      )}
    </div>
  )
}

export default ImageDisplay
