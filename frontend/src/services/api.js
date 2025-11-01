const API_BASE_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:8000';

class ApiService {
  async handleResponse(response) {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    return response.json();
  }

  // States & Districts
  async getStates() {
    const response = await fetch(`${API_BASE_URL}/api/v1/districts/states`);
    return this.handleResponse(response);
  }

  async getDistricts(stateId) {
    const response = await fetch(`${API_BASE_URL}/api/v1/districts/states/${stateId}/districts`);
    return this.handleResponse(response);
  }

  async getDistrictDetails(id) {
    const response = await fetch(`${API_BASE_URL}/api/v1/districts/${id}`);
    return this.handleResponse(response);
  }

  async searchDistrict(query) {
    const response = await fetch(`${API_BASE_URL}/api/v1/districts/search?q=${encodeURIComponent(query)}`);
    return this.handleResponse(response);
  }

  
  async detectDistrictByLocation(latitude, longitude) {
    const response = await fetch(`${API_BASE_URL}/api/v1/districts/by-location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude, longitude })
    });
    return this.handleResponse(response);
  }

  // Metrics
  async getCurrentMetrics(districtId) {
    const response = await fetch(`${API_BASE_URL}/api/v1/metrics/districts/${districtId}`);
    return this.handleResponse(response);
  }

  async getHistoricalMetrics(districtId, params = {}) {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/api/v1/metrics/districts/${districtId}/history?${query}`);
    return this.handleResponse(response);
  }

  async compareWithState(districtId) {
    const response = await fetch(`${API_BASE_URL}/api/v1/metrics/districts/${districtId}/compare`);
    return this.handleResponse(response);
  }

  // Admin
  async uploadData(file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/upload`, {
      method: 'POST',
      body: formData
    });
    return this.handleResponse(response);
  }

  async triggerSync() {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/sync`, {
      method: 'POST'
    });
    return this.handleResponse(response);
  }

  async getSyncStatus() {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/sync-status`);
    return this.handleResponse(response);
  }

  async clearCache() {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/clear-cache`, {
      method: 'POST'
    });
    return this.handleResponse(response);
  }

  async getSystemStats() {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/stats`);
    return this.handleResponse(response);
  }

  async getSnapshots() {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/snapshots`);
    return this.handleResponse(response);
  }

  async healthCheck() {
    const response = await fetch(`${API_BASE_URL}/health`);
    return this.handleResponse(response);
  }
}

export default new ApiService();
