import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import type { Technique } from './techniques'

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

export const usePreferencesStore = defineStore('preferences', () => {
  // Initialize preferences from localStorage or use defaults
  const loadSavedPreferences = (): AppPreferences => {
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
    }
    
    // Return default preferences if nothing valid was found
    return { ...DEFAULT_PREFERENCES }
  }
  
  // Validate loaded preferences
  const isValidPreferences = (prefs: any): prefs is AppPreferences => {
    return (
      prefs &&
      Array.isArray(prefs.kyus) &&
      Array.isArray(prefs.sources) &&
      Array.isArray(prefs.selectedKyus) && 
      prefs.selectedKyus.length > 0 &&
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
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newPreferences))
      } catch (error) {
        console.error('Error saving preferences to localStorage:', error)
      }
    },
    { deep: true }
  )

  // Computed property to check if preferences are valid
  const isValid = computed(() => {
    return preferences.value.selectedKyus.length > 0 && 
           preferences.value.sources.includes(preferences.value.selectedSource)
  })

  // Update selected kyus
  const updateSelectedKyus = (kyus: KyuLevel[]) => {
    // Ensure at least one kyu is selected
    if (kyus.length === 0) return
    
    // Make sure all selected kyus are valid
    const validKyus = kyus.filter(kyu => preferences.value.kyus.includes(kyu))
    if (validKyus.length === 0) return
    
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

  // Check if a technique should be included based on current preferences
  const filterTechnique = (technique: Technique): boolean => {
    // Check if the technique has a kyu value for the selected source
    const selectedSourceKyuValue = technique[preferences.value.selectedSource]
    
    // Case 1: Include technique if it matches the selected source and kyu level
    if (selectedSourceKyuValue !== undefined) {
      return preferences.value.selectedKyus.includes(selectedSourceKyuValue as KyuLevel)
    }
    
    // Case 2: Include technique if includeOther is true AND the technique doesn't have any source value
    if (preferences.value.includeOther) {
      // Check if the technique has ANY grading source defined
      const hasAnyGradingSource = preferences.value.sources.some(source => 
        technique[source] !== undefined
      )
      
      // Include if it doesn't have any grading source defined
      return !hasAnyGradingSource
    }
    
    // If we get here, the technique doesn't match our criteria
    return false
  }

  // Return all state and methods
  return {
    preferences,
    isValid,
    updateSelectedKyus,
    updateSelectedSource,
    toggleIncludeOther,
    setIncludeOther,
    filterTechnique,
    resetToDefaults
  }
})