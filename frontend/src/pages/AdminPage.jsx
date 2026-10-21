// pages/AdminPage.jsx — Admin dashboard for managing quotations
import { useState, useEffect } from 'react'
import { adminApi } from '../api'

const STATUS_FILTERS = ['All', 'Pending', 'Approved', 'Rejected', 'In Review', 'Quoted', 'Closed']

const STATUS_COLORS = {
  Pending: { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: 'rgba(245,158,11,0.25)' },
  Approved: { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: 'rgba(16,185,129,0.25)' },
  Rejected: { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: 'rgba(239,68,68,0.25)' },
  'In Review': { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: 'rgba(59,130,246,0.25)' },
  Quoted: { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: 'rgba(16,185,129,0.25)' },
  Closed: { bg: 'rgba(148, 163, 184, 0.1)', color: '#94a3b8', border: 'rgba(148,163,184,0.15)' },
}

function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS['Closed']
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '3px 10px',
      borderRadius: 999, fontSize: '0.74rem', fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: '0.04em',
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
    }}>
      {status}
    </span>
  )
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function AdminPage({ user }) {
  const [dashboard, setDashboard] = useState(null)
  const [quotations, setQuotations] = useState([])
  const [activeFilter, setActiveFilter] = useState('Pending')
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [comments, setComments] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')
  const [showLogs, setShowLogs] = useState(false)
  const [activityLogs, setActivityLogs] = useState([])
  const [logsLoading, setLogsLoading] = useState(false)

  const loadDashboard = async () => {
    try {
      const res = await adminApi.dashboard()
      setDashboard(res.data)
    } catch (err) {
      console.warn('Failed to load dashboard', err)
    }
  }

  const loadQuotations = async (filter) => {
    setLoading(true)
    setError('')
    try {
      const statusParam = filter === 'All' ? null : filter
      const res = await adminApi.listQuotations(statusParam)
      setQuotations(res.data)
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Access denied. Admin privileges required.')
      } else {
        setError('Failed to load quotations. Is the backend running?')
      }
    } finally {
      setLoading(false)
    }
  }

  const loadActivityLogs = async () => {
    setLogsLoading(true)
    try {
      const res = await adminApi.activityLogs(50)
      setActivityLogs(res.data)
    } catch (err) {
      console.warn('Failed to load activity logs', err)
    } finally {
      setLogsLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
    loadQuotations(activeFilter)
  }, [])

  const handleFilterChange = (filter) => {
    setActiveFilter(filter)
    setSelected(null)
    setActionSuccess('')
    setError('')
    loadQuotations(filter)
  }

  const handleAction = async (quotationId, action) => {
    setActionLoading(true)
    setActionSuccess('')
    try {
      const res = await adminApi.updateQuotation(quotationId, action, comments)
      const updatedQuotation = { ...selected, ...res.data }
      setSelected(updatedQuotation)
      setQuotations(current =>
        current.map(quotation =>
          quotation.id === quotationId ? { ...quotation, ...res.data } : quotation
        )
      )
      setError('')
      setActionSuccess(res.data.message || `Quotation ${action.toLowerCase()} successfully!`)
      setComments('')
      await Promise.all([loadQuotations(activeFilter), loadDashboard()])
    } catch (err) {
      setError(err.response?.data?.detail || `Failed to ${action.toLowerCase()} quotation.`)
    } finally {
      setActionLoading(false)
    }
  }

  const ACTION_ICONS = {
    LOGIN: '🔑',
    REGISTER: '🆕',
    SUBMIT_QUOTATION: '📋',
    APPROVED_QUOTATION: '✅',
    REJECTED_QUOTATION: '❌',
    IN_REVIEW_QUOTATION: '🔍',
    QUOTED_QUOTATION: '💰',
    CLOSED_QUOTATION: '🔒',
    PENDING_QUOTATION: '⏳',
  }

  return (
    <div style={styles.page}>
      {/* Page header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            🛡️ Admin Panel
          </h1>
          <p style={styles.subtitle}>
            Logged in as <strong style={{ color: '#00c9c8' }}>{user?.username}</strong> · ADMIN
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn btn-secondary"
            style={{ fontSize: '0.82rem' }}
            disabled={loading}
            onClick={() => { loadQuotations(activeFilter); loadDashboard() }}
          >
            ↻ Refresh
          </button>
          <button
            className="btn btn-secondary"
            style={{ fontSize: '0.82rem' }}
            onClick={() => { setShowLogs(!showLogs); if (!showLogs) loadActivityLogs() }}
          >
            📊 {showLogs ? 'Hide Logs' : 'Activity Logs'}
          </button>
        </div>
      </div>

      {/* Dashboard stats */}
      {dashboard && (
        <div style={styles.statsGrid} className="fade-in">
          <StatCard icon="📋" label="Total" value={dashboard.total_quotations} color="#f1f5f9" />
          <StatCard icon="⏳" label="Pending" value={dashboard.pending} color="#f59e0b" />
          <StatCard icon="✅" label="Approved" value={dashboard.approved} color="#10b981" />
          <StatCard icon="❌" label="Rejected" value={dashboard.rejected} color="#ef4444" />
          <StatCard icon="🔍" label="In Review" value={dashboard.in_review} color="#3b82f6" />
          <StatCard icon="👥" label="Users" value={dashboard.total_users} color="#a78bfa" />
        </div>
      )}

      {/* Activity logs panel */}
      {showLogs && (
        <div className="glass-card fade-in" style={styles.logsPanel}>
          <h3 style={styles.logsPanelTitle}>📊 Recent Activity Logs</h3>
          {logsLoading ? (
            <div style={styles.center}>
              <span className="spinner" />
              <span style={{ color: '#94a3b8' }}>Loading logs…</span>
            </div>
          ) : activityLogs.length === 0 ? (
            <p style={{ color: '#64748b', textAlign: 'center', padding: 20 }}>No activity logs yet.</p>
          ) : (
            <div style={styles.logsTable}>
              <div style={styles.logsHeader}>
                <span style={styles.logsHeaderCell}>Time</span>
                <span style={styles.logsHeaderCell}>User</span>
                <span style={styles.logsHeaderCell}>Role</span>
                <span style={styles.logsHeaderCell}>Action</span>
                <span style={{ ...styles.logsHeaderCell, flex: 2 }}>Details</span>
              </div>
              {activityLogs.map((log, i) => (
                <div key={log.id} style={{
                  ...styles.logsRow,
                  background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                }}>
                  <span style={styles.logsCell}>{formatDate(log.created_at)}</span>
                  <span style={{ ...styles.logsCell, fontWeight: 600, color: '#f1f5f9' }}>{log.username}</span>
                  <span style={styles.logsCell}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 4, fontSize: '0.7rem', fontWeight: 600,
                      background: log.role === 'ADMIN' ? 'rgba(239,68,68,0.12)' : 'rgba(59,130,246,0.12)',
                      color: log.role === 'ADMIN' ? '#f87171' : '#60a5fa',
                    }}>
                      {log.role}
                    </span>
                  </span>
                  <span style={styles.logsCell}>
                    {ACTION_ICONS[log.action] || '📌'} {log.action}
                  </span>
                  <span style={{ ...styles.logsCell, flex: 2, color: '#94a3b8' }}>
                    {log.details || '—'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filter tabs */}
      <div style={styles.filterRow}>
        {STATUS_FILTERS.map(f => (
          <button
            key={f}
            className={`btn ${activeFilter === f ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.78rem', padding: '6px 14px' }}
            onClick={() => handleFilterChange(f)}
          >
            {f}
            {f !== 'All' && dashboard && (
              <span style={{ opacity: 0.7, marginLeft: 4 }}>
                ({f === 'Pending' ? dashboard.pending
                  : f === 'Approved' ? dashboard.approved
                  : f === 'Rejected' ? dashboard.rejected
                  : f === 'In Review' ? dashboard.in_review
                  : f === 'Quoted' ? dashboard.quoted
                  : f === 'Closed' ? dashboard.closed : 0})
              </span>
            )}
          </button>
        ))}
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
      {actionSuccess && (
        <div className="alert alert-success fade-in" style={{ marginBottom: 16 }} role="status">
          ✅ {actionSuccess}
        </div>
      )}

      {loading ? (
        <div style={styles.center}>
          <span className="spinner spinner-lg" />
          <span style={{ color: '#94a3b8' }}>Loading quotations…</span>
        </div>
      ) : quotations.length === 0 && !selected ? (
        <div style={styles.empty}>
          <div style={{ fontSize: '3rem' }}>📋</div>
          <h3 style={{ fontFamily: 'Outfit, sans-serif', color: '#f1f5f9' }}>
            No {activeFilter !== 'All' ? activeFilter : ''} Quotations
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem' }}>
            {activeFilter === 'Pending'
              ? 'No pending quotations to review right now.'
              : `No quotations with status "${activeFilter}" found.`}
          </p>
        </div>
      ) : (
        <div style={styles.layout}>
          {/* Quotation list */}
          <div style={styles.list}>
            {quotations.length === 0 ? (
              <div style={{ color: '#64748b', fontSize: '0.85rem', padding: 16 }}>
                No {activeFilter.toLowerCase()} requests remain in this filter.
              </div>
            ) : quotations.map(q => (
              <div
                key={q.id}
                className="glass-card"
                style={{
                  ...styles.listItem,
                  ...(selected?.id === q.id ? styles.listItemActive : {}),
                }}
                onClick={() => { setSelected(q); setComments(''); setActionSuccess('') }}
              >
                <div style={styles.listTop}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#f1f5f9' }}>
                    {q.customer_name}
                  </div>
                  <StatusBadge status={q.status} />
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{q.company || 'Individual'}</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{q.email}</div>
                {q.recommended_product && (
                  <div className="tag" style={{ marginTop: 6, display: 'inline-block' }}>{q.recommended_product}</div>
                )}
                {q.estimated_price != null && (
                  <div style={{ fontSize: '0.78rem', color: '#00c9c8', fontWeight: 600, marginTop: 4 }}>
                    Est. ₹{q.estimated_price}
                  </div>
                )}
                <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: 4 }}>
                  {formatDate(q.created_at)}
                </div>
              </div>
            ))}
          </div>

          {/* Detail panel */}
          {selected ? (
            <div className="glass-card slide-in" style={styles.detail}>
              <div style={styles.detailHeader}>
                <div>
                  <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.1rem', fontWeight: 700 }}>
                    Quotation Details
                  </h2>
                  <StatusBadge status={selected.status} />
                </div>
                <button style={styles.closeBtn} onClick={() => setSelected(null)}>✕</button>
              </div>

              <hr className="divider" />

              {/* Contact */}
              <DetailSection title="📧 Contact Info">
                <DetailRow label="Name" value={selected.customer_name} />
                <DetailRow label="Company" value={selected.company} />
                <DetailRow label="Email" value={selected.email} />
                <DetailRow label="Phone" value={selected.phone} />
              </DetailSection>

              {/* Requirements */}
              <DetailSection title="🔬 Technical Requirements">
                <DetailRow label="Application" value={selected.application} />
                <DetailRow label="Liquid Type" value={selected.liquid_type} />
                <DetailRow label="Viscosity" value={selected.viscosity_cp != null ? `${selected.viscosity_cp} cP` : null} />
                <DetailRow label="Flow Rate" value={selected.flow_rate_ml_min != null ? `${selected.flow_rate_ml_min} ml/min` : null} />
                <DetailRow label="Droplet Size" value={selected.droplet_size_um != null ? `${selected.droplet_size_um} µm` : null} />
                <DetailRow label="Frequency" value={selected.frequency_khz != null ? `${selected.frequency_khz} kHz` : null} />
                <DetailRow label="Product" value={selected.recommended_product} />
                <DetailRow label="Notes" value={selected.additional_requirements} />
              </DetailSection>

              {/* Pricing */}
              {selected.estimated_price != null && (
                <DetailSection title="💰 Pricing">
                  <DetailRow label="Estimated Price" value={`₹${selected.estimated_price}`} />
                </DetailSection>
              )}

              {/* Previous review */}
              {selected.reviewed_by && (
                <DetailSection title="📝 Previous Review">
                  <DetailRow label="Reviewed By" value={selected.reviewed_by} />
                  <DetailRow label="Reviewed At" value={formatDate(selected.reviewed_at)} />
                  <DetailRow label="Admin Comments" value={selected.admin_comments} />
                </DetailSection>
              )}

              {/* Admin actions */}
              <div style={styles.actionsSection}>
                <h4 style={styles.actionTitle}>⚡ Admin Actions</h4>
                <div className="form-group">
                  <label className="form-label">Message to the user (optional)</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    placeholder="This message will be visible to the user with your decision..."
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                  />
                </div>
                <div style={styles.actionBtns}>
                  <button
                    className="btn"
                    style={styles.approveBtn}
                    disabled={actionLoading || selected.status === 'Approved'}
                    onClick={() => handleAction(selected.id, 'Approved')}
                  >
                    {actionLoading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : '✅'} Approve
                  </button>
                  <button
                    className="btn btn-danger"
                    disabled={actionLoading || selected.status === 'Rejected'}
                    onClick={() => handleAction(selected.id, 'Rejected')}
                  >
                    {actionLoading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : '❌'} Reject
                  </button>
                  <button
                    className="btn btn-secondary"
                    disabled={actionLoading || selected.status === 'In Review'}
                    onClick={() => handleAction(selected.id, 'In Review')}
                    style={{ fontSize: '0.82rem' }}
                  >
                    🔍 Mark In Review
                  </button>
                </div>
              </div>

              <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: 12 }}>
                Submitted: {formatDate(selected.created_at)}
              </div>
            </div>
          ) : (
            <div style={styles.detailEmpty}>
              <span style={{ fontSize: '2.5rem' }}>👈</span>
              <span style={{ color: '#64748b', fontSize: '0.88rem' }}>Select a quotation to review</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="glass-card" style={styles.statCard}>
      <div style={{ fontSize: '1.4rem' }}>{icon}</div>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, color, fontFamily: 'Outfit, sans-serif' }}>
        {value}
      </div>
      <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500 }}>{label}</div>
    </div>
  )
}

function DetailSection({ title, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        fontSize: '0.78rem', color: '#64748b', fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8,
      }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function DetailRow({ label, value }) {
  if (!value) return null
  return (
    <div style={{
      display: 'flex', gap: 12, padding: '5px 0',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <span style={{ fontSize: '0.78rem', color: '#64748b', minWidth: 130, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '0.85rem', color: '#cbd5e1', wordBreak: 'break-word' }}>{value}</span>
    </div>
  )
}

const styles = {
  page: { maxWidth: 1400, margin: '0 auto', padding: '28px 20px' },
  header: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    marginBottom: 24, flexWrap: 'wrap', gap: 12,
  },
  title: { fontFamily: 'Outfit, sans-serif', fontSize: '1.8rem', fontWeight: 800 },
  subtitle: { color: '#94a3b8', fontSize: '0.88rem', marginTop: 4 },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: 12, marginBottom: 24,
  },
  statCard: {
    padding: '16px', display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 6, textAlign: 'center',
  },
  filterRow: {
    display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap',
  },
  center: { display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', padding: 60 },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '60px 20px', textAlign: 'center' },
  layout: { display: 'grid', gridTemplateColumns: '380px 1fr', gap: 20, alignItems: 'flex-start' },
  list: {
    display: 'flex', flexDirection: 'column', gap: 10,
    maxHeight: '75vh', overflowY: 'auto', paddingRight: 4,
  },
  listItem: {
    padding: '14px 16px', cursor: 'pointer', transition: 'all 0.15s',
    display: 'flex', flexDirection: 'column', gap: 4,
  },
  listItemActive: { borderColor: 'rgba(0,201,200,0.4)', background: 'rgba(0,201,200,0.06)' },
  listTop: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: 8, flexWrap: 'wrap',
  },
  detail: { padding: '22px 24px', maxHeight: '85vh', overflowY: 'auto' },
  detailHeader: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4,
  },
  detailEmpty: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: 10, padding: 60, minHeight: 300,
  },
  closeBtn: {
    background: 'none', border: 'none', color: '#94a3b8',
    cursor: 'pointer', fontSize: '1.1rem', padding: 4,
  },
  actionsSection: {
    marginTop: 16, padding: '16px', background: 'rgba(0,201,200,0.04)',
    border: '1px solid rgba(0,201,200,0.12)', borderRadius: 12,
  },
  actionTitle: {
    fontFamily: 'Outfit, sans-serif', fontSize: '0.9rem', fontWeight: 700,
    color: '#f1f5f9', marginBottom: 12,
  },
  actionBtns: {
    display: 'flex', gap: 8, flexWrap: 'wrap',
  },
  approveBtn: {
    background: 'rgba(16, 185, 129, 0.15)', color: '#10b981',
    border: '1px solid rgba(16,185,129,0.3)', fontSize: '0.85rem',
  },
  logsPanel: {
    padding: '20px', marginBottom: 24, maxHeight: '50vh', overflowY: 'auto',
  },
  logsPanelTitle: {
    fontFamily: 'Outfit, sans-serif', fontSize: '1rem', fontWeight: 700,
    color: '#f1f5f9', marginBottom: 14,
  },
  logsTable: { display: 'flex', flexDirection: 'column' },
  logsHeader: {
    display: 'flex', gap: 8, padding: '8px 12px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(0,201,200,0.04)',
    borderRadius: '8px 8px 0 0',
  },
  logsHeaderCell: {
    flex: 1, fontSize: '0.72rem', fontWeight: 600,
    color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em',
  },
  logsRow: {
    display: 'flex', gap: 8, padding: '8px 12px',
    borderBottom: '1px solid rgba(255,255,255,0.03)',
    transition: 'background 0.15s',
  },
  logsCell: {
    flex: 1, fontSize: '0.78rem', color: '#cbd5e1',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
}
