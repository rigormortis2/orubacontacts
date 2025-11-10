/**
 * Application Configuration
 * Central configuration for API endpoints and constants
 */

export const config = {
  // API Configuration
  API_BASE_URL: 'http://172.16.16.188:3000/api',

  // Lock Timer Configuration (5 minutes in milliseconds)
  LOCK_TIMEOUT_MS: 5 * 60 * 1000,

  // Timer Warning Thresholds (in seconds)
  WARNING_THRESHOLD: 120, // 2 minutes - show yellow
  DANGER_THRESHOLD: 60,   // 1 minute - show red
  BLINK_THRESHOLD: 30,    // 30 seconds - start blinking

  // Local Storage Keys
  STORAGE_KEYS: {
    USERNAME: 'matchingSystemUsername',
    THEME: 'matchingSystemTheme'
  },

  // UI Constants
  SEARCH_DEBOUNCE_MS: 300,
  MIN_SEARCH_LENGTH: 2,
  MAX_CONTACT_PERSONS: 5,

  // Alert Types
  ALERT_TYPES: {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
  }
};

export default config;
