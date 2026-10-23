// pages/CataloguePage.jsx — Product catalogue with filter and recommendation
import { useState, useEffect } from 'react'
import { productsApi } from '../api'
import ProductCard from '../components/ProductCard'
import QuotationForm from '../components/QuotationForm'

const CATEGORIES = ['All', 'Standard', 'High-Viscosity', 'High-Flow', 'Medical', 'Extended Horn']

export default function CataloguePage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showQuote, setShowQuote] = useState(false)

  // Recommendation state
  const [recForm, setRecForm] = useState({ viscosity_cp: '', flow_rate_ml_min: '', droplet_size_um: '', application: '' })
  const [recResults, setRecResults] = useState(null)
  const [recLoading, setRecLoading] = useState(false)
  const [recError, setRecError] = useState('')

  useEffect(() => {
    productsApi.list()
      .then(r => setProducts(r.data.products))
      .catch(() => setError('Could not load product catalogue. Please ensure the backend is running.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = products.filter(p => {
    const matchCat = activeCategory === 'All' || p.category === activeCategory
    const matchSearch = !searchTerm ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.applications.some(a => a.toLowerCase().includes(searchTerm.toLowerCase())) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchCat && matchSearch
  })

  const handleGetQuote = (product) => {
    setSelectedProduct(product)
    setShowQuote(true)
  }

  const handleRecommend = async () => {
    setRecLoading(true)
    setRecError('')
    setRecResults(null)
    try {
      const payload = {}
      if (recForm.viscosity_cp) payload.viscosity_cp = parseFloat(recForm.viscosity_cp)
      if (recForm.flow_rate_ml_min) payload.flow_rate_ml_min = parseFloat(recForm.flow_rate_ml_min)
      if (recForm.droplet_size_um) payload.droplet_size_um = parseFloat(recForm.droplet_size_um)
      if (recForm.application) payload.application = recForm.application
      const res = await productsApi.recommend(payload)
      setRecResults(res.data)
    } catch (e) {
      setRecError('Recommendation failed. Please check backend connection.')
    } finally {
      setRecLoading(false)
    }
  }

  return (
    <div style={styles.page} className="responsive-page responsive-page--catalogue">
      <h1 style={styles.title}>Product Catalogue</h1>
      <p style={styles.subtitle}>
        Ultrasonic spray nozzle systems from WaveNxD Technologies.
        <span style={{ color: '#64748b', fontSize: '0.8rem' }}> (Data from internship brief — not an official complete catalogue)</span>
      </p>

      {/* ── Recommendation Widget ────────────────────────────────────────── */}
      <div className="glass-card" style={styles.recCard}>
        <div style={styles.recHeader}>
          <span style={{ fontSize: '1.4rem' }}>🎯</span>
          <div>
            <h2 style={styles.recTitle}>Find the Right Nozzle</h2>
            <p style={{ fontSize: '0.82rem', color: '#64748b' }}>Enter your requirements and get matched instantly</p>
          </div>
        </div>
        <div style={styles.recGrid}>
          <div className="form-group">
            <label className="form-label">Application</label>
            <input className="form-input" placeholder="e.g. Spray drying, PIPAC, fuel cell…"
              value={recForm.application} onChange={e => setRecForm(f => ({ ...f, application: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Viscosity (cP)</label>
            <input className="form-input" type="number" min="0" placeholder="e.g. 50"
              value={recForm.viscosity_cp} onChange={e => setRecForm(f => ({ ...f, viscosity_cp: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Flow Rate (ml/min)</label>
            <input className="form-input" type="number" min="0" placeholder="e.g. 5"
              value={recForm.flow_rate_ml_min} onChange={e => setRecForm(f => ({ ...f, flow_rate_ml_min: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Droplet Size (µm)</label>
            <input className="form-input" type="number" min="0" placeholder="e.g. 40"
              value={recForm.droplet_size_um} onChange={e => setRecForm(f => ({ ...f, droplet_size_um: e.target.value }))} />
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleRecommend} disabled={recLoading}>
          {recLoading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Finding…</> : '🔍 Find Products'}
        </button>
        {recError && <div className="alert alert-error" style={{ marginTop: 10 }}>{recError}</div>}

        {recResults && (
          <div className="fade-in" style={{ marginTop: 16 }}>
            <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: 12, lineHeight: 1.6 }}>
              {recResults.explanation.split('\n').map((line, i) => {
                if (line.startsWith('**') && line.endsWith('**')) {
                  return <div key={i} style={{ fontWeight: 700, color: '#f1f5f9', marginTop: 8 }}>{line.replace(/\*\*/g, '')}</div>
                }
                if (line.startsWith('- ')) {
                  return <div key={i} style={{ paddingLeft: 12 }}>• {line.slice(2)}</div>
                }
                if (line.startsWith('> ⚠️')) {
                  return <div key={i} className="alert alert-warning" style={{ fontSize: '0.78rem', marginTop: 8 }}>{line.slice(2)}</div>
                }
                return <div key={i}>{line}</div>
              })}
            </div>
            {recResults.products.slice(0, 3).map((p, i) => (
              <div key={p.id} style={{ ...styles.recResult, borderLeft: `3px solid ${i === 0 ? '#00c9c8' : '#334155'}` }}>
                <div style={{ fontWeight: 700, color: i === 0 ? '#00c9c8' : '#cbd5e1', fontSize: '0.9rem' }}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} {p.name}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                  {p.frequency_khz} kHz · {p.droplet_size_um} µm · {p.flow_rate_ml_min} ml/min
                </div>
                <button className="btn btn-secondary" style={{ fontSize: '0.74rem', padding: '4px 10px', marginTop: 6 }}
                  onClick={() => handleGetQuote(p)}>
                  📋 Quote This
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Search & Filter ─────────────────────────────────────────────── */}
      <div style={styles.filterBar}>
        <input className="form-input" style={{ maxWidth: 300 }}
          placeholder="🔍 Search products or applications…"
          value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        <div style={styles.catFilters}>
          {CATEGORIES.map(cat => (
            <button key={cat}
              className={`btn ${activeCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.78rem', padding: '6px 14px' }}
              onClick={() => setActiveCategory(cat)}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Product Grid ─────────────────────────────────────────────────── */}
      {loading && (
        <div style={styles.loadState}>
          <span className="spinner spinner-lg" />
          <span style={{ color: '#94a3b8' }}>Loading catalogue…</span>
        </div>
      )}
      {error && <div className="alert alert-error">{error}</div>}
      {!loading && !error && filtered.length === 0 && (
        <div style={styles.emptyState}>
          <div style={{ fontSize: '2.5rem' }}>🔍</div>
          <div style={{ color: '#94a3b8' }}>No products match your search.</div>
        </div>
      )}
      {!loading && (
        <div style={styles.grid} className="responsive-product-grid">
          {filtered.map(p => (
            <ProductCard key={p.id} product={p} onGetQuote={handleGetQuote} />
          ))}
        </div>
      )}

      {/* ── Additional Capabilities ──────────────────────────────────────── */}
      {!loading && (
        <div className="glass-card" style={{ padding: '20px 22px', marginBottom: 40 }}>
          <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, marginBottom: 12, fontSize: '1rem' }}>
            ⚙️ Additional System Capabilities
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[
              'Air-shaping attachments',
              'Micro-fluid dispensing (0–200 µl)',
              'PLC-controlled XY spray pyrolysis (up to 450 °C)',
              'SS316 stainless steel enclosures',
            ].map(c => <span key={c} className="tag">{c}</span>)}
          </div>
        </div>
      )}

      {/* ── Quote Modal ──────────────────────────────────────────────────── */}
      {showQuote && (
        <div className="responsive-modal-overlay" style={styles.overlay} onClick={e => e.target === e.currentTarget && setShowQuote(false)}>
          <div className="glass-card fade-in responsive-modal" style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>📋 Request Quotation</h2>
              <button style={styles.closeBtn} onClick={() => setShowQuote(false)}>✕</button>
            </div>
            <div className="responsive-modal-body" style={{ overflowY: 'auto', padding: 20 }}>
              <QuotationForm
                prefilledProduct={selectedProduct}
                onSuccess={() => setTimeout(() => setShowQuote(false), 4000)}
                onCancel={() => setShowQuote(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  page: { maxWidth: 1280, margin: '0 auto', padding: '28px 20px' },
  title: { fontFamily: 'Outfit, sans-serif', fontSize: '1.8rem', fontWeight: 800, marginBottom: 6 },
  subtitle: { color: '#94a3b8', marginBottom: 24, fontSize: '0.9rem' },
  recCard: { padding: '22px 22px', marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 14 },
  recHeader: { display: 'flex', alignItems: 'flex-start', gap: 12 },
  recTitle: { fontFamily: 'Outfit, sans-serif', fontSize: '1.05rem', fontWeight: 700 },
  recGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0 16px' },
  recResult: {
    padding: '10px 14px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 8,
    marginBottom: 8,
  },
  filterBar: { display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 22 },
  catFilters: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 18,
    marginBottom: 32,
  },
  loadState: { display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', padding: 60 },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: 60 },
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 200, padding: 20,
  },
  modal: { width: '100%', maxWidth: 640, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  modalHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0,
  },
  modalTitle: { fontFamily: 'Outfit, sans-serif', fontSize: '1.1rem', fontWeight: 700 },
  closeBtn: { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.1rem', padding: 4 },
}
