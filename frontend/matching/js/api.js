/**
 * API Service Layer
 * Handles all HTTP requests to the backend
 */

import { config } from './config.js';

class APIService {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  /**
   * Generic fetch wrapper with error handling
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  /**
   * Get next unmatched raw_data record
   */
  async getNextUnmatched(username) {
    return this.request(`/matching/next?username=${encodeURIComponent(username)}`);
  }

  /**
   * Assign a contact person to a raw_data record
   */
  async assignContact(data) {
    return this.request('/matching/assign', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * Complete matching for a raw_data record
   */
  async completeMatching(rawDataId, username) {
    return this.request(`/matching/complete`, {
      method: 'POST',
      body: JSON.stringify({ rawDataId, username })
    });
  }

  /**
   * Release lock on a raw_data record
   */
  async releaseLock(rawDataId, username) {
    return this.request(`/matching/release`, {
      method: 'POST',
      body: JSON.stringify({ rawDataId, username })
    });
  }

  /**
   * Get all job titles
   */
  async getJobTitles() {
    return this.request('/matching/job-titles');
  }

  /**
   * Search hospitals by name
   */
  async getHospitals(search = '') {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.request(`/matching/hospitals${params}`);
  }

  /**
   * Get matching statistics
   */
  async getMatchingStats() {
    return this.request('/matching/stats');
  }

  /**
   * Get phones for a raw_data record
   * Note: This endpoint returns paginated results, we extract the data array
   */
  async getPhones(rawDataId) {
    const response = await this.request(`/phones?rawDataId=${rawDataId}&limit=100`);
    return response.data || [];
  }

  /**
   * Get emails for a raw_data record
   * Note: This endpoint returns paginated results, we extract the data array
   */
  async getEmails(rawDataId) {
    const response = await this.request(`/emails?rawDataId=${rawDataId}&limit=100`);
    return response.data || [];
  }

  /**
   * Create a new phone record
   */
  async createPhone(data) {
    return this.request('/phones', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * Create a new email record
   */
  async createEmail(data) {
    return this.request('/emails', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * Get cities list
   */
  async getCities() {
    return this.request('/cities');
  }
}

// Export singleton instance
export const api = new APIService(config.API_BASE_URL);
export default api;
