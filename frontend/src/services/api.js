import axios from 'axios';
import { MOCK_STATS, MOCK_TRACKER_DATA } from './mockData';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 6000,
  withCredentials: true, // Automatically sends and receives httpOnly cookies across CORS
});

// Attach JWT token if stored in localStorage
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('pulse_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  // Authentication: Login
  async login(credentials) {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      if (response.data?.access_token) {
        localStorage.setItem('pulse_token', response.data.access_token);
      }
      return { data: response.data, isLive: true };
    } catch (error) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Invalid email or password');
    }
  },

  // Authentication: Register
  async register(userData) {
    try {
      const response = await apiClient.post('/auth/register', userData);
      if (response.data?.access_token) {
        localStorage.setItem('pulse_token', response.data.access_token);
      }
      return { data: response.data, isLive: true };
    } catch (error) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Registration failed. If you already have an account, please log in.');
    }
  },

  // Authentication: Logout
  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('pulse_token');
    }
  },

  // Authentication: Get Current Authenticated User (Me)
  async getMe() {
    try {
      const response = await apiClient.get('/auth/me');
      return { data: response.data, isLive: true };
    } catch {
      return { data: null, isLive: false };
    }
  },

  // Search Donors
  async searchDonors(params = {}) {
    try {
      const response = await apiClient.get('/donors/search', { params });
      return { data: response.data, isLive: true };
    } catch (error) {
      console.warn('Donor search request error:', error.message);
      return { data: [], isLive: false };
    }
  },

  // Toggle Availability
  async toggleAvailability(is_available = null) {
    try {
      const response = await apiClient.patch('/donors/toggle-availability', { is_available });
      return { data: response.data, isLive: true };
    } catch (error) {
      console.warn('Toggle availability error:', error.message);
      return { data: null, isLive: false };
    }
  },

  // One-click blood request handshake
  async requestBlood(donorId, reqData = {}) {
    const response = await apiClient.post(`/donors/${donorId}/request`, reqData);
    return { data: response.data, isLive: true };
  },

  // Create SOS Emergency
  async createSOS(formData) {
    const response = await apiClient.post('/sos/create', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return { data: response.data, isLive: true };
  },

  // Fetch Active SOS
  async fetchActiveSOS(lat = 12.9716, lng = 77.5946) {
    try {
      const response = await apiClient.get('/sos/active', { params: { lat, lng } });
      return { data: response.data, isLive: true };
    } catch (error) {
      console.warn('Fetch active SOS error:', error.message);
      return { data: [], isLive: false };
    }
  },

  // Respond to SOS
  async respondToSOS(requestId, payload = {}) {
    const response = await apiClient.post(`/sos/${requestId}/respond`, payload);
    return { data: response.data, isLive: true };
  },

  // Fetch Dashboard Stats
  async fetchStats() {
    try {
      const response = await apiClient.get('/stats');
      return { data: response.data, isLive: true };
    } catch {
      return { data: MOCK_STATS, isLive: false };
    }
  },

  // Fetch Request & Mission Tracker
  async fetchTrackerRequests(statusFilter = 'All') {
    try {
      const params = statusFilter && statusFilter !== 'All' ? { status_filter: statusFilter } : {};
      const response = await apiClient.get('/tracker/all', { params });
      return { data: response.data, isLive: true };
    } catch (error) {
      console.warn('Fetch tracker error:', error.message);
      return {
        data: MOCK_TRACKER_DATA,
        isLive: false
      };
    }
  },

  // Update Request Status (e.g. Mark Fulfilled or Cancelled)
  async updateTrackerStatus(sourceType, rawId, newStatus) {
    const response = await apiClient.patch(`/tracker/${sourceType}/${rawId}/status`, {
      status: newStatus
    });
    return { data: response.data, isLive: true };
  }
};
