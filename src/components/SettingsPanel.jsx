import { useState } from 'react'
import {
  Settings,
  Download,
  FileText,
  FileSpreadsheet,
  Trash2,
  Calendar,
  Key,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react'
import { getProviderInfo, validateCredentials } from '../api/imageGen'
import { exportSessionsToCSV, exportImagesToCSV, exportToPDF } from '../utils/export'
import { isCalendarConfigured } from '../services/calendar'

function SettingsPanel({
  sessions,
  images,
  sessionStats,
  onClearData,
  isCalendarConnected,
  onConnectCalendar,
  onDisconnectCalendar
}) {
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState(null)
  const [activeExport, setActiveExport] = useState(null)

  const providerInfo = getProviderInfo()

  const handleValidate = async () => {
    setIsValidating(true)
    setValidationResult(null)
    const result = await validateCredentials()
    setValidationResult(result)
    setIsValidating(false)
  }

  const handleExportSessionsCSV = () => {
    setActiveExport('sessions-csv')
    exportSessionsToCSV(sessions)
    setTimeout(() => setActiveExport(null), 1000)
  }

  const handleExportImagesCSV = () => {
    setActiveExport('images-csv')
    exportImagesToCSV(images)
    setTimeout(() => setActiveExport(null), 1000)
  }

  const handleExportSessionsPDF = async () => {
    setActiveExport('sessions-pdf')
    await exportToPDF({ sessions, stats: sessionStats }, 'sessions')
    setTimeout(() => setActiveExport(null), 1000)
  }

  const handleExportImagesPDF = async () => {
    setActiveExport('images-pdf')
    await exportToPDF({ images, stats: {} }, 'images')
    setTimeout(() => setActiveExport(null), 1000)
  }

  return (
    <div className="settings-panel">
      <div className="settings-section">
        <h3>
          <Key size={16} />
          API Configuration
        </h3>

        <div className="api-status">
          <div className="status-row">
            <span className="status-label">Provider:</span>
            <span className="status-value">{providerInfo.provider.toUpperCase()}</span>
          </div>
          <div className="status-row">
            <span className="status-label">API Key:</span>
            <span className={`status-value ${providerInfo.hasKey ? 'connected' : 'not-connected'}`}>
              {providerInfo.hasKey ? '••••••••' : 'Not configured'}
            </span>
          </div>
          {providerInfo.isDemo && (
            <p className="demo-notice">
              Running in demo mode. Configure your API key in .env to use real image generation.
            </p>
          )}

          <button
            className="validate-btn"
            onClick={handleValidate}
            disabled={isValidating || providerInfo.isDemo}
          >
            {isValidating ? (
              <><Loader2 size={14} className="spin" /> Validating...</>
            ) : (
              <><Key size={14} /> Test Connection</>
            )}
          </button>

          {validationResult && (
            <div className={`validation-result ${validationResult.valid ? 'valid' : 'invalid'}`}>
              {validationResult.valid ? <CheckCircle size={14} /> : <XCircle size={14} />}
              {validationResult.message}
            </div>
          )}
        </div>
      </div>

      <div className="settings-section">
        <h3>
          <Calendar size={16} />
          Calendar Integration
        </h3>

        <p className="section-desc">
          Connect to Google Calendar to automatically create focus time blocks when you start sessions.
          Works with Clockwise for smart scheduling.
        </p>

        {!isCalendarConfigured() ? (
          <p className="config-notice">
            Calendar integration requires Google API credentials. Add VITE_GOOGLE_CLIENT_ID and
            VITE_GOOGLE_API_KEY to your .env file.
          </p>
        ) : isCalendarConnected ? (
          <div className="calendar-connected">
            <CheckCircle size={14} />
            <span>Connected to Google Calendar</span>
            <button className="disconnect-btn" onClick={onDisconnectCalendar}>
              Disconnect
            </button>
          </div>
        ) : (
          <button className="connect-calendar-btn" onClick={onConnectCalendar}>
            <Calendar size={14} />
            Connect Google Calendar
          </button>
        )}
      </div>

      <div className="settings-section">
        <h3>
          <Download size={16} />
          Export Data
        </h3>

        <div className="export-grid">
          <div className="export-group">
            <h4>Sessions Report</h4>
            <div className="export-buttons">
              <button
                className={`export-btn ${activeExport === 'sessions-csv' ? 'exporting' : ''}`}
                onClick={handleExportSessionsCSV}
                disabled={sessions.length === 0}
              >
                <FileSpreadsheet size={14} />
                CSV
              </button>
              <button
                className={`export-btn ${activeExport === 'sessions-pdf' ? 'exporting' : ''}`}
                onClick={handleExportSessionsPDF}
                disabled={sessions.length === 0}
              >
                <FileText size={14} />
                PDF
              </button>
            </div>
            <span className="export-count">{sessions.length} sessions</span>
          </div>

          <div className="export-group">
            <h4>Images Report</h4>
            <div className="export-buttons">
              <button
                className={`export-btn ${activeExport === 'images-csv' ? 'exporting' : ''}`}
                onClick={handleExportImagesCSV}
                disabled={images.length === 0}
              >
                <FileSpreadsheet size={14} />
                CSV
              </button>
              <button
                className={`export-btn ${activeExport === 'images-pdf' ? 'exporting' : ''}`}
                onClick={handleExportImagesPDF}
                disabled={images.length === 0}
              >
                <FileText size={14} />
                PDF
              </button>
            </div>
            <span className="export-count">{images.length} images</span>
          </div>
        </div>
      </div>

      <div className="settings-section danger-zone">
        <h3>
          <Trash2 size={16} />
          Danger Zone
        </h3>

        <button className="clear-data-btn" onClick={onClearData}>
          <Trash2 size={14} />
          Clear All Data
        </button>
        <p className="danger-warning">
          This will permanently delete all sessions, images, and history.
        </p>
      </div>
    </div>
  )
}

export default SettingsPanel
