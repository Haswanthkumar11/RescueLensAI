import axios from 'axios'
import { supabase } from './supabaseClient'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const api = axios.create({ baseURL: BASE_URL })

// Every protected backend route expects `Authorization: Bearer <token>`.
// Attach the current Supabase session's access token automatically so
// individual call sites don't have to think about it.
api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession()
  const token = data?.session?.access_token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// A 401 here means the backend rejected the token -- expired, revoked,
// or otherwise invalid. Rather than leave the UI looking like a request
// silently failed, clear the stale session and send the user back to
// log in. autoRefreshToken (see supabaseClient.js) already handles the
// common case of a token nearing expiry, so a 401 reaching here means
// refresh itself failed (e.g. the user was signed out elsewhere).
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      await supabase.auth.signOut()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

/**
 * Sends an emergency image file to the backend /analyze pipeline for AI analysis & risk scoring.
 * @param {File} file - Disaster scene photo file
 * @param {Function} [onUploadProgress] - Axios progress callback
 * @returns {Promise<Object>} Analysis response object including risk score and timeline
 */
export async function analyzeImage(file, onUploadProgress) {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await api.post('/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  })
  return data
}

/**
 * Fetches recent disaster incidents history (filtered by role on backend).
 * @param {number} [limit=50] - Maximum number of incidents to return
 * @returns {Promise<Array>} List of incident summary objects
 */
export async function fetchHistory(limit = 50) {
  const { data } = await api.get('/history', { params: { limit } })
  return data.incidents
}

/**
 * Fetches detailed incident data including AI detections, risk breakdown, and timeline.
 * @param {string} id - Incident UUID
 * @returns {Promise<Object>} Detailed incident object
 */
export async function fetchIncident(id) {
  const { data } = await api.get(`/incident/${id}`)
  return data
}

/**
 * Deletes an incident record from the database (admin permission required).
 * @param {string} id - Incident UUID
 * @returns {Promise<Object>} Deletion confirmation status
 */
export async function deleteIncident(id) {
  const { data } = await api.delete(`/incident/${id}`)
  return data
}

// The PDF route now requires auth, so a plain `<a href>` link (with no
// way to attach an Authorization header) no longer works. Fetch it as
// an authenticated blob instead, then hand the browser a local object
// URL to download -- same end-user result, works with protected routes.
/**
 * Downloads the generated PDF incident report as a Blob.
 * @param {string} id - Incident UUID
 * @returns {Promise<Blob>} Raw PDF blob data
 */
export async function downloadReportPdf(id) {
  const response = await api.get(`/incident/${id}/report.pdf`, { responseType: 'blob' })
  return response.data
}

/**
 * Fetches the current user's profile and assigned role.
 * @returns {Promise<Object>} User profile object
 */
export async function fetchProfile() {
  const { data } = await api.get('/profile/me')
  return data
}

/**
 * Updates self-service profile fields (name, phone, department, organization).
 * @param {Object} updates - Profile fields to update
 * @returns {Promise<Object>} Updated profile object
 */
export async function updateProfile(updates) {
  const { data } = await api.patch('/profile/me', updates)
  return data
}

/**
 * Fetches all user profiles (admin permission required).
 * @returns {Promise<Array>} List of user profiles
 */
export async function fetchUsers() {
  const { data } = await api.get('/profile/users')
  return data
}

/**
 * Updates a target user's role (admin permission required).
 * @param {string} userId - Target user UUID
 * @param {string} role - New role ("admin", "responder", "viewer")
 * @returns {Promise<Object>} Updated profile object
 */
export async function updateUserRole(userId, role) {
  const { data } = await api.patch(`/profile/users/${userId}/role`, { role })
  return data
}
