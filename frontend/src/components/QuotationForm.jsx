// QuotationForm.jsx — Customer quotation request form
import { useState } from 'react'
import { quotationsApi } from '../api'

const STATUS_STEPS = ['Fill Form', 'Review', 'Submitted']

export default function QuotationForm({ prefilledProduct, onSuccess, onCancel }) {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [quotationId, setQuotationId] = useState(null)

  const [form, setForm] = useState({
    customer_name: '',
    company: '',
    email: '',
    phone: '',
    application: '',
    liquid_type: '',
    viscosity_cp: '',
    flow_rate_ml_min: '',
    droplet_size_um: '',
    frequency_khz: '',
    additional_requirements: '',
    recommended_product: prefilledProduct?.name || '',
    notes: '',
  })

  const [errors, setErrors] = useState({})

  const update = (field, value) => {
    setForm(f => ({ ...f, [field]: value }))
    setErrors(e => ({ ...e, [field]: '' }))
  }

  // Determine if required fields are filled and valid
  const isFormValid = () => {
    // Required: customer_name and a valid email
    if (!form.customer_name?.trim()) return false
    if (!form.email?.trim() || !/\S+@\S+\.\S+/.test(form.email)) return false
    return true
  }

  const validateStep = () => {
    const errs = {}
    if (step === 0) {
      if (!form.customer_name.trim()) errs.customer_name = 'Name is required'
      if (!form.email.trim()) errs.email = 'Email is required'
      else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const nextStep = () => {
    if (validateStep()) setStep(s => s + 1)
  }

  const handleSubmit = async () => {
    // Ensure required fields are present before sending
    if (!isFormValid()) {
      setError('Please provide a valid name and email before submitting.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const payload = { ...form }
      // Convert numeric strings to numbers or null
      ;['viscosity_cp', 'flow_rate_ml_min', 'droplet_size_um', 'frequency_khz'].forEach(k => {
        payload[k] = form[k] ? parseFloat(form[k]) : null
      })
      const res = await quotationsApi.create(payload)
      setQuotationId(res.data.id)
      setSubmitted(true)
      if (onSuccess) onSuccess(res.data)
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        'Failed to submit quotation. Please check your connection and try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div style={styles.successWrap} className="fade-in">
        <div style={styles.successIcon}>✅</div>
        <h2 style={styles.successTitle}>Quotation Submitted!</h2>
        <p style={styles.successText}>
          Thank you, <strong>{form.customer_name}</strong>. Your quotation request
          #{quotationId} has been saved. The WaveNxD team will contact you at{' '}
          <strong>{form.email}</strong>.
        </p>
        <div className="alert alert-warning" style={{ marginTop: 16, fontSize: '0.8rem' }}>
          ⚠️ Product recommendations are preliminary and subject to confirmation from the WaveNxD Technologies technical team.
        </div>
        <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={onCancel}>
          Done
        </button>
      </div>
    )
  }

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <div style={styles.wrap}>
      {/* Steps indicator */}
      <div style={styles.steps}>
        {STATUS_STEPS.map((s, i) => (
          <div key={s} style={styles.stepItem}>
            <div style={{
              ...styles.stepDot,
              ...(i <= step ? styles.stepDotActive : {}),
            }}>{i + 1}</div>
            <span style={{ ...styles.stepLabel, color: i <= step ? '#00c9c8' : '#64748b' }}>{s}</span>
          </div>
        ))}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Step 0 — Contact */}
      {step === 0 && (
        <div className="fade-in">
          <h3 style={styles.sectionTitle}>Contact Details</h3>
          <div style={styles.grid2}>
            <Field label="Full Name *" error={errors.customer_name}>
              <input className="form-input" placeholder="Your name" value={form.customer_name}
                onChange={e => update('customer_name', e.target.value)} />
            </Field>
            <Field label="Company">
              <input className="form-input" placeholder="Company name (optional)" value={form.company}
                onChange={e => update('company', e.target.value)} />
            </Field>
            <Field label="Email *" error={errors.email}>
              <input className="form-input" type="email" placeholder="you@company.com" value={form.email}
                onChange={e => update('email', e.target.value)} />
            </Field>
            <Field label="Phone">
              <input className="form-input" type="tel" placeholder="+91 98765 43210" value={form.phone}
                onChange={e => update('phone', e.target.value)} />
            </Field>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
            <button className="btn btn-primary" onClick={nextStep}>Next →</button>
          </div>
        </div>
      )}

      {/* Step 1 — Requirements */}
      {step === 1 && (
        <div className="fade-in">
          <h3 style={styles.sectionTitle}>Application Requirements</h3>
          <Field label="Application / Use Case">
            <input className="form-input" placeholder="e.g. Spray drying, fuel cell coating…" value={form.application}
              onChange={e => update('application', e.target.value)} />
          </Field>
          <Field label="Liquid Type">
            <input className="form-input" placeholder="e.g. Nafion solution, catalyst ink…" value={form.liquid_type}
              onChange={e => update('liquid_type', e.target.value)} />
          </Field>
          <div style={styles.grid2}>
            <Field label="Viscosity (cP)">
              <input className="form-input" type="number" min="0" placeholder="e.g. 50" value={form.viscosity_cp}
                onChange={e => update('viscosity_cp', e.target.value)} />
            </Field>
            <Field label="Flow Rate (ml/min)">
              <input className="form-input" type="number" min="0" placeholder="e.g. 5" value={form.flow_rate_ml_min}
                onChange={e => update('flow_rate_ml_min', e.target.value)} />
            </Field>
            <Field label="Droplet Size (µm)">
              <input className="form-input" type="number" min="0" placeholder="e.g. 40" value={form.droplet_size_um}
                onChange={e => update('droplet_size_um', e.target.value)} />
            </Field>
            <Field label="Frequency (kHz)">
              <input className="form-input" type="number" min="0" placeholder="e.g. 60" value={form.frequency_khz}
                onChange={e => update('frequency_khz', e.target.value)} />
            </Field>
          </div>
          <Field label="Recommended Product (from AI)">
            <input className="form-input" value={form.recommended_product}
              onChange={e => update('recommended_product', e.target.value)} />
          </Field>
          <Field label="Additional Requirements">
            <textarea className="form-textarea" rows={3} placeholder="Any special requirements…" value={form.additional_requirements}
              onChange={e => update('additional_requirements', e.target.value)} />
          </Field>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button className="btn btn-secondary" onClick={() => setStep(0)}>← Back</button>
            <button className="btn btn-primary" onClick={nextStep}>Review →</button>
          </div>
        </div>
      )}

      {/* Step 2 — Review */}
      {step === 2 && (
        <div className="fade-in">
          <h3 style={styles.sectionTitle}>Review & Submit</h3>
          <div style={styles.reviewGrid}>
            <ReviewRow label="Name" value={form.customer_name} />
            <ReviewRow label="Company" value={form.company} />
            <ReviewRow label="Email" value={form.email} />
            <ReviewRow label="Phone" value={form.phone} />
            <ReviewRow label="Application" value={form.application} />
            <ReviewRow label="Liquid Type" value={form.liquid_type} />
            <ReviewRow label="Viscosity" value={form.viscosity_cp ? `${form.viscosity_cp} cP` : '—'} />
            <ReviewRow label="Flow Rate" value={form.flow_rate_ml_min ? `${form.flow_rate_ml_min} ml/min` : '—'} />
            <ReviewRow label="Droplet Size" value={form.droplet_size_um ? `${form.droplet_size_um} µm` : '—'} />
            <ReviewRow label="Frequency" value={form.frequency_khz ? `${form.frequency_khz} kHz` : '—'} />
            <ReviewRow label="Recommended Product" value={form.recommended_product} />
            <ReviewRow label="Additional Notes" value={form.additional_requirements} />
          </div>
          <div className="alert alert-warning" style={{ marginTop: 12, fontSize: '0.8rem' }}>
            ⚠️ By submitting, you acknowledge this is a preliminary enquiry. All recommendations require technical confirmation.
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <button className="btn btn-secondary" onClick={() => setStep(1)} disabled={loading}>← Back</button>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={loading || !isFormValid()}
            >
              {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Submitting…</> : '✅ Submit Request'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, children, error }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {children}
      {error && <div className="form-error">{error}</div>}
    </div>
  )
}

function ReviewRow({ label, value }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', gap: 12, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ fontSize: '0.78rem', color: '#64748b', minWidth: 140, fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: '0.85rem', color: '#f1f5f9' }}>{value}</span>
    </div>
  )
}

const styles = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 16 },
  steps: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  stepItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.72rem',
    fontWeight: 700,
    background: 'rgba(255,255,255,0.08)',
    color: '#64748b',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  stepDotActive: {
    background: 'rgba(0,201,200,0.2)',
    color: '#00c9c8',
    border: '1px solid rgba(0,201,200,0.4)',
  },
  stepLabel: {
    fontSize: '0.75rem',
    fontWeight: 500,
  },
  sectionTitle: {
    fontSize: '1rem',
    fontWeight: 700,
    color: '#f1f5f9',
    marginBottom: 12,
    fontFamily: 'Outfit, sans-serif',
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '0 16px',
  },
  reviewGrid: {
    display: 'flex',
    flexDirection: 'column',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 10,
    padding: 14,
  },
  successWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: 10,
    padding: 20,
  },
  successIcon: { fontSize: '3rem' },
  successTitle: { fontSize: '1.4rem', fontFamily: 'Outfit, sans-serif', color: '#10b981' },
  successText: { fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6 },
}
