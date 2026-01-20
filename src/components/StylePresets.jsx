import { useState } from 'react'
import { Bookmark, Plus, Trash2, Check, X, FolderOpen } from 'lucide-react'

function StylePresets({
  presets,
  currentImages,
  onSavePreset,
  onLoadPreset,
  onDeletePreset,
  disabled = false
}) {
  const [isCreating, setIsCreating] = useState(false)
  const [newPresetName, setNewPresetName] = useState('')
  const [selectedPresetId, setSelectedPresetId] = useState(null)

  const handleSave = () => {
    if (!newPresetName.trim() || currentImages.length === 0) return

    onSavePreset({
      id: `preset-${Date.now()}`,
      name: newPresetName.trim(),
      images: currentImages.map(img => ({
        name: img.name,
        base64: img.base64,
        strength: img.strength,
        tag: img.tag,
        order: img.order
      })),
      createdAt: new Date().toISOString()
    })

    setNewPresetName('')
    setIsCreating(false)
  }

  const handleLoad = (preset) => {
    setSelectedPresetId(preset.id)
    onLoadPreset(preset)
  }

  const handleDelete = (e, presetId) => {
    e.stopPropagation()
    if (confirm('Delete this style preset?')) {
      onDeletePreset(presetId)
      if (selectedPresetId === presetId) {
        setSelectedPresetId(null)
      }
    }
  }

  return (
    <div className="style-presets-section">
      <div className="section-header">
        <h2>
          <Bookmark size={14} />
          Style Presets
        </h2>
        {!isCreating && currentImages.length > 0 && (
          <button
            className="save-preset-btn"
            onClick={() => setIsCreating(true)}
            disabled={disabled}
            title="Save current references as preset"
          >
            <Plus size={14} />
            Save
          </button>
        )}
      </div>

      {/* Create new preset form */}
      {isCreating && (
        <div className="create-preset-form">
          <input
            type="text"
            className="preset-name-input"
            placeholder="Preset name..."
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            autoFocus
          />
          <div className="preset-form-actions">
            <button
              className="preset-action save"
              onClick={handleSave}
              disabled={!newPresetName.trim()}
            >
              <Check size={14} />
            </button>
            <button
              className="preset-action cancel"
              onClick={() => {
                setIsCreating(false)
                setNewPresetName('')
              }}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Presets list */}
      {presets.length > 0 ? (
        <div className="presets-list">
          {presets.map(preset => (
            <div
              key={preset.id}
              className={`preset-item ${selectedPresetId === preset.id ? 'active' : ''}`}
              onClick={() => !disabled && handleLoad(preset)}
            >
              <div className="preset-thumbnails">
                {preset.images.slice(0, 3).map((img, idx) => (
                  <div
                    key={idx}
                    className="preset-thumb"
                    style={{
                      backgroundImage: `url(${img.base64})`,
                      zIndex: 3 - idx
                    }}
                  />
                ))}
                {preset.images.length > 3 && (
                  <span className="preset-more">+{preset.images.length - 3}</span>
                )}
              </div>

              <div className="preset-info">
                <span className="preset-name">{preset.name}</span>
                <span className="preset-count">{preset.images.length} images</span>
              </div>

              <button
                className="preset-delete-btn"
                onClick={(e) => handleDelete(e, preset.id)}
                disabled={disabled}
                title="Delete preset"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="presets-empty">
          <FolderOpen size={20} />
          <p>No saved presets</p>
          <span>Add reference images and save as preset</span>
        </div>
      )}
    </div>
  )
}

export default StylePresets
