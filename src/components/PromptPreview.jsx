import { useState } from 'react'
import { Eye, EyeOff, Copy, Check } from 'lucide-react'
import { REFERENCE_TAGS } from './ReferenceImageUpload'

function PromptPreview({
  textPrompt,
  referenceImages,
  imageType,
  productCategory
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  // Build the final prompt structure
  const buildPromptStructure = () => {
    const parts = []

    // Base prompt info
    parts.push({
      type: 'header',
      label: 'Text Prompt',
      content: textPrompt || '(No text prompt)'
    })

    // Image type context
    if (imageType) {
      const typeLabels = {
        main: 'Main Product Image (white background, 85% fill)',
        lifestyle: 'Lifestyle Shot (product in use)',
        infographic: 'Infographic (features & benefits)',
        detail: 'Detail Shot (close-up)',
        comparison: 'Comparison Image'
      }
      parts.push({
        type: 'context',
        label: 'Image Type',
        content: typeLabels[imageType] || imageType
      })
    }

    // Category context
    if (productCategory) {
      parts.push({
        type: 'context',
        label: 'Category',
        content: productCategory
      })
    }

    // Reference images
    if (referenceImages.length > 0) {
      const sortedRefs = [...referenceImages].sort((a, b) => a.order - b.order)

      sortedRefs.forEach((ref, idx) => {
        const tag = REFERENCE_TAGS.find(t => t.id === ref.tag)
        parts.push({
          type: 'reference',
          label: `Reference ${idx + 1}`,
          content: `${tag?.label || ref.tag} @ ${ref.strength}% strength`,
          tag: ref.tag,
          tagColor: tag?.color,
          imageName: ref.name
        })
      })
    }

    return parts
  }

  const promptParts = buildPromptStructure()
  const hasReferences = referenceImages.length > 0

  // Generate copyable text version
  const getCopyablePrompt = () => {
    let text = `Text Prompt: ${textPrompt || '(none)'}\n`
    if (imageType) text += `Image Type: ${imageType}\n`
    if (productCategory) text += `Category: ${productCategory}\n`

    if (hasReferences) {
      text += '\nReference Images:\n'
      referenceImages.forEach((ref, idx) => {
        const tag = REFERENCE_TAGS.find(t => t.id === ref.tag)
        text += `  ${idx + 1}. ${ref.name} - ${tag?.label} @ ${ref.strength}%\n`
      })
    }

    return text
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(getCopyablePrompt())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!textPrompt && !hasReferences) {
    return null
  }

  return (
    <div className={`prompt-preview ${isExpanded ? 'expanded' : ''}`}>
      <div className="preview-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="preview-title">
          {isExpanded ? <EyeOff size={14} /> : <Eye size={14} />}
          <span>Prompt Structure Preview</span>
          {hasReferences && (
            <span className="ref-badge">{referenceImages.length} refs</span>
          )}
        </div>
        <button
          className="copy-prompt-btn"
          onClick={(e) => {
            e.stopPropagation()
            handleCopy()
          }}
          title="Copy prompt structure"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>

      {isExpanded && (
        <div className="preview-content">
          {promptParts.map((part, idx) => (
            <div key={idx} className={`preview-part ${part.type}`}>
              <span className="part-label">{part.label}</span>
              <span
                className="part-content"
                style={part.tagColor ? { borderLeftColor: part.tagColor } : {}}
              >
                {part.type === 'reference' && (
                  <span
                    className="part-tag"
                    style={{ backgroundColor: part.tagColor }}
                  >
                    {part.tag}
                  </span>
                )}
                {part.content}
                {part.imageName && (
                  <span className="part-filename">({part.imageName})</span>
                )}
              </span>
            </div>
          ))}

          <div className="preview-note">
            This structure will be sent to the image generation API.
            Reference images are encoded and sent alongside the text prompt.
          </div>
        </div>
      )}
    </div>
  )
}

export default PromptPreview
