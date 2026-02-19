/**
 * IndexedDB Database Service
 * Provides persistent storage for images, projects, and style presets
 */

const DB_NAME = 'amazon-listing-generator'
const DB_VERSION = 3 // Upgraded: removed sessions/calendar stores

let db = null

export async function initDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const database = event.target.result

      // Remove legacy stores if they exist
      if (database.objectStoreNames.contains('sessions')) {
        database.deleteObjectStore('sessions')
      }
      if (database.objectStoreNames.contains('calendarEvents')) {
        database.deleteObjectStore('calendarEvents')
      }

      // Images store - generated images
      if (!database.objectStoreNames.contains('images')) {
        const imagesStore = database.createObjectStore('images', { keyPath: 'id' })
        imagesStore.createIndex('timestamp', 'timestamp', { unique: false })
        imagesStore.createIndex('imageType', 'imageType', { unique: false })
        imagesStore.createIndex('isFavorite', 'isFavorite', { unique: false })
      }

      // Projects store - group images by product/project
      if (!database.objectStoreNames.contains('projects')) {
        const projectsStore = database.createObjectStore('projects', { keyPath: 'id' })
        projectsStore.createIndex('name', 'name', { unique: false })
        projectsStore.createIndex('createdAt', 'createdAt', { unique: false })
      }

      // Style presets store - saved reference image combinations
      if (!database.objectStoreNames.contains('stylePresets')) {
        const presetsStore = database.createObjectStore('stylePresets', { keyPath: 'id' })
        presetsStore.createIndex('name', 'name', { unique: false })
        presetsStore.createIndex('createdAt', 'createdAt', { unique: false })
        presetsStore.createIndex('projectId', 'projectId', { unique: false })
      }
    }
  })
}

function getStore(storeName, mode = 'readonly') {
  const transaction = db.transaction(storeName, mode)
  return transaction.objectStore(storeName)
}

// Generic CRUD operations
export async function add(storeName, data) {
  return new Promise((resolve, reject) => {
    const store = getStore(storeName, 'readwrite')
    const request = store.add(data)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function put(storeName, data) {
  return new Promise((resolve, reject) => {
    const store = getStore(storeName, 'readwrite')
    const request = store.put(data)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function get(storeName, id) {
  return new Promise((resolve, reject) => {
    const store = getStore(storeName)
    const request = store.get(id)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function getAll(storeName) {
  return new Promise((resolve, reject) => {
    const store = getStore(storeName)
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function remove(storeName, id) {
  return new Promise((resolve, reject) => {
    const store = getStore(storeName, 'readwrite')
    const request = store.delete(id)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function getByIndex(storeName, indexName, value) {
  return new Promise((resolve, reject) => {
    const store = getStore(storeName)
    const index = store.index(indexName)
    const request = index.getAll(value)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function clear(storeName) {
  return new Promise((resolve, reject) => {
    const store = getStore(storeName, 'readwrite')
    const request = store.clear()
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// Image-specific helpers
export async function getAllImages() {
  return getAll('images')
}

export async function getFavoriteImages() {
  return getByIndex('images', 'isFavorite', true)
}

export async function saveImage(image) {
  return put('images', image)
}

// Project helpers
export async function getAllProjects() {
  return getAll('projects')
}

export async function saveProject(project) {
  return put('projects', project)
}

// Style preset helpers
export async function getAllPresets() {
  return getAll('stylePresets')
}

export async function savePreset(preset) {
  return put('stylePresets', preset)
}

export async function deletePreset(presetId) {
  return remove('stylePresets', presetId)
}

export async function getPresetsByProject(projectId) {
  return getByIndex('stylePresets', 'projectId', projectId)
}

export { db }
