import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * Notification types
 */
export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  ERROR: 'error',
  WAKE: 'wake',
};

/**
 * Default durations for auto-dismiss (in ms)
 */
const DEFAULT_DURATIONS = {
  [NOTIFICATION_TYPES.INFO]: 4000,
  [NOTIFICATION_TYPES.SUCCESS]: 3000,
  [NOTIFICATION_TYPES.ERROR]: 6000,
  [NOTIFICATION_TYPES.WAKE]: null, // Wake notifications don't auto-dismiss
};

const NotificationContext = createContext(null);

/**
 * Hook to access notification context
 * @returns {{ notification, notify, clearNotification, isWaking, setWaking }}
 */
export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

/**
 * Provider component for notification state
 */
export function NotificationProvider({ children }) {
  const [notification, setNotification] = useState(null);
  const [isWaking, setIsWaking] = useState(false);

  /**
   * Show a notification
   * @param {string} message - The notification message
   * @param {string} type - One of NOTIFICATION_TYPES
   * @param {number|null} duration - Auto-dismiss duration (null = no auto-dismiss)
   */
  const notify = useCallback((message, type = NOTIFICATION_TYPES.INFO, duration) => {
    // Format message with icon based on type
    let formattedMessage = message;
    if (type === NOTIFICATION_TYPES.ERROR && !message.startsWith('❌')) {
      formattedMessage = '❌ Error: ' + message;
    } else if (type === NOTIFICATION_TYPES.SUCCESS && !message.startsWith('✅')) {
      formattedMessage = '✅ ' + message;
    } else if (type === NOTIFICATION_TYPES.INFO && !message.startsWith('ℹ️')) {
      formattedMessage = 'ℹ️ ' + message;
    }

    const timestamp = Date.now();
    setNotification({
      message: formattedMessage,
      type,
      timestamp,
    });

    // Auto-dismiss after duration
    const dismissDuration = duration !== undefined ? duration : DEFAULT_DURATIONS[type];
    if (dismissDuration) {
      setTimeout(() => {
        setNotification(prev => {
          // Only clear if this is still the same notification
          if (prev && prev.timestamp === timestamp) {
            return null;
          }
          return prev;
        });
      }, dismissDuration);
    }
  }, []);

  /**
   * Clear the current notification
   */
  const clearNotification = useCallback(() => {
    setNotification(null);
  }, []);

  /**
   * Set backend waking state
   */
  const setWaking = useCallback((waking) => {
    setIsWaking(waking);
  }, []);

  /**
   * Legacy wrapper for compatibility with existing code
   * @param {string} message
   * @param {boolean} isError
   */
  const notifyLegacy = useCallback((message, isError = false) => {
    notify(message, isError ? NOTIFICATION_TYPES.ERROR : NOTIFICATION_TYPES.INFO);
  }, [notify]);

  const value = {
    notification,
    notify,
    notifyLegacy,
    clearNotification,
    isWaking,
    setWaking,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export default NotificationContext;
