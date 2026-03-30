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

export async function forgotPassword(email) {
  const res = await fetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || 'Request failed')
  }

  return res.json()
}

export async function updateProfile(displayName) {
  const res = await fetchAPI('/api/auth/me', {
    method: 'PATCH',
    body: JSON.stringify({ display_name: displayName }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || 'Update failed')
  }
  return res.json()
}

export async function changePassword(currentPassword, newPassword) {
  const res = await fetchAPI('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || 'Password change failed')
  }
  return res.json()
}

export async function resetPassword(token, password) {
  const res = await fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password }),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || 'Password reset failed')
  }

  return res.json()
}
