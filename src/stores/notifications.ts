import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

// Define notification types
export type NotificationType = 'status' | 'error'

// Define notification duration types
export type NotificationDuration = 'transient' | 'permanent'

// Define notification object interface
export interface Notification {
  id: string
  type: NotificationType
  message: string
  duration: NotificationDuration
  timestamp: number
}

// Notification store to manage all notifications in the application
export const useNotificationsStore = defineStore('notifications', () => {
  // Default duration for transient notifications in milliseconds
  const TRANSIENT_DURATION = 3000 // 3 seconds

  // State
  const activeNotification = ref<Notification | null>(null)
  const permanentNotification = ref<Notification | null>(null)
  const notificationQueue = ref<Notification[]>([])
  const isTransientShowing = ref(false)
  const transientTimerId = ref<number | null>(null)

  // Computed properties
  const hasNotifications = computed(() => 
    notificationQueue.value.length > 0 || 
    activeNotification.value !== null || 
    permanentNotification.value !== null
  )

  // Generate unique id for notifications
  const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2)
  }

  // Add a new notification
  const addNotification = (
    message: string, 
    type: NotificationType = 'status', 
    duration: NotificationDuration = 'transient'
  ) => {
    const notification: Notification = {
      id: generateId(),
      type,
      message,
      duration,
      timestamp: Date.now()
    }

    // Handle permanent notifications immediately
    if (duration === 'permanent') {
      // Replace any existing permanent notification
      permanentNotification.value = notification
      
      // If a transient notification is active, let it complete
      // Otherwise, make the permanent notification active immediately
      if (!isTransientShowing.value) {
        activeNotification.value = notification
      }
      
      return
    }

    // For transient notifications, add to queue
    notificationQueue.value.push(notification)
    
    // If no notification is currently showing, process the queue
    if (!isTransientShowing.value && activeNotification.value === permanentNotification.value) {
      processQueue()
    }
  }

  // Process the notification queue
  const processQueue = () => {
    // If queue is empty or a transient is already showing, exit
    if (notificationQueue.value.length === 0 || isTransientShowing.value) {
      return
    }

    // Get the next notification from the queue
    const nextNotification = notificationQueue.value.shift()!
    
    // Set it as active
    activeNotification.value = nextNotification
    isTransientShowing.value = true
    
    // Set timer to remove it after duration
    transientTimerId.value = window.setTimeout(() => {
      isTransientShowing.value = false
      
      // If there's a permanent notification, show it again
      if (permanentNotification.value) {
        activeNotification.value = permanentNotification.value
      } else {
        activeNotification.value = null
      }
      
      // Process the next notification in queue, if any
      processQueue()
    }, TRANSIENT_DURATION)
  }

  // Dismiss the current notification manually
  const dismissNotification = (id?: string) => {
    // If an ID is provided, only dismiss matching notifications
    if (id) {
      // If active notification matches, dismiss it
      if (activeNotification.value?.id === id) {
        // Clear timeout if it's transient
        if (isTransientShowing.value && transientTimerId.value) {
          clearTimeout(transientTimerId.value)
          transientTimerId.value = null
        }
        
        isTransientShowing.value = false
        
        // Revert to permanent notification if one exists
        if (permanentNotification.value && permanentNotification.value.id !== id) {
          activeNotification.value = permanentNotification.value
        } else {
          activeNotification.value = null
          permanentNotification.value = null
        }
        
        // Process queue
        processQueue()
      }
      
      // If permanent notification matches, dismiss it
      if (permanentNotification.value?.id === id) {
        permanentNotification.value = null
        
        // If it was also the active notification, update active
        if (activeNotification.value?.id === id) {
          activeNotification.value = null
          processQueue()
        }
      }
      
      // Remove matching notifications from queue
      notificationQueue.value = notificationQueue.value.filter(n => n.id !== id)
    } else {
      // Dismiss all notifications
      if (transientTimerId.value) {
        clearTimeout(transientTimerId.value)
        transientTimerId.value = null
      }
      
      activeNotification.value = null
      permanentNotification.value = null
      notificationQueue.value = []
      isTransientShowing.value = false
    }
  }

  // Clean up timers when component is unmounted
  const cleanup = () => {
    if (transientTimerId.value) {
      clearTimeout(transientTimerId.value)
      transientTimerId.value = null
    }
  }

  // Return public methods and properties
  return {
    activeNotification,
    hasNotifications,
    addNotification,
    dismissNotification,
    cleanup
  }
})