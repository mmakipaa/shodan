<!-- A simple hamburger menu button component -->
<script setup lang="ts">
// Define props without assigning to a variable
defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

// Define emits without assigning to a variable
defineEmits(['toggle'])
</script>

<template>
  <button 
    class="menu-button" 
    aria-label="Open preferences menu"
    @click="$emit('toggle')"
    :class="{ 'open': isOpen }"
  >
    <div class="hamburger-icon">
      <span></span>
      <span></span>
      <span></span>
    </div>
  </button>
</template>

<style scoped>
.menu-button {
  position: fixed;
  top: 1rem;
  right: 1rem;
  /* Calculate size based on play button (about 1/4 of the area) */
  width: 6vmin;
  height: 6vmin;
  background: rgba(116, 116, 118, 0.9);
  border: 2px solid #a63603;
  border-radius: 8px; /* Square with rounded corners instead of circle */
  z-index: 1000;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  padding: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2); /* Add subtle shadow for depth */
}

.menu-button:hover {
  background: rgba(83, 83, 85, 0.9);
  transform: scale(1.05); /* Subtle hover effect */
}

.hamburger-icon {
  width: 60%; /* Increased from 40% for better proportion */
  height: 40%; /* Increased from 30% to accommodate thicker bars */
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.hamburger-icon span {
  display: block;
  height: 3px; /* Increased from 2px for thicker bars */
  width: 100%;
  background-color: #a6a6a8;
  border-radius: 2px;
  transition: all 0.3s ease;
}

/* Transform hamburger to X when menu is open - fixed to cross at center */
.menu-button.open .hamburger-icon {
  justify-content: center; /* Center the bars when open */
}

.menu-button.open .hamburger-icon span {
  position: absolute; /* Position absolutely for perfect centering */
  top: 50%; /* Center vertically */
  margin-top: -1.5px; /* Half of the height for perfect centering */
}

.menu-button.open .hamburger-icon span:nth-child(1) {
  transform: rotate(45deg); /* Rotated without translation */
}

.menu-button.open .hamburger-icon span:nth-child(2) {
  opacity: 0;
  width: 0;
}

.menu-button.open .hamburger-icon span:nth-child(3) {
  transform: rotate(-45deg); /* Rotated without translation */
}

/* Add slight animation when clicked */
.menu-button:active {
  transform: scale(0.95);
}
</style>