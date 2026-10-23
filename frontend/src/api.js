// api.js — Axios instance configured to talk to the FastAPI backend
import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

export function getToken() {
<<<<<<< HEAD
  migrateLegacyAuth()
  return sessionStorage.getItem('wavenxd_token')
}

export function setToken(token) {
  sessionStorage.setItem('wavenxd_token', token)
  clearLegacyAuth()
}

export function removeToken() {
  migrateLegacyAuth()
  sessionStorage.removeItem('wavenxd_token')
  sessionStorage.removeItem('wavenxd_user')
}

export function getStoredUser() {
  migrateLegacyAuth()
  const raw = sessionStorage.getItem('wavenxd_user')
=======
  return localStorage.getItem('wavenxd_token')
}

export function setToken(token) {
  localStorage.setItem('wavenxd_token', token)
}

export function removeToken() {
  localStorage.removeItem('wavenxd_token')
  localStorage.removeItem('wavenxd_user')
}

export function getStoredUser() {
  const raw = localStorage.getItem('wavenxd_user')
>>>>>>> 171b31ee03ffb6b8eba4c25febe1f1542b3422b8
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

export function setStoredUser(user) {
<<<<<<< HEAD
  sessionStorage.setItem('wavenxd_user', JSON.stringify(user))
  clearLegacyAuth()
}

function migrateLegacyAuth() {
  if (sessionStorage.getItem('wavenxd_token')) {
    clearLegacyAuth()
    return
  }

  const token = localStorage.getItem('wavenxd_token')
  const user = localStorage.getItem('wavenxd_user')
  if (token) sessionStorage.setItem('wavenxd_token', token)
  if (user) sessionStorage.setItem('wavenxd_user', user)
  if (token || user) clearLegacyAuth()
}

function clearLegacyAuth() {
  localStorage.removeItem('wavenxd_token')
  localStorage.removeItem('wavenxd_user')
=======
  localStorage.setItem('wavenxd_user', JSON.stringify(user))
>>>>>>> 171b31ee03ffb6b8eba4c25febe1f1542b3422b8
}

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
<<<<<<< HEAD
      const hadToken = Boolean(getToken())
      removeToken()
      if (hadToken && typeof window !== 'undefined') {
        window.dispatchEvent(new Event('wavenxd:unauthorized'))
      }
=======
      removeToken()
>>>>>>> 171b31ee03ffb6b8eba4c25febe1f1542b3422b8
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  login: (username, password) =>
    api.post('/auth/login-json', { username, password }),
  register: (username, password) =>
    api.post('/auth/register', { username, password }),
  me: () => api.get('/auth/me'),
}

export const chatApi = {
  newSession: () => api.get('/chat/new-session'),
  send: (session_id, message, history) =>
    api.post('/chat/', { session_id, message, history }),
<<<<<<< HEAD
  stream: async (session_id, message, history, onChunk) => {
    const headers = { 'Content-Type': 'application/json' }
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`

    const response = await fetch(`${api.defaults.baseURL}/chat/stream`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ session_id, message, history }),
    })

    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      throw new Error(body.detail || `Chat request failed (${response.status}).`)
    }
    if (!response.body) throw new Error('Streaming responses are not supported by this browser.')

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let aiAvailable = false
    let errorMessage = ''
    let receivedDone = false

    const processFrame = (frame) => {
      const dataLine = frame.split(/\r?\n/).find(line => line.startsWith('data:'))
      if (!dataLine) return
      const event = JSON.parse(dataLine.slice(5).trim())
      if (event.type === 'chunk') onChunk(event.text)
      if (event.type === 'replace') onChunk(event.text, true)
      if (event.type === 'error') errorMessage = event.message
      if (event.type === 'done') {
        aiAvailable = event.ai_available
        receivedDone = true
      }
    }

    while (true) {
      const { value, done } = await reader.read()
      buffer += decoder.decode(value || new Uint8Array(), { stream: !done })
      const frames = buffer.split(/\r?\n\r?\n/)
      buffer = frames.pop() || ''
      frames.forEach(processFrame)
      if (done) break
    }
    if (buffer.trim()) processFrame(buffer)
    if (!receivedDone) throw new Error('The chat stream ended before the response completed. Please try again.')

    return { ai_available: aiAvailable, error: errorMessage }
  },
=======
>>>>>>> 171b31ee03ffb6b8eba4c25febe1f1542b3422b8
}

export const productsApi = {
  list: () => api.get('/products/'),
  get: (id) => api.get(`/products/${id}`),
  recommend: (data) => api.post('/products/recommend', data),
}

export const quotationsApi = {
  create: (data) => api.post('/quotations/', data),
  list: () => api.get('/quotations/'),
  get: (id) => api.get(`/quotations/${id}`),
<<<<<<< HEAD
  downloadPdf: (id) => api.get(`/quotations/${id}/pdf`, { responseType: 'blob' }),
=======
>>>>>>> 171b31ee03ffb6b8eba4c25febe1f1542b3422b8
  updateStatus: (id, status) =>
    api.patch(`/quotations/${id}/status?status=${encodeURIComponent(status)}`),
  pendingCount: () => api.get('/quotations/pending-count'),
}

<<<<<<< HEAD
export const followupsApi = {
  create: (data) => api.post('/followups/', data),
  forQuotation: (quotationId) => api.get(`/followups/quotation/${quotationId}`),
  allForAdmin: () => api.get('/followups/admin/all'),
}

=======
>>>>>>> 171b31ee03ffb6b8eba4c25febe1f1542b3422b8
export const adminApi = {
  dashboard: () => api.get('/admin/dashboard'),
  listQuotations: (statusFilter) => {
    const params = statusFilter ? `?status_filter=${encodeURIComponent(statusFilter)}` : ''
    return api.get(`/admin/quotations${params}`)
  },
  getQuotation: (id) => api.get(`/admin/quotations/${id}`),
<<<<<<< HEAD
  updateQuotation: (id, action, admin_comments, pricing = {}) =>
    api.patch(`/admin/quotations/${id}`, { action, admin_comments, ...pricing }),
  resendQuotationEmail: (id) => api.post(`/admin/quotations/${id}/send-email`),
=======
  updateQuotation: (id, action, admin_comments) =>
    api.patch(`/admin/quotations/${id}`, { action, admin_comments }),
>>>>>>> 171b31ee03ffb6b8eba4c25febe1f1542b3422b8
  activityLogs: (limit = 50) => api.get(`/admin/activity-logs?limit=${limit}`),
}

export const statusApi = {
  get: () => api.get('/status'),
}

export default api
