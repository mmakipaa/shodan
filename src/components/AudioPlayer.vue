<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useTechniquesStore } from '../stores/techniques'
import { usePreferencesStore } from '../stores/preferences'
import { usePlayQueueStore } from '../stores/playQueue'
import type { Technique } from '../stores/techniques'

// Get store references
const techniquesStore = useTechniquesStore()
const preferencesStore = usePreferencesStore()
const playQueueStore = usePlayQueueStore()

// Audio element reference
const audioElement = ref<HTMLAudioElement | null>(null)

// Track the displayed technique (separate from current queue position)
const displayedTechnique = ref<Technique | null>(null)

// Calculate the golden ratio position (approx 0.618)
const goldenRatio = 0.618

// Load data and initialize components
onMounted(async () => {
  // First, load techniques from JSON
  await techniquesStore.loadTechniques()
  
  // Initialize audio element
  audioElement.value = new Audio()
  
  // Add event listeners for audio element
  if (audioElement.value) {
    // When audio ends, automatically move to the next track
    audioElement.value.onended = () => {
      playQueueStore.setPlaying(false)
      
      // Advance to the next track
      const nextTrack = playQueueStore.nextTrack()
      
      // If we reached the end and need to generate a new queue
      if (!nextTrack) {
        playQueueStore.generateQueue()
      }
    }
  }
  
  // After techniques are loaded, initialize the play queue from localStorage
  // or generate a new one if nothing is saved
  const initialized = playQueueStore.initializeQueue()
  
  // If we have a current track and techniques were loaded successfully, prepare it
  if (initialized && playQueueStore.currentTechnique) {
    // Preload the audio source without playing
    if (audioElement.value) {
      audioElement.value.src = `/audio/${playQueueStore.currentTechnique.filename}`
    }
    
    // Do not set displayedTechnique here - we want it to start null
    // until the user presses play for the first time
  }
})

// Watch for changes in preferences to regenerate the queue
watch(
  () => [
    preferencesStore.preferences.selectedKyus, 
    preferencesStore.preferences.selectedSource,
    preferencesStore.preferences.includeOther
  ],
  () => {
    // Reset and regenerate queue when preferences change
    playQueueStore.resetQueue()
    playQueueStore.generateQueue()
    
    // Preload the new audio source
    if (audioElement.value && playQueueStore.currentTechnique) {
      audioElement.value.src = `/audio/${playQueueStore.currentTechnique.filename}`
    }
    
    // Reset displayed technique when preferences change
    displayedTechnique.value = null
  },
  { deep: true }
)

// Play the current track
const playCurrentTrack = () => {
  if (!audioElement.value) return
  
  // If already playing, do nothing (no pause functionality)
  if (playQueueStore.isPlaying) return
  
  // If queue is empty or no current track, try to generate a new queue
  if (!playQueueStore.currentTechnique) {
    playQueueStore.generateQueue()
    
    // If still no current track, return
    if (!playQueueStore.currentTechnique) return
  }
  
  // Update the displayed technique to the current one when play is pressed
  displayedTechnique.value = playQueueStore.currentTechnique
  
  // Set the source of the audio element if not already set
  if (!audioElement.value.src || !audioElement.value.src.includes(playQueueStore.currentTechnique.filename)) {
    audioElement.value.src = `/audio/${playQueueStore.currentTechnique.filename}`
  }
  
  // Play the audio
  audioElement.value.play()
    .then(() => {
      playQueueStore.setPlaying(true)
    })
    .catch(error => {
      console.error('Error playing audio:', error)
      playQueueStore.setPlaying(false)
    })
}
</script>

<template>
  <div class="audio-player">
    <div class="title-container">
      <!-- Display the displayed technique, not the current queue position -->
      <div class="technique-title" v-if="displayedTechnique">
        <div class="technique-text">{{ displayedTechnique.category }}</div>
        <div class="technique-text">
          {{ displayedTechnique.attack }} {{ displayedTechnique.technique }}
        </div>
      </div>
      <div v-else-if="techniquesStore.isLoading" class="technique-title">
        <div class="loading">Loading techniques...</div>
      </div>
      <!-- When queue exists but nothing played yet, show nothing -->
    </div>
    <div class="button-container">
      <button 
        class="play-button" 
        @click="playCurrentTrack"
        :class="{ 'is-playing': playQueueStore.isPlaying }"
        :disabled="playQueueStore.queue.length === 0"
      >
        <span class="play-icon"></span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.audio-player {
  position: relative;
  height: 100vh;
  width: 100%;
}

/* Title Container Styling */
.title-container {
  position: absolute;
  left: 0;
  right: 0;
  bottom: calc(38.2vh + 15vmin + 1.5em);  /* Space above button container */
  padding: 0 5vw;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.technique-title {
  font-size: 1.5em;
  color: #f7f7f7;
  text-align: center;
  word-wrap: break-word;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  max-width: 90%;
  margin: 0 auto;
  padding: 1em;
  background-color: rgba(0, 0, 0, 0.4);
  border-radius: 8px;
}

.technique-text {
  text-transform: capitalize;
  width: 100%;
  white-space: normal;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0.2em 0;
  line-height: 1.3;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
}

/* Button Container Styling */
.button-container {
  position: absolute;
  width: 100%;
  left: 0;
  /* Position the center of the button at the golden ratio point */
  top: calc(v-bind(goldenRatio) * 100%);
  transform: translateY(-50%);
  display: flex;
  justify-content: center;
  /* Add to ensure container doesn't constrain button shape */
  min-height: 28vmin;
}

.play-button {
  width: 28vmin;
  height: 28vmin;
  min-width: 28vmin; /* Enforce minimum width */
  min-height: 28vmin; /* Enforce minimum height */
  border-radius: 50%;
  background: rgba(116, 116, 118, 0.9);
  border: 3px solid #d94701;  /* Increased from 2px to 3px */
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  padding: 0;
  position: relative;
  /* Explicitly enforce 1:1 aspect ratio */
  aspect-ratio: 1 / 1;
  /* Prevent any flex-based distortion */
  flex-shrink: 0;
  flex-grow: 0;
  /* Remove any potential inline styles that might be conflicting */
  box-sizing: content-box;
}

.play-button:hover:not(:disabled) {
  background: rgba(83, 83, 85, 0.9);
  transform: scale(1.05);
}

.play-button:disabled {
  background: rgba(116, 116, 118, 0.5);
  border-color: #747476;
  cursor: not-allowed;
}

.play-button:disabled .play-icon {
  opacity: 0.5;
}

.play-icon {
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 9vmin 0 9vmin 14vmin;  /* Tall triangle */
  border-color: transparent transparent transparent #a6a6a8;
  margin-left: 4vmin;  /* Increased from 2vmin to 4vmin */
}

.play-button.is-playing .play-icon {
  opacity: 0.5;
}

/* Optional: Add focus state for accessibility */
.play-button:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(82, 82, 82, 0.3);
}

/* Add styles for loading, error states */
.loading, .error {
  color: #f7f7f7;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
}

.error {
  color: #ff6b6b;
}
</style>
