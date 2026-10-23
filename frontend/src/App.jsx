// App.jsx — Root component with authentication & navigation state
import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import ChatPage from './pages/ChatPage'
import CataloguePage from './pages/CataloguePage'
import QuotationsPage from './pages/QuotationsPage'
import LoginPage from './pages/LoginPage'
import AdminPage from './pages/AdminPage'
import { getToken, getStoredUser, removeToken, authApi, setStoredUser } from './api'

export default function App() {
  const [page, setPage] = useState('home')
  const [user, setUser] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)

  // Check stored auth on mount
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null)
      setPage('login')
    }
    window.addEventListener('wavenxd:unauthorized', handleUnauthorized)

    const token = getToken()
    const storedUser = getStoredUser()
    if (token && storedUser) {
      // Verify token is still valid
      authApi.me()
        .then(res => {
          const authenticatedUser = { username: res.data.username, role: res.data.role }
          setUser(authenticatedUser)
          setStoredUser(authenticatedUser)
          if (authenticatedUser.role === 'ADMIN') setPage('admin')
        })
        .catch(() => {
          // Token expired or invalid
          removeToken()
          setUser(null)
        })
        .finally(() => setAuthChecked(true))
    } else {
      setAuthChecked(true)
    }

    return () => window.removeEventListener('wavenxd:unauthorized', handleUnauthorized)
  }, [])

  const navigate = (p) => {
    if (p === 'admin' && user?.role !== 'ADMIN') return
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleLogin = (userData) => {
    setUser(userData)
    // Redirect admin to admin page, user to home
    if (userData.role === 'ADMIN') {
      setPage('admin')
    } else {
      setPage('home')
    }
  }

  const handleLogout = () => {
    removeToken()
    setUser(null)
    setPage('login')
  }

  // Show login page if not authenticated
  if (!authChecked) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#080c14',
      }}>
        <span className="spinner spinner-lg" />
      </div>
    )
  }

  // If not logged in, show login page
  if (!user) {
    return <LoginPage onLoginSuccess={handleLogin} />
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        activePage={page}
        onNavigate={navigate}
        user={user}
        onLogout={handleLogout}
      />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {page === 'home'       && <HomePage onNavigate={navigate} />}
        {page === 'chat'       && <ChatPage onNavigate={navigate} />}
        {page === 'catalogue'  && <CataloguePage onNavigate={navigate} />}
        {page === 'quotations' && <QuotationsPage onNavigate={navigate} />}
        {page === 'admin'      && user?.role === 'ADMIN' && <AdminPage user={user} />}
        {page === 'login'      && <LoginPage onLoginSuccess={handleLogin} />}
      </main>

      {/* Footer */}
      <footer style={footerStyle}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <div>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: '#00c9c8' }}>WaveNxD</span>
            <span style={{ color: '#475569', fontSize: '0.8rem' }}> Technologies Pvt. Ltd. · Kolhapur</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#475569' }}>
            AI Sales Rep · Internship Project · Data based on task brief only
          </div>
        </div>
      </footer>
    </div>
  )
}

const footerStyle = {
  background: 'rgba(8, 12, 20, 0.95)',
  borderTop: '1px solid rgba(255,255,255,0.05)',
  padding: '16px 20px',
  marginTop: 'auto',
}
