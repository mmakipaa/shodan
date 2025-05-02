import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import { useTechniquesStore } from './techniques'
import { usePreferencesStore } from './preferences'
import { useNotificationsStore } from './notifications'
import type { Technique } from './techniques'
import { filterTechniques as filterTechniquesUtil } from '../utils/filterTechniques'

// Storage keys
const QUEUE_STORAGE_KEY = 'shodan-playqueue'
const PLAYSTATE_STORAGE_KEY = 'shodan-playstate'

// Defines what we store in localStorage - only the current index
// We don't need to store isPlaying since we always start paused
interface StoredPlayState {
  currentIndex: number
}

export const usePlayQueueStore = defineStore('playQueue', () => {
  const techniquesStore = useTechniquesStore()
  const preferencesStore = usePreferencesStore()
  const notificationsStore = useNotificationsStore()
  
  const queue = ref<Technique[]>([])
  const currentIndex = ref<number>(-1)
  const isPlaying = ref<boolean>(false)

  // Load queue from localStorage
  const loadSavedQueue = (): Technique[] => {
    try {
      const savedQueue = localStorage.getItem(QUEUE_STORAGE_KEY)
      if (savedQueue) {
        // We store only IDs in localStorage to reduce storage size
        const savedIds = JSON.parse(savedQueue) as number[]
        if (Array.isArray(savedIds) && savedIds.length > 0) {
          // Convert IDs back to technique objects
          const loadedQueue = savedIds
            .map(id => techniquesStore.getTechniqueById(id))
            .filter((t): t is Technique => t !== null)
          
          if (loadedQueue.length > 0) {
            return loadedQueue
          }
        }
      }
    } catch (error) {
      console.error('Error loading queue from localStorage:', error)
      notificationsStore.addNotification('Failed to load queue from storage', 'error', 'transient')
    }
    
    return []
  }

  // Load play state from localStorage
  const loadPlayState = (): StoredPlayState => {
    try {
      const savedState = localStorage.getItem(PLAYSTATE_STORAGE_KEY)
      if (savedState) {
        const state = JSON.parse(savedState) as StoredPlayState
        return {
          currentIndex: typeof state.currentIndex === 'number' ? state.currentIndex : -1
        }
      }
    } catch (error) {
      console.error('Error loading play state from localStorage:', error)
      notificationsStore.addNotification('Failed to load play state from storage', 'error', 'transient')
    }
    
    return { currentIndex: -1 }
  }

  // Save queue to localStorage
  const saveQueue = () => {
    try {
      // Store only the IDs to reduce storage size
      const ids = queue.value.map(t => t.id)
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(ids))
    } catch (error) {
      console.error('Error saving queue to localStorage:', error)
      notificationsStore.addNotification('Failed to save queue state to storage', 'error', 'transient')
    }
  }

  // Save play state to localStorage
  const savePlayState = () => {
    try {
      const state: StoredPlayState = {
        currentIndex: currentIndex.value
      }
      localStorage.setItem(PLAYSTATE_STORAGE_KEY, JSON.stringify(state))
    } catch (error) {
      console.error('Error saving play state to localStorage:', error)
      notificationsStore.addNotification('Failed to save queue state to storage', 'error', 'transient')
    }
  }

  // Watch for changes to save to localStorage
  watch([queue, currentIndex, isPlaying], () => {
    saveQueue()
    savePlayState()
  }, { deep: true })

  // Filter techniques based on current preferences
  const filterTechniques = (): Technique[] => {
    return filterTechniquesUtil(techniquesStore.techniques, preferencesStore.preferences)
  }

  // Randomize array using Fisher-Yates shuffle algorithm
  const shuffleArray = (array: Technique[]): Technique[] => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  // Generate a new play queue by filtering and randomizing techniques
  const generateQueue = (): boolean => {
    const filteredTechniques = filterTechniques()
    queue.value = shuffleArray(filteredTechniques)
    currentIndex.value = queue.value.length > 0 ? 0 : -1
    isPlaying.value = false
    
    // Show notification that the queue has been regenerated
    if (queue.value.length > 0) {
      notificationsStore.addNotification(
        `Play queue has been refreshed with ${queue.value.length} techniques`,
        'status',
        'transient'
      )
    } else {
      notificationsStore.addNotification('No techniques match current preferences', 'error', 'transient')
    }
    
    // Return true if we successfully created a queue with techniques
    return queue.value.length > 0
  }

  // Initialize the queue and state from localStorage or generate new ones
  const initializeQueue = (forceRegenerate = false): boolean => {
    // Don't try to load if techniques aren't loaded yet
    if (techniquesStore.techniques.length === 0) {
      return false
    }
    
    // If forced regeneration is requested, generate a new queue instead of loading from localStorage
    if (forceRegenerate) {
      console.log('Queue regeneration requested, creating fresh play queue')
      return generateQueue()
    }
    
    // Normal flow - try to load queue from localStorage
    const savedQueue = loadSavedQueue()
    const savedState = loadPlayState()
    
    if (savedQueue.length > 0) {
      queue.value = savedQueue
      
      // Make sure the index is valid for the loaded queue
      if (savedState.currentIndex >= 0 && savedState.currentIndex < savedQueue.length) {
        // Use the saved current index if it's valid
        currentIndex.value = savedState.currentIndex
      } else if (savedState.currentIndex >= savedQueue.length) {
        // If the saved index is beyond the queue length, set to the last item
        currentIndex.value = savedQueue.length - 1
      } else {
        // If the saved index is negative or invalid, reset to 0
        currentIndex.value = 0
      }

      isPlaying.value = false // Always start not playing
      return true
    } else {
      // No valid saved queue, generate a new one
      return generateQueue()
    }
  }

  // Get the current technique being played
  const currentTechnique = computed(() => {
    if (currentIndex.value >= 0 && currentIndex.value < queue.value.length) {
      return queue.value[currentIndex.value]
    }
    return null
  })

  // Move to the next track in the queue
  const nextTrack = () => {
    if (queue.value.length === 0) return null
    
    if (currentIndex.value < queue.value.length - 1) {
      currentIndex.value++
      return currentTechnique.value
    } else {
      // We've reached the end of the queue
      // The AudioPlayer.vue will handle generating a new queue
      return null
    }
  }

  // Set the playing state
  const setPlaying = (playing: boolean) => {
    isPlaying.value = playing
  }

  // Reset the queue
  const resetQueue = () => {
    queue.value = []
    currentIndex.value = -1
    isPlaying.value = false
  }

  return {
    queue,
    currentIndex,
    isPlaying,
    currentTechnique,
    generateQueue,
    initializeQueue,
    nextTrack,
    setPlaying,
    resetQueue
  }
})