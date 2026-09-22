import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Building,
  Activity,
  Search,
  Filter,
  ArrowLeft,
  RefreshCw,
  FileText,
  ExternalLink,
  Lock,
  Heart,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Check,
  X,
  Users,
  UserCheck,
  Droplet,
  Crown
} from 'lucide-react';
import { api } from '../services/api';
import { formatTimeAgo } from '../utils/bloodCompatibility';

export default function AdminPage({ onNavigateBack, addToast }) {
  const [activeTab, setActiveTab] = useState('donors'); // 'donors' | 'pending' | 'requests' | 'stats'
  const [isLoading, setIsLoading] = useState(true);

  // 0. Registered Donors & Users State
  const [allUsers, setAllUsers] = useState([]);
  const [userRoleFilter, setUserRoleFilter] = useState('all'); // 'all' | 'donor_acceptor' | 'hospital' | 'admin'
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userBloodFilter, setUserBloodFilter] = useState('All');
  const [isDeletingUser, setIsDeletingUser] = useState(null);
  const [confirmDeleteUserId, setConfirmDeleteUserId] = useState(null);
  const [isUpdatingRole, setIsUpdatingRole] = useState(null);
  const [roleMenuOpenId, setRoleMenuOpenId] = useState(null);

  // 1. Pending Verifications State
  const [pendingUsers, setPendingUsers] = useState([]);
  const [isVerifying, setIsVerifying] = useState(null);

  // 2. All Requests State
  const [allRequests, setAllRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleting, setIsDeleting] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // 3. Stats State
  const [adminStats, setAdminStats] = useState(null);

  // Load Admin Data
  const loadAdminData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'donors') {
        const res = await api.fetchAdminUsers(userRoleFilter);
        setAllUsers(Array.isArray(res?.data) ? res.data : []);
      } else if (activeTab === 'pending') {
        const res = await api.fetchPendingVerifications();
        setPendingUsers(Array.isArray(res?.data) ? res.data : []);
      } else if (activeTab === 'requests') {
        const res = await api.fetchAdminRequests(statusFilter);
        setAllRequests(Array.isArray(res?.data) ? res.data : []);
      } else if (activeTab === 'stats') {
        const res = await api.fetchAdminStats();
        setAdminStats(res?.data || null);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
      if (addToast) addToast(err.message || 'Failed to fetch admin data. Check permissions.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, userRoleFilter, statusFilter, addToast]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  // Handle Verify User
  const handleVerifyUser = async (userId, userName) => {
    setIsVerifying(userId);
    try {
      await api.verifyUser(userId);
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, is_verified: true } : u));
      if (addToast) addToast(`Successfully verified ${userName}!`, 'success');
    } catch (err) {
      if (addToast) addToast(err.message || 'Failed to verify user', 'error');
    } finally {
      setIsVerifying(null);
    }
  };

  // Handle Delete User Account
  const handleDeleteUser = async (userId, userName) => {
    setIsDeletingUser(userId);
    try {
      await api.deleteAdminUser(userId);
      setAllUsers(prev => prev.filter(u => u.id !== userId));
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
      setConfirmDeleteUserId(null);
      if (addToast) addToast(`Account for ${userName} removed`, 'success');
    } catch (err) {
      if (addToast) addToast(err.message || 'Failed to delete user', 'error');
    } finally {
      setIsDeletingUser(null);
    }
  };

  // Handle Make Admin / Change Role
  const handleUpdateRole = async (userId, userName, newRole) => {
    setIsUpdatingRole(userId);
    try {
      await api.updateUserRole(userId, newRole);
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole, is_verified: true } : u));
      setPendingUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole, is_verified: true } : u));
      setRoleMenuOpenId(null);
      const roleLabel = newRole === 'admin' ? 'Administrator' : newRole === 'hospital' ? 'Hospital' : 'Donor / Acceptor';
      if (addToast) addToast(`🎉 ${userName} is now an ${roleLabel}!`, 'success');
    } catch (err) {
      if (addToast) addToast(err.message || 'Failed to update user role', 'error');
    } finally {
      setIsUpdatingRole(null);
    }
  };

  // Handle Delete Emergency Request
  const handleDeleteRequest = async (requestId, patientName) => {
    setIsDeleting(requestId);
    try {
      await api.deleteAdminRequest(requestId);
      setAllRequests(prev => prev.filter(r => r.id !== requestId));
      setConfirmDeleteId(null);
      if (addToast) addToast(`Emergency SOS for ${patientName} deleted`, 'success');
    } catch (err) {
      if (addToast) addToast(err.message || 'Failed to delete request', 'error');
    } finally {
      setIsDeleting(null);
    }
  };

  // Filtered Donors & Users for Tab 0
  const filteredUsers = allUsers.filter(user => {
    if (userBloodFilter !== 'All' && user.blood_group !== userBloodFilter) {
      return false;
    }
    if (!userSearchQuery.trim()) return true;
    const q = userSearchQuery.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(q) ||
      user.email?.toLowerCase().includes(q) ||
      user.phone_number?.toLowerCase().includes(q) ||
      user.locality?.toLowerCase().includes(q) ||
      user.city?.toLowerCase().includes(q) ||
      user.state?.toLowerCase().includes(q) ||
      user.blood_group?.toLowerCase().includes(q) ||
      user.hospital_name?.toLowerCase().includes(q)
    );
  });

  // Filtered Requests for Tab 2
  const filteredRequests = allRequests.filter(req => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      req.patient_name?.toLowerCase().includes(q) ||
      req.hospital_name?.toLowerCase().includes(q) ||
      req.hospital_locality?.toLowerCase().includes(q) ||
      req.blood_group?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-10 2xl:px-12 py-8 animate-fadeIn">
      
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <button
            onClick={onNavigateBack}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Platform</span>
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Admin <span className="text-purple-600 dark:text-purple-400">Moderation</span> Portal
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Network governance, identity verification, fraud moderation & audit metrics
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <Lock className="w-3 h-3" />
            Admin Authorized
          </span>
          <button
            onClick={loadAdminData}
            disabled={isLoading}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors shadow-sm"
            title="Refresh current tab"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('donors')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeTab === 'donors'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Registered Donors</span>
          {allUsers.length > 0 && (
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'donors'
                ? 'bg-white text-purple-600'
                : 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
            }`}>
              {allUsers.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeTab === 'pending'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Pending Verifications</span>
          {pendingUsers.length > 0 && (
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'pending'
                ? 'bg-white text-purple-600'
                : 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
            }`}>
              {pendingUsers.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeTab === 'requests'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>All SOS Requests</span>
        </button>

        <button
          onClick={() => setActiveTab('stats')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeTab === 'stats'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Platform Stats</span>
        </button>
      </div>

      {/* TAB 0: REGISTERED DONORS & USER DIRECTORY */}
      {activeTab === 'donors' && (
        <div>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Registered Donors & Community Directory</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                  {filteredUsers.length} {filteredUsers.length === 1 ? 'User' : 'Users'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Real-time records of all registered volunteer donors, healthcare accounts, and administrators.
              </p>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="Search name, phone, city..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
                />
              </div>

              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
              >
                <option value="all" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">All Roles</option>
                <option value="donor_acceptor" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">Donors / Acceptors</option>
                <option value="hospital" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">Hospitals & Clinics</option>
                <option value="admin" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">Administrators</option>
              </select>

              <select
                value={userBloodFilter}
                onChange={(e) => setUserBloodFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
              >
                <option value="All" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">All Blood Groups</option>
                <option value="O+" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">O+</option>
                <option value="O-" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">O-</option>
                <option value="A+" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">A+</option>
                <option value="A-" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">A-</option>
                <option value="B+" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">B+</option>
                <option value="B-" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">B-</option>
                <option value="AB+" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">AB+</option>
                <option value="AB-" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">AB-</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="py-16 text-center text-slate-400 dark:text-slate-500">
              <RefreshCw className="w-7 h-7 animate-spin mx-auto mb-2 text-purple-600 dark:text-purple-400" />
              <p className="text-xs font-medium">Fetching registered donor directory...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                No Registered Donors Found
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                No users matched your current search criteria or role filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers.map(user => (
                <div
                  key={user.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-purple-200 dark:hover:border-purple-800/60 transition-all"
                >
                  <div>
                    {/* Header: Avatar, Name, Role & Blood Group */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-start gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-sm shrink-0">
                          {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                            {user.full_name}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                              user.role === 'hospital'
                                ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300'
                                : user.role === 'admin'
                                ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300'
                                : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                            }`}>
                              {user.role === 'hospital' ? 'Hospital / Clinic' : user.role === 'admin' ? 'Admin' : 'Donor'}
                            </span>
                            {user.is_verified ? (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Verified</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                <ShieldAlert className="w-3 h-3" />
                                <span>Unverified</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Blood Group Badge */}
                      <div className="px-2.5 py-1 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 font-black text-sm shrink-0 shadow-sm">
                        {user.blood_group}
                      </div>
                    </div>

                    {/* Hospital Name (if applicable) */}
                    {user.hospital_name && (
                      <div className="mb-2 px-2.5 py-1 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-[11px] text-blue-700 dark:text-blue-300 font-semibold flex items-center gap-1.5">
                        <Building className="w-3 h-3 shrink-0" />
                        <span className="truncate">{user.hospital_name}</span>
                      </div>
                    )}

                    {/* Contact & Location Details */}
                    <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 mb-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                        <span className="truncate font-medium">{user.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                        <span className="font-mono">{user.phone_number}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                        <span className="truncate">{user.locality || `${user.city || ''}, ${user.state || ''}`}</span>
                      </div>
                    </div>

                    {/* Key Metrics / Duty Indicators */}
                    <div className="flex items-center justify-between gap-2 mb-4 px-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1 text-red-600 dark:text-red-400 font-bold">
                        <Heart className="w-3.5 h-3.5 fill-red-600" />
                        <span>{user.total_donations || 0} Donations</span>
                      </div>

                      <div>
                        {user.is_in_cooldown ? (
                          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                            <Clock className="w-3 h-3" />
                            <span>Cooldown ({user.cooldown_days_remaining}d)</span>
                          </span>
                        ) : user.is_available ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>On Duty</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-400 dark:text-slate-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                            <span>Off Duty</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Role Management & Moderation Actions */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">
                      Joined {formatTimeAgo(user.created_at)}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {/* Make Admin / Role Switcher Button */}
                      {user.role !== 'admin' ? (
                        <button
                          onClick={() => handleUpdateRole(user.id, user.full_name, 'admin')}
                          disabled={isUpdatingRole === user.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900 border border-purple-200 dark:border-purple-800/60 active:scale-95 transition-all shadow-2xs"
                          title={`Promote ${user.full_name} to Administrator`}
                        >
                          {isUpdatingRole === user.id ? (
                            <RefreshCw className="w-3 h-3 animate-spin text-purple-600" />
                          ) : (
                            <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          )}
                          <span>Make Admin</span>
                        </button>
                      ) : (
                        <div className="relative">
                          <button
                            onClick={() => setRoleMenuOpenId(roleMenuOpenId === user.id ? null : user.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 hover:bg-purple-100 transition-colors"
                            title="Admin Options"
                          >
                            <Crown className="w-3 h-3 text-amber-500 fill-amber-500" />
                            <span>Admin</span>
                            <span className="text-[9px] ml-0.5">▼</span>
                          </button>
                          {roleMenuOpenId === user.id && (
                            <div className="absolute right-0 bottom-full mb-1 w-44 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl z-20 py-1 text-xs">
                              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Demote / Switch
                              </div>
                              <button
                                onClick={() => handleUpdateRole(user.id, user.full_name, 'donor_acceptor')}
                                className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-200 font-medium"
                              >
                                <Users className="w-3 h-3 text-emerald-500" />
                                <span>Demote to Donor</span>
                              </button>
                              <button
                                onClick={() => handleUpdateRole(user.id, user.full_name, 'hospital')}
                                className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-200 font-medium"
                              >
                                <Building className="w-3 h-3 text-blue-500" />
                                <span>Switch to Hospital</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Remove User Action */}
                      {confirmDeleteUserId === user.id ? (
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleDeleteUser(user.id, user.full_name)}
                            disabled={isDeletingUser === user.id}
                            className="px-2 py-1 rounded-lg text-[10px] font-bold bg-red-600 text-white hover:bg-red-700 active:scale-95 transition-all shadow-sm"
                          >
                            {isDeletingUser === user.id ? 'Deleting...' : 'Confirm'}
                          </button>
                          <button
                            onClick={() => setConfirmDeleteUserId(null)}
                            className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteUserId(user.id)}
                          className="inline-flex items-center gap-1 p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                          title="Remove user account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 1: PENDING VERIFICATIONS */}
      {activeTab === 'pending' && (
        <div>
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Accounts Awaiting Identity Verification
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Review and approve donor and healthcare provider credentials.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Total Pending: {pendingUsers.length}
            </span>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600 dark:text-purple-400" />
              <p className="text-xs">Loading pending verifications...</p>
            </div>
          ) : pendingUsers.length === 0 ? (
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                No Accounts To Verify
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                No users or hospital profiles are currently pending administrative verification.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingUsers.map(user => (
                <div
                  key={user.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-all"
                >
                  <div>
                    {/* Header: Name, Role & Blood Group */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                          {user.full_name}
                        </h3>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          user.role === 'hospital'
                            ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300'
                            : user.role === 'admin'
                            ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300'
                            : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                        }`}>
                          {user.role === 'hospital' ? 'Hospital / Clinic' : user.role === 'admin' ? 'Administrator' : 'Donor / Acceptor'}
                        </span>
                      </div>

                      <div className="px-2.5 py-1 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 font-black text-sm">
                        {user.blood_group}
                      </div>
                    </div>

                    {/* User Details */}
                    <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 mb-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                        <span className="truncate">{user.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                        <span>{user.phone_number}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                        <span className="truncate">{user.locality || `${user.city}, ${user.state}`}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
                        <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
                        <span>Registered {formatTimeAgo(user.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Verification Actions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      onClick={() => handleVerifyUser(user.id, user.full_name)}
                      disabled={isVerifying === user.id}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all shadow-sm shadow-emerald-600/20 disabled:opacity-50"
                    >
                      {isVerifying === user.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      <span>Verify</span>
                    </button>

                    <button
                      onClick={() => handleUpdateRole(user.id, user.full_name, 'admin')}
                      disabled={isUpdatingRole === user.id}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-black text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 transition-all shadow-sm shadow-purple-600/20 disabled:opacity-50"
                      title="Verify and grant Administrator privileges"
                    >
                      {isUpdatingRole === user.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Crown className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                      )}
                      <span>Make Admin</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ALL REQUESTS (MODERATION) */}
      {activeTab === 'requests' && (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                SOS Request Moderation
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Audit and remove fraudulent, duplicate, or expired SOS emergency broadcasts.
              </p>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="Search patient, hospital..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="All" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">All Statuses</option>
                <option value="Active" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">Active Only</option>
                <option value="Fulfilled" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">Fulfilled Only</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600 dark:text-purple-400" />
              <p className="text-xs">Loading requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
              <Activity className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No SOS Requests Found
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                No requests matched the current filter or search query.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 uppercase font-black tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">SOS ID</th>
                    <th className="px-4 py-3">Patient & Need</th>
                    <th className="px-4 py-3">Hospital & Location</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Urgency / Status</th>
                    <th className="px-4 py-3">Slip</th>
                    <th className="px-4 py-3 text-right">Moderation Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredRequests.map(req => (
                    <tr key={req.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-500 dark:text-slate-400">
                        #{req.id}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 font-black border border-red-200 dark:border-red-900/40">
                            {req.blood_group}
                          </span>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">{req.patient_name}</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">{req.units_needed} Units • {req.component_type}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{req.hospital_name}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{req.hospital_locality}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 dark:text-white">{req.contact_person}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{req.contact_phone}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${
                            req.status === 'Active'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}>
                            {req.status}
                          </span>
                          <span className={`text-[10px] font-bold ${
                            req.urgency_level === 'Immediate' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
                          }`}>
                            {req.urgency_level}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        {req.verification_slip_path ? (
                          <a
                            href={req.verification_slip_path}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 underline font-bold text-[11px]"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>View</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-[11px]">None</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {confirmDeleteId === req.id ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => handleDeleteRequest(req.id, req.patient_name)}
                              disabled={isDeleting === req.id}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-red-600 text-white hover:bg-red-700 active:scale-95 transition-all"
                            >
                              {isDeleting === req.id ? 'Deleting...' : 'Confirm'}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 rounded-lg text-[11px] font-bold bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(req.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                            title="Delete fraudulent or duplicate request"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PLATFORM STATS */}
      {activeTab === 'stats' && (
        <div>
          <div className="mb-4">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Platform & Moderation Analytics
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live database metrics across donors, hospitals, SOS broadcasts, and lives saved.
            </p>
          </div>

          {isLoading || !adminStats ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600 dark:text-purple-400" />
              <p className="text-xs">Loading analytics...</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Primary KPI Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Registered Users</div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
                    {adminStats.total_users}
                  </div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                    {adminStats.verified_users} Verified • {adminStats.pending_verifications} Pending
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Active Ready Donors</div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                    {adminStats.active_ready_donors}
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                    Not in cooldown & on duty
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Active SOS Emergencies</div>
                  <div className="text-2xl sm:text-3xl font-black text-red-600 dark:text-red-400 mt-1">
                    {adminStats.active_emergencies}
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                    {adminStats.total_emergencies} Total Broadcasts
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Lives Saved</div>
                  <div className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400 mt-1">
                    {adminStats.total_lives_saved}
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                    {adminStats.golden_hour_success_rate} Success Rate
                  </div>
                </div>
              </div>

              {/* Role Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Donors & Acceptors</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white">{adminStats.donors_count}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                    <div
                      className="bg-red-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${adminStats.total_users ? (adminStats.donors_count / adminStats.total_users) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Hospitals & Clinics</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white">{adminStats.hospitals_count}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                    <div
                      className="bg-blue-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${adminStats.total_users ? (adminStats.hospitals_count / adminStats.total_users) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Administrators</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white">{adminStats.admins_count}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                    <div
                      className="bg-purple-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${adminStats.total_users ? (adminStats.admins_count / adminStats.total_users) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      )}

    </div>
  );
}
