import { useState, useEffect } from 'react'
import { Play, Square, Clock, Calendar, Image, TrendingUp } from 'lucide-react'
import { formatDuration, calculateLiveDuration } from '../services/sessionTracker'

function SessionPanel({
  activeSession,
  onStartSession,
  onEndSession,
  sessionStats,
  isCalendarConnected,
  onConnectCalendar
}) {
  const [liveDuration, setLiveDuration] = useState(0)
  const [projectName, setProjectName] = useState('')

  // Update live duration every second when session is active
  useEffect(() => {
    if (!activeSession) {
      setLiveDuration(0)
      return
    }

    const interval = setInterval(() => {
      setLiveDuration(calculateLiveDuration(activeSession.startTime))
    }, 1000)

    return () => clearInterval(interval)
  }, [activeSession])

  const handleStart = () => {
    onStartSession(projectName || null)
    setProjectName('')
  }

  return (
    <div className="session-panel">
      <div className="session-header">
        <h2>Session Tracker</h2>
        {!isCalendarConnected && (
          <button className="calendar-connect-btn" onClick={onConnectCalendar}>
            <Calendar size={14} />
            Connect Calendar
          </button>
        )}
      </div>

      {activeSession ? (
        <div className="active-session">
          <div className="session-timer">
            <Clock size={20} className="timer-icon pulse" />
            <span className="timer-value">{formatDuration(liveDuration)}</span>
          </div>

          {activeSession.projectName && (
            <p className="session-project">{activeSession.projectName}</p>
          )}

          <div className="session-live-stats">
            <div className="live-stat">
              <Image size={14} />
              <span>{activeSession.generationCount} images</span>
            </div>
          </div>

          <button className="session-btn stop" onClick={onEndSession}>
            <Square size={16} />
            End Session
          </button>
        </div>
      ) : (
        <div className="start-session">
          <input
            type="text"
            className="project-input"
            placeholder="Project name (optional)"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleStart()}
          />
          <button className="session-btn start" onClick={handleStart}>
            <Play size={16} />
            Start Session
          </button>
        </div>
      )}

      {sessionStats && (
        <div className="session-stats">
          <h3>
            <TrendingUp size={14} />
            Last 30 Days
          </h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value">{sessionStats.sessionCount}</span>
              <span className="stat-label">Sessions</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{sessionStats.formattedTotalTime}</span>
              <span className="stat-label">Total Time</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{sessionStats.totalGenerations}</span>
              <span className="stat-label">Images</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{formatDuration(sessionStats.averageSessionTime)}</span>
              <span className="stat-label">Avg Session</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SessionPanel
