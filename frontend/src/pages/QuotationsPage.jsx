// pages/QuotationsPage.jsx — View and manage quotation requests
import { useState, useEffect } from 'react'
import { quotationsApi } from '../api'
import QuotationForm from '../components/QuotationForm'

const STATUS_OPTIONS = ['Pending', 'In Review', 'Quoted', 'Approved', 'Rejected', 'Closed']

const STATUS_BADGE = {
  Pending:   'badge badge-pending',
  'In Review': 'badge badge-review',
  Quoted:    'badge badge-quoted',
  Approved:  'badge badge-approved',
  Rejected:  'badge badge-rejected',
  Closed:    'badge badge-closed',
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const timestamp = /(?:Z|[+-]\d{2}:\d{2})$/i.test(dateStr) ? dateStr : `${dateStr}Z`
  return new Date(timestamp).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Kolkata',
    timeZoneName: 'short',
  })
}

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [showNew, setShowNew] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [downloadingQuotationId, setDownloadingQuotationId] = useState(null)

  const downloadQuotationPdf = async (quotation) => {
    setDownloadingQuotationId(quotation.id)
    setError('')
    try {
      const response = await quotationsApi.downloadPdf(quotation.id)
      const url = URL.createObjectURL(response.data)
      const link = document.createElement('a')
      link.href = url
      link.download = `WaveNxD-Quotation-${quotation.id}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (downloadError) {
      setError(downloadError.response?.data?.detail || 'Could not download the quotation PDF.')
    } finally {
      setDownloadingQuotationId(null)
    }
  }

  const load = () => {
    setLoading(true)
    // Fetch quotations list
    quotationsApi.list()
      .then(r => setQuotations(r.data))
      .catch(() => setError('Could not load quotations. Is the backend running?'))
      .finally(() => setLoading(false))
    // Fetch pending count separately
    quotationsApi.pendingCount()
      .then(r => {
        // Assuming API returns { count: number }
        const cnt = r.data?.count ?? r.data
        setPendingCount(cnt)
      })
      .catch(() => {
        // If pending count fails, retain existing state (default 0)
        console.warn('Failed to fetch pending count')
      })
  }

  useEffect(() => {
    load()
    const refreshTimer = window.setInterval(() => {
      Promise.all([quotationsApi.list(), quotationsApi.pendingCount()])
        .then(([quotationResponse, pendingResponse]) => {
          const updatedQuotations = quotationResponse.data
          setQuotations(updatedQuotations)
          setPendingCount(pendingResponse.data?.count ?? pendingResponse.data)
          setSelected(current =>
            current
              ? updatedQuotations.find(quotation => quotation.id === current.id) || current
              : current
          )
        })
        .catch(refreshError => console.warn('Could not refresh quotation updates.', refreshError))
    }, 30000)
    return () => window.clearInterval(refreshTimer)
  }, [])

  return (
    <div style={styles.page} className="responsive-page responsive-page--quotations">
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.title}>My Quotation Requests</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem' }}>
            {quotations.length} of your enquiries
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNew(true)}>
          ＋ New Request
        </button>
      </div>

      {/* Stats row */}
      {!loading && quotations.length > 0 && (
        <div style={styles.statsRow}>
          {STATUS_OPTIONS.map(s => {
            const count = s === 'Pending' ? pendingCount : quotations.filter(q => q.status === s).length
            return (
              <div key={s} className="glass-card" style={styles.statCard}>
                <span className={STATUS_BADGE[s] || 'badge badge-closed'}>{s}</span>
                <span style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f1f5f9', marginTop: 6 }}>{count}</span>
              </div>
            )
          })}
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      {loading && (
        <div style={styles.center}>
          <span className="spinner spinner-lg" />
          <span style={{ color: '#94a3b8' }}>Loading quotations…</span>
        </div>
      )}

      {!loading && quotations.length === 0 && !error && (
        <div style={styles.empty}>
          <div style={{ fontSize: '3rem' }}>📋</div>
          <h3 style={{ fontFamily: 'Outfit, sans-serif', color: '#f1f5f9' }}>No Quotations Yet</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem' }}>
            Start by chatting with the AI rep or clicking "New Request".
          </p>
          <button className="btn btn-primary" onClick={() => setShowNew(true)}>+ Submit First Request</button>
        </div>
      )}

      {/* List + Detail split */}
      {!loading && quotations.length > 0 && (
        <div style={styles.layout} className="responsive-quotation-layout">
          {/* List */}
          <div style={styles.list}>
            {quotations.map(q => (
              <div
                key={q.id}
                className="glass-card"
                style={{
                  ...styles.listItem,
                  ...(selected?.id === q.id ? styles.listItemActive : {}),
                }}
                onClick={() => setSelected(q)}
              >
                <div style={styles.listTop}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f1f5f9' }}>
                    #{q.id} — {q.customer_name}
                  </div>
                  <span className={STATUS_BADGE[q.status] || 'badge badge-closed'}>{q.status}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{q.company || 'Individual'}</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{q.email}</div>
                {q.recommended_product && (
                  <div className="tag" style={{ marginTop: 6, display: 'inline-block' }}>
                    {q.quotation_product || q.recommended_product}
                  </div>
                )}
                {q.status === 'Approved' && q.quotation_total != null && (
                  <div style={{ color: '#00c9c8', fontSize: '0.8rem', fontWeight: 600, marginTop: 5 }}>
                    Quotation: {q.currency} {Number(q.quotation_total).toFixed(2)}
                  </div>
                )}
                {q.reviewed_by && (
                  <div style={{
                    marginTop: 8, padding: '8px 10px', borderRadius: 8,
                    background: 'rgba(0, 201, 200, 0.07)',
                    border: '1px solid rgba(0, 201, 200, 0.14)',
                    color: '#94a3b8', fontSize: '0.76rem', wordBreak: 'break-word',
                  }}>
                    <strong style={{ color: '#00c9c8' }}>Admin response: {q.status}</strong>
                    {q.admin_comments && <div style={{ marginTop: 3 }}>{q.admin_comments}</div>}
                  </div>
                )}
                {q.follow_ups?.map(call => (
                  <div key={call.id} style={{
                    marginTop: 8, padding: '8px 10px', borderRadius: 8,
                    background: 'rgba(59, 130, 246, 0.08)',
                    border: '1px solid rgba(59, 130, 246, 0.18)',
                    color: '#cbd5e1', fontSize: '0.76rem', wordBreak: 'break-word',
                  }}>
                    <strong style={{ color: '#60a5fa' }}>Admin scheduled a follow-up call</strong>
                    <div style={{ marginTop: 3 }}>
                      {formatDate(call.follow_up_date)} · {call.status}
                    </div>
                    {call.notes && <div style={{ marginTop: 3 }}>{call.notes}</div>}
                  </div>
                ))}
                <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: 6 }}>{formatDate(q.created_at)}</div>
              </div>
            ))}
          </div>

          {/* Detail Panel */}
          {selected ? (
            <div className="glass-card responsive-detail-panel" style={styles.detail}>
              <div style={styles.detailHeader}>
                <div>
                  <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.1rem', fontWeight: 700 }}>
                    Quotation #{selected.id}
                  </h2>
                  <span className={STATUS_BADGE[selected.status] || 'badge badge-closed'} style={{ marginTop: 6, display: 'inline-block' }}>
                    {selected.status}
                  </span>
                </div>
                <button style={styles.closeBtn} onClick={() => setSelected(null)}>✕</button>
              </div>

              <hr className="divider" />

              {/* Contact */}
              <Section title="Contact">
                <Row label="Name" value={selected.customer_name} />
                <Row label="Company" value={selected.company} />
                <Row label="Email" value={selected.email} />
                <Row label="Phone" value={selected.phone} />
              </Section>

              {/* Requirements */}
              <Section title="Requirements">
                <Row label="Requested Quantity" value={selected.quantity} />
                <Row label="Quoted Product" value={selected.quotation_product || selected.recommended_product} />
                <Row label="Application" value={selected.application} />
                <Row label="Liquid Type" value={selected.liquid_type} />
                <Row label="Viscosity" value={selected.viscosity_cp != null ? `${selected.viscosity_cp} cP` : null} />
                <Row label="Flow Rate" value={selected.flow_rate_ml_min != null ? `${selected.flow_rate_ml_min} ml/min` : null} />
                <Row label="Droplet Size" value={selected.droplet_size_um != null ? `${selected.droplet_size_um} µm` : null} />
                <Row label="Frequency" value={selected.frequency_khz != null ? `${selected.frequency_khz} kHz` : null} />
                <Row label="AI Product Recommendation" value={selected.recommended_product} />
                <Row label="Additional Notes" value={selected.additional_requirements} />
              </Section>

              {selected.status === 'Approved' && selected.quotation_total != null && (
                <Section title="Approved quotation">
                  <Row label="Product unit price" value={`${selected.currency} ${Number(selected.unit_price).toFixed(2)}`} />
                  <Row label="Quantity" value={selected.quantity} />
                  <Row label="Subtotal" value={`${selected.currency} ${Number(selected.quotation_subtotal).toFixed(2)}`} />
                  <Row label={`Tax (${selected.tax_rate_percent}%)`} value={`${selected.currency} ${Number(selected.tax_amount).toFixed(2)}`} />
                  <Row label="Shipping" value={`${selected.currency} ${Number(selected.shipping_charge).toFixed(2)}`} />
                  <Row label="Customization" value={`${selected.currency} ${Number(selected.customization_charge).toFixed(2)}`} />
                  <Row label="Total" value={`${selected.currency} ${Number(selected.quotation_total).toFixed(2)}`} />
                  <Row label="Valid until" value={selected.quotation_valid_until} />
                  <Row label="Payment terms" value={selected.payment_terms} />
                  <button
                    className="btn btn-primary"
                    style={{ marginTop: 12 }}
                    disabled={downloadingQuotationId === selected.id}
                    onClick={() => downloadQuotationPdf(selected)}
                  >
                    {downloadingQuotationId === selected.id ? 'Preparing PDF…' : '⬇ Download approved quotation PDF'}
                  </button>
                </Section>
              )}

              {selected.follow_ups?.length > 0 && (
                <Section title="Follow-up Calls Scheduled by Admin">
                  {selected.follow_ups.map(call => (
                    <div key={call.id} style={{
                      padding: '10px 12px', marginBottom: 8, borderRadius: 8,
                      background: 'rgba(59, 130, 246, 0.08)',
                      border: '1px solid rgba(59, 130, 246, 0.18)',
                      color: '#cbd5e1', fontSize: '0.85rem',
                    }}>
                      <strong style={{ color: '#60a5fa' }}>{call.action_taken || 'Follow-up call'} · {call.status}</strong>
                      <div style={{ marginTop: 4 }}>Scheduled for {formatDate(call.follow_up_date)}</div>
                      {call.notes && <div style={{ marginTop: 4 }}>{call.notes}</div>}
                    </div>
                  ))}
                </Section>
              )}

              {selected.reviewed_by && (
                <div
                  className={`alert ${selected.status === 'Approved' ? 'alert-success' : selected.status === 'Rejected' ? 'alert-error' : 'alert-warning'}`}
                  style={{ marginBottom: 16 }}
                  role="status"
                >
                  <div>
                    <strong>
                      Admin decision: {selected.status}
                    </strong>
                    <div style={{ marginTop: 4 }}>
                      {selected.admin_comments || `Your quotation request is ${selected.status.toLowerCase()}.`}
                    </div>
                    <div style={{ marginTop: 6, fontSize: '0.75rem', opacity: 0.8 }}>
                      Reviewed by {selected.reviewed_by} · {formatDate(selected.reviewed_at)}
                    </div>
                  </div>
                </div>
              )}

              <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: 8 }}>
                Submitted: {formatDate(selected.created_at)}
              </div>
            </div>
          ) : (
            <div style={styles.detailEmpty}>
              <span style={{ fontSize: '2rem' }}>👈</span>
              <span style={{ color: '#64748b', fontSize: '0.88rem' }}>Select a quotation to view details</span>
            </div>
          )}
        </div>
      )}

      {/* New Quotation Modal */}
      {showNew && (
        <div className="responsive-modal-overlay" style={styles.overlay} onClick={e => e.target === e.currentTarget && setShowNew(false)}>
          <div className="glass-card fade-in responsive-modal" style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.1rem', fontWeight: 700 }}>New Quotation Request</h2>
              <button style={styles.closeBtn} onClick={() => setShowNew(false)}>✕</button>
            </div>
            <div className="responsive-modal-body" style={{ overflowY: 'auto', padding: 20 }}>
              <QuotationForm
                onSuccess={() => { load(); setTimeout(() => setShowNew(false), 3500) }}
                onCancel={() => setShowNew(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function Row({ label, value }) {
  if (!value) return null
  return (
    <div className="responsive-detail-row" style={{ display: 'flex', gap: 12, padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span style={{ fontSize: '0.78rem', color: '#64748b', minWidth: 140, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '0.85rem', color: '#cbd5e1', wordBreak: 'break-word' }}>{value}</span>
    </div>
  )
}

const styles = {
  page: { maxWidth: 1280, margin: '0 auto', padding: '28px 20px' },
  pageHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 },
  title: { fontFamily: 'Outfit, sans-serif', fontSize: '1.8rem', fontWeight: 800 },
  statsRow: { display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' },
  statCard: { padding: '14px 18px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4, minWidth: 120 },
  center: { display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', padding: 60 },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '60px 20px', textAlign: 'center' },
  layout: { display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20, alignItems: 'flex-start' },
  list: { display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '75vh', overflowY: 'auto', paddingRight: 4 },
  listItem: { padding: '14px 16px', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', flexDirection: 'column', gap: 4 },
  listItemActive: { borderColor: 'rgba(0,201,200,0.4)', background: 'rgba(0,201,200,0.06)' },
  listTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
  detail: { padding: '20px 22px', maxHeight: '80vh', overflowY: 'auto' },
  detailHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 },
  detailEmpty: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 40, minHeight: 200 },
  closeBtn: { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.1rem', padding: 4 },
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20,
  },
  modal: { width: '100%', maxWidth: 640, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  modalHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0,
  },
}
