import { useState, useEffect } from 'react'
import {
  User,
  Lock,
  Zap,
  Loader2,
  CheckCircle,
  Eye,
  EyeOff,
  BarChart2,
  History,
  ChevronDown,
  HardDrive,
  Image,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth.jsx'
import { updateProfile, changePassword } from '../api/auth'
import { fetchAPI, safeJson } from '../api/client'

function AccountSettings() {
  const { user, login } = useAuth()

  // Profile form
  const [displayName, setDisplayName] = useState(user?.display_name || '')
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [profileError, setProfileError] = useState('')

  // Password form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  // Usage stats
  const [usage, setUsage] = useState(null)
  const [usageLoading, setUsageLoading] = useState(true)

  // Generation history
  const [history, setHistory] = useState([])
  const [historyTotal, setHistoryTotal] = useState(0)
  const [historyOffset, setHistoryOffset] = useState(0)
  const [historyLoading, setHistoryLoading] = useState(false)
  const HISTORY_PAGE = 20

  // Storage stats
  const [storageStats, setStorageStats] = useState(null)
  const [storageLoading, setStorageLoading] = useState(true)
  const [healthResult, setHealthResult] = useState(null)
  const [healthChecking, setHealthChecking] = useState(false)

  useEffect(() => {
    fetchAPI('/api/usage/summary')
      .then(res => safeJson(res))
      .then(data => { if (data) setUsage(data) })
      .catch(() => {})
      .finally(() => setUsageLoading(false))

    fetchAPI('/api/images/storage-stats')
      .then(res => safeJson(res))
      .then(data => { if (data) setStorageStats(data) })
      .catch(() => {})
      .finally(() => setStorageLoading(false))

    loadHistory(0)
  }, [])

  const runHealthCheck = async () => {
    setHealthChecking(true)
    setHealthResult(null)
    try {
      const res = await fetchAPI('/api/images/storage-health')
      const data = await safeJson(res)
      setHealthResult({ ok: res.ok && data?.ok, ...data })
    } catch {
      setHealthResult({ ok: false, error: 'Request failed' })
    } finally {
      setHealthChecking(false)
    }
  }

  const loadHistory = async (off = 0) => {
    setHistoryLoading(true)
    try {
      const res = await fetchAPI(`/api/usage/history?limit=${HISTORY_PAGE}&offset=${off}`)
      const data = await safeJson(res)
      if (data) {
        if (off === 0) setHistory(data.generations)
        else setHistory(prev => [...prev, ...data.generations])
        setHistoryTotal(data.total)
        setHistoryOffset(off)
      }
    } catch { /* silent */ }
    finally { setHistoryLoading(false) }
  }

  const handleProfileSave = async (e) => {
    e.preventDefault()
    setProfileError('')
    setProfileSuccess(false)
    setProfileLoading(true)
    try {
      await updateProfile(displayName.trim())
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
    } catch (err) {
      setProfileError(err.message)
    } finally {
      setProfileLoading(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess(false)

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }

    setPasswordLoading(true)
    try {
      await changePassword(currentPassword, newPassword)
      setPasswordSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordSuccess(false), 3000)
    } catch (err) {
      setPasswordError(err.message)
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="account-settings-page">
      <header className="page-header">
        <div>
          <h1>Account Settings</h1>
          <p>Manage your profile and security preferences</p>
        </div>
      </header>

      <div className="account-settings-grid">

        {/* Profile Section */}
        <section className="settings-card">
          <div className="settings-card-header">
            <User size={20} />
            <h2>Profile</h2>
          </div>

          <div className="settings-account-info">
            <span className="settings-label">Email</span>
            <span className="settings-value">{user?.email}</span>
          </div>

          <form onSubmit={handleProfileSave} className="settings-form">
            <div className="form-group">
              <label>Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Your name"
                maxLength={100}
                required
              />
            </div>

            {profileError && <div className="settings-error">{profileError}</div>}
            {profileSuccess && (
              <div className="settings-success">
                <CheckCircle size={15} /> Profile updated
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={profileLoading}>
              {profileLoading ? <><Loader2 size={16} className="spin" /> Saving…</> : 'Save Changes'}
            </button>
          </form>
        </section>

        {/* Password Section */}
        <section className="settings-card">
          <div className="settings-card-header">
            <Lock size={20} />
            <h2>Change Password</h2>
          </div>

          <form onSubmit={handlePasswordChange} className="settings-form">
            <div className="form-group">
              <label>Current Password</label>
              <div className="password-input-wrap">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                />
                <button type="button" className="password-toggle" onClick={() => setShowCurrent(v => !v)}>
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>New Password</label>
              <div className="password-input-wrap">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  required
                  minLength={8}
                />
                <button type="button" className="password-toggle" onClick={() => setShowNew(v => !v)}>
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <div className="password-input-wrap">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  required
                />
              </div>
            </div>

            {passwordError && <div className="settings-error">{passwordError}</div>}
            {passwordSuccess && (
              <div className="settings-success">
                <CheckCircle size={15} /> Password changed successfully
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={passwordLoading}>
              {passwordLoading ? <><Loader2 size={16} className="spin" /> Updating…</> : 'Update Password'}
            </button>
          </form>
        </section>

        {/* Usage Stats Section */}
        <section className="settings-card settings-card-full">
          <div className="settings-card-header">
            <BarChart2 size={20} />
            <h2>Usage</h2>
          </div>

          {usageLoading ? (
            <div className="settings-loading"><Loader2 size={20} className="spin" /></div>
          ) : usage ? (
            <div className="usage-stats-grid">
              <div className="usage-stat">
                <div className="usage-stat-label">Today</div>
                <div className="usage-stat-bar-wrap">
                  <div
                    className="usage-stat-bar"
                    style={{ width: `${Math.min(100, (usage.daily.used / usage.daily.limit) * 100)}%` }}
                  />
                </div>
                <div className="usage-stat-numbers">
                  {usage.daily.used} / {usage.daily.limit} generations
                  <span className="usage-remaining">{usage.daily.remaining} remaining</span>
                </div>
              </div>

              <div className="usage-stat">
                <div className="usage-stat-label">This Month</div>
                <div className="usage-stat-bar-wrap">
                  <div
                    className="usage-stat-bar"
                    style={{ width: `${Math.min(100, (usage.monthly.used / usage.monthly.limit) * 100)}%` }}
                  />
                </div>
                <div className="usage-stat-numbers">
                  {usage.monthly.used} / {usage.monthly.limit} generations
                  <span className="usage-remaining">{usage.monthly.remaining} remaining</span>
                </div>
              </div>

              <div className="usage-totals">
                <div className="usage-total-item">
                  <Zap size={16} />
                  <span>{usage.total_generations} total generations</span>
                </div>
                <div className="usage-total-item">
                  <span className="usage-cost">
                    Est. cost: ${usage.total_cost_estimate.toFixed(4)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="settings-empty">Could not load usage data.</p>
          )}
        </section>

        {/* Storage Stats Section */}
        <section className="settings-card settings-card-full">
          <div className="settings-card-header">
            <HardDrive size={20} />
            <h2>Storage</h2>
          </div>

          {storageLoading ? (
            <div className="settings-loading"><Loader2 size={20} className="spin" /></div>
          ) : storageStats ? (
            <div className="storage-stats-wrap">
              <div className="storage-backend-row">
                <div className="storage-backend-badge">
                  <HardDrive size={14} />
                  <span>Backend: <strong>{storageStats.backend.toUpperCase()}</strong></span>
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={runHealthCheck}
                  disabled={healthChecking}
                  title="Test storage connectivity"
                >
                  {healthChecking
                    ? <><Loader2 size={14} className="spin" /> Testing…</>
                    : <><Zap size={14} /> Test Connection</>}
                </button>
              </div>

              {storageStats.backend === 'local' && (
                <div className="storage-warning">
                  <strong>Local storage is active.</strong> Images are stored on the server disk and will be lost if the server is redeployed (e.g. Railway, Render). Set <code>STORAGE_BACKEND=r2</code> or <code>s3</code> for production.
                </div>
              )}

              {healthResult && (
                <div className={`storage-health-result ${healthResult.ok ? 'ok' : 'fail'}`}>
                  {healthResult.ok
                    ? `Storage OK — ${healthResult.backend?.toUpperCase()} is reachable and writable.`
                    : `Storage ERROR — ${healthResult.error || 'Unknown error'}`}
                </div>
              )}

              <div className="storage-stats-grid">
                <div className="storage-stat-item">
                  <Image size={16} />
                  <span className="storage-stat-value">{storageStats.total_images}</span>
                  <span className="storage-stat-label">Images stored</span>
                </div>
                {Object.entries(storageStats.by_provider || {}).map(([provider, count]) => (
                  <div key={provider} className="storage-stat-item">
                    <Zap size={16} />
                    <span className="storage-stat-value">{count}</span>
                    <span className="storage-stat-label">{provider}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="settings-empty">Could not load storage data.</p>
          )}
        </section>

        {/* Generation History */}
        <section className="settings-card settings-card-full">
          <div className="settings-card-header">
            <History size={20} />
            <h2>Generation History</h2>
          </div>

          {history.length === 0 && !historyLoading && (
            <p className="settings-empty">No generations yet.</p>
          )}

          {history.length > 0 && (
            <div className="history-table-wrap">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Prompt</th>
                    <th>Provider</th>
                    <th>Model</th>
                    <th>Status</th>
                    <th>Cost</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(g => (
                    <tr key={g.id}>
                      <td className="history-prompt-cell" title={g.prompt}>{g.prompt}</td>
                      <td>{g.provider || '—'}</td>
                      <td style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{g.model || '—'}</td>
                      <td>
                        <span className={`history-status-badge ${g.status}`}>{g.status}</span>
                      </td>
                      <td>{g.cost_estimate != null ? `$${Number(g.cost_estimate).toFixed(4)}` : '—'}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{new Date(g.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {history.length < historyTotal && (
            <div className="history-load-more">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => loadHistory(historyOffset + HISTORY_PAGE)}
                disabled={historyLoading}
              >
                {historyLoading
                  ? <><Loader2 size={14} className="spin" /> Loading…</>
                  : <><ChevronDown size={14} /> Load more ({historyTotal - history.length} remaining)</>}
              </button>
            </div>
          )}
        </section>

      </div>
    </div>
  )
}

export default AccountSettings
