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

  useEffect(() => {
    fetchAPI('/api/usage/summary')
      .then(res => safeJson(res))
      .then(data => { if (data) setUsage(data) })
      .catch(() => {})
      .finally(() => setUsageLoading(false))
  }, [])

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

      </div>
    </div>
  )
}

export default AccountSettings
