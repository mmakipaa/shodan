<script setup lang="ts">
import { ref, computed, onMounted, watch, defineExpose } from 'vue'
import { usePreferencesStore } from '../stores/preferences'
import { useTechniquesStore } from '../stores/techniques'
import { useNotificationsStore } from '../stores/notifications'
import { filterTechniques } from '../utils/filterTechniques'
import type { AppPreferences, GradingSource, KyuLevel } from '../stores/preferences'

// Props and emits
const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'clickOutside'])

// Get access to the preferences store
const preferencesStore = usePreferencesStore()
const techniquesStore = useTechniquesStore()
const notificationsStore = useNotificationsStore()

// Create local state for draft preferences and initial preferences
const draftPreferences = ref<AppPreferences>({
  kyus: [] as KyuLevel[],
  sources: [] as GradingSource[],
  selectedKyus: [] as KyuLevel[],
  selectedSource: 'aikikai',
  includeOther: false
})

const initialPreferences = ref<AppPreferences>({
  kyus: [] as KyuLevel[],
  sources: [] as GradingSource[],
  selectedKyus: [] as KyuLevel[],
  selectedSource: 'aikikai',
  includeOther: false
})

// Load initial preferences when mounted
onMounted(() => {
  resetDraftToCurrentPreferences()
})

// Watch for changes in isOpen prop to reset draft when menu opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    resetDraftToCurrentPreferences()
  }
})

// Reset draft to current preferences
const resetDraftToCurrentPreferences = () => {
  // Create deep copies of the current preferences for both draft and initial state
  draftPreferences.value = JSON.parse(JSON.stringify(preferencesStore.preferences))
  initialPreferences.value = JSON.parse(JSON.stringify(preferencesStore.preferences))
}

// Validation functions
const isValid = computed(() => {
  return draftPreferences.value.sources.includes(draftPreferences.value.selectedSource)
})

const hasChanges = computed(() => {
  const initialPrefs = initialPreferences.value
  const draftPrefs = draftPreferences.value
  
  // Check if selected source changed
  if (initialPrefs.selectedSource !== draftPrefs.selectedSource) return true
  
  // Check if includeOther changed
  if (initialPrefs.includeOther !== draftPrefs.includeOther) return true
  
  // Check if selected kyus changed
  if (initialPrefs.selectedKyus.length !== draftPrefs.selectedKyus.length) return true
  
  // Check if any kyu value changed (if any selected in initial state isn't in draft)
  for (const kyu of initialPrefs.selectedKyus) {
    if (!draftPrefs.selectedKyus.includes(kyu)) return true
  }
  
  // Also check if any kyu in draft isn't in initial (to cover all cases)
  for (const kyu of draftPrefs.selectedKyus) {
    if (!initialPrefs.selectedKyus.includes(kyu)) return true
  }
  
  return false
})

// Handle toggling kyu selection
const toggleKyu = (kyu: KyuLevel) => {
  const index = draftPreferences.value.selectedKyus.indexOf(kyu)
  if (index === -1) {
    // Add the kyu
    draftPreferences.value.selectedKyus.push(kyu)
  } else {
    // Remove the kyu without restriction
    draftPreferences.value.selectedKyus.splice(index, 1)
  }
  
  // Don't apply changes immediately, wait for menu closure
}

// Handle source selection
const selectSource = (source: GradingSource) => {
  draftPreferences.value.selectedSource = source
  
  // Don't apply changes immediately, wait for menu closure
}

// Handle includeOther toggle
const toggleIncludeOther = () => {
  draftPreferences.value.includeOther = !draftPreferences.value.includeOther
  
  // Don't apply changes immediately, wait for menu closure
}

// Apply changes when menu is closed
const applyChanges = () => {
  if (!isValid.value) return
  
  // Check if the current draft preferences would result in zero techniques
  const filteredTechniques = filterTechniques(techniquesStore.techniques, draftPreferences.value)
  
  // If no techniques would be found, show an error notification and prevent closing
  if (filteredTechniques.length === 0) {
    notificationsStore.addNotification('Your selection would result in zero techniques. Please adjust your preferences.', 'error', 'transient')
    return
  }
  
  if (hasChanges.value) {
    // Use batch update to apply all changes at once
    // This prevents multiple reactive updates and reduces unwanted behavior
    preferencesStore.batchUpdate({
      selectedKyus: draftPreferences.value.selectedKyus,
      selectedSource: draftPreferences.value.selectedSource,
      includeOther: draftPreferences.value.includeOther
    })
  }
  
  emit('close')
}

// Watch for changes in draftPreferences to check if selection would result in zero techniques
watch(
  draftPreferences,
  (newDraftPreferences) => {
    // Only run the check if the menu is open and the selection is valid
    if (props.isOpen && isValid.value) {
      // Use the utility function to check if any techniques would be selected with current draft preferences
      const filteredTechniques = filterTechniques(techniquesStore.techniques, newDraftPreferences)
      
      // If no techniques would be found, show a notification
      if (filteredTechniques.length === 0) {
        notificationsStore.addNotification('No techniques match your current selection', 'status', 'transient')
      }
    }
  },
  { deep: true } // Watch for deep changes in the draftPreferences object
)

// Handle click on backdrop
const handleBackdropClick = (event: MouseEvent) => {
  // Only close if clicking directly on the backdrop, not on the menu
  if ((event.target as HTMLElement).classList.contains('backdrop')) {
    emit('clickOutside')
  }
}

// Expose methods to parent component
defineExpose({
  applyChanges
})
</script>

<template>
  <div 
    v-if="isOpen" 
    class="backdrop visible"
    @click="handleBackdropClick"
  >
    <div 
      class="preferences-menu"
      :class="{ 'open': isOpen }"
    >
      <!-- Kyu Levels Selection (with Other) -->
      <div class="preference-section">
        <h3>Kyu Levels</h3>
        <div class="checkbox-group">
          <div 
            v-for="kyu in draftPreferences.kyus.slice().sort((a, b) => b - a)" 
            :key="kyu" 
            class="checkbox-item"
          >
            <label>
              <input 
                type="checkbox" 
                :checked="draftPreferences.selectedKyus.includes(kyu)"
                @change="toggleKyu(kyu)"
              />
              <span>{{ kyu }} kyu</span>
            </label>
          </div>
          <!-- Other techniques option added to kyu levels group -->
          <div class="checkbox-item other-option">
            <label>
              <input 
                type="checkbox" 
                :checked="draftPreferences.includeOther"
                @change="toggleIncludeOther"
              />
              <span>Other</span>
            </label>
          </div>
        </div>
      </div>
      
      <!-- Source Selection -->
      <div class="preference-section">
        <h3>Grading Source</h3>
        <div class="radio-group">
          <div 
            v-for="source in draftPreferences.sources" 
            :key="source" 
            class="radio-item"
          >
            <label>
              <input 
                type="radio" 
                :checked="draftPreferences.selectedSource === source"
                @change="selectSource(source)"
                :name="'source'"
              />
              <span>{{ source }}</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(83, 83, 85, 0.5);
  z-index: 900;
  display: flex;
  justify-content: flex-end;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;
}

.backdrop.visible {
  opacity: 1;
  visibility: visible;
}

.preferences-menu {
  background-color: rgba(83, 83, 85, 0.9);
  width: 280px;
  height: 100%;
  padding: 2rem 1.5rem;
  overflow-y: auto;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.3);
  transform: translateX(100%);
  transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
  color: #f7f7f7;
}

.preferences-menu.open {
  transform: translateX(0);
}

.preference-section {
  margin-bottom: 2rem;
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.3s ease, transform 0.3s ease;
}

/* Fixed selectors to properly target all three sections */
.open .preference-section {
  opacity: 1;
  transform: translateY(0);
}

/* First preference section (Kyu Levels) */
.open .preference-section:nth-of-type(1) {
  transition-delay: 0.15s;
}

/* Second preference section (Grading Source) */
.open .preference-section:nth-of-type(2) {
  transition-delay: 0.2s;
}

h3 {
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: #f7f7f7;
  text-align: left;
}

.checkbox-group, .radio-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.checkbox-item, .radio-item {
  display: flex;
  align-items: center;
}

.checkbox-item.other-option {
  margin-top: 0.5rem; /* Small spacing to visually separate "Other" from kyu levels */
}

.checkbox-item label, .radio-item label {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.checkbox-item input, .radio-item input {
  margin-right: 0.5rem;
  cursor: pointer;
}

.validation-message {
  color: #ff6b6b;
  font-size: 0.85rem;
  margin-top: 0.5rem;
}
</style>