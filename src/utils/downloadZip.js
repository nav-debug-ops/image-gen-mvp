import JSZip from 'jszip'

/**
 * Download multiple images as a single ZIP file.
 *
 * @param {Array<{url: string, typeName?: string, id: string|number}>} images
 * @param {string} zipName - base filename (without .zip)
 */
export async function downloadAsZip(images, zipName = 'images') {
  const zip = new JSZip()
  const folder = zip.folder(zipName)

  await Promise.all(
    images.map(async (img, index) => {
      try {
        const response = await fetch(img.url)
        const blob = await response.blob()
        const ext = blob.type === 'image/jpeg' ? 'jpg' : 'png'
        const baseName = img.typeName
          ? img.typeName.replace(/[^a-z0-9\s-]/gi, '').replace(/\s+/g, '-').toLowerCase().slice(0, 60)
          : `image-${index + 1}`
        const filename = `${String(index + 1).padStart(2, '0')}-${baseName}.${ext}`
        folder.file(filename, blob)
      } catch {
        // Skip images that fail to fetch
      }
    })
  )

  const content = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } })
  const url = URL.createObjectURL(content)
  const a = document.createElement('a')
  a.href = url
  a.download = `${zipName}.zip`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
