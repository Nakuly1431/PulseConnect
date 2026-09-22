import axios from 'axios';
import { MOCK_DONORS, MOCK_EMERGENCIES, MOCK_STATS, MOCK_TRACKER_DATA } from './mockData';

const rawApiUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').trim().replace(/\/+$/, '');
const API_BASE_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
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

const formatErrorDetail = (detail) => {
  if (!detail) return null;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map(item => item.msg ? `${item.loc?.slice(-1)[0] || 'Field'}: ${item.msg}` : JSON.stringify(item)).join(' | ');
  }
  return JSON.stringify(detail);
};

const haversineDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

const filterDonors = (list, params = {}) => {
  let res = [...list];
  const centerLat = params.lat || 20.2961;
  const centerLng = params.lng || 85.8245;

  // Calculate distance for each donor
  res = res.map(d => {
    const dist = d.distance_km != null 
      ? d.distance_km 
      : haversineDistance(centerLat, centerLng, d.latitude, d.longitude);
    return { ...d, distance_km: dist };
  });

  if (params.blood_group && params.blood_group !== 'All') {
    res = res.filter(d => d.blood_group === params.blood_group);
  }
  if (params.only_available) {
    res = res.filter(d => d.is_available);
  }
  if (params.locality && params.locality.trim()) {
    const q = params.locality.toLowerCase().trim();
    res = res.filter(d => 
      (d.locality && d.locality.toLowerCase().includes(q)) ||
      (d.city && d.city.toLowerCase().includes(q)) ||
      (d.state && d.state.toLowerCase().includes(q)) ||
      (d.full_name && d.full_name.toLowerCase().includes(q))
    );
  }
  if (params.radius_km && Number(params.radius_km) < 100) {
    res = res.filter(d => d.distance_km == null || d.distance_km <= Number(params.radius_km));
  }

  // Sort by nearest distance
  res.sort((a, b) => {
    if (a.distance_km == null) return 1;
    if (b.distance_km == null) return -1;
    return a.distance_km - b.distance_km;
  });

  return res;
};


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
        throw new Error(formatErrorDetail(error.response.data.detail));
      }
      if (!error.response) {
        throw new Error('Unable to connect to the backend server. Please verify your backend API URL and ensure the server is online.');
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
        throw new Error(formatErrorDetail(error.response.data.detail));
      }
      if (!error.response) {
        throw new Error('Unable to connect to the backend server. Please verify your backend API URL and ensure the server is online.');
      }
      throw new Error(error.response?.data?.message || error.response?.statusText || 'Registration failed. Please verify your connection and details, then try again.');
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

  // Authentication: Update Profile
  async updateProfile(profileData) {
    try {
      const response = await apiClient.put('/auth/profile', profileData);
      return { data: response.data, isLive: true };
    } catch (error) {
      if (error.response?.data?.detail) {
        throw new Error(formatErrorDetail(error.response.data.detail));
      }
      throw new Error('Failed to update user profile. Please check your data.');
    }
  },

  // Search Donors
  async searchDonors(params = {}) {
    const cleanParams = { ...params };
    if (cleanParams.radius_km >= 100) {
      delete cleanParams.radius_km;
    }
    try {
      const response = await apiClient.get('/donors/search', { params: cleanParams });
      if (Array.isArray(response.data)) {
        return { data: response.data, isLive: true };
      }
      return { data: [], isLive: true };
    } catch (error) {
      console.warn('Donor search request error, using demo Odisha donors:', error.message);
      return { data: filterDonors(MOCK_DONORS, params), isLive: false };
    }
  },

  // Toggle Availability
  async toggleAvailability(is_available = null) {
    try {
      const response = await apiClient.patch('/donors/toggle-availability', { is_available });
      return { data: response.data, isLive: true };
    } catch (error) {
      if (error.response?.data?.detail) {
        throw new Error(formatErrorDetail(error.response.data.detail));
      }
      throw new Error(error.message || 'Failed to toggle availability');
    }
  },

  // Direct blood request handshake with patient need details
  async requestBlood(donorId, reqData = {}) {
    try {
      const response = await apiClient.post(`/donors/${donorId}/request`, reqData);
      return { data: response.data, isLive: true };
    } catch (error) {
      if (error.response?.data?.detail) {
        throw new Error(formatErrorDetail(error.response.data.detail));
      }
      // If server offline, simulate mock success for demo (but warn user)
      return {
        data: {
          id: Date.now(),
          donor_id: donorId,
          status: 'Requested',
          notes: reqData.notes || 'Emergency direct blood request',
          timestamp: new Date().toISOString(),
          _offline_mode: true
        },
        isLive: false
      };
    }
  },

  // Send SOS OTP verification
  async sendSOSOtp(phoneNumber) {
    const response = await apiClient.post('/sos/send-otp', { phone_number: phoneNumber });
    return { data: response.data, isLive: true };
  },

  // Create SOS Emergency
  async createSOS(formData) {
    const response = await apiClient.post('/sos/create', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return { data: response.data, isLive: true };
  },

  // Update SOS Emergency (for correcting filings under stress)
  async updateSOS(requestId, updateData) {
    const response = await apiClient.put(`/sos/${requestId}`, updateData);
    return { data: response.data, isLive: true };
  },

  // Fetch Active SOS
  async fetchActiveSOS(params = {}) {
    try {
      const response = await apiClient.get('/sos/active', { params });
      if (Array.isArray(response.data) && response.data.length > 0) {
        return { data: response.data, isLive: true };
      }
      return { data: MOCK_EMERGENCIES, isLive: true };
    } catch (error) {
      console.warn('Fetch active SOS error, using demo Odisha emergencies:', error.message);
      return { data: MOCK_EMERGENCIES, isLive: false };
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
    } catch (error) {
      if (error.response) {
        // Real HTTP error from reachable backend - do not silently substitute mock data
        console.error('API error fetching stats:', error.response.status, error.response.data);
        throw error;
      }
      // Offline fallback only when backend is completely unreachable
      return { data: MOCK_STATS, isLive: false };
    }
  },

  // Fetch Request & Mission Tracker (defaults to user's own requests/missions)
  async fetchTrackerRequests(statusFilter = 'All', scope = 'my') {
    try {
      const params = { scope };
      if (statusFilter && statusFilter !== 'All') {
        params.status_filter = statusFilter;
      }
      const response = await apiClient.get('/tracker/all', { params });
      return { data: response.data, isLive: true };
    } catch (error) {
      if (error.response) {
        // Real HTTP error from reachable backend - do not silently substitute mock data
        console.error('API error fetching tracker:', error.response.status, error.response.data);
        throw error;
      }
      return {
        data: { summary: { total: 0, accepted: 0, pending: 0, fulfilled: 0 }, requests: [] },
        isLive: false
      };
    }
  },

  // Fetch Current User's Personal Donation Missions
  async fetchMyDonationHistory() {
    try {
      const response = await apiClient.get('/donors/my-history');
      return { data: response.data, isLive: true };
    } catch {
      return { data: [], isLive: false };
    }
  },

  // Update Request Status (e.g. Mark Fulfilled or Cancelled)
  async updateTrackerStatus(sourceType, rawId, newStatus) {
    const response = await apiClient.patch(`/tracker/${sourceType}/${rawId}/status`, {
      status: newStatus
    });
    return { data: response.data, isLive: true };
  },

  // Admin: Fetch All Users (Donors, Hospitals, Admins)
  async fetchAdminUsers(role = 'all', search = '') {
    const params = {};
    if (role && role !== 'all') params.role = role;
    if (search && search.trim()) params.search = search.trim();
    const response = await apiClient.get('/admin/users', { params });
    return { data: response.data, isLive: true };
  },

  // Admin: Delete User (Moderation)
  async deleteAdminUser(userId) {
    const response = await apiClient.delete(`/admin/users/${userId}`);
    return { data: response.data, isLive: true };
  },

  // Admin: Fetch Pending Verifications
  async fetchPendingVerifications() {
    const response = await apiClient.get('/admin/users/pending-verification');
    return { data: response.data, isLive: true };
  },

  // Admin: Verify User
  async verifyUser(userId) {
    const response = await apiClient.patch(`/admin/users/${userId}/verify`);
    return { data: response.data, isLive: true };
  },

  // Admin: Fetch All Requests
  async fetchAdminRequests(status = 'All') {
    const params = status && status !== 'All' ? { status } : {};
    const response = await apiClient.get('/admin/requests', { params });
    return { data: response.data, isLive: true };
  },

  // Admin: Delete Request (Moderation)
  async deleteAdminRequest(requestId) {
    const response = await apiClient.delete(`/admin/requests/${requestId}`);
    return { data: response.data, isLive: true };
  },

  // Admin: Fetch Platform & Moderation Stats
  async fetchAdminStats() {
    const response = await apiClient.get('/admin/stats');
    return { data: response.data, isLive: true };
  },

  // Notifications: Get current authenticated user's notifications
  async fetchMyNotifications() {
    try {
      const response = await apiClient.get('/notifications/me');
      return { data: response.data, isLive: true };
    } catch {
      return { data: { unread_count: 0, notifications: [] }, isLive: false };
    }
  },

  // Notifications: Mark single notification as read
  async markNotificationRead(id) {
    const response = await apiClient.patch(`/notifications/${id}/read`);
    return { data: response.data, isLive: true };
  },

  // Notifications: Mark all notifications as read
  async markAllNotificationsRead() {
    const response = await apiClient.post('/notifications/mark-all-read');
    return { data: response.data, isLive: true };
  }
};
