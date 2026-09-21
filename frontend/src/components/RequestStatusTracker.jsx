import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  MapPin,
  Building,
  Phone,
  User,
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Send,
  Radio,
  Heart,
  ArrowRight,
  ExternalLink,
  Check,
  Edit3
} from 'lucide-react';
import { formatTimeAgo } from '../utils/bloodCompatibility';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function RequestStatusTracker({ onNavigateDashboard, onOpenSOS, onOpenEditSOS }) {
  const { user, isAuthenticated } = useAuth();
  const [data, setData] = useState({
    summary: { total: 0, accepted: 0, pending: 0, fulfilled: 0 },
    requests: []
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [scope, setScope] = useState('my'); // 'my' for user's own requests, 'all' for admin
  const [searchQuery, setSearchQuery] = useState('');
  const [isUpdating, setIsUpdating] = useState(null);
  const [feedbackToast, setFeedbackToast] = useState(null);

  // My created SOS emergencies for authorization to edit mistakes
  const myCreatedSOS = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('pulseconnect_my_sos_requests') || '[]');
    } catch {
      return [];
    }
  }, [data]);

  // Load tracker data
  const loadTrackerData = React.useCallback(async () => {
    setLoading(true);
    try {
      const activeScope = (user?.role === 'admin' && scope === 'all') ? 'all' : 'my';
      const res = await api.fetchTrackerRequests(statusFilter, activeScope);
      if (res && res.data) {
        setData({
          summary: res.data.summary || { total: 0, accepted: 0, pending: 0, fulfilled: 0 },
          requests: Array.isArray(res.data.requests) ? res.data.requests : []
        });
      }
    } catch (_err) {
      console.error('Failed to load tracker data:', _err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, scope, user?.role]);

  useEffect(() => {
    loadTrackerData();
    const interval = setInterval(loadTrackerData, 10000);
    return () => clearInterval(interval);
  }, [loadTrackerData]);

  const showToast = (msg, type = 'success') => {
    setFeedbackToast({ msg, type });
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  // Handle status update (e.g. Mark as Fulfilled)
  const handleUpdateStatus = async (item, newStatus) => {
    setIsUpdating(item.id);
    try {
      const sourceType = item.source_type.toLowerCase().includes('sos') ? 'sos' : 'direct';
      await api.updateTrackerStatus(sourceType, item.raw_id, newStatus);
      showToast(`Request for ${item.patient_name} updated to ${newStatus}!`, 'success');
      // Optimistic update
      setData(prev => ({
        ...prev,
        requests: (prev.requests || []).map(r => r.id === item.id ? { ...r, status: newStatus } : r)
      }));
      loadTrackerData();
    } catch {
      showToast('Failed to update status', 'error');
    } finally {
      setIsUpdating(null);
    }
  };

  // Filtered requests
  const filteredRequests = useMemo(() => {
    const list = Array.isArray(data?.requests) ? data.requests : [];
    return list.filter(req => {
      // Status filter
      if (statusFilter !== 'All' && req.status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      // Source filter
      if (sourceFilter !== 'All') {
        if (sourceFilter === 'SOS' && !req.source_type.includes('SOS')) return false;
        if (sourceFilter === 'Direct' && !req.source_type.includes('Direct')) return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const patientMatch = req.patient_name?.toLowerCase().includes(query);
        const hospitalMatch = req.hospital_name?.toLowerCase().includes(query);
        const bloodMatch = req.blood_group?.toLowerCase().includes(query);
        const localityMatch = req.hospital_locality?.toLowerCase().includes(query);
        const donorMatch = req.assigned_donor?.full_name?.toLowerCase().includes(query);
        return patientMatch || hospitalMatch || bloodMatch || localityMatch || donorMatch;
      }
      return true;
    });
  }, [data.requests, statusFilter, sourceFilter, searchQuery]);

  return (
    <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-10 2xl:px-12 py-8 animate-fadeIn transition-colors">

      {/* Toast Notification */}
      {feedbackToast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl text-sm font-bold text-white transition-all transform duration-300 ${feedbackToast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
          }`}>
          <CheckCircle2 className="w-5 h-5" />
          <span>{feedbackToast.msg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/50 mb-2">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span>{scope === 'all' && user?.role === 'admin' ? 'Network Request Ledger (Admin)' : 'My Requests & Mission History'}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {scope === 'all' && user?.role === 'admin' ? 'Network-Wide Mission Control' : 'My Personal Request & Mission Status'}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-medium mt-1">
            {scope === 'all' && user?.role === 'admin'
              ? 'Real-time overview of all hospital SOS requests and donor dispatches across the platform.'
              : 'Viewing only blood requests you created and emergency missions where you are the responding donor.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadTrackerData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold text-xs sm:text-sm shadow-sm transition-all"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={onNavigateDashboard}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all border dark:border-slate-700"
          >
            <Heart className="w-4 h-4 text-red-400" />
            <span>Back to Portal</span>
          </button>
        </div>
      </div>

      {/* Admin Scope Toggle (Only for Administrators) */}
      {user?.role === 'admin' && (
        <div className="flex items-center gap-2 mb-6 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 w-fit">
          <button
            onClick={() => setScope('my')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              scope === 'my'
                ? 'bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            My Requests & Missions
          </button>
          <button
            onClick={() => setScope('all')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              scope === 'all'
                ? 'bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            All Network Requests (Admin Ledger)
          </button>
        </div>
      )}

      {/* Guest Notice if Not Signed In */}
      {!isAuthenticated && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between text-xs text-amber-800 dark:text-amber-200">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>You are viewing as guest. Please <strong>Sign In</strong> to track your personal blood requests and emergency missions.</span>
          </div>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Pending Card */}
        <div
          onClick={() => setStatusFilter('Pending')}
          className={`cursor-pointer p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all ${statusFilter === 'Pending'
              ? 'border-amber-400 ring-2 ring-amber-400/20 shadow-md'
              : 'border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-500'
            }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Pending Donor Search
            </span>
            <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
            {data.summary.pending}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-1">
            Waiting for compatible donor
          </p>
        </div>

        {/* Accepted Card */}
        <div
          onClick={() => setStatusFilter('Accepted')}
          className={`cursor-pointer p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all ${statusFilter === 'Accepted'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
              : 'border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-500'
            }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Accepted & En Route
            </span>
            <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <Send className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {data.summary.accepted}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-1">
            Donor dispatched on mission
          </p>
        </div>

        {/* Fulfilled Card */}
        <div
          onClick={() => setStatusFilter('Fulfilled')}
          className={`cursor-pointer p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all ${statusFilter === 'Fulfilled'
              ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md'
              : 'border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-500'
            }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Fulfilled & Saved
            </span>
            <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
            {data.summary.fulfilled}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-1">
            Completed transfusions
          </p>
        </div>

        {/* Total Requests Card */}
        <div
          onClick={() => setStatusFilter('All')}
          className={`cursor-pointer p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all ${statusFilter === 'All'
              ? 'border-slate-800 dark:border-slate-600 ring-2 ring-slate-800/20 dark:ring-slate-600/20 shadow-md'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600'
            }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Network Requests
            </span>
            <span className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <Activity className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {data.summary.total}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-1">
            All active & completed dispatches
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 mb-6 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center transition-colors">

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {['All', 'Accepted', 'Pending', 'Fulfilled'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${statusFilter === status
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
            >
              {status === 'All' ? 'All Statuses' : status}
            </button>
          ))}

          <span className="hidden lg:inline text-slate-300 dark:text-slate-700">|</span>

          {/* Source Type Selector */}
          {['All', 'SOS', 'Direct'].map(src => (
            <button
              key={src}
              onClick={() => setSourceFilter(src)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${sourceFilter === src
                  ? 'bg-slate-900 dark:bg-slate-700 text-white'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
            >
              {src === 'All' ? 'All Sources' : src === 'SOS' ? 'SOS Broadcasts' : 'Direct Requests'}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search patient, donor, hospital..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-base sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
          />
        </div>
      </div>

      {/* List of Request Cards */}
      {filteredRequests.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-4">
            <Filter className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">
            {isAuthenticated ? 'No personal requests or missions found' : 'Sign in to view your request history'}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-6">
            {isAuthenticated
              ? 'You have not submitted any emergency blood requests or responded to any donor dispatches yet. Only your own requests and assigned missions will appear in this tracker.'
              : 'Sign in with your account to view the real-time status of your emergency blood requests and donor dispatches.'}
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => { setStatusFilter('All'); setSourceFilter('All'); setSearchQuery(''); }}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              Reset Filters
            </button>
            <button
              onClick={onOpenSOS}
              className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 shadow-md shadow-red-600/20 transition-all"
            >
              Broadcast New SOS
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => {
            const isAccepted = req.status === 'Accepted';
            const isPending = req.status === 'Pending';
            const matchingMySOS = req.source_type.includes('SOS')
              ? myCreatedSOS.find(item => item.id === req.raw_id || String(item.id) === String(req.raw_id))
              : null;
            const canEdit = Boolean(matchingMySOS && req.status.toLowerCase() !== 'fulfilled');

            return (
              <div
                key={req.id}
                className={`bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border transition-all duration-200 shadow-sm hover:shadow-md ${isAccepted
                    ? 'border-emerald-300 dark:border-emerald-800/80 ring-1 ring-emerald-500/10'
                    : isPending
                      ? 'border-amber-300 dark:border-amber-800/80 ring-1 ring-amber-500/10'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
              >
                {/* Header: Source, Urgency & Timestamp */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${req.source_type.includes('SOS')
                        ? 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/50'
                        : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/50'
                      }`}>
                      {req.source_type.includes('SOS') ? (
                        <Radio className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                      ) : (
                        <Heart className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      )}
                      <span>{req.source_type}</span>
                    </span>

                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold">
                      {req.urgency_level}
                    </span>

                    {req.posted_by_verified_hospital && (
                      <span 
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm shadow-emerald-500/20 border border-emerald-500/30"
                        title="Verified by PulseConnect Medical Administration — Certified Healthcare Facility"
                      >
                        <ShieldCheck className="w-3 h-3" />
                        <span>Hospital Verified</span>
                      </span>
                    )}

                    {matchingMySOS && (
                      <span 
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                        title="SOS created from this browser"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>My Broadcast</span>
                      </span>
                    )}
                  </div>

                  {/* Status Indicator Badge */}
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider ${isAccepted
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shadow-sm shadow-emerald-500/10'
                        : isPending
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                          : 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                      }`}>
                      <span className={`w-2 h-2 rounded-full ${isAccepted ? 'bg-emerald-500 animate-ping' : isPending ? 'bg-amber-500 animate-pulse' : 'bg-blue-500'
                        }`} />
                      <span>
                        {isAccepted
                          ? 'DONOR DISPATCHED & EN ROUTE'
                          : isPending
                            ? 'PENDING DONOR MATCH'
                            : 'FULFILLED & TRANSFUSED'}
                      </span>
                    </span>

                    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatTimeAgo(req.created_at)}
                    </span>
                  </div>
                </div>

                {/* Matchup Layout: Patient/Acceptor ➔ Donor Handshake */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* Left Column: Patient / Acceptor Info */}
                  <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Recipient / Patient Details
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-red-600 text-white font-black text-xs">
                        Needs {req.blood_group}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-lg font-black text-slate-900 dark:text-white">
                        {req.patient_name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                        {req.units_needed} Units • {req.component_type}
                      </p>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{req.hospital_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                        <span>{req.hospital_locality}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                        <span>Contact: {req.contact_person} ({req.contact_phone})</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Assigned Donor Info */}
                  <div className={`p-4 rounded-2xl border space-y-3 ${req.assigned_donor
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/40'
                      : 'bg-amber-50/30 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30'
                    }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Assigned Blood Donor
                      </span>
                      {req.assigned_donor && (
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white font-black text-xs">
                          {req.assigned_donor.blood_group} Donor
                        </span>
                      )}
                    </div>

                    {req.assigned_donor ? (
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow">
                            {req.assigned_donor.full_name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-base font-black text-slate-900 dark:text-white">
                              {req.assigned_donor.full_name}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {req.assigned_donor.locality}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span className="font-bold text-slate-800 dark:text-slate-200">{req.assigned_donor.phone_number}</span>
                          </div>
                          {req.notes && (
                            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-emerald-100 dark:border-emerald-900/50 text-slate-700 dark:text-slate-200 font-medium text-xs">
                              💬 {req.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-4 text-center">
                        <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2 animate-pulse">
                          <Activity className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                          Searching compatible donors in Bangalore...
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                          Nearby donors within radius have received broadcast notifications.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action Bar */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-slate-400 dark:text-slate-500">
                    ID: <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300 font-mono">{req.id}</code>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* If accepted, allow marking fulfilled */}
                    {isAccepted && (
                      <button
                        onClick={() => handleUpdateStatus(req, 'Fulfilled')}
                        disabled={isUpdating === req.id}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-sm shadow-emerald-600/20 transition-all"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isUpdating === req.id ? 'Updating...' : 'Mark as Fulfilled & Delivered'}</span>
                      </button>
                    )}

                    {/* Edit Mistake Button for Stressed Filers */}
                    {canEdit && (
                      <button
                        onClick={() => onOpenEditSOS && onOpenEditSOS({
                          id: req.raw_id,
                          patient_name: req.patient_name,
                          blood_group: req.blood_group,
                          units_needed: req.units_needed,
                          component_type: req.component_type,
                          urgency_level: req.urgency_level,
                          hospital_name: req.hospital_name,
                          hospital_locality: req.hospital_locality,
                          contact_person: req.contact_person,
                          contact_phone: req.contact_phone,
                          edit_token: matchingMySOS.edit_token
                        })}
                        className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 active:scale-95 text-white shadow-sm shadow-amber-500/20 transition-all"
                        title="Filing mistake under pressure? Click to correct details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Details</span>
                      </button>
                    )}

                    {/* Direct phone call trigger */}
                    <a
                      href={`tel:${req.contact_phone}`}
                      className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Hospital</span>
                    </a>

                    {req.assigned_donor && (
                      <a
                        href={`tel:${req.assigned_donor.phone_number}`}
                        className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/80 transition-all"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call Donor</span>
                      </a>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
