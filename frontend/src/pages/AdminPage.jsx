// pages/AdminPage.jsx — Admin dashboard for managing quotations
import { useState, useEffect } from 'react'
import { adminApi, followupsApi } from '../api'

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
  const timestamp = /(?:Z|[+-]\d{2}:\d{2})$/i.test(dateStr) ? dateStr : `${dateStr}Z`
  return new Date(timestamp).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Kolkata',
    timeZoneName: 'short',
  })
}

function istDateTimeToIso(dateTime) {
  return new Date(`${dateTime}:00+05:30`).toISOString()
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
  const [quoteForm, setQuoteForm] = useState({
    quotation_product: '',
    unit_price: '',
    tax_rate_percent: '0',
    shipping_charge: '0',
    customization_charge: '0',
    currency: 'INR',
    validity_days: '30',
    payment_terms: '',
  })
  const [actionSuccess, setActionSuccess] = useState('')
  const [showLogs, setShowLogs] = useState(false)
  const [activityLogs, setActivityLogs] = useState([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [followUps, setFollowUps] = useState([])
  const [followUpsLoading, setFollowUpsLoading] = useState(false)
  const [followUpDate, setFollowUpDate] = useState('')
  const [followUpNotes, setFollowUpNotes] = useState('')
  const [followUpLoading, setFollowUpLoading] = useState(false)
  const [followUpMessage, setFollowUpMessage] = useState('')
  const [scheduledCalls, setScheduledCalls] = useState([])
  const [scheduledCallsLoading, setScheduledCallsLoading] = useState(false)
  const [scheduledCallsError, setScheduledCallsError] = useState('')

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

  const loadFollowUps = async (quotationId) => {
    setFollowUpsLoading(true)
    try {
      const res = await followupsApi.forQuotation(quotationId)
      setFollowUps(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load scheduled follow-ups.')
    } finally {
      setFollowUpsLoading(false)
    }
  }

  const loadScheduledCalls = async () => {
    setScheduledCallsLoading(true)
    setScheduledCallsError('')
    try {
      const res = await followupsApi.allForAdmin()
      setScheduledCalls(res.data)
    } catch (err) {
      setScheduledCallsError(err.response?.data?.detail || 'Failed to load scheduled calls.')
    } finally {
      setScheduledCallsLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
    loadQuotations(activeFilter)
    loadScheduledCalls()
  }, [])

  const handleFilterChange = (filter) => {
    setActiveFilter(filter)
    setSelected(null)
    setActionSuccess('')
    setError('')
    loadQuotations(filter)
  }

  const handleScheduleFollowUp = async () => {
    if (!followUpDate) {
      setFollowUpMessage('Choose a date and time for the follow-up call.')
      return
    }
    if (new Date(istDateTimeToIso(followUpDate)).getTime() <= Date.now()) {
      setFollowUpMessage('The follow-up call must be scheduled for a future time.')
      return
    }

    setFollowUpLoading(true)
    setFollowUpMessage('')
    try {
      await followupsApi.create({
        quotation_id: selected.id,
        action_taken: 'Follow-up call',
        notes: followUpNotes.trim() || null,
        follow_up_date: istDateTimeToIso(followUpDate),
        status: 'Scheduled',
      })
      setFollowUpMessage('Follow-up call scheduled.')
      setFollowUpDate('')
      setFollowUpNotes('')
      await Promise.all([loadFollowUps(selected.id), loadScheduledCalls()])
    } catch (err) {
      setFollowUpMessage(err.response?.data?.detail || 'Could not schedule the follow-up call.')
    } finally {
      setFollowUpLoading(false)
    }
  }

  const openScheduledQuotation = async (quotationId) => {
    try {
      const response = await adminApi.getQuotation(quotationId)
      setSelected(response.data)
      setQuoteForm({
        quotation_product: response.data.quotation_product || response.data.recommended_product || '',
        unit_price: response.data.unit_price ?? '',
        tax_rate_percent: response.data.tax_rate_percent ?? '0',
        shipping_charge: response.data.shipping_charge ?? '0',
        customization_charge: response.data.customization_charge ?? '0',
        currency: response.data.currency ?? 'INR',
        validity_days: response.data.validity_days ?? '30',
        payment_terms: response.data.payment_terms ?? '',
      })
      setComments('')
      setActionSuccess('')
      setFollowUpMessage('')
      await loadFollowUps(quotationId)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load the quotation for this call.')
    }
  }

  const handleAction = async (quotationId, action) => {
    setActionLoading(true)
    setActionSuccess('')
    try {
      const pricing = action === 'Approved' ? {
        quotation_product: quoteForm.quotation_product.trim(),
        unit_price: Number(quoteForm.unit_price),
        tax_rate_percent: Number(quoteForm.tax_rate_percent),
        shipping_charge: Number(quoteForm.shipping_charge),
        customization_charge: Number(quoteForm.customization_charge),
        currency: quoteForm.currency.trim().toUpperCase(),
        validity_days: Number(quoteForm.validity_days),
        payment_terms: quoteForm.payment_terms.trim(),
      } : {}
      const res = await adminApi.updateQuotation(quotationId, action, comments, pricing)
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
      if (err.response?.status === 502) {
        try {
          const refreshed = await adminApi.getQuotation(quotationId)
          setSelected(refreshed.data)
          await Promise.all([loadQuotations(activeFilter), loadDashboard()])
        } catch (refreshError) {
          console.warn('Could not refresh the approved quotation after email delivery failed.', refreshError)
        }
      }
    } finally {
      setActionLoading(false)
    }
  }

  const handleResendQuotation = async (quotationId) => {
    setActionLoading(true)
    setError('')
    setActionSuccess('')
    try {
      const response = await adminApi.resendQuotationEmail(quotationId)
      const refreshed = await adminApi.getQuotation(quotationId)
      setSelected(refreshed.data)
      setActionSuccess(response.data.message)
      await loadQuotations(activeFilter)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send the quotation email.')
    } finally {
      setActionLoading(false)
    }
  }

  const quotationInput = (field, value) => setQuoteForm(current => ({ ...current, [field]: value }))
  const numericQuoteFields = ['unit_price', 'tax_rate_percent', 'shipping_charge', 'customization_charge', 'validity_days']
  const quoteNumbersValid = numericQuoteFields.every(field =>
    quoteForm[field] !== '' && Number.isFinite(Number(quoteForm[field])) && Number(quoteForm[field]) >= 0
  )
  const quoteTotalPreview = (() => {
    if (!selected || !quoteNumbersValid) return null
    const subtotal = Number(quoteForm.unit_price) * selected.quantity
    const taxBase = subtotal + Number(quoteForm.shipping_charge) + Number(quoteForm.customization_charge)
    return (taxBase + taxBase * Number(quoteForm.tax_rate_percent) / 100).toFixed(2)
  })()
  const canApproveQuote = quoteNumbersValid
    && Number.isInteger(Number(quoteForm.validity_days))
    && Number(quoteForm.validity_days) >= 1
    && Number(quoteForm.validity_days) <= 365
    && /^[A-Za-z]{3}$/.test(quoteForm.currency.trim())
    && quoteForm.quotation_product.trim().length > 0
    && quoteForm.payment_terms.trim().length > 0

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
            onClick={() => { loadQuotations(activeFilter); loadDashboard(); loadScheduledCalls() }}
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

      <div className="glass-card fade-in" style={styles.scheduledCallsPanel}>
        <h3 style={styles.logsPanelTitle}>📞 Scheduled Follow-up Calls ({scheduledCalls.length})</h3>
        {scheduledCallsLoading ? (
          <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Loading scheduled calls…</div>
        ) : scheduledCallsError ? (
          <div className="alert alert-error" role="status">{scheduledCallsError}</div>
        ) : scheduledCalls.length === 0 ? (
          <p style={{ color: '#64748b', margin: 0 }}>No follow-up calls scheduled.</p>
        ) : (
          <div style={styles.scheduledCallsList}>
            {scheduledCalls.map(call => (
              <div key={call.id} style={styles.scheduledCall}>
                <div style={styles.scheduledCallHeading}>
                  <strong>{call.customer_name}</strong>
                  <StatusBadge status={call.status} />
                </div>
                {call.company && <div style={{ color: '#94a3b8' }}>{call.company}</div>}
                <div>📅 {formatDate(call.follow_up_date)}</div>
                <div>✉️ {call.email}</div>
                {call.phone ? (
                  <a href={`tel:${call.phone}`} style={styles.callPhone}>📞 {call.phone}</a>
                ) : (
                  <div style={{ color: '#f59e0b' }}>No phone number provided</div>
                )}
                {call.application && <div>Application: {call.application}</div>}
                {call.notes && <div style={styles.scheduledCallNotes}>Notes: {call.notes}</div>}
                <button
                  className="btn btn-secondary"
                  style={{ alignSelf: 'flex-start', fontSize: '0.78rem', marginTop: 4 }}
                  onClick={() => openScheduledQuotation(call.quotation_id)}
                >
                  View quotation
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

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
                onClick={() => {
                  setSelected(q)
                  setQuoteForm({
                    quotation_product: q.quotation_product || q.recommended_product || '',
                    unit_price: q.unit_price ?? '',
                    tax_rate_percent: q.tax_rate_percent ?? '0',
                    shipping_charge: q.shipping_charge ?? '0',
                    customization_charge: q.customization_charge ?? '0',
                    currency: q.currency ?? 'INR',
                    validity_days: q.validity_days ?? '30',
                    payment_terms: q.payment_terms ?? '',
                  })
                  setComments('')
                  setActionSuccess('')
                  setFollowUpMessage('')
                  setFollowUps([])
                  loadFollowUps(q.id)
                }}
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
                {q.quotation_total != null && (
                  <div style={{ fontSize: '0.78rem', color: '#00c9c8', fontWeight: 600, marginTop: 4 }}>
                    Quote: {q.currency} {Number(q.quotation_total).toFixed(2)}
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
                <DetailRow label="Requested Quantity" value={selected.quantity} />
                <DetailRow label="Application" value={selected.application} />
                <DetailRow label="Liquid Type" value={selected.liquid_type} />
                <DetailRow label="Viscosity" value={selected.viscosity_cp != null ? `${selected.viscosity_cp} cP` : null} />
                <DetailRow label="Flow Rate" value={selected.flow_rate_ml_min != null ? `${selected.flow_rate_ml_min} ml/min` : null} />
                <DetailRow label="Droplet Size" value={selected.droplet_size_um != null ? `${selected.droplet_size_um} µm` : null} />
                <DetailRow label="Frequency" value={selected.frequency_khz != null ? `${selected.frequency_khz} kHz` : null} />
                <DetailRow label="Product" value={selected.recommended_product} />
                <DetailRow label="Notes" value={selected.additional_requirements} />
              </DetailSection>

              <DetailSection title="💰 Commercial Quotation">
                {selected.status === 'Approved' ? (
                  selected.quotation_total != null ? <>
                    <DetailRow label="Unit Price" value={`${selected.currency} ${Number(selected.unit_price).toFixed(2)}`} />
                    <DetailRow label="Quantity" value={selected.quantity} />
                    <DetailRow label="Subtotal" value={`${selected.currency} ${Number(selected.quotation_subtotal).toFixed(2)}`} />
                    <DetailRow label={`Tax (${selected.tax_rate_percent}%)`} value={`${selected.currency} ${Number(selected.tax_amount).toFixed(2)}`} />
                    <DetailRow label="Shipping" value={`${selected.currency} ${Number(selected.shipping_charge).toFixed(2)}`} />
                    <DetailRow label="Customization" value={`${selected.currency} ${Number(selected.customization_charge).toFixed(2)}`} />
                    <DetailRow label="Total" value={`${selected.currency} ${Number(selected.quotation_total).toFixed(2)}`} />
                    <DetailRow label="Validity" value={`${selected.validity_days} days · valid until ${selected.quotation_valid_until}`} />
                    <DetailRow label="Payment Terms" value={selected.payment_terms} />
                    <DetailRow label="Email Delivery" value={selected.quotation_email_status || 'Not sent'} />
                    <button
                      className="btn btn-secondary"
                      disabled={actionLoading}
                      onClick={() => handleResendQuotation(selected.id)}
                      style={{ marginTop: 8 }}
                    >
                      {actionLoading ? 'Sending…' : '✉️ Send / Retry quotation email'}
                    </button>
                  </> : <div style={{ color: '#f59e0b', fontSize: '0.85rem' }}>
                    This legacy approved request has no finalized commercial quotation attached.
                  </div>
                ) : (
                  <>
                    <DetailRow label="Requested Quantity" value={selected.quantity} />
                    <div style={styles.quoteFields}>
                      <QuoteInput label="Verified product" value={quoteForm.quotation_product} onChange={value => quotationInput('quotation_product', value)} maxLength={300} />
                      <QuoteInput label="Unit price" value={quoteForm.unit_price} onChange={value => quotationInput('unit_price', value)} />
                      <QuoteInput label="Tax rate (%)" value={quoteForm.tax_rate_percent} onChange={value => quotationInput('tax_rate_percent', value)} />
                      <QuoteInput label="Shipping charge" value={quoteForm.shipping_charge} onChange={value => quotationInput('shipping_charge', value)} />
                      <QuoteInput label="Customization charge" value={quoteForm.customization_charge} onChange={value => quotationInput('customization_charge', value)} />
                      <QuoteInput label="Currency code" value={quoteForm.currency} onChange={value => quotationInput('currency', value)} maxLength={3} />
                      <QuoteInput label="Validity (days)" value={quoteForm.validity_days} onChange={value => quotationInput('validity_days', value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Payment terms *</label>
                      <textarea
                        className="form-textarea"
                        rows={2}
                        value={quoteForm.payment_terms}
                        onChange={event => quotationInput('payment_terms', event.target.value)}
                        placeholder="Enter payment terms for this quotation"
                      />
                    </div>
                    {quoteTotalPreview !== null && (
                      <DetailRow label="Calculated total" value={`${quoteForm.currency.toUpperCase()} ${quoteTotalPreview}`} />
                    )}
                    <DetailRow label="Tax calculation" value="Tax is applied to subtotal, shipping, and customization charges." />
                  </>
                )}
              </DetailSection>

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
                    disabled={actionLoading || selected.status === 'Approved' || !canApproveQuote}
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

              <div style={styles.actionsSection}>
                <h4 style={styles.actionTitle}>📞 Follow-up Calls</h4>
                {followUpsLoading ? (
                  <div style={{ color: '#94a3b8', fontSize: '0.82rem' }}>Loading follow-ups…</div>
                ) : followUps.length > 0 ? (
                  <div style={{ marginBottom: 12 }}>
                    {followUps.map(followUp => (
                      <div key={followUp.id} style={{
                        padding: '8px 0',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        color: '#cbd5e1',
                        fontSize: '0.82rem',
                      }}>
                        <strong>{followUp.status}</strong>
                        {' · '}{followUp.action_taken || 'Follow-up'}
                        {followUp.follow_up_date && ` · ${formatDate(followUp.follow_up_date)}`}
                        {followUp.notes && <div style={{ color: '#94a3b8' }}>{followUp.notes}</div>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: 10 }}>
                    No follow-up calls scheduled.
                  </p>
                )}
                <div className="form-group">
                  <label className="form-label" htmlFor="follow-up-date">Schedule date and time (IST)</label>
                  <input
                    id="follow-up-date"
                    className="form-input"
                    type="datetime-local"
                    value={followUpDate}
                    onChange={event => setFollowUpDate(event.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="follow-up-notes">Call notes (optional)</label>
                  <textarea
                    id="follow-up-notes"
                    className="form-textarea"
                    rows={2}
                    value={followUpNotes}
                    onChange={event => setFollowUpNotes(event.target.value)}
                    placeholder="Add any context for the call..."
                  />
                </div>
                {followUpMessage && (
                  <div
                    className={`alert ${followUpMessage === 'Follow-up call scheduled.' ? 'alert-success' : 'alert-error'}`}
                    role="status"
                    style={{ margin: '8px 0' }}
                  >
                    {followUpMessage}
                  </div>
                )}
                <button
                  className="btn btn-secondary"
                  disabled={followUpLoading || followUpsLoading}
                  onClick={handleScheduleFollowUp}
                >
                  {followUpLoading ? 'Scheduling…' : '📞 Schedule Follow-up Call'}
                </button>
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
  if (value == null || value === '') return null
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

function QuoteInput({ label, value, onChange, maxLength }) {
  const currencyField = label === 'Currency code'
  const textField = currencyField || label === 'Verified product'
  return (
    <div className="form-group">
      <label className="form-label">{label} *</label>
      <input
        className="form-input"
        type={textField ? 'text' : 'number'}
        min={currencyField ? undefined : '0'}
        step={label === 'Validity (days)' ? '1' : '0.01'}
        maxLength={maxLength}
        value={value}
        onChange={event => onChange(event.target.value)}
      />
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
  quoteFields: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0 12px' },
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
  scheduledCallsPanel: { padding: 20, marginBottom: 24 },
  scheduledCallsList: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 12, maxHeight: 420, overflowY: 'auto',
  },
  scheduledCall: {
    display: 'flex', flexDirection: 'column', gap: 6, padding: 14,
    borderRadius: 10, border: '1px solid rgba(0,201,200,0.14)',
    background: 'rgba(0,201,200,0.035)', color: '#cbd5e1', fontSize: '0.82rem',
    overflowWrap: 'anywhere',
  },
  scheduledCallHeading: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
    color: '#f1f5f9',
  },
  scheduledCallNotes: { color: '#94a3b8', whiteSpace: 'pre-wrap' },
  callPhone: { color: '#00c9c8', textDecoration: 'none' },
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
