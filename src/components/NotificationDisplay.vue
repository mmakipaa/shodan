<template>
  <Transition name="notification">
    <div 
      v-if="notificationsStore.activeNotification" 
      class="notification-container"
      :class="[
        notificationsStore.activeNotification.type,
        { 'transient': notificationsStore.activeNotification.duration === 'transient' }
      ]"
    >
      <div class="notification-content">
        {{ notificationsStore.activeNotification.message }}
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useNotificationsStore } from '../stores/notifications'
import { onBeforeUnmount } from 'vue'

// Get access to the notifications store
const notificationsStore = useNotificationsStore()

// Clean up any timers when component is unmounted
onBeforeUnmount(() => {
  notificationsStore.cleanup()
})
</script>

<style scoped>
.notification-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  padding: 1rem 1.5rem;
  z-index: 2000;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.3);
  font-size: 1.25rem;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-content {
  color: #f7f7f7;
  word-break: break-word;
  max-width: 90%;
  margin: 0 auto;
}

/* Notification types */
.notification-container.status {
  background-color: rgba(8, 81, 156, 0.95); /* Blue background for status */
}

.notification-container.error {
  background-color: rgba(165, 15, 21, 0.95); /* Red background for errors */
}

/* Animation for notification entry and exit */
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from,
.notification-leave-to {
  opacity: 0;
  transform: translateY(100%);
}

.notification-enter-to,
.notification-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>