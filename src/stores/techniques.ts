import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useNotificationsStore } from './notifications'

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

  // Load techniques data from JSON file
  const loadTechniques = async () => {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch('/data/techniques.json')
      const data = await response.json() as TechniquesData
      techniques.value = data.techniques
      version.value = data.version
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
    loadTechniques, 
    getTechniqueById
  }
})