/**
 * UI Rendering and DOM Manipulation
 * Handles all visual updates and user interface rendering
 */

import { config } from './config.js';
import { appState } from './state.js';

export class UIManager {
  constructor() {
    this.modalElement = null;
  }

  /**
   * Render statistics dashboard
   */
  renderStats(stats) {
    if (!stats) return;

    const totalElement = document.getElementById('stat-total');
    const matchedElement = document.getElementById('stat-matched');
    const unmatchedElement = document.getElementById('stat-unmatched');
    const lockedElement = document.getElementById('stat-locked');

    if (totalElement) totalElement.textContent = stats.total || 0;
    if (matchedElement) matchedElement.textContent = stats.matched || 0;
    if (unmatchedElement) unmatchedElement.textContent = stats.unmatched || 0;
    if (lockedElement) lockedElement.textContent = stats.locked || 0;

    this.updateProgress(stats);
  }

  /**
   * Update progress bar
   */
  updateProgress(stats) {
    if (!stats || !stats.total) return;

    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');

    if (progressBar && progressText) {
      const percentage = Math.round((stats.matched / stats.total) * 100);
      progressBar.style.width = `${percentage}%`;
      progressText.textContent = `${percentage}% Complete (${stats.matched} / ${stats.total})`;
    }
  }

  /**
   * Render main matching card with raw data
   */
  renderMatchingCard(rawData) {
    const titleElement = document.getElementById('trello-title');
    const descElement = document.getElementById('trello-description');

    if (titleElement) {
      titleElement.textContent = rawData.title || 'No Title';
    }

    if (descElement) {
      descElement.textContent = rawData.description || 'No description available';
    }
  }

  /**
   * Render phone list
   */
  renderPhoneList(phones) {
    const container = document.getElementById('phone-list');
    if (!container) return;

    container.innerHTML = '';

    // Get unmatched phones only
    const unmatchedPhones = appState.getUnmatchedPhones();

    if (!unmatchedPhones || unmatchedPhones.length === 0) {
      container.innerHTML = '<div class="empty-message">All phones assigned</div>';
      return;
    }

    unmatchedPhones.forEach(phone => {
      const item = this.renderPhoneItem(phone);
      container.appendChild(item);
    });
  }

  /**
   * Render individual phone item with drag-and-drop support
   */
  renderPhoneItem(phone) {
    const div = document.createElement('div');
    div.className = 'phone-item';
    div.draggable = true;
    div.dataset.phoneId = phone.id;
    div.dataset.phoneNumber = phone.phoneNumber;
    div.dataset.phoneType = phone.phoneType || 'Unknown';

    const typeSpan = document.createElement('span');
    typeSpan.className = 'phone-type';
    typeSpan.textContent = phone.phoneType || 'Unknown';

    const numberSpan = document.createElement('span');
    numberSpan.className = 'phone-number';
    numberSpan.textContent = phone.phoneNumber || 'N/A';

    div.appendChild(typeSpan);
    div.appendChild(numberSpan);

    // Add drag event listeners
    div.addEventListener('dragstart', (e) => {
      e.dataTransfer.effectAllowed = 'copy';
      e.dataTransfer.setData('application/json', JSON.stringify({
        type: 'phone',
        id: phone.id,
        phoneNumber: phone.phoneNumber,
        phoneType: phone.phoneType
      }));
      div.classList.add('dragging');
    });

    div.addEventListener('dragend', (e) => {
      div.classList.remove('dragging');
    });

    return div;
  }

  /**
   * Render email list
   */
  renderEmailList(emails) {
    const container = document.getElementById('email-list');
    if (!container) return;

    container.innerHTML = '';

    // Get unmatched emails only
    const unmatchedEmails = appState.getUnmatchedEmails();

    if (!unmatchedEmails || unmatchedEmails.length === 0) {
      container.innerHTML = '<div class="empty-message">All emails assigned</div>';
      return;
    }

    unmatchedEmails.forEach(email => {
      const item = this.renderEmailItem(email);
      container.appendChild(item);
    });
  }

  /**
   * Render individual email item with drag-and-drop support
   */
  renderEmailItem(email) {
    const div = document.createElement('div');
    div.className = 'email-item';
    div.draggable = true;
    div.dataset.emailId = email.id;
    div.dataset.emailAddress = email.emailAddress;
    div.dataset.emailType = email.emailType || 'Unknown';

    const typeSpan = document.createElement('span');
    typeSpan.className = 'email-type';
    typeSpan.textContent = email.emailType || 'Unknown';

    const addressSpan = document.createElement('span');
    addressSpan.className = 'email-address';
    addressSpan.textContent = email.emailAddress || 'N/A';

    div.appendChild(typeSpan);
    div.appendChild(addressSpan);

    // Add drag event listeners
    div.addEventListener('dragstart', (e) => {
      e.dataTransfer.effectAllowed = 'copy';
      e.dataTransfer.setData('application/json', JSON.stringify({
        type: 'email',
        id: email.id,
        emailAddress: email.emailAddress,
        emailType: email.emailType
      }));
      div.classList.add('dragging');
    });

    div.addEventListener('dragend', (e) => {
      div.classList.remove('dragging');
    });

    return div;
  }

  /**
   * Setup drop zone for contact forms
   * This triggers the API call to assign phone/email to a contact
   */
  setupDropZone(element, formId, onDrop) {
    if (!element) return;

    element.classList.add('drop-zone');

    element.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      element.classList.add('drag-over');
    });

    element.addEventListener('dragleave', (e) => {
      element.classList.remove('drag-over');
    });

    element.addEventListener('drop', async (e) => {
      e.preventDefault();
      element.classList.remove('drag-over');

      try {
        const data = JSON.parse(e.dataTransfer.getData('application/json'));

        // Call the drop handler provided by the app
        if (onDrop) {
          await onDrop(formId, data);
        }
      } catch (error) {
        console.error('Error handling drop:', error);
        this.showAlert('Failed to process dropped item', config.ALERT_TYPES.ERROR);
      }
    });
  }

  /**
   * Render assigned items list on contact form
   */
  renderAssignedItems(formElement, formId) {
    const form = appState.getContactForms().find(f => f.id === formId);
    if (!form) return;

    let assignedContainer = formElement.querySelector('.assigned-items-container');
    if (!assignedContainer) {
      assignedContainer = document.createElement('div');
      assignedContainer.className = 'assigned-items-container';
      formElement.appendChild(assignedContainer);
    }

    const assignedPhones = form.data.assignedPhones || [];
    const assignedEmails = form.data.assignedEmails || [];

    if (assignedPhones.length === 0 && assignedEmails.length === 0) {
      assignedContainer.innerHTML = '';
      return;
    }

    let html = '<div class="assigned-items"><h4>Assigned Items:</h4>';

    if (assignedPhones.length > 0) {
      html += '<div class="assigned-phones"><strong>Phones:</strong><ul>';
      assignedPhones.forEach(phone => {
        html += `<li class="assigned-item">${this.escapeHtml(phone.phoneNumber)}</li>`;
      });
      html += '</ul></div>';
    }

    if (assignedEmails.length > 0) {
      html += '<div class="assigned-emails"><strong>Emails:</strong><ul>';
      assignedEmails.forEach(email => {
        html += `<li class="assigned-item">${this.escapeHtml(email.emailAddress)}</li>`;
      });
      html += '</ul></div>';
    }

    html += '</div>';
    assignedContainer.innerHTML = html;
  }

  /**
   * Show alert message
   */
  showAlert(message, type = config.ALERT_TYPES.INFO) {
    const alertsContainer = document.getElementById('alerts-container') || this.createAlertsContainer();

    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
      <span class="alert-message">${this.escapeHtml(message)}</span>
      <button class="alert-close" onclick="this.parentElement.remove()">×</button>
    `;

    alertsContainer.appendChild(alert);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      alert.classList.add('fade-out');
      setTimeout(() => alert.remove(), 300);
    }, 5000);
  }

  /**
   * Create alerts container if it doesn't exist
   */
  createAlertsContainer() {
    let container = document.getElementById('alerts-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'alerts-container';
      container.className = 'alerts-container';
      document.body.appendChild(container);
    }
    return container;
  }

  /**
   * Show modal dialog
   */
  showModal(title, content, options = {}) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h2>${this.escapeHtml(title)}</h2>
          ${options.closable !== false ? '<button class="modal-close">×</button>' : ''}
        </div>
        <div class="modal-body">
          ${content}
        </div>
        ${options.footer ? `<div class="modal-footer">${options.footer}</div>` : ''}
      </div>
    `;

    document.body.appendChild(modal);
    this.modalElement = modal;

    // Close handlers
    if (options.closable !== false) {
      const closeBtn = modal.querySelector('.modal-close');
      const overlay = modal.querySelector('.modal-overlay');

      const closeHandler = () => this.closeModal();
      closeBtn.addEventListener('click', closeHandler);
      overlay.addEventListener('click', closeHandler);
    }

    // Focus first input
    setTimeout(() => {
      const firstInput = modal.querySelector('input, textarea, select');
      if (firstInput) firstInput.focus();
    }, 100);

    return modal;
  }

  /**
   * Close modal
   */
  closeModal() {
    if (this.modalElement) {
      this.modalElement.remove();
      this.modalElement = null;
    }
  }

  /**
   * Show username modal
   */
  showUsernameModal(onSubmit) {
    const content = `
      <div class="username-form">
        <label for="username-input">Enter your username to continue:</label>
        <input type="text" id="username-input" class="form-input" placeholder="Your name" required>
        <button id="username-submit" class="btn btn-primary">Start Matching</button>
      </div>
    `;

    const modal = this.showModal('Welcome to Matching System', content, { closable: false });

    const input = modal.querySelector('#username-input');
    const submitBtn = modal.querySelector('#username-submit');

    const handleSubmit = () => {
      const username = input.value.trim();
      if (username) {
        this.closeModal();
        onSubmit(username);
      } else {
        this.showAlert('Please enter a username', config.ALERT_TYPES.ERROR);
      }
    };

    submitBtn.addEventListener('click', handleSubmit);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleSubmit();
    });
  }

  /**
   * Show loading state
   */
  showLoading(message = 'Loading...') {
    const loader = document.createElement('div');
    loader.id = 'global-loader';
    loader.className = 'global-loader';
    loader.innerHTML = `
      <div class="loader-content">
        <div class="spinner"></div>
        <p>${this.escapeHtml(message)}</p>
      </div>
    `;
    document.body.appendChild(loader);
  }

  /**
   * Hide loading state
   */
  hideLoading() {
    const loader = document.getElementById('global-loader');
    if (loader) loader.remove();
  }

  /**
   * Enable/disable button
   */
  setButtonState(buttonId, enabled) {
    const button = document.getElementById(buttonId);
    if (button) {
      button.disabled = !enabled;
    }
  }

  /**
   * Show empty state
   */
  showEmptyState(message = 'No more records to match!') {
    const container = document.getElementById('matching-card');
    if (container) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">✓</div>
          <h2>All Done!</h2>
          <p>${this.escapeHtml(message)}</p>
          <button class="btn btn-primary" onclick="location.reload()">Refresh</button>
        </div>
      `;
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Format date for display
   */
  formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  /**
   * Populate job title pills with defensive coding
   */
  populateJobTitles(jobTitles, selectElement) {
    if (!selectElement) return;

    selectElement.innerHTML = '<option value="">Select Job Title...</option>';

    // Defensive coding: ensure jobTitles is an array
    const jobTitlesArray = Array.isArray(jobTitles) ? jobTitles : [];

    jobTitlesArray.forEach(jobTitle => {
      const option = document.createElement('option');
      option.value = jobTitle.id;
      option.textContent = jobTitle.title;
      selectElement.appendChild(option);
    });
  }

  /**
   * Populate hospital dropdown with search and defensive coding
   */
  populateHospitals(hospitals, selectElement) {
    if (!selectElement) return;

    selectElement.innerHTML = '<option value="">Select Hospital...</option>';

    // Defensive coding: ensure hospitals is an array
    const hospitalsArray = Array.isArray(hospitals) ? hospitals : [];

    hospitalsArray.forEach(hospital => {
      const option = document.createElement('option');
      option.value = hospital.id;
      option.textContent = `${hospital.name} - ${hospital.city?.name || 'Unknown'}`;
      selectElement.appendChild(option);
    });
  }
}

// Export singleton instance
export const ui = new UIManager();
export default ui;
