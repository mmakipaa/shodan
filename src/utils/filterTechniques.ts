import type { Technique } from '../stores/techniques'
import type { AppPreferences, KyuLevel } from '../stores/preferences'

/**
 * Filters a technique based on provided preferences
 * 
 * @param technique - The technique to filter
 * @param preferences - The current user preferences
 * @returns boolean - True if the technique should be included, false otherwise
 */
export function filterTechnique(technique: Technique, preferences: AppPreferences): boolean {
  // Check if the technique has a kyu value for the selected source
  const selectedSourceKyuValue = technique[preferences.selectedSource]
  
  // Case 1: Include technique if it matches the selected source and kyu level
  if (selectedSourceKyuValue !== undefined) {
    return preferences.selectedKyus.includes(selectedSourceKyuValue as KyuLevel)
  }
  
  // Case 2: Include technique if includeOther is true AND the technique doesn't have any source value
  if (preferences.includeOther) {
    // Check if the technique has ANY grading source defined
    const hasAnyGradingSource = preferences.sources.some(source => 
      technique[source] !== undefined
    )
    
    // Include if it doesn't have any grading source defined
    return !hasAnyGradingSource
  }
  
  // If we get here, the technique doesn't match our criteria
  return false
}

/**
 * Filters an array of techniques based on provided preferences
 * 
 * @param techniques - The array of techniques to filter
 * @param preferences - The current user preferences
 * @returns Technique[] - Array of techniques that match the filtering criteria
 */
export function filterTechniques(techniques: Technique[], preferences: AppPreferences): Technique[] {
  return techniques.filter(technique => filterTechnique(technique, preferences))
}