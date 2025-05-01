<script setup lang="ts">
import AudioPlayer from './components/AudioPlayer.vue'
</script>

<template>
  <main>
    <AudioPlayer />
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
