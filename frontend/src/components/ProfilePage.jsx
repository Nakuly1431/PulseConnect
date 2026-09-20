import React, { useState, useEffect } from 'react';
import { 
  User, ShieldCheck, Heart, Clock, Award, Phone, Mail, MapPin, 
  Calendar, CheckCircle2, AlertCircle, Edit3, ArrowLeft, LogOut, 
  LogIn, Copy, Check, Share2, Compass, Activity, Droplets, QrCode,
  FileBadge, Navigation, Sparkles, X, Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

// Medical Compatibility Reference
const BLOOD_COMPATIBILITY = {
  'O-': {
    canDonateTo: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    canReceiveFrom: ['O-'],
    type: 'Universal Red Cell Donor'
  },
  'O+': {
    canDonateTo: ['O+', 'A+', 'B+', 'AB+'],
    canReceiveFrom: ['O+', 'O-'],
    type: 'Most Needed Common Type'
  },
  'A-': {
    canDonateTo: ['A-', 'A+', 'AB-', 'AB+'],
    canReceiveFrom: ['A-', 'O-'],
    type: 'Rare High-Demand Donor'
  },
  'A+': {
    canDonateTo: ['A+', 'AB+'],
    canReceiveFrom: ['A+', 'A-', 'O+', 'O-'],
    type: 'High-Demand Hospital Type'
  },
  'B-': {
    canDonateTo: ['B-', 'B+', 'AB-', 'AB+'],
    canReceiveFrom: ['B-', 'O-'],
    type: 'Rare Donor Type'
  },
  'B+': {
    canDonateTo: ['B+', 'AB+'],
    canReceiveFrom: ['B+', 'B-', 'O+', 'O-'],
    type: 'Critical Hospital Inventory'
  },
  'AB-': {
    canDonateTo: ['AB-', 'AB+'],
    canReceiveFrom: ['AB-', 'A-', 'B-', 'O-'],
    type: 'Universal Plasma Donor'
  },
  'AB+': {
    canDonateTo: ['AB+'],
    canReceiveFrom: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    type: 'Universal Recipient'
  }
};

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const getDonorHonor = (totalDonations = 0) => {
  const count = Number(totalDonations) || 0;
  if (count >= 10) return { tier: 'Life Saver Legend (Tier 4)', title: 'Life Saver Legend', desc: 'Top 1% proximity lifesaver', color: 'text-amber-300' };
  if (count >= 5) return { tier: 'Life Saver Master (Tier 3)', title: 'Life Saver Master', desc: 'Top 5% proximity responder', color: 'text-amber-300' };
  if (count >= 1) return { tier: 'Active Lifesaver (Tier 2)', title: 'Active Lifesaver', desc: 'Verified emergency contributor', color: 'text-emerald-300' };
  return { tier: 'New Registered Donor (Tier 1)', title: 'Registered Volunteer Donor', desc: 'Standby for first emergency mission', color: 'text-slate-200' };
};

export default function ProfilePage({
  onNavigateBack,
  onNavigateAuth,
  isAvailable,
  onToggleAvailability,
  addToast
}) {
  const { user, isAuthenticated, logout, updateUser } = useAuth();

  // Route unregistered / unauthenticated users to Sign In immediately
  useEffect(() => {
    if (!isAuthenticated || !user) {
      onNavigateAuth?.('login');
    }
  }, [isAuthenticated, user, onNavigateAuth]);

  if (!isAuthenticated || !user) {
    return null;
  }

  const donor = user;
  const currentBloodGroup = donor.blood_group || 'O+';
  const compatibility = BLOOD_COMPATIBILITY[currentBloodGroup] || BLOOD_COMPATIBILITY['O+'];
  const honor = getDonorHonor(donor.total_donations);

  // State
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'medical' | 'card' | 'history'
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [copiedCard, setCopiedCard] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit Form State
  const [formData, setFormData] = useState({
    full_name: donor.full_name || '',
    phone_number: donor.phone_number || '',
    blood_group: donor.blood_group || 'O+',
    locality: donor.locality || '',
    city: donor.city || '',
    state: donor.state || '',
    latitude: donor.latitude || 12.9716,
    longitude: donor.longitude || 77.5946
  });

  const handleOpenEdit = () => {
    setFormData({
      full_name: donor.full_name || '',
      phone_number: donor.phone_number || '',
      blood_group: donor.blood_group || 'O+',
      locality: donor.locality || '',
      city: donor.city || '',
      state: donor.state || '',
      latitude: donor.latitude || 12.9716,
      longitude: donor.longitude || 77.5946
    });
    setIsEditModalOpen(true);
  };

  // GPS Geolocation Auto-Detection
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      addToast?.('Geolocation is not supported by your browser', 'error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData(prev => ({
          ...prev,
          latitude: parseFloat(pos.coords.latitude.toFixed(5)),
          longitude: parseFloat(pos.coords.longitude.toFixed(5))
        }));
        addToast?.('Current GPS location coordinates retrieved!', 'success');
      },
      () => {
        addToast?.('Unable to retrieve location. Please check browser permissions.', 'error');
      }
    );
  };

  // Submit Profile Changes
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (isAuthenticated) {
        const res = await api.updateProfile(formData);
        if (res?.data) {
          updateUser(res.data);
        }
      } else {
        // Update local session preview for demo
        updateUser(formData);
      }
      addToast?.('Profile details updated successfully!', 'success');
      setIsEditModalOpen(false);
    } catch (err) {
      addToast?.(err.message || 'Failed to update profile.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Copy Digital Donor ID Card Link
  const handleCopyCard = () => {
    const cardText = `PulseConnect Certified Blood Donor: ${donor.full_name} | Blood Group: ${donor.blood_group} | City: ${donor.locality}, ${donor.city} | Status: ${isAvailable ? 'Ready On-Duty' : 'Off-Duty'}`;
    navigator.clipboard.writeText(cardText);
    setCopiedCard(true);
    addToast?.('Donor Credentials copied to clipboard!', 'success');
    setTimeout(() => setCopiedCard(false), 3000);
  };

  const calculateLivesSaved = (donations) => (donations || 0) * 3;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 animate-fadeIn">
      
      {/* Top Header with Back Navigation & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateBack}
            className="flex items-center justify-center p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-900/60 shadow-sm transition-all active:scale-95"
            title="Return to Portal"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                User Details & Donor Dossier
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/60">
                Official Record
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Verified Medical & Blood Donor Credentials
            </p>
          </div>
        </div>

        {/* Top Actions: Availability + Edit + Logout */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Availability Switch or Cooldown Indicator */}
          {donor.cooldown_until ? (
            <button
              onClick={onToggleAvailability}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 cursor-not-allowed shadow-sm"
              title={`Biological Cooldown Active (${donor.cooldown_days_remaining || 45}d remaining). You cannot go On-Duty.`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>In Cooldown ({donor.cooldown_days_remaining || 45}d)</span>
            </button>
          ) : (
            <button
              onClick={onToggleAvailability}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                isAvailable
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
              }`}
              title="Click to toggle availability"
            >
              <span className={`w-2.5 h-2.5 rounded-full ${isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              <span>{isAvailable ? 'On-Duty (Ready to Donate)' : 'Off-Duty (Standby)'}</span>
            </button>
          )}

          {/* Edit Profile Button */}
          <button
            onClick={handleOpenEdit}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-sm transition-all"
          >
            <Edit3 className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
            <span>Edit Details</span>
          </button>

          {/* Auth Button (Sign In / Sign Out) */}
          {isAuthenticated ? (
            <button
              onClick={async () => {
                await logout();
                onNavigateAuth?.('login');
                addToast?.('Logged out successfully. Please sign in to continue.', 'info');
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/50 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          ) : (
            <button
              onClick={() => onNavigateAuth?.('login')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>

      {/* Guest Mode Notification Banner if Not Logged In */}
      {!isAuthenticated && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-800 dark:text-amber-200">
          <div className="flex items-center gap-2.5">
            <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="text-xs font-medium">
              You are viewing a demonstration profile dossier. <strong>Sign in or register</strong> to persist your personal blood donor records and emergency dispatches.
            </p>
          </div>
          <button
            onClick={() => onNavigateAuth?.('login')}
            className="shrink-0 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors shadow-sm"
          >
            Sign In Now
          </button>
        </div>
      )}

      {/* Hero Profile Dossier Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-600 via-rose-600 to-rose-700 text-white p-6 sm:p-8 shadow-xl shadow-red-600/15">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Blood Type Avatar Pill */}
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/20 backdrop-blur-md border-2 border-white/40 flex flex-col items-center justify-center shadow-lg shadow-black/10">
                <span className="text-3xl sm:text-4xl font-black tracking-tight">{donor.blood_group}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-100 mt-0.5">RH Type</span>
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 border-2 border-white text-white shadow" title="Medical Status Verified">
                <ShieldCheck className="w-3.5 h-3.5" />
              </span>
            </div>

            {/* Donor Identity Info */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{donor.full_name}</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-white/25 backdrop-blur-md text-white text-xs font-extrabold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                  Verified Donor
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs sm:text-sm text-red-100 font-medium">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {donor.locality}, {donor.city || 'Bengaluru'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  {donor.email}
                </span>
                <span>•</span>
                <span>ID: #PULSE-{donor.id ? String(donor.id).padStart(5, '0') : 'NEW'}</span>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-xl bg-black/20 text-white font-semibold">
                  Donor Rank: <strong className={honor.color}>{honor.tier}</strong>
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-black/20 text-white font-semibold">
                  {compatibility.type}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Badge Column */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-col gap-2.5 w-full md:w-auto shrink-0">
            <div className="p-3.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-center md:text-left">
              <span className="text-[10px] uppercase font-bold text-red-100 block">Total Donations</span>
              <span className="text-xl font-black">{donor.total_donations ?? 0} Units</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-center md:text-left">
              <span className="text-[10px] uppercase font-bold text-red-100 block">Estimated Impact</span>
              <span className="text-xl font-black text-emerald-200">~{calculateLivesSaved(donor.total_donations ?? 0)} Lives Saved</span>
            </div>
          </div>

        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeTab === 'overview'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Personal & Location</span>
        </button>

        <button
          onClick={() => setActiveTab('medical')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeTab === 'medical'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Droplets className="w-4 h-4" />
          <span>Medical Compatibility</span>
        </button>

        <button
          onClick={() => setActiveTab('card')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeTab === 'card'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileBadge className="w-4 h-4" />
          <span>Digital Donor Card</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeTab === 'history'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Donation History</span>
        </button>
      </div>

      {/* TAB 1: Overview (Personal & Contact Details + Cooldown Status) */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          
          {/* Contact Details Card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Personal & Contact Profile</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Direct contact info for verified emergency dispatches</p>
                  </div>
                </div>
                <button
                  onClick={handleOpenEdit}
                  className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                  <span className="text-slate-400 dark:text-slate-500 font-bold block mb-1">Full Legal Name</span>
                  <span className="text-sm font-black text-slate-800 dark:text-slate-200">{donor.full_name}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                  <span className="text-slate-400 dark:text-slate-500 font-bold block mb-1">Blood Group & Rh</span>
                  <span className="text-sm font-black text-red-600 dark:text-red-400">{donor.blood_group} ({compatibility.type})</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                  <span className="text-slate-400 dark:text-slate-500 font-bold block mb-1">Primary Email</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate block">{donor.email}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-400 dark:text-slate-500 font-bold">Emergency Phone</span>
                    <button
                      onClick={() => setShowPhone(!showPhone)}
                      className="text-[10px] font-bold text-red-600 dark:text-red-400 hover:underline"
                    >
                      {showPhone ? 'Hide' : 'Reveal'}
                    </button>
                  </div>
                  <span className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200">
                    {showPhone ? donor.phone_number : (donor.phone_number ? `${donor.phone_number.slice(0, 4)}••••••${donor.phone_number.slice(-2)}` : '—')}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 sm:col-span-2">
                  <span className="text-slate-400 dark:text-slate-500 font-bold block mb-1">Locality & Residential Landmark</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {donor.locality}, {donor.city || 'Bengaluru'}, {donor.state || 'Karnataka'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 sm:col-span-2 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 font-bold block mb-1">GPS Geolocation Coordinates</span>
                    <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                      Latitude: {donor.latitude && donor.latitude !== 0 ? `${donor.latitude}° N` : 'Not calibrated'} | Longitude: {donor.longitude && donor.longitude !== 0 ? `${donor.longitude}° E` : 'Not calibrated'}
                    </span>
                  </div>
                  <button
                    onClick={handleOpenEdit}
                    className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors flex items-center gap-1 shadow-sm"
                  >
                    <Navigation className="w-3 h-3 text-red-600 dark:text-red-400" />
                    <span>Calibrate</span>
                  </button>
                </div>

              </div>
            </div>

            {/* Verification & Eligibility Standards Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Mandatory Medical Standards</span>
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Age: 18 - 65 years (Eligible)</span>
                </div>
                <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Weight ≥ 50 kg Standard</span>
                </div>
                <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Hemoglobin ≥ 12.5 g/dL Target</span>
                </div>
                <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Govt ID & Mobile Authenticated</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: 90-Day Cooldown & Honor Tier */}
          <div className="space-y-6">
            
            {/* 90-Day Cooldown Tracker */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-red-600" />
                  Biological Cooldown
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                  donor.cooldown_until
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                    : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                }`}>
                  {donor.cooldown_until ? `${donor.cooldown_days_remaining || 45} Days Left` : '100% Eligible'}
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                Mandatory 90-day physiological replenishment interval between whole red blood cell donations to protect your hemoglobin, iron, and health.
              </p>

              {/* Progress Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      donor.cooldown_until ? 'bg-amber-500 w-3/5' : 'bg-emerald-500 w-full'
                    }`}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-bold text-slate-400 dark:text-slate-500">
                  <span>Last: {donor.last_donation_date || 'None on record'}</span>
                  <span>Next: {donor.cooldown_until || 'Immediate'}</span>
                </div>
              </div>
            </div>

            {/* Honor & Community Impact Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-amber-950/20 dark:via-orange-950/20 dark:to-slate-900 border border-amber-200/70 dark:border-amber-900/40 shadow-sm transition-colors space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/20">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    Community Honor Rank
                  </span>
                  <h4 className="text-base font-extrabold text-slate-900 dark:text-white">{honor.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{honor.desc}</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-800/80 border border-amber-200/50 dark:border-amber-900/30 text-xs space-y-1">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-600 dark:text-slate-300">Total Units Donated</span>
                  <span className="text-slate-900 dark:text-white font-black">{donor.total_donations ?? 0} Units</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-slate-600 dark:text-slate-300">Lives Potentially Saved</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-black">~{calculateLivesSaved(donor.total_donations ?? 0)} Patients</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-slate-600 dark:text-slate-300">Response Verification</span>
                  <span className="text-red-600 dark:text-red-400 font-black">{(donor.total_donations || 0) > 0 ? '100% Emergency Dispatched' : 'Standing By'}</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: Medical Compatibility Details */}
      {activeTab === 'medical' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
          
          {/* Blood Compatibility Breakdown */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2.5 rounded-2xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400">
                <Droplets className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Blood Group Compatibility: {donor.blood_group}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{compatibility.type}</p>
              </div>
            </div>

            {/* Can Donate To */}
            <div className="space-y-2.5">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                You can donate Red Blood Cells to ({compatibility.canDonateTo.length} Blood Types):
              </span>
              <div className="flex flex-wrap gap-2">
                {compatibility.canDonateTo.map(type => (
                  <span
                    key={type}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black shadow-sm ${
                      type === donor.blood_group
                        ? 'bg-red-600 text-white'
                        : 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/60'
                    }`}
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>

            {/* Can Receive From */}
            <div className="space-y-2.5 pt-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                In an emergency, you can receive blood from:
              </span>
              <div className="flex flex-wrap gap-2">
                {compatibility.canReceiveFrom.map(type => (
                  <span
                    key={type}
                    className="px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 shadow-sm"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              <strong className="text-slate-900 dark:text-white">Emergency Cross-Match Protocol:</strong> While ABO and Rh factor compatibility guides immediate nearest-donor dispatches, standard hospital bedside cross-matching is always conducted before transfusion.
            </div>
          </div>

          {/* Full Reference Table */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Complete Transfusion Reference Matrix
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Medical compatibility guidelines for all ABO and Rh blood groups:
            </p>

            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Type</th>
                    <th className="p-3">Can Donate To</th>
                    <th className="p-3">Can Receive From</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {Object.entries(BLOOD_COMPATIBILITY).map(([group, data]) => {
                    const isUser = group === donor.blood_group;
                    return (
                      <tr
                        key={group}
                        className={isUser ? 'bg-red-50/70 dark:bg-red-950/40 font-bold text-red-700 dark:text-red-300' : 'text-slate-700 dark:text-slate-300'}
                      >
                        <td className="p-3 font-black">
                          <span className={isUser ? 'text-red-600 dark:text-red-400' : ''}>
                            {group} {isUser && '★'}
                          </span>
                        </td>
                        <td className="p-3">{data.canDonateTo.join(', ')}</td>
                        <td className="p-3">{data.canReceiveFrom.join(', ')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: Digital Donor ID Card (Printable / Shareable) */}
      {activeTab === 'card' && (
        <div className="flex flex-col items-center justify-center py-4 space-y-6 animate-fadeIn">
          
          <div className="text-center max-w-md space-y-1">
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Digital Certified Blood Donor Card</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Present this verified digital credential at hospitals, trauma centers, and blood donation camps.
            </p>
          </div>

          {/* Realistic Physical Card Representation */}
          <div className="w-full max-w-md rounded-3xl p-7 bg-gradient-to-br from-slate-900 via-rose-950 to-slate-900 text-white shadow-2xl border border-red-500/30 relative overflow-hidden">
            
            {/* Holographic Watermark effect */}
            <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-8 -top-8 w-44 h-44 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col justify-between h-56">
              
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-white/15 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center shadow">
                    <Heart className="w-4 h-4 text-white fill-white" />
                  </div>
                  <div>
                    <span className="text-xs font-black tracking-tight block">PulseConnect</span>
                    <span className="text-[9px] text-red-200 uppercase font-bold tracking-wider">Emergency Donor Network</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                  Verified Active
                </span>
              </div>

              {/* Card Center: Blood Group & Donor Name */}
              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-red-200 font-bold uppercase tracking-wider block">Donor Name</span>
                  <h3 className="text-xl font-black tracking-tight">{donor.full_name}</h3>
                  <p className="text-xs text-slate-300 font-medium">{donor.locality}, {donor.city || 'Bengaluru'}</p>
                </div>

                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 flex flex-col items-center justify-center shadow-lg border-2 border-white/40">
                  <span className="text-2xl font-black">{donor.blood_group}</span>
                  <span className="text-[8px] font-extrabold uppercase text-white/80">RH Group</span>
                </div>
              </div>

              {/* Card Footer: Donor ID & Barcode / Security Hash */}
              <div className="flex items-end justify-between border-t border-white/15 pt-3">
                <div>
                  <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Registration Number</span>
                  <span className="text-xs font-mono font-bold tracking-wider text-red-300">
                    PULSE-{String(donor.id || 1084).padStart(6, '0')}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-right">
                  <QrCode className="w-8 h-8 text-white/80" />
                  <div>
                    <span className="text-[8px] text-slate-400 uppercase font-bold block">Security Status</span>
                    <span className="text-[10px] font-bold text-emerald-400">100% Authenticated</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleCopyCard}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold shadow-sm transition-all"
            >
              {copiedCard ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCard ? 'Copied to Clipboard!' : 'Copy Card Credentials'}</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition-all"
            >
              <FileBadge className="w-4 h-4" />
              <span>Print / Download Card</span>
            </button>
          </div>

        </div>
      )}

      {/* TAB 4: Donation History & Dispatches */}
      {activeTab === 'history' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Emergency Response Missions</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Chronological timeline of blood donation dispatches</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                {donor.total_donations ?? 0} Fulfilled
              </span>
            </div>

            {(!donor.donation_history || donor.donation_history.length === 0) ? (
              <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shadow-sm">
                  <Heart className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Donation Missions Yet</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                    You have not completed any blood donation missions yet. When you respond to an emergency SOS or direct blood request, your verified hospital contributions will appear here.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {donor.donation_history.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 dark:text-white text-sm">{item.hospital}</span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                          {item.status}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 font-medium">
                        {item.patient} • <strong className="text-red-600 dark:text-red-400">{item.type}</strong>
                      </p>
                    </div>

                    <div className="text-left sm:text-right text-slate-500 dark:text-slate-400">
                      <span className="font-bold block text-slate-800 dark:text-slate-200">{item.date}</span>
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">{item.impact}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-slideUp">
            
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-red-600 to-rose-600 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black tracking-tight">Edit Profile & Contact Details</h3>
                <p className="text-xs text-red-100 font-medium">Keep your proximity details current for emergency matching</p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProfile} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-red-500 focus:outline-none"
                  placeholder="e.g. Aarav Sharma"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Blood Group *
                  </label>
                  <select
                    value={formData.blood_group}
                    onChange={(e) => setFormData(prev => ({ ...prev, blood_group: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-red-500 focus:outline-none"
                  >
                    {BLOOD_GROUPS.map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Emergency Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-red-500 focus:outline-none"
                    placeholder="e.g. +91 98765 43210"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Locality / Landmark *
                </label>
                <input
                  type="text"
                  required
                  value={formData.locality}
                  onChange={(e) => setFormData(prev => ({ ...prev, locality: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-red-500 focus:outline-none"
                  placeholder="e.g. Indiranagar, 100 Feet Rd"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-red-500 focus:outline-none"
                    placeholder="e.g. Bengaluru"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-red-500 focus:outline-none"
                    placeholder="e.g. Karnataka"
                  />
                </div>
              </div>

              {/* GPS Geolocation Coordinates */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Proximity GPS Coordinates
                  </span>
                  <button
                    type="button"
                    onClick={handleDetectGPS}
                    className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    Detect My GPS
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 block">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) => setFormData(prev => ({ ...prev, latitude: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) => setFormData(prev => ({ ...prev, longitude: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-md shadow-red-600/20 disabled:opacity-50"
                >
                  {isSaving ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
