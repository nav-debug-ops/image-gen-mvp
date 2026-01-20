import { Clock } from 'lucide-react'

const IMAGE_TYPE_LABELS = {
  main: 'Main',
  lifestyle: 'Lifestyle',
  infographic: 'Infographic',
  detail: 'Detail',
  comparison: 'Comparison'
}

function History({ history, onSelect, onClear, currentId }) {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date

    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="history-section">
      <div className="history-header">
        <h2>History</h2>
        {history.length > 0 && (
          <button className="clear-btn" onClick={onClear}>
            Clear
          </button>
        )}
      </div>

      <div className="history-list">
        {history.length === 0 ? (
          <div className="history-empty">
            <Clock size={24} />
            <p>No generations yet</p>
          </div>
        ) : (
          history.map(item => (
            <div
              key={item.id}
              className={`history-item ${currentId === item.id ? 'active' : ''}`}
              onClick={() => onSelect(item)}
            >
              <img
                src={item.imageUrl}
                alt=""
                className="history-thumb"
              />
              <div className="history-info">
                <p className="history-prompt">{item.prompt}</p>
                <div className="history-meta">
                  {item.imageType && (
                    <span className="type-badge">{IMAGE_TYPE_LABELS[item.imageType] || item.imageType}</span>
                  )}
                  <span className="history-time">{formatTime(item.timestamp)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default History
