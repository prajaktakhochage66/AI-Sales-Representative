// pages/HomePage.jsx — Landing dashboard
import { useEffect, useState } from 'react'
import { statusApi, productsApi } from '../api'

export default function HomePage({ onNavigate }) {
  const [status, setStatus] = useState(null)
  const [productCount, setProductCount] = useState(9)

  useEffect(() => {
    statusApi.get()
      .then(r => setStatus(r.data))
      .catch(() => setStatus({ ai_available: false, message: 'Backend not reachable' }))

    productsApi.list()
      .then(r => setProductCount(r.data.count))
      .catch(() => {})
  }, [])

  const stats = [
    { icon: '〜', label: 'Frequency Range', value: '24–180 kHz' },
    { icon: '💧', label: 'Droplet Size', value: '10–60 µm' },
    { icon: '⚡', label: 'Flow Rate', value: '0–200 ml/min' },
    { icon: '🧪', label: 'Max Viscosity', value: '1000 cP' },
  ]

  const features = [
    { icon: '🤖', title: 'AI Sales Assistant', desc: 'Intelligent chatbot trained on our product data. Ask anything in English, Hindi, or Marathi.' },
    { icon: '🔬', title: 'Product Catalogue', desc: 'Browse detailed specs for all 9 nozzle variants with applications and selection guidance.' },
    { icon: '📊', title: 'Smart Recommendations', desc: 'Tell us your viscosity, flow rate, and application — get matched to the right nozzle.' },
    { icon: '📋', title: 'Instant Quotations', desc: 'Submit enquiries with your requirements and receive a formal quote from our team.' },
  ]

  return (
    <div style={styles.page} className="responsive-page responsive-page--home">
      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section style={styles.hero}>
        <div style={styles.heroBadge}>🇮🇳 Made in India · Kolhapur, Maharashtra</div>
        <h1 style={styles.heroTitle}>
          Ultrasonic Spray Nozzle
          <br />
          <span className="gradient-text">Intelligence</span>
        </h1>
        <p style={styles.heroSub}>
          WaveNxD Technologies Pvt. Ltd. brings you an AI-powered sales assistant for
          precision ultrasonic spray nozzle systems — from laboratory research to industrial-scale production.
        </p>

        <div style={styles.heroCtas}>
          <button className="btn btn-primary" style={{ fontSize: '1rem', padding: '12px 28px' }}
            onClick={() => onNavigate('chat')}>
            💬 Chat with AI Rep
          </button>
          <button className="btn btn-secondary" style={{ fontSize: '1rem', padding: '12px 28px' }}
            onClick={() => onNavigate('catalogue')}>
            🔬 View Products
          </button>
        </div>

        {/* AI status badge */}
        {status && (
          <div style={{ marginTop: 16 }}>
            <span className={`badge ${status.ai_available ? 'badge-live' : 'badge-demo'}`}>
              {status.ai_available ? '✅ Live AI Active' : '⚠️ Demo Mode — Configure API Key'}
            </span>
          </div>
        )}
      </section>

      {/* ── Stats ──────────────────────────────────────────────────────────── */}
      <section style={styles.statsSection}>
        <div style={styles.statsGrid}>
          {stats.map(s => (
            <div key={s.label} className="glass-card" style={styles.statCard}>
              <div style={{ fontSize: '1.8rem' }}>{s.icon}</div>
              <div className="stat-value">{s.value}</div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────────── */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Platform Features</h2>
        <div style={styles.featuresGrid}>
          {features.map(f => (
            <div key={f.title} className="glass-card" style={styles.featureCard}>
              <div style={styles.featureIcon}>{f.icon}</div>
              <h3 style={styles.featureTitle}>{f.title}</h3>
              <p style={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Product categories ─────────────────────────────────────────────── */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Product Categories</h2>
        <div style={styles.categoriesGrid}>
          {[
            { cat: 'Standard Nozzles', count: '3 variants', icon: '🔩', desc: '60–180 kHz, up to 5 ml/min, lab applications', color: '#00c9c8' },
            { cat: 'High-Viscosity', count: '2 variants', icon: '🧪', desc: '24/60 kHz, handles up to 1000 cP, fuel cells', color: '#a78bfa' },
            { cat: 'High-Flow', count: '1 variant', icon: '⚡', desc: '60 kHz, up to 200 ml/min, industrial drying', color: '#60a5fa' },
            { cat: 'Medical / PIPAC', count: '1 variant', icon: '💉', desc: 'Specialised for PIPAC chemotherapy', color: '#f87171' },
            { cat: 'Extended Horn', count: '2 variants', icon: '📏', desc: '15/25 mm extensions for tube & syringe coating', color: '#fbbf24' },
          ].map(c => (
            <div
              key={c.cat}
              className="glass-card"
              style={{ ...styles.catCard, cursor: 'pointer' }}
              onClick={() => onNavigate('catalogue')}
            >
              <div style={{ fontSize: '1.6rem' }}>{c.icon}</div>
              <div>
                <div style={{ fontWeight: 700, color: c.color, fontSize: '0.9rem', fontFamily: 'Outfit, sans-serif' }}>{c.cat}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{c.count}</div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 4 }}>{c.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Disclaimer ─────────────────────────────────────────────────────── */}
      <div className="alert alert-warning" style={{ margin: '0 0 40px' }}>
        <span>⚠️</span>
        <span style={{ fontSize: '0.82rem' }}>
          Product data shown is from the internship task brief and may not represent the complete official catalogue.
          Do not rely on this application for final specifications, pricing, or availability.
          Always confirm with WaveNxD Technologies Pvt. Ltd. directly.
        </span>
      </div>
    </div>
  )
}

const styles = {
  page: { padding: '0 20px', maxWidth: 1280, margin: '0 auto' },
  hero: {
    textAlign: 'center',
    padding: '60px 20px 50px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
  },
  heroBadge: {
    display: 'inline-block',
    padding: '4px 14px',
    background: 'rgba(0,201,200,0.08)',
    border: '1px solid rgba(0,201,200,0.2)',
    borderRadius: 999,
    fontSize: '0.78rem',
    color: '#00c9c8',
    fontWeight: 500,
  },
  heroTitle: {
    fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
    fontFamily: 'Outfit, sans-serif',
    fontWeight: 800,
    lineHeight: 1.1,
    letterSpacing: '-0.02em',
  },
  heroSub: {
    maxWidth: 560,
    fontSize: '1rem',
    color: '#94a3b8',
    lineHeight: 1.7,
  },
  heroCtas: { display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' },
  statsSection: { marginBottom: 40 },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 14,
  },
  statCard: {
    padding: '20px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    textAlign: 'center',
  },
  section: { marginBottom: 44 },
  sectionTitle: {
    fontSize: '1.4rem',
    fontFamily: 'Outfit, sans-serif',
    fontWeight: 700,
    marginBottom: 20,
    color: '#f1f5f9',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
    gap: 16,
  },
  featureCard: { padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: 10 },
  featureIcon: { fontSize: '1.8rem' },
  featureTitle: { fontSize: '1rem', fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: '#f1f5f9' },
  featureDesc: { fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5 },
  categoriesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 14,
  },
  catCard: {
    padding: '18px 16px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 14,
    transition: 'all 0.2s',
  },
}
