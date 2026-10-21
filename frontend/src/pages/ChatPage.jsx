// pages/ChatPage.jsx — Full-screen chat + quotation overlay
import { useState } from 'react'
import ChatWindow from '../components/ChatWindow'
import QuotationForm from '../components/QuotationForm'

export default function ChatPage() {
  const [showQuotation, setShowQuotation] = useState(false)
  const [quotationProduct, setQuotationProduct] = useState(null)

  return (
    <div style={styles.page}>
      <div style={styles.layout}>
        {/* ── Chat Panel ───────────────────────────────────────────────── */}
        <div className="glass-card" style={styles.chatPanel}>
          <ChatWindow onRequestQuote={() => setShowQuotation(true)} />
        </div>

        {/* ── Sidebar ──────────────────────────────────────────────────── */}
        <div style={styles.sidebar}>
          <div className="glass-card" style={styles.infoCard}>
            <h3 style={styles.sideTitle}>💡 How to Use</h3>
            <ol style={styles.howToList}>
              {[
                'Greet the AI and describe your application',
                'Share your liquid viscosity (in cP)',
                'Mention required flow rate (ml/min)',
                'Ask for a product recommendation',
                'Request a quotation when ready',
              ].map((step, i) => (
                <li key={i} style={styles.howToItem}>
                  <span style={styles.stepNum}>{i + 1}</span>
                  <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="glass-card" style={styles.infoCard}>
            <h3 style={styles.sideTitle}>🌐 Supported Languages</h3>
            <div style={styles.langGrid}>
              {['🇬🇧 English', '🇮🇳 Hindi (हिन्दी)', '🇮🇳 Marathi (मराठी)'].map(l => (
                <span key={l} className="tag" style={{ margin: '3px 0' }}>{l}</span>
              ))}
            </div>
          </div>

          <div className="glass-card" style={styles.infoCard}>
            <h3 style={styles.sideTitle}>📋 Sample Questions</h3>
            <div style={styles.sampleList}>
              {[
                '"What is the finest droplet size you offer?"',
                '"My liquid viscosity is 800 cP — which nozzle works?"',
                '"I need industrial-scale spray drying"',
                '"Tell me about PIPAC chemotherapy nozzles"',
                '"मला 60 kHz नोझल बद्दल सांगा"',
              ].map(q => (
                <div key={q} style={styles.sampleQ}>{q}</div>
              ))}
            </div>
          </div>

          {/* Quotation quick-start */}
          <button
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', fontSize: '0.9rem' }}
            onClick={() => setShowQuotation(true)}
          >
            📋 Start Quotation Request
          </button>
        </div>
      </div>

      {/* ── Quotation Modal ───────────────────────────────────────────────── */}
      {showQuotation && (
        <div style={styles.overlay} onClick={e => e.target === e.currentTarget && setShowQuotation(false)}>
          <div className="glass-card fade-in" style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>📋 Request a Quotation</h2>
              <button style={styles.closeBtn} onClick={() => setShowQuotation(false)}>✕</button>
            </div>
            <div style={styles.modalBody}>
              <QuotationForm
                prefilledProduct={quotationProduct}
                onSuccess={() => setTimeout(() => setShowQuotation(false), 4000)}
                onCancel={() => setShowQuotation(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  page: {
    maxWidth: 1280,
    margin: '0 auto',
    padding: '24px 20px',
    height: 'calc(100vh - 64px)',
    display: 'flex',
    flexDirection: 'column',
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '1fr 320px',
    gap: 20,
    flex: 1,
    minHeight: 0,
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr',
    },
  },
  chatPanel: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    minHeight: 0,
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    overflowY: 'auto',
  },
  infoCard: { padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 12 },
  sideTitle: { fontFamily: 'Outfit, sans-serif', fontSize: '0.9rem', fontWeight: 700, color: '#f1f5f9' },
  howToList: { listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 },
  howToItem: { display: 'flex', alignItems: 'flex-start', gap: 10 },
  stepNum: {
    width: 20,
    height: 20,
    borderRadius: '50%',
    background: 'rgba(0,201,200,0.15)',
    border: '1px solid rgba(0,201,200,0.3)',
    color: '#00c9c8',
    fontSize: '0.7rem',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  langGrid: { display: 'flex', flexDirection: 'column', gap: 6 },
  sampleList: { display: 'flex', flexDirection: 'column', gap: 6 },
  sampleQ: {
    fontSize: '0.78rem',
    color: '#64748b',
    padding: '6px 10px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: 6,
    fontStyle: 'italic',
    lineHeight: 1.4,
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 640,
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    flexShrink: 0,
  },
  modalTitle: { fontFamily: 'Outfit, sans-serif', fontSize: '1.1rem', fontWeight: 700, color: '#f1f5f9' },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: '1.1rem',
    padding: 4,
  },
  modalBody: { overflowY: 'auto', padding: '20px' },
}
