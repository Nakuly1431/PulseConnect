import axios from 'axios';
import { MOCK_DONORS, MOCK_EMERGENCIES, MOCK_STATS, MOCK_TRACKER_DATA } from './mockData';

const isBrowser = typeof window !== 'undefined';
const isLocalhost = isBrowser && ['localhost', '127.0.0.1'].includes(window.location.hostname);
const defaultApi = isLocalhost ? 'http://127.0.0.1:8000/api' : 'https://pulseconnect-api-8ygq.onrender.com/api';
let rawUrl = (import.meta.env.VITE_API_BASE_URL || defaultApi).trim().replace(/\/+$/, '');
if (rawUrl.includes('localhost:8000')) rawUrl = isLocalhost ? rawUrl.replace('localhost:8000', '127.0.0.1:8000') : 'https://pulseconnect-api-8ygq.onrender.com/api';
const API_BASE_URL = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl}/api`;

const apiClient = axios.create({ baseURL: API_BASE_URL, timeout: 45000, withCredentials: true });
apiClient.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('pulse_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

const formatError = (d) => {
  if (!d) return null;
  if (typeof d === 'string') return d;
  if (Array.isArray(d)) return d.map(i => i.msg ? `${i.loc?.slice(-1)[0] || 'Field'}: ${i.msg}` : JSON.stringify(i)).join(' | ');
  return JSON.stringify(d);
};

const getStored = (key, fb = null) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fb; } catch { return fb; } };
const setStored = (key, val) => localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val));
const removeStored = (...keys) => keys.forEach(k => localStorage.removeItem(k));

const haversine = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const dLat = (lat2 - lat1) * Math.PI / 180, dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2)**2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2)**2;
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
};

const filterDonors = (list, p = {}) => {
  const cLat = p.lat || 20.2961, cLng = p.lng || 85.8245;
  let res = list.map(d => ({ ...d, distance_km: d.distance_km ?? haversine(cLat, cLng, d.latitude, d.longitude) }));
  if (p.blood_group && p.blood_group !== 'All') res = res.filter(d => d.blood_group === p.blood_group);
  if (p.only_available) res = res.filter(d => d.is_available);
  if (p.locality?.trim()) {
    const q = p.locality.toLowerCase().trim();
    res = res.filter(d => [d.locality, d.city, d.state, d.full_name].some(f => f?.toLowerCase().includes(q)));
  }
  if (p.radius_km && Number(p.radius_km) < 100) res = res.filter(d => d.distance_km == null || d.distance_km <= Number(p.radius_km));
  return res.sort((a, b) => (a.distance_km ?? 9999) - (b.distance_km ?? 9999));
};

const MOCK_DEMO_USERS = {
  'subrat.jena@demo.pulseconnect.org': {
    id: 1, full_name: "Subrat Kumar Jena", email: "subrat.jena@demo.pulseconnect.org", phone_number: "+91 98610 23411",
    masked_phone: "+91 986•• •••11", blood_group: "O+", locality: "Patia, Bhubaneswar", city: "Bhubaneswar", state: "Odisha",
    latitude: 20.3551, longitude: 85.8189, is_available: true, is_verified: true, role: "donor_acceptor", total_donations: 4
  },
  'admin@pulseconnect.org': {
    id: 999, full_name: "PulseConnect Administrator", email: "admin@pulseconnect.org", phone_number: "+91 98000 00000",
    masked_phone: "+91 980•• •••00", blood_group: "O+", locality: "Secretariat, Bhubaneswar", city: "Bhubaneswar", state: "Odisha",
    latitude: 20.2961, longitude: 85.8245, is_available: true, is_verified: true, role: "admin", total_donations: 0
  }
};

export const api = {
  async login(creds) {
    try {
      const res = await apiClient.post('/auth/login', creds);
      if (res.data?.access_token) { setStored('pulse_token', res.data.access_token); removeStored('pulse_demo_user'); }
      return { data: res.data, isLive: true };
    } catch (err) {
      if (err.response?.data?.detail) throw new Error(formatError(err.response.data.detail));
      if (!err.response) {
        const email = (creds.email || '').toLowerCase().trim();
        const stored = getStored('pulse_demo_user');
        let user = MOCK_DEMO_USERS[email] || (stored?.email === email ? stored : null);
        if (!user && email.endsWith('@demo.pulseconnect.org')) {
          const name = email.split('@')[0].replace(/\./g, ' ');
          user = { id: 101, full_name: name.charAt(0).toUpperCase() + name.slice(1), email, phone_number: "+91 98610 00000", masked_phone: "+91 986•• •••00", blood_group: "O+", locality: "Bhubaneswar", city: "Bhubaneswar", state: "Odisha", latitude: 20.2961, longitude: 85.8245, is_available: true, is_verified: true, role: "donor_acceptor", total_donations: 1 };
        }
        if (user) {
          setStored('pulse_token', 'demo-token-active');
          setStored('pulse_demo_user', user);
          return { data: { access_token: 'demo-token-active', user }, isLive: false };
        }
        throw new Error('Backend server is offline or unreachable. For demo testing, sign in with:\n• Demo Donor: subrat.jena@demo.pulseconnect.org\n• Admin: admin@pulseconnect.org');
      }
      throw new Error('Invalid email or password');
    }
  },

  async register(userData) {
    try {
      const res = await apiClient.post('/auth/register', userData);
      if (res.data?.access_token) { setStored('pulse_token', res.data.access_token); removeStored('pulse_demo_user'); }
      return { data: res.data, isLive: true };
    } catch (err) {
      if (err.response?.data?.detail) throw new Error(formatError(err.response.data.detail));
      if (!err.response) {
        const isVer = !['admin', 'hospital'].includes(userData.role);
        const newUser = {
          id: Date.now(), full_name: userData.full_name, email: userData.email.toLowerCase().trim(), phone_number: userData.phone_number,
          masked_phone: userData.phone_number?.replace(/(\+?\d{2,3})\s*(\d{3})\d{4}(\d{2})/, '$1 $2•• •••$3') || '+91 9•••• •••00',
          blood_group: userData.blood_group, locality: userData.locality, city: userData.city, state: userData.state,
          latitude: userData.latitude || 20.2961, longitude: userData.longitude || 85.8245, is_available: true, is_verified: isVer,
          role: userData.role || 'donor_acceptor', hospital_name: userData.hospital_name || null, license_number: userData.license_number || null,
          total_donations: 0, created_at: new Date().toISOString()
        };
        if (userData.role === 'admin') {
          const notifs = getStored('pulse_demo_notifications', []);
          notifs.unshift({ id: Date.now(), message: `🔔 Admin Registration Request: ${newUser.full_name} (${newUser.email}) from ${newUser.city || 'India'} has applied for Administrator access. Please review and approve under Pending Verifications.`, is_read: false, created_at: new Date().toISOString() });
          setStored('pulse_demo_notifications', notifs);
          const pending = getStored('pulse_demo_pending_users', []);
          pending.unshift(newUser);
          setStored('pulse_demo_pending_users', pending);
          removeStored('pulse_token', 'pulse_demo_user');
          return { data: { access_token: '', user: newUser }, isLive: false };
        }
        setStored('pulse_token', 'demo-token-active');
        setStored('pulse_demo_user', newUser);
        return { data: { access_token: 'demo-token-active', user: newUser }, isLive: false };
      }
      throw new Error(err.response?.data?.message || err.response?.statusText || 'Registration failed.');
    }
  },

  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      console.debug('Logout request failed or offline', e);
    } finally {
      removeStored('pulse_token', 'pulse_demo_user');
    }
  },

  async getMe() {
    try {
      const res = await apiClient.get('/auth/me');
      removeStored('pulse_demo_user');
      return { data: res.data, isLive: true };
    } catch {
      return { data: getStored('pulse_demo_user'), isLive: false };
    }
  },

  async forgotPassword(email) {
    try {
      const res = await apiClient.post('/auth/forgot-password', { email });
      return { data: res.data, isLive: true };
    } catch (err) {
      if (err.response?.data?.detail) throw new Error(formatError(err.response.data.detail));
      if (!err.response) {
        // Offline / Mock fallback for demo
        const cleanEmail = (email || '').toLowerCase().trim();
        const stored = getStored('pulse_demo_user');
        const user = MOCK_DEMO_USERS[cleanEmail] || (stored?.email === cleanEmail ? stored : null);
        if (user || cleanEmail.includes('@')) {
          const mockOtp = '777777';
          return {
            data: {
              status: 'success',
              message: `Verification code sent to registered contact!`,
              debug_otp: mockOtp,
              masked_phone: user?.masked_phone || '+91 986•• •••00'
            },
            isLive: false
          };
        }
        throw new Error('No registered account found with this email.');
      }
      throw new Error(err.response?.data?.message || err.message || 'Failed to send password reset code.');
    }
  },

  async resetPassword({ email, otp, newPassword }) {
    try {
      const res = await apiClient.post('/auth/reset-password', {
        email,
        otp,
        new_password: newPassword
      });
      return { data: res.data, isLive: true };
    } catch (err) {
      if (err.response?.data?.detail) throw new Error(formatError(err.response.data.detail));
      if (!err.response) {
        // Offline / Mock fallback for demo
        if (otp === '777777' || otp.length === 6) {
          return {
            data: {
              status: 'success',
              message: 'Password reset successfully! You can now sign in with your new password.'
            },
            isLive: false
          };
        }
        throw new Error('Invalid verification code. Please check your 6-digit OTP.');
      }
      throw new Error(err.response?.data?.message || err.message || 'Password reset failed.');
    }
  },

  async updateProfile(profileData) {
    try {
      const res = await apiClient.put('/auth/profile', profileData);
      return { data: res.data, isLive: true };
    } catch (err) {
      if (err.response?.data?.detail) throw new Error(formatError(err.response.data.detail));
      const u = getStored('pulse_demo_user');
      if (u) {
        const updated = { ...u, ...profileData };
        setStored('pulse_demo_user', updated);
        return { data: updated, isLive: false };
      }
      throw new Error('Failed to update user profile. Please check your data.');
    }
  },

  async searchDonors(params = {}) {
    const clean = { ...params };
    if (clean.radius_km >= 100) delete clean.radius_km;
    try {
      const res = await apiClient.get('/donors/search', { params: clean });
      return { data: Array.isArray(res.data) ? res.data : [], isLive: true };
    } catch {
      return { data: filterDonors(MOCK_DONORS, params), isLive: false };
    }
  },

  async toggleAvailability(is_available = null) {
    try {
      const res = await apiClient.patch('/donors/toggle-availability', { is_available });
      return { data: res.data, isLive: true };
    } catch (err) {
      if (err.response?.data?.detail) throw new Error(formatError(err.response.data.detail));
      const u = getStored('pulse_demo_user');
      if (u) {
        u.is_available = is_available !== null ? is_available : !u.is_available;
        setStored('pulse_demo_user', u);
        return { data: { is_available: u.is_available, message: `Availability updated to ${u.is_available}` }, isLive: false };
      }
      throw new Error(err.message || 'Failed to toggle availability');
    }
  },

  async requestBlood(donorId, reqData = {}) {
    try {
      const res = await apiClient.post(`/donors/${donorId}/request`, reqData);
      return { data: res.data, isLive: true };
    } catch (err) {
      if (err.response?.data?.detail) throw new Error(formatError(err.response.data.detail));
      return { data: { id: Date.now(), donor_id: donorId, status: 'Requested', notes: reqData.notes || 'Emergency direct blood request', timestamp: new Date().toISOString(), _offline_mode: true }, isLive: false };
    }
  },

  async sendSOSOtp(phone) {
    const res = await apiClient.post('/sos/send-otp', { phone_number: phone });
    return { data: res.data, isLive: true };
  },

  async createSOS(formData) {
    const res = await apiClient.post('/sos/create', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    return { data: res.data, isLive: true };
  },

  async updateSOS(requestId, updateData) {
    const res = await apiClient.put(`/sos/${requestId}`, updateData);
    return { data: res.data, isLive: true };
  },

  async fetchActiveSOS(params = {}) {
    try {
      const res = await apiClient.get('/sos/active', { params });
      return { data: Array.isArray(res.data) && res.data.length ? res.data : MOCK_EMERGENCIES, isLive: true };
    } catch {
      return { data: MOCK_EMERGENCIES, isLive: false };
    }
  },

  async respondToSOS(requestId, payload = {}) {
    const res = await apiClient.post(`/sos/${requestId}/respond`, payload);
    return { data: res.data, isLive: true };
  },

  async fetchStats() {
    try {
      const res = await apiClient.get('/stats');
      return { data: res.data, isLive: true };
    } catch (err) {
      if (err.response) throw err;
      return { data: MOCK_STATS, isLive: false };
    }
  },

  async fetchTrackerRequests(statusFilter = 'All', scope = 'my') {
    try {
      const p = { scope, ...(statusFilter && statusFilter !== 'All' ? { status_filter: statusFilter } : {}) };
      const res = await apiClient.get('/tracker/all', { params: p });
      return { data: res.data, isLive: true };
    } catch (err) {
      if (err.response) throw err;
      return { data: { summary: { total: 0, accepted: 0, pending: 0, fulfilled: 0 }, requests: [] }, isLive: false };
    }
  },

  async fetchMyDonationHistory() {
    try {
      const res = await apiClient.get('/donors/my-history');
      return { data: res.data, isLive: true };
    } catch {
      return { data: [], isLive: false };
    }
  },

  async updateTrackerStatus(sourceType, rawId, newStatus) {
    const res = await apiClient.patch(`/tracker/${sourceType}/${rawId}/status`, { status: newStatus });
    return { data: res.data, isLive: true };
  },

  async fetchAdminUsers(role = 'all', search = '') {
    try {
      const p = { ...(role && role !== 'all' ? { role } : {}), ...(search?.trim() ? { search: search.trim() } : {}) };
      const res = await apiClient.get('/admin/users', { params: p });
      return { data: res.data, isLive: true };
    } catch {
      let d = [...MOCK_DONORS];
      if (search) d = d.filter(x => x.full_name?.toLowerCase().includes(search.toLowerCase()) || x.city?.toLowerCase().includes(search.toLowerCase()));
      return { data: d.slice(0, 50), isLive: false };
    }
  },

  async deleteAdminUser(userId) {
    try {
      const res = await apiClient.delete(`/admin/users/${userId}`);
      return { data: res.data, isLive: true };
    } catch {
      return { data: { success: true }, isLive: false };
    }
  },

  async updateUserRole(userId, newRole) {
    try {
      const res = await apiClient.patch(`/admin/users/${userId}/role`, { role: newRole });
      return { data: res.data, isLive: true };
    } catch (err) {
      if (err.response?.data?.detail) throw new Error(formatError(err.response.data.detail));
      return { data: { id: userId, role: newRole, is_verified: true }, isLive: false };
    }
  },

  async makeUserAdmin(userId) {
    try {
      const res = await apiClient.patch(`/admin/users/${userId}/make-admin`);
      return { data: res.data, isLive: true };
    } catch (err) {
      if (err.response?.data?.detail) throw new Error(formatError(err.response.data.detail));
      return { data: { id: userId, role: 'admin', is_verified: true }, isLive: false };
    }
  },

  async fetchPendingVerifications() {
    try {
      const res = await apiClient.get('/admin/users/pending-verification');
      return { data: res.data, isLive: true };
    } catch {
      return { data: getStored('pulse_demo_pending_users', []), isLive: false };
    }
  },

  async verifyUser(userId) {
    try {
      const res = await apiClient.patch(`/admin/users/${userId}/verify`);
      return { data: res.data, isLive: true };
    } catch {
      const pending = getStored('pulse_demo_pending_users', []).filter(u => u.id !== userId);
      setStored('pulse_demo_pending_users', pending);
      return { data: { success: true, id: userId, is_verified: true }, isLive: false };
    }
  },

  async fetchAdminRequests(status = 'All') {
    try {
      const p = status && status !== 'All' ? { status } : {};
      const res = await apiClient.get('/admin/requests', { params: p });
      return { data: res.data, isLive: true };
    } catch {
      return { data: MOCK_EMERGENCIES, isLive: false };
    }
  },

  async deleteAdminRequest(requestId) {
    try {
      const res = await apiClient.delete(`/admin/requests/${requestId}`);
      return { data: res.data, isLive: true };
    } catch {
      return { data: { success: true }, isLive: false };
    }
  },

  async fetchAdminStats() {
    try {
      const res = await apiClient.get('/admin/stats');
      return { data: res.data, isLive: true };
    } catch {
      return { data: { total_users: 720, pending_verifications: 0, verified_donors: 718, active_emergencies: 3, fulfilled_emergencies: 1420 }, isLive: false };
    }
  },

  async fetchMyNotifications() {
    try {
      const res = await apiClient.get('/notifications/me');
      return { data: res.data, isLive: true };
    } catch {
      const notifs = getStored('pulse_demo_notifications', []);
      return { data: { unread_count: notifs.filter(n => !n.is_read).length, notifications: notifs }, isLive: false };
    }
  },

  async markNotificationRead(id) {
    const res = await apiClient.patch(`/notifications/${id}/read`);
    return { data: res.data, isLive: true };
  },

  async markAllNotificationsRead() {
    const res = await apiClient.post('/notifications/mark-all-read');
    return { data: res.data, isLive: true };
  }
};
