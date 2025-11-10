/**
 * Application State Management
 * Central state store for the matching application
 */

export class AppState {
  constructor() {
    this.username = null;
    this.currentRawData = null;
    this.jobTitles = [];
    this.hospitals = [];
    this.cities = [];
    this.stats = null;
    this.phones = [];
    this.emails = [];
    this.contactForms = [];
    this.matchedPhoneIds = new Set(); // Track matched phones
    this.matchedEmailIds = new Set(); // Track matched emails
    this.listeners = new Map();
  }

  /**
   * Set username
   */
  setUsername(username) {
    this.username = username;
    this.emit('username-changed', username);
  }

  /**
   * Get username
   */
  getUsername() {
    return this.username;
  }

  /**
   * Set current raw data record
   */
  setCurrentRawData(rawData) {
    this.currentRawData = rawData;
    this.emit('rawdata-changed', rawData);
  }

  /**
   * Get current raw data
   */
  getCurrentRawData() {
    return this.currentRawData;
  }

  /**
   * Set job titles
   */
  setJobTitles(jobTitles) {
    this.jobTitles = jobTitles;
    this.emit('jobtitles-changed', jobTitles);
  }

  /**
   * Get job titles
   */
  getJobTitles() {
    return this.jobTitles;
  }

  /**
   * Set hospitals
   */
  setHospitals(hospitals) {
    this.hospitals = hospitals;
    this.emit('hospitals-changed', hospitals);
  }

  /**
   * Get hospitals
   */
  getHospitals() {
    return this.hospitals;
  }

  /**
   * Set cities
   */
  setCities(cities) {
    this.cities = cities;
    this.emit('cities-changed', cities);
  }

  /**
   * Get cities
   */
  getCities() {
    return this.cities;
  }

  /**
   * Set statistics
   */
  setStats(stats) {
    this.stats = stats;
    this.emit('stats-changed', stats);
  }

  /**
   * Get statistics
   */
  getStats() {
    return this.stats;
  }

  /**
   * Set phones
   */
  setPhones(phones) {
    this.phones = phones;
    this.emit('phones-changed', phones);
  }

  /**
   * Get phones (filtered by matched status)
   */
  getPhones() {
    return this.phones;
  }

  /**
   * Get unmatched phones only
   */
  getUnmatchedPhones() {
    return this.phones.filter(phone => !this.matchedPhoneIds.has(phone.id));
  }

  /**
   * Set emails
   */
  setEmails(emails) {
    this.emails = emails;
    this.emit('emails-changed', emails);
  }

  /**
   * Get emails
   */
  getEmails() {
    return this.emails;
  }

  /**
   * Get unmatched emails only
   */
  getUnmatchedEmails() {
    return this.emails.filter(email => !this.matchedEmailIds.has(email.id));
  }

  /**
   * Mark phone as matched
   */
  markPhoneAsMatched(phoneId) {
    this.matchedPhoneIds.add(phoneId);
    this.emit('phones-changed', this.phones);
  }

  /**
   * Mark email as matched
   */
  markEmailAsMatched(emailId) {
    this.matchedEmailIds.add(emailId);
    this.emit('emails-changed', this.emails);
  }

  /**
   * Check if phone is matched
   */
  isPhoneMatched(phoneId) {
    return this.matchedPhoneIds.has(phoneId);
  }

  /**
   * Check if email is matched
   */
  isEmailMatched(emailId) {
    return this.matchedEmailIds.has(emailId);
  }

  /**
   * Check if all phones and emails are matched
   */
  areAllItemsMatched() {
    const allPhones = this.phones.length;
    const allEmails = this.emails.length;
    const matchedPhones = this.matchedPhoneIds.size;
    const matchedEmails = this.matchedEmailIds.size;

    return allPhones === matchedPhones && allEmails === matchedEmails;
  }

  /**
   * Add a contact form
   */
  addContactForm() {
    const formId = `contact-form-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.contactForms.push({
      id: formId,
      data: {
        firstName: '',
        lastName: '',
        jobTitleId: null,
        hospitalId: null,
        notes: '',
        assignedPhones: [], // Track phones assigned to this form
        assignedEmails: []  // Track emails assigned to this form
      }
    });
    this.emit('contact-forms-changed', this.contactForms);
    return formId;
  }

  /**
   * Remove a contact form
   */
  removeContactForm(formId) {
    this.contactForms = this.contactForms.filter(form => form.id !== formId);
    this.emit('contact-forms-changed', this.contactForms);
  }

  /**
   * Update contact form data
   */
  updateContactForm(formId, data) {
    const form = this.contactForms.find(f => f.id === formId);
    if (form) {
      form.data = { ...form.data, ...data };
      this.emit('contact-form-updated', { formId, data: form.data });
    }
  }

  /**
   * Add assigned phone to contact form
   */
  addAssignedPhone(formId, phoneId, phoneNumber) {
    const form = this.contactForms.find(f => f.id === formId);
    if (form && !form.data.assignedPhones.some(p => p.id === phoneId)) {
      form.data.assignedPhones.push({ id: phoneId, phoneNumber });
      this.emit('contact-form-updated', { formId, data: form.data });
    }
  }

  /**
   * Add assigned email to contact form
   */
  addAssignedEmail(formId, emailId, emailAddress) {
    const form = this.contactForms.find(f => f.id === formId);
    if (form && !form.data.assignedEmails.some(e => e.id === emailId)) {
      form.data.assignedEmails.push({ id: emailId, emailAddress });
      this.emit('contact-form-updated', { formId, data: form.data });
    }
  }

  /**
   * Get all contact forms
   */
  getContactForms() {
    return this.contactForms;
  }

  /**
   * Clear all contact forms
   */
  clearContactForms() {
    this.contactForms = [];
    this.emit('contact-forms-changed', this.contactForms);
  }

  /**
   * Reset state for new record
   */
  resetForNewRecord() {
    this.currentRawData = null;
    this.phones = [];
    this.emails = [];
    this.contactForms = [];
    this.matchedPhoneIds.clear();
    this.matchedEmailIds.clear();
    this.emit('state-reset');
  }

  /**
   * Event listener management
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   */
  off(event, callback) {
    if (!this.listeners.has(event)) return;
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  /**
   * Emit event to listeners
   */
  emit(event, data) {
    if (!this.listeners.has(event)) return;
    this.listeners.get(event).forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });
  }
}

// Export singleton instance
export const appState = new AppState();
export default appState;
