// Navbar.jsx — Top navigation bar with auth state
import { useState } from 'react'

const NAV_LINKS = [
  { id: 'home',       label: 'Home',       icon: '🏠' },
  { id: 'chat',       label: 'AI Chat',    icon: '🤖' },
  { id: 'catalogue',  label: 'Products',   icon: '🔬' },
  { id: 'quotations', label: 'Quotations', icon: '📋' },
]

export default function Navbar({ activePage, onNavigate, user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false)

  const allLinks = user?.role === 'ADMIN'
    ? [...NAV_LINKS, { id: 'admin', label: 'Admin Panel', icon: '🛡️' }]
    : NAV_LINKS

  return (
    <nav style={styles.nav}>
      <div style={styles.inner} className="responsive-navbar-inner">
        {/* Logo */}
        <button style={styles.logo} onClick={() => onNavigate('home')}>
          <span style={styles.logoIcon}>〜</span>
          <span style={styles.logoText}>WaveN<span style={styles.logoBold}>xD</span></span>
          <span style={styles.logoSub}>Technologies</span>
        </button>

        {/* Desktop links */}
        <div style={styles.links} className="hide-mobile">
          {allLinks.map(link => (
            <button
              key={link.id}
              onClick={() => onNavigate(link.id)}
              style={{
                ...styles.link,
                ...(activePage === link.id ? styles.linkActive : {}),
                ...(link.id === 'admin' ? styles.adminLink : {}),
              }}
            >
              <span>{link.icon}</span>
              {link.label}
              {activePage === link.id && <span style={styles.activeDot} />}
            </button>
          ))}
        </div>

        {/* User info & actions */}
        <div style={styles.userSection} className="hide-mobile">
          {user && (
            <>
              <div style={styles.userBadge}>
                <span style={styles.userAvatar}>
                  {user.role === 'ADMIN' ? '🛡️' : '👤'}
                </span>
                <div style={styles.userInfo}>
                  <span style={styles.userName}>{user.username}</span>
                  <span style={styles.userRole}>{user.role}</span>
                </div>
              </div>
              <button
                className="btn"
                style={styles.logoutBtn}
                onClick={onLogout}
              >
                🚪 Logout
              </button>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          style={styles.hamburger}
          className="hide-desktop"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={styles.mobileMenu} className="fade-in">
          {allLinks.map(link => (
            <button
              key={link.id}
              onClick={() => { onNavigate(link.id); setMenuOpen(false) }}
              style={{
                ...styles.mobileLink,
                ...(activePage === link.id ? styles.mobileLinkActive : {}),
              }}
            >
              <span>{link.icon}</span>
              {link.label}
            </button>
          ))}
          {user && (
            <>
              <div style={styles.mobileUserInfo}>
                <span style={{ fontSize: '0.82rem', color: '#f1f5f9' }}>
                  {user.role === 'ADMIN' ? '🛡️' : '👤'} {user.username}
                </span>
                <span style={{
                  padding: '2px 8px', borderRadius: 4, fontSize: '0.65rem', fontWeight: 600,
                  background: user.role === 'ADMIN' ? 'rgba(239,68,68,0.12)' : 'rgba(59,130,246,0.12)',
                  color: user.role === 'ADMIN' ? '#f87171' : '#60a5fa',
                }}>
                  {user.role}
                </span>
              </div>
              <button
                onClick={() => { onLogout(); setMenuOpen(false) }}
                style={{ ...styles.mobileLink, color: '#f87171' }}
              >
                <span>🚪</span> Logout
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  )
}

const styles = {
  nav: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    background: 'rgba(8, 12, 20, 0.92)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(0, 201, 200, 0.12)',
    boxShadow: '0 4px 30px rgba(0,0,0,0.4)',
  },
  inner: {
    maxWidth: 1400,
    margin: '0 auto',
    padding: '0 20px',
    height: 64,
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  logo: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginRight: 'auto',
    flexShrink: 0,
  },
  logoIcon: {
    fontSize: '1.6rem',
    color: '#00c9c8',
  },
  logoText: {
    fontFamily: 'Outfit, sans-serif',
    fontWeight: 800,
    fontSize: '1.2rem',
    color: '#f1f5f9',
    letterSpacing: '-0.02em',
  },
  logoBold: {
    color: '#00c9c8',
  },
  logoSub: {
    fontSize: '0.7rem',
    color: '#64748b',
    fontWeight: 400,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    marginLeft: 2,
    alignSelf: 'flex-end',
    marginBottom: 2,
  },
  links: {
    display: 'flex',
    gap: 4,
  },
  link: {
    position: 'relative',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#94a3b8',
    fontSize: '0.875rem',
    fontWeight: 500,
    padding: '8px 14px',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    transition: 'all 0.2s',
    fontFamily: 'Inter, sans-serif',
  },
  linkActive: {
    color: '#00c9c8',
    background: 'rgba(0, 201, 200, 0.1)',
  },
  adminLink: {
    color: '#f87171',
  },
  activeDot: {
    position: 'absolute',
    bottom: 4,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 4,
    height: 4,
    borderRadius: '50%',
    background: '#00c9c8',
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginLeft: 8,
    flexShrink: 0,
  },
  userBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '4px 12px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
  },
  userAvatar: {
    fontSize: '1rem',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  userName: {
    fontSize: '0.78rem',
    fontWeight: 600,
    color: '#f1f5f9',
    fontFamily: 'Inter, sans-serif',
  },
  userRole: {
    fontSize: '0.62rem',
    fontWeight: 600,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  logoutBtn: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239,68,68,0.2)',
    color: '#f87171',
    fontSize: '0.78rem',
    padding: '6px 12px',
    borderRadius: 8,
    cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
    fontWeight: 500,
    transition: 'all 0.2s',
  },
  hamburger: {
    background: 'none',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#f1f5f9',
    cursor: 'pointer',
    fontSize: '1.1rem',
    padding: '6px 10px',
    borderRadius: 8,
    marginLeft: 'auto',
  },
  mobileMenu: {
    display: 'flex',
    flexDirection: 'column',
    padding: '8px 16px 16px',
    gap: 4,
    borderTop: '1px solid rgba(255,255,255,0.06)',
  },
  mobileLink: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#94a3b8',
    fontSize: '0.9rem',
    fontWeight: 500,
    padding: '10px 14px',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    textAlign: 'left',
    fontFamily: 'Inter, sans-serif',
    transition: 'all 0.2s',
  },
  mobileLinkActive: {
    color: '#00c9c8',
    background: 'rgba(0, 201, 200, 0.1)',
  },
  mobileUserInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    marginTop: 4,
  },
}
