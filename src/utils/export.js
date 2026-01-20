/**
 * Export Utilities
 * Generate CSV and PDF reports for sessions and time tracking
 */

import { formatDuration } from '../services/sessionTracker'

/**
 * Export sessions to CSV
 */
export function exportSessionsToCSV(sessions, filename = 'session-report.csv') {
  const headers = [
    'Session ID',
    'Project',
    'Start Time',
    'End Time',
    'Duration (minutes)',
    'Images Generated',
    'Main Images',
    'Lifestyle Images',
    'Infographic Images',
    'Detail Images',
    'Comparison Images',
    'Status',
    'Notes'
  ]

  const rows = sessions.map(session => [
    session.id,
    session.projectName || '',
    formatDateTime(session.startTime),
    session.endTime ? formatDateTime(session.endTime) : '',
    Math.round(session.duration / 60),
    session.generationCount,
    session.imageTypes?.main || 0,
    session.imageTypes?.lifestyle || 0,
    session.imageTypes?.infographic || 0,
    session.imageTypes?.detail || 0,
    session.imageTypes?.comparison || 0,
    session.status,
    (session.notes || '').replace(/"/g, '""')
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  downloadFile(csvContent, filename, 'text/csv')
}

/**
 * Export images to CSV
 */
export function exportImagesToCSV(images, filename = 'images-report.csv') {
  const headers = [
    'Image ID',
    'Prompt',
    'Image Type',
    'Product Category',
    'Timestamp',
    'Session ID',
    'Is Favorite',
    'Image URL'
  ]

  const rows = images.map(image => [
    image.id,
    (image.prompt || '').replace(/"/g, '""'),
    image.imageType || '',
    image.productCategory || '',
    formatDateTime(image.timestamp),
    image.sessionId || '',
    image.isFavorite ? 'Yes' : 'No',
    image.imageUrl || ''
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  downloadFile(csvContent, filename, 'text/csv')
}

/**
 * Generate and export PDF report
 */
export async function exportToPDF(data, type = 'sessions') {
  // Create a printable HTML document
  const html = type === 'sessions'
    ? generateSessionsReport(data)
    : generateImagesReport(data)

  // Open in new window for printing
  const printWindow = window.open('', '_blank')
  printWindow.document.write(html)
  printWindow.document.close()

  // Wait for content to load, then print
  printWindow.onload = () => {
    printWindow.print()
  }
}

function generateSessionsReport(data) {
  const { sessions, stats } = data

  return `
<!DOCTYPE html>
<html>
<head>
  <title>Amazon Listing Generator - Session Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; color: #333; }
    h1 { font-size: 24px; margin-bottom: 8px; }
    .subtitle { color: #666; margin-bottom: 24px; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
    .stat-card { background: #f5f5f5; padding: 16px; border-radius: 8px; }
    .stat-value { font-size: 28px; font-weight: bold; color: #ff9900; }
    .stat-label { font-size: 12px; color: #666; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; margin-top: 24px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e0e0e0; }
    th { background: #f5f5f5; font-weight: 600; font-size: 12px; text-transform: uppercase; }
    td { font-size: 14px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; }
    .badge-completed { background: #e8f5e9; color: #2e7d32; }
    .badge-active { background: #fff3e0; color: #f57c00; }
    @media print {
      body { padding: 20px; }
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
    }
  </style>
</head>
<body>
  <h1>Session Report</h1>
  <p class="subtitle">Amazon Listing Image Generator - Generated ${formatDateTime(new Date().toISOString())}</p>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-value">${stats.sessionCount}</div>
      <div class="stat-label">Total Sessions</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.formattedTotalTime}</div>
      <div class="stat-label">Total Time</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.totalGenerations}</div>
      <div class="stat-label">Images Generated</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${formatDuration(stats.averageSessionTime)}</div>
      <div class="stat-label">Avg Session Time</div>
    </div>
  </div>

  <h2>Sessions</h2>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Project</th>
        <th>Duration</th>
        <th>Images</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${sessions.map(session => `
        <tr>
          <td>${formatDateTime(session.startTime)}</td>
          <td>${session.projectName || '-'}</td>
          <td>${formatDuration(session.duration)}</td>
          <td>${session.generationCount}</td>
          <td><span class="badge badge-${session.status}">${session.status}</span></td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>
  `
}

function generateImagesReport(data) {
  const { images, stats } = data

  const typeCount = {}
  images.forEach(img => {
    const type = img.imageType || 'unknown'
    typeCount[type] = (typeCount[type] || 0) + 1
  })

  return `
<!DOCTYPE html>
<html>
<head>
  <title>Amazon Listing Generator - Images Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; color: #333; }
    h1 { font-size: 24px; margin-bottom: 8px; }
    .subtitle { color: #666; margin-bottom: 24px; }
    .stats-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 32px; }
    .stat-card { background: #f5f5f5; padding: 12px; border-radius: 8px; text-align: center; }
    .stat-value { font-size: 24px; font-weight: bold; color: #ff9900; }
    .stat-label { font-size: 11px; color: #666; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; margin-top: 24px; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e0e0e0; }
    th { background: #f5f5f5; font-weight: 600; font-size: 11px; text-transform: uppercase; }
    td { font-size: 13px; }
    .prompt { max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; background: #e3f2fd; color: #1565c0; }
    @media print {
      body { padding: 20px; }
      .stats-grid { grid-template-columns: repeat(3, 1fr); }
    }
  </style>
</head>
<body>
  <h1>Images Report</h1>
  <p class="subtitle">Amazon Listing Image Generator - Generated ${formatDateTime(new Date().toISOString())}</p>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-value">${images.length}</div>
      <div class="stat-label">Total Images</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${typeCount.main || 0}</div>
      <div class="stat-label">Main Images</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${typeCount.lifestyle || 0}</div>
      <div class="stat-label">Lifestyle</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${typeCount.infographic || 0}</div>
      <div class="stat-label">Infographic</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${images.filter(i => i.isFavorite).length}</div>
      <div class="stat-label">Favorites</div>
    </div>
  </div>

  <h2>Generated Images</h2>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Type</th>
        <th>Category</th>
        <th>Prompt</th>
        <th>Favorite</th>
      </tr>
    </thead>
    <tbody>
      ${images.map(image => `
        <tr>
          <td>${formatDateTime(image.timestamp)}</td>
          <td><span class="badge">${image.imageType || '-'}</span></td>
          <td>${image.productCategory || '-'}</td>
          <td class="prompt" title="${(image.prompt || '').replace(/"/g, '&quot;')}">${image.prompt || '-'}</td>
          <td>${image.isFavorite ? '★' : '-'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>
  `
}

function formatDateTime(isoString) {
  if (!isoString) return '-'
  const date = new Date(isoString)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Export summary statistics
 */
export function exportSummaryToJSON(data) {
  const json = JSON.stringify(data, null, 2)
  downloadFile(json, 'summary-export.json', 'application/json')
}
