// ProductCard.jsx — Individual product card component
export default function ProductCard({ product, onGetQuote }) {
  const categoryColors = {
    Standard:      { bg: 'rgba(0,201,200,0.1)',    border: 'rgba(0,201,200,0.25)',    text: '#00c9c8' },
    'High-Viscosity': { bg: 'rgba(124,58,237,0.1)', border: 'rgba(124,58,237,0.25)',  text: '#a78bfa' },
    'High-Flow':   { bg: 'rgba(59,130,246,0.1)',   border: 'rgba(59,130,246,0.25)',   text: '#60a5fa' },
    Medical:       { bg: 'rgba(239,68,68,0.1)',    border: 'rgba(239,68,68,0.25)',    text: '#f87171' },
    'Extended Horn':{ bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)',   text: '#fbbf24' },
  }

  const cat = categoryColors[product.category] || categoryColors['Standard']

  return (
    <div className="glass-card fade-in responsive-product-card" style={styles.card}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.nozzleIcon}>🔬</span>
          <div>
            <h3 style={styles.name}>{product.name}</h3>
            <span style={{
              ...styles.catBadge,
              background: cat.bg,
              border: `1px solid ${cat.border}`,
              color: cat.text,
            }}>
              {product.category}
            </span>
          </div>
        </div>
        <div style={styles.id}>#{product.id}</div>
      </div>

      {/* Specs grid */}
      <div style={styles.specsGrid}>
        <Spec label="Frequency" value={`${product.frequency_khz} kHz`} icon="〜" />
        <Spec label="Droplet Size" value={`${product.droplet_size_um} µm`} icon="💧" />
        <Spec label="Flow Rate" value={`${product.flow_rate_ml_min} ml/min`} icon="⚡" />
        <Spec label="Max Viscosity" value={`${product.max_viscosity_cp} cP`} icon="🧪" />
      </div>

      <hr className="divider" />

      {/* Description */}
      <p style={styles.description}>{product.description}</p>

      {/* Applications */}
      <div style={styles.appsSection}>
        <span style={styles.appsLabel}>Applications</span>
        <div style={styles.appTags}>
          {product.applications.map(app => (
            <span key={app} className="tag">{app}</span>
          ))}
        </div>
      </div>

      {/* CTA */}
      <button
        className="btn btn-primary"
        style={{ width: '100%', marginTop: 4, justifyContent: 'center' }}
        onClick={() => onGetQuote && onGetQuote(product)}
      >
        📋 Request Quote
      </button>
    </div>
  )
}

function Spec({ label, value, icon }) {
  return (
    <div style={specStyles.wrap}>
      <span style={specStyles.icon}>{icon}</span>
      <div>
        <div style={specStyles.label}>{label}</div>
        <div style={specStyles.value}>{value}</div>
      </div>
    </div>
  )
}

const styles = {
  card: {
    padding: 22,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
  },
  nozzleIcon: {
    fontSize: '1.8rem',
    flexShrink: 0,
    marginTop: 2,
  },
  name: {
    fontSize: '0.95rem',
    fontWeight: 700,
    color: '#f1f5f9',
    marginBottom: 6,
    fontFamily: 'Outfit, sans-serif',
    lineHeight: 1.3,
  },
  catBadge: {
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: 999,
    fontSize: '0.7rem',
    fontWeight: 600,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  id: {
    fontSize: '0.72rem',
    color: '#64748b',
    fontFamily: 'monospace',
    flexShrink: 0,
  },
  specsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
  },
  description: {
    fontSize: '0.82rem',
    color: '#94a3b8',
    lineHeight: 1.5,
  },
  appsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  appsLabel: {
    fontSize: '0.75rem',
    color: '#64748b',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  appTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
}

const specStyles = {
  wrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 8,
    padding: '8px 10px',
  },
  icon: { fontSize: '1rem', flexShrink: 0 },
  label: { fontSize: '0.68rem', color: '#64748b', fontWeight: 500 },
  value: { fontSize: '0.85rem', color: '#f1f5f9', fontWeight: 600 },
}
