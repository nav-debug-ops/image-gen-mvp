import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import { forgotPassword } from '../api/auth'
import { Sparkles, Mail, Lock, User, Loader2, ArrowRight, ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react'

function getPasswordStrength(pwd) {
  if (!pwd) return { score: 0, label: '', color: '' }
  let score = 0
  if (pwd.length >= 8) score++
  if (pwd.length >= 12) score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd)) score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++
  const levels = [
    { label: '', color: '' },
    { label: 'Weak', color: '#EF4444' },
    { label: 'Fair', color: '#F97316' },
    { label: 'Good', color: '#F59E0B' },
    { label: 'Strong', color: '#84CC16' },
    { label: 'Very Strong', color: '#22C55E' },
  ]
  return { score, ...levels[score] }
}

function Login() {
  const [mode, setMode] = useState('login') // 'login' | 'register' | 'forgot'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const { login, register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'login') {
        await login(email, password)
        navigate('/')
      } else if (mode === 'register') {
        if (password.length < 8) {
          setError('Password must be at least 8 characters')
          setLoading(false)
          return
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match')
          setLoading(false)
          return
        }
        await register(email, password, displayName)
        navigate('/')
      } else if (mode === 'forgot') {
        await forgotPassword(email)
        setResetSent(true)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (newMode) => {
    setMode(newMode)
    setError('')
    setResetSent(false)
    setPassword('')
    setConfirmPassword('')
  }

  const strength = mode === 'register' ? getPasswordStrength(password) : null

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <Sparkles size={32} className="login-logo" />
          <h1>Amazon Image Generator</h1>
          <p>AI-powered product listing optimization</p>
        </div>

        {mode !== 'forgot' && (
          <div className="login-tabs">
            <button
              className={`login-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => switchMode('login')}
            >
              Sign In
            </button>
            <button
              className={`login-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => switchMode('register')}
            >
              Create Account
            </button>
          </div>
        )}

        {mode === 'forgot' && resetSent ? (
          <div className="reset-sent">
            <CheckCircle size={48} className="reset-sent-icon" />
            <h2>Check Your Email</h2>
            <p>
              If an account exists for <strong>{email}</strong>, we've sent a password reset link.
              The link expires in 15 minutes.
            </p>
            <button
              className="login-submit"
              onClick={() => switchMode('login')}
            >
              <ArrowLeft size={18} />
              Back to Sign In
            </button>
          </div>
        ) : mode === 'forgot' ? (
          <>
            <div className="forgot-header">
              <h2>Reset Password</h2>
              <p>Enter your email and we'll send you a reset link.</p>
            </div>
            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label>
                  <Mail size={16} />
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>

              {error && <div className="login-error">{error}</div>}

              <button type="submit" className="login-submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 size={18} className="spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Reset Link
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              <button
                type="button"
                className="forgot-back-link"
                onClick={() => switchMode('login')}
              >
                <ArrowLeft size={14} />
                Back to Sign In
              </button>
            </form>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="login-form">
            {mode === 'register' && (
              <div className="form-group">
                <label>
                  <User size={16} />
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
            )}

            <div className="form-group">
              <label>
                <Mail size={16} />
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label>
                <Lock size={16} />
                Password
              </label>
              <div className="password-input-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'register' ? 'Min 8 characters' : 'Your password'}
                  required
                  minLength={mode === 'register' ? 8 : undefined}
                />
                <button type="button" className="password-toggle" onClick={() => setShowPassword(v => !v)}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {mode === 'register' && strength && strength.score > 0 && (
                <div className="password-strength">
                  <div className="password-strength-bar">
                    {[1,2,3,4,5].map(i => (
                      <div
                        key={i}
                        className="password-strength-seg"
                        style={{ background: i <= strength.score ? strength.color : 'var(--border)' }}
                      />
                    ))}
                  </div>
                  <span className="password-strength-label" style={{ color: strength.color }}>
                    {strength.label}
                  </span>
                </div>
              )}
            </div>

            {mode === 'register' && (
              <div className="form-group">
                <label>
                  <Lock size={16} />
                  Confirm Password
                </label>
                <div className="password-input-wrap">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    required
                  />
                  <button type="button" className="password-toggle" onClick={() => setShowConfirm(v => !v)}>
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <span className="password-mismatch">Passwords do not match</span>
                )}
                {confirmPassword && password === confirmPassword && password.length >= 8 && (
                  <span className="password-match"><CheckCircle size={13} /> Passwords match</span>
                )}
              </div>
            )}

            {mode === 'login' && (
              <button
                type="button"
                className="forgot-password-link"
                onClick={() => switchMode('forgot')}
              >
                Forgot password?
              </button>
            )}

            {error && <div className="login-error">{error}</div>}

            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={18} className="spin" />
                  {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default Login
