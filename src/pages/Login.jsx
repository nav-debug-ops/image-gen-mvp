import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import { forgotPassword } from '../api/auth'
import { Sparkles, Mail, Lock, User, Loader2, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react'

function Login() {
  const [mode, setMode] = useState('login') // 'login' | 'register' | 'forgot'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)

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
  }

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
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'register' ? 'Min 8 characters' : 'Your password'}
                required
                minLength={mode === 'register' ? 8 : undefined}
              />
            </div>

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
