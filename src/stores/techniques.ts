import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useNotificationsStore } from './notifications'

// Local storage key for storing version
const VERSION_STORAGE_KEY = 'shodan-techniques-version'

// Technique interfaces
export interface Technique {
  id: number
  filename: string
  category: string
  attack: string
  technique?: string
  aikicircle?: number
  aikikai?: number
}

export interface TechniquesData {
  version: number
  techniques: Technique[]
}

export const useTechniquesStore = defineStore('techniques', () => {
  const techniques = ref<Technique[]>([])
  const version = ref<number>(0)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const notificationsStore = useNotificationsStore()
  const isNewVersion = ref(false)

  // Get stored version from local storage
  const getStoredVersion = (): number | null => {
    const storedVersion = localStorage.getItem(VERSION_STORAGE_KEY)
    return storedVersion ? parseInt(storedVersion, 10) : null
  }

  // Save version to local storage
  const saveVersionToStorage = (versionNumber: number) => {
    localStorage.setItem(VERSION_STORAGE_KEY, versionNumber.toString())
  }

  // Check if current version is newer than stored version
  const checkForNewVersion = (currentVersion: number): boolean => {
    const storedVersion = getStoredVersion()
    return storedVersion !== null && currentVersion > storedVersion
  }

  // Load techniques data from JSON file
  const loadTechniques = async () => {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch('/data/techniques.json')
      const data = await response.json() as TechniquesData
      techniques.value = data.techniques
      version.value = data.version
      
      // Check if this is a new version
      isNewVersion.value = checkForNewVersion(data.version)
      
      // Save current version to local storage
      saveVersionToStorage(data.version)
    } catch (err) {
      console.error('Failed to load techniques:', err)
      error.value = 'Failed to load techniques data'
      // Show error notification
      notificationsStore.addNotification('Failed to load techniques data', 'error', 'permanent')
    } finally {
      isLoading.value = false
    }
  }

  // Get a technique by ID
  const getTechniqueById = (id: number) => {
    return techniques.value.find(t => t.id === id) || null
  }

  return { 
    techniques,
    version, 
    isLoading, 
    error,
    isNewVersion,
    loadTechniques, 
    getTechniqueById
  }
})