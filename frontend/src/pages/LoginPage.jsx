// pages/LoginPage.jsx — User login & registration page
import { useState } from 'react'
import { authApi, setToken, setStoredUser } from '../api'

export default function LoginPage({ onLoginSuccess }) {
  const [loginType, setLoginType] = useState('USER')
  const [isRegister, setIsRegister] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!username.trim() || !password.trim()) {
      setError('Username and password are required')
      return
    }

    if (isRegister && password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (isRegister && password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      let res
      if (isRegister) {
        res = await authApi.register(username, password)
        setSuccess('Account created successfully! Logging you in...')
      } else {
        res = await authApi.login(username, password)
      }
      const { access_token, user } = res.data
      if (user.role !== loginType) {
        setError(loginType === 'ADMIN'
          ? 'This is not an admin account. Choose User Login or use admin credentials.'
          : 'This is an admin account. Choose Admin Login to continue.')
        return
      }
      setToken(access_token)
      setStoredUser(user)
      setTimeout(() => {
        onLoginSuccess(user)
      }, isRegister ? 800 : 100)
    } catch (err) {
      const detail = err.response?.data?.detail
      if (typeof detail === 'string') {
        setError(loginType === 'ADMIN' && err.response?.status === 401
          ? 'Incorrect admin username or password. Use the admin credentials configured for this application.'
          : detail)
      } else if (!err.response) {
        setError('Unable to connect to the server. Please check your connection and try again.')
      } else {
        setError(isRegister
          ? 'Registration failed. Try a different username.'
          : loginType === 'ADMIN'
            ? 'Admin sign-in failed. Check the configured admin credentials.'
            : 'Invalid username or password.')
      }
    } finally {
      setLoading(false)
    }
  }

  const toggleMode = () => {
    if (!isRegister && loginType === 'ADMIN') {
      setLoginType('USER')
      setIsRegister(true)
    } else {
      setIsRegister(!isRegister)
    }
    setError('')
    setSuccess('')
  }

  const selectLoginType = (type) => {
    setLoginType(type)
    setIsRegister(false)
    setError('')
    setSuccess('')
  }

  return (
    <div style={styles.page}>
      {/* Background decoration */}
      <div style={styles.bgOrb1} />
      <div style={styles.bgOrb2} />

      <div style={styles.container}>
        {/* Logo section */}
        <div style={styles.logoSection}>
          <div style={styles.logoIcon}>〜</div>
          <h1 style={styles.logoTitle}>
            WaveN<span style={styles.logoBold}>xD</span>
          </h1>
          <p style={styles.logoSub}>Technologies Pvt. Ltd.</p>
          <p style={styles.tagline}>AI-Powered Sales Representative</p>
        </div>

        {/* Login card */}
        <div className="glass-card fade-in" style={styles.card}>
          <div style={styles.loginTypeTabs} role="tablist" aria-label="Choose account type">
            {[
              { id: 'USER', label: '👤 User Login' },
              { id: 'ADMIN', label: '🛡️ Admin Login' },
            ].map(option => (
              <button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={loginType === option.id}
                onClick={() => selectLoginType(option.id)}
                style={{
                  ...styles.loginTypeTab,
                  ...(loginType === option.id ? styles.loginTypeTabActive : {}),
                }}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>
              {isRegister
                ? '🚀 Create Account'
                : loginType === 'ADMIN' ? '🛡️ Admin Sign In' : '👋 Welcome Back'}
            </h2>
            <p style={styles.cardSubtitle}>
              {isRegister
                ? 'Sign up to submit quotation requests'
                : loginType === 'ADMIN'
                  ? 'Sign in to review and manage quotation requests'
                  : 'Sign in to your WaveNxD account'}
            </p>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            {error && (
              <div className="alert alert-error" style={styles.alert}>
                <span>❌</span> {error}
              </div>
            )}
            {success && (
              <div className="alert alert-success" style={styles.alert}>
                <span>✅</span> {success}
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="login-username">Username</label>
              <input
                id="login-username"
                className="form-input"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                minLength={isRegister ? 3 : undefined}
                maxLength={50}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Password</label>
              <input
                id="login-password"
                className="form-input"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                minLength={isRegister ? 8 : undefined}
                maxLength={72}
                required
              />
            </div>

            {isRegister && (
              <div className="form-group fade-in">
                <label className="form-label" htmlFor="login-confirm">Confirm Password</label>
                <input
                  id="login-confirm"
                  className="form-input"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={72}
                  required
                />
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={styles.submitBtn}
            >
              {loading ? (
                <>
                  <span className="spinner" style={{ width: 18, height: 18 }} />
                  {isRegister ? 'Creating Account...' : 'Signing In...'}
                </>
              ) : (
                isRegister ? '🚀 Create Account' : '🔑 Sign In'
              )}
            </button>
          </form>

          <div style={styles.divider}>
            <span style={styles.dividerText}>or</span>
          </div>
          <button
            onClick={toggleMode}
            style={styles.toggleBtn}
            type="button"
          >
            {isRegister
              ? 'Already have an account? Sign In'
              : loginType === 'ADMIN'
                ? 'Need a user account? Register here'
                : "Don't have an account? Sign Up"}
          </button>
          {!isRegister && loginType === 'ADMIN' && (
            <div style={styles.adminHint}>
              <span style={{ color: '#64748b', fontSize: '0.75rem' }}>
                Admin accounts are provided by the application administrator.
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <p style={styles.footer}>
          WaveNxD Technologies Pvt. Ltd. · Kolhapur, Maharashtra
        </p>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    position: 'relative',
    overflow: 'hidden',
  },
  bgOrb1: {
    position: 'absolute',
    top: '10%',
    left: '15%',
    width: 400,
    height: 400,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(0, 201, 200, 0.12) 0%, transparent 70%)',
    filter: 'blur(60px)',
    pointerEvents: 'none',
    animation: 'pulse 4s ease-in-out infinite',
  },
  bgOrb2: {
    position: 'absolute',
    bottom: '10%',
    right: '15%',
    width: 350,
    height: 350,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(124, 58, 237, 0.12) 0%, transparent 70%)',
    filter: 'blur(60px)',
    pointerEvents: 'none',
    animation: 'pulse 5s ease-in-out infinite',
  },
  container: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    maxWidth: 440,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 24,
  },
  logoSection: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  logoIcon: {
    fontSize: '3rem',
    color: '#00c9c8',
    marginBottom: 4,
  },
  logoTitle: {
    fontFamily: 'Outfit, sans-serif',
    fontWeight: 800,
    fontSize: '2rem',
    color: '#f1f5f9',
    letterSpacing: '-0.02em',
  },
  logoBold: {
    color: '#00c9c8',
  },
  logoSub: {
    fontSize: '0.8rem',
    color: '#64748b',
    fontWeight: 400,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  tagline: {
    fontSize: '0.85rem',
    color: '#94a3b8',
    marginTop: 4,
  },
  card: {
    width: '100%',
    padding: '32px 28px',
  },
  loginTypeTabs: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
    padding: 5,
    marginBottom: 24,
    borderRadius: 12,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  loginTypeTab: {
    padding: '10px 8px',
    border: '1px solid transparent',
    borderRadius: 8,
    color: '#94a3b8',
    background: 'transparent',
    cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
    fontSize: '0.82rem',
    fontWeight: 600,
    transition: 'all 0.2s',
  },
  loginTypeTabActive: {
    color: '#00c9c8',
    background: 'rgba(0,201,200,0.1)',
    borderColor: 'rgba(0,201,200,0.2)',
  },
  cardHeader: {
    textAlign: 'center',
    marginBottom: 24,
  },
  cardTitle: {
    fontFamily: 'Outfit, sans-serif',
    fontSize: '1.3rem',
    fontWeight: 700,
    color: '#f1f5f9',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: '0.85rem',
    color: '#94a3b8',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  alert: {
    fontSize: '0.82rem',
    marginBottom: 8,
  },
  submitBtn: {
    width: '100%',
    padding: '12px 20px',
    fontSize: '0.95rem',
    justifyContent: 'center',
    marginTop: 8,
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    margin: '20px 0',
  },
  dividerText: {
    flex: 1,
    textAlign: 'center',
    fontSize: '0.78rem',
    color: '#475569',
    position: 'relative',
  },
  toggleBtn: {
    width: '100%',
    padding: '10px',
    background: 'rgba(0, 201, 200, 0.06)',
    border: '1px solid rgba(0, 201, 200, 0.15)',
    borderRadius: 10,
    color: '#00c9c8',
    fontSize: '0.85rem',
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
    transition: 'all 0.2s',
  },
  adminHint: {
    textAlign: 'center',
    marginTop: 16,
  },
  footer: {
    fontSize: '0.72rem',
    color: '#475569',
    textAlign: 'center',
    marginTop: 8,
  },
}
