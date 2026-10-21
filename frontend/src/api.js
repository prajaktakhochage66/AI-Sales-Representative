// api.js — Axios instance configured to talk to the FastAPI backend
import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

export function getToken() {
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
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

export function setStoredUser(user) {
  localStorage.setItem('wavenxd_user', JSON.stringify(user))
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
      removeToken()
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
  updateStatus: (id, status) =>
    api.patch(`/quotations/${id}/status?status=${encodeURIComponent(status)}`),
  pendingCount: () => api.get('/quotations/pending-count'),
}

export const adminApi = {
  dashboard: () => api.get('/admin/dashboard'),
  listQuotations: (statusFilter) => {
    const params = statusFilter ? `?status_filter=${encodeURIComponent(statusFilter)}` : ''
    return api.get(`/admin/quotations${params}`)
  },
  getQuotation: (id) => api.get(`/admin/quotations/${id}`),
  updateQuotation: (id, action, admin_comments) =>
    api.patch(`/admin/quotations/${id}`, { action, admin_comments }),
  activityLogs: (limit = 50) => api.get(`/admin/activity-logs?limit=${limit}`),
}

export const statusApi = {
  get: () => api.get('/status'),
}

export default api
