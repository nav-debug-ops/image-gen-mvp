import { Heart, Trash2, Package } from 'lucide-react'

const IMAGE_TYPE_LABELS = {
  main: 'Main Image',
  lifestyle: 'Lifestyle',
  infographic: 'Infographic',
  detail: 'Detail Shot',
  comparison: 'Comparison'
}

function Gallery({ favorites, onRemove, onSelect }) {
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (favorites.length === 0) {
    return (
      <div className="gallery">
        <h2>Saved Listing Images</h2>
        <div className="gallery-empty">
          <Package size={48} />
          <p>No saved images yet. Generate Amazon listing images and save your favorites!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="gallery">
      <h2>Saved Listing Images ({favorites.length})</h2>
      <div className="gallery-grid">
        {favorites.map(item => (
          <div key={item.id} className="gallery-card">
            <img
              src={item.imageUrl}
              alt={item.prompt}
              className="gallery-image"
              onClick={() => onSelect(item)}
            />
            <div className="gallery-card-info">
              {item.imageType && (
                <span className="type-badge">{IMAGE_TYPE_LABELS[item.imageType] || item.imageType}</span>
              )}
              <p className="gallery-card-prompt">{item.prompt}</p>
              <div className="gallery-card-footer">
                <span className="gallery-card-time">
                  {item.productCategory && `${item.productCategory} • `}
                  {formatDate(item.timestamp)}
                </span>
                <button
                  className="remove-btn"
                  onClick={() => onRemove(item.id)}
                >
                  <Trash2 size={14} />
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Gallery
