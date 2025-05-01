<script setup lang="ts">
import { ref } from 'vue'
import AudioPlayer from './components/AudioPlayer.vue'
import MenuButton from './components/MenuButton.vue'
import PreferencesMenu from './components/PreferencesMenu.vue'
import NotificationDisplay from './components/NotificationDisplay.vue'

// Define a type for the PreferencesMenu component instance with its exposed methods
type PreferencesMenuInstance = {
  applyChanges: () => void
}

// Menu state
const isMenuOpen = ref(false)
const preferencesMenu = ref<PreferencesMenuInstance | null>(null)

// Toggle menu
const toggleMenu = () => {
  if (isMenuOpen.value) {
    // When closing, trigger validation and apply changes if valid
    attemptClose()
  } else {
    // When opening, we can just set it directly
    isMenuOpen.value = true
  }
}

// Handle direct closing from the menu component
// This will only be emitted when the selection is valid
const closeMenu = () => {
  isMenuOpen.value = false
}

// Handle click outside or toggle button click when menu is open
const attemptClose = () => {
  if (preferencesMenu.value) {
    // Call the applyChanges method which handles validation and emits close if valid
    preferencesMenu.value.applyChanges()
  }
}
</script>

<template>
  <main>
    <AudioPlayer />
    <MenuButton @toggle="toggleMenu" :isOpen="isMenuOpen" />
    <PreferencesMenu 
      :isOpen="isMenuOpen"
      @close="closeMenu"
      @clickOutside="attemptClose"
      ref="preferencesMenu"
    />
    <NotificationDisplay />
  </main>
</template>

<style scoped>
main {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin: 0;
  padding: 0;
  position: relative;
  min-height: 100vh;
  width: 100%;
  overflow: hidden;
}

/* Apply background image to the whole app */
main::before {
  content: "";
  background-image: url('@/assets/images/background.jpg');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
}
</style>
