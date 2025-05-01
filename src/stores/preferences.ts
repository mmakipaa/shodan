import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import { useNotificationsStore } from './notifications'

// Define types for preferences
export type GradingSource = 'aikikai' | 'aikicircle'
export type KyuLevel = 1 | 2 | 3 | 4 | 5 | 6

export interface AppPreferences {
  // Available options
  kyus: KyuLevel[]
  sources: GradingSource[]
  
  // Current selections
  selectedKyus: KyuLevel[]
  selectedSource: GradingSource
  includeOther: boolean
}

// Storage key for preferences
const STORAGE_KEY = 'shodan-preferences'

// Default preferences when nothing is stored
const DEFAULT_PREFERENCES: AppPreferences = {
  // Available options
  kyus: [6, 5, 4, 3, 2, 1],
  sources: ['aikikai', 'aikicircle'],
  
  // Default selections
  selectedKyus: [6, 5, 4, 3, 2, 1], // All kyu levels selected
  selectedSource: 'aikikai', // Default source
  includeOther: false // Default to not include others
}

// Export these functions for the storage recovery mechanism
export const savePreferencesToStorage = (prefs: AppPreferences) => {
  const notificationsStore = useNotificationsStore()
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch (error) {
    console.error('Error saving preferences to localStorage:', error)
    notificationsStore.addNotification('Failed to save preferences to storage', 'error', 'transient')
  }
}

export const usePreferencesStore = defineStore('preferences', () => {
  // Initialize preferences from localStorage or use defaults
  const loadSavedPreferences = (): AppPreferences => {
    const notificationsStore = useNotificationsStore()
    try {
      const savedPreferences = localStorage.getItem(STORAGE_KEY)
      if (savedPreferences) {
        const parsed = JSON.parse(savedPreferences) as AppPreferences
        // Validate the loaded preferences
        if (isValidPreferences(parsed)) {
          return parsed
        }
      }
    } catch (error) {
      console.error('Error loading preferences from localStorage:', error)
      notificationsStore.addNotification('Failed to load preferences from storage', 'error', 'transient')
    }
    
    // If we reach here, we need to use the default preferences
    // AND save them to localStorage immediately
    const defaultPrefs = { ...DEFAULT_PREFERENCES }
    savePreferencesToStorage(defaultPrefs)
    
    return defaultPrefs
  }
  
  // Define a type for unknown preferences data (potentially from localStorage)
  type UnknownPreferencesData = {
    kyus?: unknown
    sources?: unknown
    selectedKyus?: unknown
    selectedSource?: unknown
    includeOther?: unknown
  }

  // Validate loaded preferences
  const isValidPreferences = (prefs: UnknownPreferencesData): prefs is AppPreferences => {
    return (
      prefs !== null &&
      typeof prefs === 'object' &&
      Array.isArray(prefs.kyus) &&
      Array.isArray(prefs.sources) &&
      Array.isArray(prefs.selectedKyus) && 
      typeof prefs.selectedSource === 'string' &&
      typeof prefs.includeOther === 'boolean'
    )
  }

  // Load preferences from localStorage
  const preferences = ref<AppPreferences>(loadSavedPreferences())

  // Save preferences to localStorage whenever they change
  watch(
    preferences,
    (newPreferences) => {
      savePreferencesToStorage(newPreferences)
    },
    { deep: true }
  )

  // Computed property to check if preferences are valid
  const isValid = computed(() => {
    return preferences.value.sources.includes(preferences.value.selectedSource)
  })

  // Update selected kyus
  const updateSelectedKyus = (kyus: KyuLevel[]) => {
    // Make sure all selected kyus are valid
    const validKyus = kyus.filter(kyu => preferences.value.kyus.includes(kyu))
    preferences.value.selectedKyus = validKyus
  }

  // Update selected source
  const updateSelectedSource = (source: GradingSource) => {
    if (preferences.value.sources.includes(source)) {
      preferences.value.selectedSource = source
    }
  }

  // Toggle include other techniques
  const toggleIncludeOther = () => {
    preferences.value.includeOther = !preferences.value.includeOther
  }

  // Set include other techniques
  const setIncludeOther = (value: boolean) => {
    preferences.value.includeOther = value
  }

  // Reset preferences to default
  const resetToDefaults = () => {
    preferences.value = { ...DEFAULT_PREFERENCES }
  }

  // Batch update preferences
  const batchUpdate = (updates: Partial<AppPreferences>) => {
    // Update all provided preference values in a single operation
    // This helps prevent multiple watches from firing separately
    if (updates.selectedKyus !== undefined) {
      preferences.value.selectedKyus = [...updates.selectedKyus]
    }
    
    if (updates.selectedSource && preferences.value.sources.includes(updates.selectedSource)) {
      preferences.value.selectedSource = updates.selectedSource
    }
    
    if (typeof updates.includeOther === 'boolean') {
      preferences.value.includeOther = updates.includeOther
    }
  }

  // Return all state and methods
  return {
    preferences,
    isValid,
    updateSelectedKyus,
    updateSelectedSource,
    toggleIncludeOther,
    setIncludeOther,
    resetToDefaults,
    batchUpdate
  }
})