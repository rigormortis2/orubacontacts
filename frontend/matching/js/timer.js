/**
 * Lock Timer Management
 * Handles 5-minute countdown timer with auto-reload on expiry
 */

import { config } from './config.js';

export class LockTimer {
  constructor() {
    this.timeoutId = null;
    this.intervalId = null;
    this.startTime = null;
    this.endTime = null;
    this.onExpireCallback = null;
    this.displayElementId = null;
  }

  /**
   * Start the timer
   * @param {Function} onExpire - Callback when timer expires (defaults to page reload)
   */
  start(onExpire = null) {
    this.stop(); // Clear any existing timer

    this.startTime = Date.now();
    this.endTime = this.startTime + config.LOCK_TIMEOUT_MS;
    this.onExpireCallback = onExpire || this.defaultExpireHandler.bind(this);

    // Set timeout to trigger expiry
    this.timeoutId = setTimeout(() => {
      this.onExpireCallback();
    }, config.LOCK_TIMEOUT_MS);

    // Update display every second
    this.intervalId = setInterval(() => {
      this.updateDisplay();
    }, 1000);

    console.log('Lock timer started: 5 minutes');
  }

  /**
   * Stop the timer
   */
  stop() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.startTime = null;
    this.endTime = null;
  }

  /**
   * Reset the timer (restart from beginning)
   */
  reset() {
    this.start(this.onExpireCallback);
  }

  /**
   * Get time remaining in seconds
   */
  getTimeRemaining() {
    if (!this.endTime) return 0;

    const now = Date.now();
    const remaining = Math.max(0, this.endTime - now);
    return Math.floor(remaining / 1000);
  }

  /**
   * Format seconds to MM:SS
   */
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Update the display element
   */
  updateDisplay(elementId = 'lock-timer') {
    const element = document.getElementById(elementId);
    if (!element) return;

    const seconds = this.getTimeRemaining();
    const timeStr = this.formatTime(seconds);

    element.textContent = `Lock expires in: ${timeStr}`;

    // Apply color classes based on time remaining
    const container = element.closest('.timer-display');
    if (container) {
      container.classList.remove('warning', 'danger', 'blink');

      if (seconds <= config.BLINK_THRESHOLD) {
        container.classList.add('danger', 'blink');
      } else if (seconds <= config.DANGER_THRESHOLD) {
        container.classList.add('danger');
      } else if (seconds <= config.WARNING_THRESHOLD) {
        container.classList.add('warning');
      }
    }
  }

  /**
   * Default expire handler - reload page
   */
  defaultExpireHandler() {
    console.log('Lock expired, reloading page...');
    alert('Your lock has expired. The page will now reload.');
    location.reload();
  }

  /**
   * Check if timer is running
   */
  isRunning() {
    return this.timeoutId !== null;
  }
}

// Export singleton instance
export const lockTimer = new LockTimer();
export default lockTimer;
