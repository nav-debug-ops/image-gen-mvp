/**
 * Shared HTTP client with JWT auth header injection.
 * All API calls go through this to ensure auth is attached.
 */

function getAuthToken() {
  return localStorage.getItem('auth_token')
}

export function setAuthToken(token) {
  localStorage.setItem('auth_token', token)
}

export function clearAuthToken() {
  localStorage.removeItem('auth_token')
}

export function isAuthenticated() {
  return !!getAuthToken()
}

/**
 * Safely parse JSON from a Response — returns null if body is empty or not valid JSON.
 */
export async function safeJson(response) {
  try {
    const text = await response.text()
    if (!text || !text.trim()) return null
    return JSON.parse(text)
  } catch {
    return null
  }
}

export async function fetchAPI(path, options = {}) {
  const token = getAuthToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const response = await fetch(path, { ...options, headers })

  if (response.status === 401) {
    clearAuthToken()
    window.location.href = '/login'
    throw new Error('Session expired')
  }

  return response
}
