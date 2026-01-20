/**
 * Calendar Integration Service
 * Integrates with Google Calendar API (compatible with Clockwise)
 *
 * Clockwise uses Google Calendar under the hood, so we integrate directly
 * with Google Calendar API for maximum compatibility.
 *
 * Features:
 * - Create focus time blocks when starting sessions
 * - Track time spent on image generation
 * - Sync session data to calendar events
 */

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY
const SCOPES = 'https://www.googleapis.com/auth/calendar.events'

let gapiLoaded = false
let gisLoaded = false
let tokenClient = null

// Load the Google API scripts
export async function loadGoogleAPIs() {
  if (typeof window === 'undefined') return false

  // Load GAPI
  if (!window.gapi) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://apis.google.com/js/api.js'
      script.onload = resolve
      script.onerror = reject
      document.body.appendChild(script)
    })
  }

  // Load GIS (Google Identity Services)
  if (!window.google?.accounts) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.onload = resolve
      script.onerror = reject
      document.body.appendChild(script)
    })
  }

  return true
}

export async function initGoogleCalendar() {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_API_KEY) {
    console.warn('Google Calendar API credentials not configured')
    return false
  }

  try {
    await loadGoogleAPIs()

    // Initialize GAPI client
    await new Promise((resolve) => {
      window.gapi.load('client', resolve)
    })

    await window.gapi.client.init({
      apiKey: GOOGLE_API_KEY,
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest']
    })
    gapiLoaded = true

    // Initialize token client
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPES,
      callback: '' // Set later
    })
    gisLoaded = true

    return true
  } catch (error) {
    console.error('Failed to initialize Google Calendar:', error)
    return false
  }
}

export async function signIn() {
  if (!gisLoaded) {
    throw new Error('Google Identity Services not loaded')
  }

  return new Promise((resolve, reject) => {
    tokenClient.callback = (response) => {
      if (response.error) {
        reject(response.error)
      } else {
        resolve(response)
      }
    }
    tokenClient.requestAccessToken({ prompt: 'consent' })
  })
}

export function signOut() {
  const token = window.gapi.client.getToken()
  if (token) {
    window.google.accounts.oauth2.revoke(token.access_token)
    window.gapi.client.setToken(null)
  }
}

export function isSignedIn() {
  return window.gapi?.client?.getToken() !== null
}

/**
 * Create a focus time event for an image generation session
 */
export async function createFocusTimeEvent(session, options = {}) {
  if (!gapiLoaded || !isSignedIn()) {
    throw new Error('Not authenticated with Google Calendar')
  }

  const {
    title = `Image Generation: ${session.projectName || 'Amazon Listings'}`,
    description = 'Focus time for Amazon listing image generation',
    colorId = '9', // Blue - good for focus time
    duration = 60 // Default 60 minutes
  } = options

  const startTime = new Date(session.startTime)
  const endTime = new Date(startTime.getTime() + duration * 60000)

  const event = {
    summary: title,
    description: `${description}\n\nSession ID: ${session.id}\nProject: ${session.projectName || 'N/A'}`,
    start: {
      dateTime: startTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    colorId,
    // Mark as focus time for Clockwise compatibility
    extendedProperties: {
      private: {
        focusTime: 'true',
        sessionId: session.id,
        appName: 'amazon-listing-generator'
      }
    }
  }

  try {
    const response = await window.gapi.client.calendar.events.insert({
      calendarId: 'primary',
      resource: event
    })
    return response.result
  } catch (error) {
    console.error('Failed to create calendar event:', error)
    throw error
  }
}

/**
 * Update the event when session ends with actual duration
 */
export async function updateSessionEvent(eventId, session) {
  if (!gapiLoaded || !isSignedIn()) {
    throw new Error('Not authenticated with Google Calendar')
  }

  const startTime = new Date(session.startTime)
  const endTime = session.endTime ? new Date(session.endTime) : new Date()

  const description = `Amazon Listing Image Generation Session

Duration: ${formatDurationForCalendar(session.duration)}
Images Generated: ${session.generationCount}
Image Types: ${Object.entries(session.imageTypes || {}).map(([type, count]) => `${type}: ${count}`).join(', ') || 'N/A'}

Session ID: ${session.id}
Project: ${session.projectName || 'N/A'}`

  try {
    const response = await window.gapi.client.calendar.events.patch({
      calendarId: 'primary',
      eventId,
      resource: {
        end: {
          dateTime: endTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        description,
        colorId: '10' // Green for completed
      }
    })
    return response.result
  } catch (error) {
    console.error('Failed to update calendar event:', error)
    throw error
  }
}

/**
 * Delete a calendar event
 */
export async function deleteCalendarEvent(eventId) {
  if (!gapiLoaded || !isSignedIn()) {
    throw new Error('Not authenticated with Google Calendar')
  }

  try {
    await window.gapi.client.calendar.events.delete({
      calendarId: 'primary',
      eventId
    })
    return true
  } catch (error) {
    console.error('Failed to delete calendar event:', error)
    throw error
  }
}

/**
 * Get all session events from the calendar
 */
export async function getSessionEvents(days = 30) {
  if (!gapiLoaded || !isSignedIn()) {
    throw new Error('Not authenticated with Google Calendar')
  }

  const now = new Date()
  const past = new Date()
  past.setDate(past.getDate() - days)

  try {
    const response = await window.gapi.client.calendar.events.list({
      calendarId: 'primary',
      timeMin: past.toISOString(),
      timeMax: now.toISOString(),
      privateExtendedProperty: 'appName=amazon-listing-generator',
      singleEvents: true,
      orderBy: 'startTime'
    })
    return response.result.items || []
  } catch (error) {
    console.error('Failed to fetch calendar events:', error)
    throw error
  }
}

function formatDurationForCalendar(seconds) {
  if (!seconds) return '0 minutes'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`
  }
  return `${minutes} minute${minutes !== 1 ? 's' : ''}`
}

// Check if calendar is configured
export function isCalendarConfigured() {
  return !!(GOOGLE_CLIENT_ID && GOOGLE_API_KEY)
}
