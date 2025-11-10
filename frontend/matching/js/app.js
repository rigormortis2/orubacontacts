/**
 * Main Application Logic
 * Orchestrates the matching workflow and coordinates all modules
 */

import { config } from './config.js';
import { api } from './api.js';
import { lockTimer } from './timer.js';
import { appState } from './state.js';
import { ui } from './ui.js';

class MatchingApp {
  constructor() {
    this.initialized = false;
    this.hospitalSearchTimeout = null;
  }

  /**
   * Initialize the application
   */
  async init() {
    console.log('Initializing Matching System...');

    // Check for existing username
    const savedUsername = localStorage.getItem(config.STORAGE_KEYS.USERNAME);

    if (savedUsername) {
      appState.setUsername(savedUsername);
      await this.startMatching();
    } else {
      // Show username modal
      ui.showUsernameModal(async (username) => {
        localStorage.setItem(config.STORAGE_KEYS.USERNAME, username);
        appState.setUsername(username);
        await this.startMatching();
      });
    }

    this.setupEventListeners();
    this.initialized = true;
  }

  /**
   * Start the matching workflow
   */
  async startMatching() {
    try {
      ui.showLoading('Loading matching data...');

      // Load initial data in parallel
      await Promise.all([
        this.loadStats(),
        this.loadJobTitles(),
        this.loadHospitals()
      ]);

      // Load next unmatched record
      await this.loadNextRecord();

      ui.hideLoading();
    } catch (error) {
      ui.hideLoading();
      ui.showAlert(`Failed to start matching: ${error.message}`, config.ALERT_TYPES.ERROR);
      console.error('Start matching error:', error);
    }
  }

  /**
   * Load statistics
   */
  async loadStats() {
    try {
      const stats = await api.getMatchingStats();
      appState.setStats(stats);
      ui.renderStats(stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }

  /**
   * Load job titles
   */
  async loadJobTitles() {
    try {
      const response = await api.getJobTitles();
      // Extract the jobTitles array from the response object
      appState.setJobTitles(response.jobTitles || []);
    } catch (error) {
      console.error('Failed to load job titles:', error);
      // Fallback to empty array on error
      appState.setJobTitles([]);
    }
  }

  /**
   * Load hospitals
   */
  async loadHospitals(search = '') {
    try {
      const response = await api.getHospitals(search);
      // Extract the hospitals array from the response object
      appState.setHospitals(response.hospitals || []);
    } catch (error) {
      console.error('Failed to load hospitals:', error);
      // Fallback to empty array on error
      appState.setHospitals([]);
    }
  }

  /**
   * Load next unmatched record
   */
  async loadNextRecord() {
    try {
      const username = appState.getUsername();
      const data = await api.getNextUnmatched(username);

      if (!data || !data.id) {
        ui.showEmptyState();
        lockTimer.stop();
        return;
      }

      appState.setCurrentRawData(data);
      ui.renderMatchingCard(data);

      // Load phones and emails
      await this.loadPhonesAndEmails(data.id);

      // Start lock timer
      lockTimer.start();

      // Clear any existing contact forms and reset matched items
      appState.resetForNewRecord();
      appState.setCurrentRawData(data);
      this.renderContactForms();

    } catch (error) {
      ui.showAlert(`Failed to load next record: ${error.message}`, config.ALERT_TYPES.ERROR);
      console.error('Load next record error:', error);
    }
  }

  /**
   * Load phones and emails for current record
   */
  async loadPhonesAndEmails(rawDataId) {
    try {
      const [phones, emails] = await Promise.all([
        api.getPhones(rawDataId),
        api.getEmails(rawDataId)
      ]);

      appState.setPhones(phones);
      appState.setEmails(emails);

      ui.renderPhoneList(phones);
      ui.renderEmailList(emails);
    } catch (error) {
      console.error('Failed to load phones/emails:', error);
      ui.renderPhoneList([]);
      ui.renderEmailList([]);
    }
  }

  /**
   * Reload phones and emails after assignment
   */
  async reloadPhonesAndEmails() {
    const rawData = appState.getCurrentRawData();
    if (rawData && rawData.id) {
      await this.loadPhonesAndEmails(rawData.id);
    }
  }

  /**
   * Validate contact form data before drop
   */
  validateContactForm(formId) {
    const form = appState.getContactForms().find(f => f.id === formId);
    if (!form) {
      return { valid: false, error: 'Contact form not found' };
    }

    const { firstName, jobTitleId } = form.data;

    if (!firstName || firstName.trim() === '') {
      return { valid: false, error: 'Please enter First Name before assigning items' };
    }

    if (!jobTitleId) {
      return { valid: false, error: 'Please select Job Title before assigning items' };
    }

    return { valid: true };
  }

  /**
   * Handle drop of phone/email onto contact form
   * This immediately calls the API to create a Contact
   */
  async handleDrop(formId, droppedData) {
    try {
      // Validate form data
      const validation = this.validateContactForm(formId);
      if (!validation.valid) {
        ui.showAlert(validation.error, config.ALERT_TYPES.WARNING);
        return;
      }

      // Check if already matched
      if (droppedData.type === 'phone' && appState.isPhoneMatched(droppedData.id)) {
        ui.showAlert('This phone has already been assigned', config.ALERT_TYPES.WARNING);
        return;
      }

      if (droppedData.type === 'email' && appState.isEmailMatched(droppedData.id)) {
        ui.showAlert('This email has already been assigned', config.ALERT_TYPES.WARNING);
        return;
      }

      // Get form data
      const form = appState.getContactForms().find(f => f.id === formId);
      const { firstName, lastName, jobTitleId, hospitalId, notes } = form.data;
      const username = appState.getUsername();

      // Prepare API payload
      const payload = {
        username,
        firstName: firstName.trim(),
        lastName: lastName ? lastName.trim() : undefined,
        jobTitleId: parseInt(jobTitleId),
        hospitalId: hospitalId ? parseInt(hospitalId) : undefined,
        notes: notes || undefined
      };

      // Add phoneId or emailId based on dropped item type
      if (droppedData.type === 'phone') {
        payload.phoneId = droppedData.id;
      } else if (droppedData.type === 'email') {
        payload.emailId = droppedData.id;
      }

      ui.showLoading('Assigning...');

      // Call API to assign
      const result = await api.assignContact(payload);

      ui.hideLoading();

      // Mark as matched in state
      if (droppedData.type === 'phone') {
        appState.markPhoneAsMatched(droppedData.id);
        appState.addAssignedPhone(formId, droppedData.id, droppedData.phoneNumber);
        ui.showAlert(`Phone ${droppedData.phoneNumber} assigned successfully!`, config.ALERT_TYPES.SUCCESS);
      } else if (droppedData.type === 'email') {
        appState.markEmailAsMatched(droppedData.id);
        appState.addAssignedEmail(formId, droppedData.id, droppedData.emailAddress);
        ui.showAlert(`Email ${droppedData.emailAddress} assigned successfully!`, config.ALERT_TYPES.SUCCESS);
      }

      // Re-render phone and email lists to hide matched items
      ui.renderPhoneList(appState.getPhones());
      ui.renderEmailList(appState.getEmails());

      // Update the contact form to show assigned items
      const formElement = document.querySelector(`[data-form-id="${formId}"]`);
      if (formElement) {
        ui.renderAssignedItems(formElement, formId);
      }

      // Check if all items are matched
      if (appState.areAllItemsMatched()) {
        ui.showAlert('All phones and emails assigned! You can now complete matching.', config.ALERT_TYPES.INFO);
      }

    } catch (error) {
      ui.hideLoading();
      ui.showAlert(`Failed to assign: ${error.message}`, config.ALERT_TYPES.ERROR);
      console.error('Drop assignment error:', error);
    }
  }

  /**
   * Render contact forms container
   */
  renderContactForms() {
    const container = document.getElementById('contact-forms-container');
    if (!container) return;

    const forms = appState.getContactForms();

    if (forms.length === 0) {
      container.innerHTML = `
        <div class="no-contacts-message">
          <p>No contact persons added yet.</p>
          <p>Click "Add Contact Person" below to get started.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    forms.forEach(form => {
      const formElement = this.createContactForm(form.id);
      container.appendChild(formElement);
    });
  }

  /**
   * Create a single contact form with drag-and-drop support
   */
  createContactForm(formId) {
    const div = document.createElement('div');
    div.className = 'contact-form';
    div.dataset.formId = formId;
    div.innerHTML = `
      <div class="contact-form-header">
        <h3>Contact Person</h3>
        <button class="btn-icon btn-remove-contact" data-form-id="${formId}">
          <span>×</span>
        </button>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>First Name <span class="required">*</span></label>
          <input type="text" class="form-input" data-field="firstName" placeholder="Enter first name" required>
        </div>
        <div class="form-group">
          <label>Last Name</label>
          <input type="text" class="form-input" data-field="lastName" placeholder="Enter last name">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Job Title <span class="required">*</span></label>
          <select class="form-select job-title-select" data-field="jobTitleId" required>
            <option value="">Select Job Title...</option>
          </select>
        </div>
        <div class="form-group">
          <label>Hospital</label>
          <select class="form-select hospital-select" data-field="hospitalId">
            <option value="">Select Hospital...</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>Notes</label>
        <textarea class="form-textarea" data-field="notes" rows="3" placeholder="Additional notes..."></textarea>
      </div>
      <div class="drop-instructions">
        <p>Drag and drop phones/emails from the left panel here to assign them to this contact.</p>
      </div>
    `;

    // Populate dropdowns
    const jobTitleSelect = div.querySelector('.job-title-select');
    const hospitalSelect = div.querySelector('.hospital-select');

    ui.populateJobTitles(appState.getJobTitles(), jobTitleSelect);
    ui.populateHospitals(appState.getHospitals(), hospitalSelect);

    // Setup drag-and-drop zone for the entire form
    ui.setupDropZone(div, formId, (formId, data) => this.handleDrop(formId, data));

    // Add event listeners for form inputs
    div.querySelectorAll('[data-field]').forEach(input => {
      input.addEventListener('change', (e) => {
        const field = e.target.dataset.field;
        let value = e.target.value;

        // Convert to number for IDs
        if (field === 'jobTitleId' || field === 'hospitalId') {
          value = value ? parseInt(value) : null;
        }

        appState.updateContactForm(formId, { [field]: value });
      });
    });

    // Remove contact button
    const removeBtn = div.querySelector('.btn-remove-contact');
    removeBtn.addEventListener('click', () => {
      if (confirm('Remove this contact person? Any assigned items will remain unmatched.')) {
        appState.removeContactForm(formId);
        this.renderContactForms();
      }
    });

    // Render any already assigned items
    ui.renderAssignedItems(div, formId);

    return div;
  }

  /**
   * Add a new contact form
   */
  addContactForm() {
    const forms = appState.getContactForms();

    if (forms.length >= config.MAX_CONTACT_PERSONS) {
      ui.showAlert(`Maximum ${config.MAX_CONTACT_PERSONS} contact persons allowed`, config.ALERT_TYPES.WARNING);
      return;
    }

    appState.addContactForm();
    this.renderContactForms();
  }

  /**
   * Complete matching for current record
   * Only validates and marks as complete - all assignments already done
   */
  async completeMatching() {
    try {
      const rawData = appState.getCurrentRawData();
      const username = appState.getUsername();

      if (!rawData || !rawData.id) {
        ui.showAlert('No active record to complete', config.ALERT_TYPES.ERROR);
        return;
      }

      // Check if all phones and emails are matched
      if (!appState.areAllItemsMatched()) {
        const unmatchedPhones = appState.getUnmatchedPhones().length;
        const unmatchedEmails = appState.getUnmatchedEmails().length;

        const message = `Please assign all phones and emails before completing. Remaining: ${unmatchedPhones} phone(s), ${unmatchedEmails} email(s).`;
        ui.showAlert(message, config.ALERT_TYPES.WARNING);
        return;
      }

      ui.showLoading('Completing matching...');

      // Call the complete endpoint - backend will verify everything is matched
      await api.completeMatching(rawData.id, username);

      ui.hideLoading();
      ui.showAlert('Matching completed successfully!', config.ALERT_TYPES.SUCCESS);

      // Stop timer and load next record
      lockTimer.stop();
      await this.loadStats();
      await this.loadNextRecord();

    } catch (error) {
      ui.hideLoading();
      ui.showAlert(`Failed to complete matching: ${error.message}`, config.ALERT_TYPES.ERROR);
      console.error('Complete matching error:', error);
    }
  }

  /**
   * Release lock and exit
   */
  async releaseLock() {
    try {
      const rawData = appState.getCurrentRawData();
      const username = appState.getUsername();

      if (!rawData || !rawData.id) {
        location.reload();
        return;
      }

      ui.showLoading('Releasing lock...');
      await api.releaseLock(rawData.id, username);

      lockTimer.stop();
      ui.hideLoading();
      ui.showAlert('Lock released successfully', config.ALERT_TYPES.SUCCESS);

      setTimeout(() => location.reload(), 1000);
    } catch (error) {
      ui.hideLoading();
      ui.showAlert(`Failed to release lock: ${error.message}`, config.ALERT_TYPES.ERROR);
      console.error('Release lock error:', error);
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Add contact button
    const addContactBtn = document.getElementById('btn-add-contact');
    if (addContactBtn) {
      addContactBtn.addEventListener('click', () => this.addContactForm());
    }

    // Complete matching button
    const completeBtn = document.getElementById('btn-complete-matching');
    if (completeBtn) {
      completeBtn.addEventListener('click', () => this.completeMatching());
    }

    // Release lock button
    const releaseLockBtn = document.getElementById('btn-release-lock');
    if (releaseLockBtn) {
      releaseLockBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to release this lock and exit?')) {
          this.releaseLock();
        }
      });
    }

    // Hospital search with debouncing
    document.addEventListener('input', (e) => {
      if (e.target.classList.contains('hospital-select')) {
        clearTimeout(this.hospitalSearchTimeout);
        this.hospitalSearchTimeout = setTimeout(async () => {
          await this.loadHospitals(e.target.value);
          // Repopulate all hospital selects
          document.querySelectorAll('.hospital-select').forEach(select => {
            ui.populateHospitals(appState.getHospitals(), select);
          });
        }, config.SEARCH_DEBOUNCE_MS);
      }
    });

    // Change username
    const changeUsernameBtn = document.getElementById('btn-change-username');
    if (changeUsernameBtn) {
      changeUsernameBtn.addEventListener('click', () => {
        if (confirm('Change username? Your current lock will be released.')) {
          localStorage.removeItem(config.STORAGE_KEYS.USERNAME);
          this.releaseLock();
        }
      });
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new MatchingApp();
  app.init();

  // Expose app instance for debugging
  window.matchingApp = app;
});

export default MatchingApp;
