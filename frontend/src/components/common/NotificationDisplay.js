import React from 'react';
import { useNotification, NOTIFICATION_TYPES } from '../../contexts';
import './NotificationDisplay.css';

/**
 * Displays notifications from the NotificationContext
 * Place this component once at the top level of your app
 */
function NotificationDisplay() {
  const { notification, isWaking } = useNotification();

  return (
    <>
      {/* Backend Wake-Up Notification */}
      {isWaking && (
        <div className="notification-banner wake-notification">
          Waking server up... ready in 30-40 seconds.
        </div>
      )}

      {/* General Notification */}
      {notification && (
        <div
          className={`notification-banner ${
            notification.type === NOTIFICATION_TYPES.ERROR ? 'error-notification' : ''
          } ${
            notification.type === NOTIFICATION_TYPES.SUCCESS ? 'success-notification' : ''
          }`}
        >
          {notification.message}
        </div>
      )}
    </>
  );
}

export default NotificationDisplay;
