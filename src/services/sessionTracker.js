/**
 * Session Tracking Service
 * Tracks work sessions, time spent, and generation counts
 */

import { saveSession, getActiveSession, getAllSessions, getSessionImages } from './database'

export function createSession(projectId = null, projectName = null) {
  return {
    id: `session-${Date.now()}`,
    projectId,
    projectName,
    status: 'active',
    startTime: new Date().toISOString(),
    endTime: null,
    duration: 0, // in seconds
    generationCount: 0,
    imageTypes: {},
    notes: '',
    calendarEventId: null,
    createdAt: new Date().toISOString()
  }
}

export async function startSession(projectId = null, projectName = null) {
  // Check for existing active session
  const existing = await getActiveSession()
  if (existing) {
    return existing
  }

  const session = createSession(projectId, projectName)
  await saveSession(session)
  return session
}

export async function endSession(sessionId) {
  const sessions = await getAllSessions()
  const session = sessions.find(s => s.id === sessionId)

  if (!session) return null

  const endTime = new Date()
  const startTime = new Date(session.startTime)
  const duration = Math.round((endTime - startTime) / 1000)

  const updatedSession = {
    ...session,
    status: 'completed',
    endTime: endTime.toISOString(),
    duration
  }

  await saveSession(updatedSession)
  return updatedSession
}

export async function updateSessionStats(sessionId, imageType) {
  const sessions = await getAllSessions()
  const session = sessions.find(s => s.id === sessionId)

  if (!session) return null

  const imageTypes = { ...session.imageTypes }
  imageTypes[imageType] = (imageTypes[imageType] || 0) + 1

  const updatedSession = {
    ...session,
    generationCount: session.generationCount + 1,
    imageTypes
  }

  await saveSession(updatedSession)
  return updatedSession
}

export async function addSessionNote(sessionId, note) {
  const sessions = await getAllSessions()
  const session = sessions.find(s => s.id === sessionId)

  if (!session) return null

  const updatedSession = {
    ...session,
    notes: session.notes ? `${session.notes}\n${note}` : note
  }

  await saveSession(updatedSession)
  return updatedSession
}

export async function getSessionSummary(sessionId) {
  const sessions = await getAllSessions()
  const session = sessions.find(s => s.id === sessionId)

  if (!session) return null

  const images = await getSessionImages(sessionId)

  return {
    ...session,
    images,
    imageCount: images.length,
    favoriteCount: images.filter(img => img.isFavorite).length,
    formattedDuration: formatDuration(session.duration)
  }
}

export async function getSessionStats(days = 30) {
  const sessions = await getAllSessions()
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)

  const recentSessions = sessions.filter(s =>
    new Date(s.startTime) >= cutoff && s.status === 'completed'
  )

  const totalTime = recentSessions.reduce((sum, s) => sum + s.duration, 0)
  const totalGenerations = recentSessions.reduce((sum, s) => sum + s.generationCount, 0)

  const imageTypeStats = {}
  recentSessions.forEach(s => {
    Object.entries(s.imageTypes || {}).forEach(([type, count]) => {
      imageTypeStats[type] = (imageTypeStats[type] || 0) + count
    })
  })

  return {
    sessionCount: recentSessions.length,
    totalTime,
    totalGenerations,
    averageSessionTime: recentSessions.length > 0 ? Math.round(totalTime / recentSessions.length) : 0,
    imageTypeStats,
    formattedTotalTime: formatDuration(totalTime)
  }
}

export function formatDuration(seconds) {
  if (!seconds) return '0m'

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

export function calculateLiveDuration(startTime) {
  const start = new Date(startTime)
  const now = new Date()
  return Math.round((now - start) / 1000)
}
