/**
 * Auth API layer — login, register, logout, profile.
 */

import { fetchAPI, setAuthToken, clearAuthToken } from './client'

export async function register(email, password, displayName = '') {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, display_name: displayName }),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || 'Registration failed')
  }

  const data = await res.json()
  setAuthToken(data.access_token)
  return data
}

export async function login(email, password) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || 'Login failed')
  }

  const data = await res.json()
  setAuthToken(data.access_token)
  return data
}

export async function getMe() {
  const res = await fetchAPI('/api/auth/me')
  if (!res.ok) return null
  return res.json()
}

export function logout() {
  clearAuthToken()
  window.location.href = '/login'
}
