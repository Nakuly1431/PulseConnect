import React, { useState } from 'react';
import {
  Heart,
  Lock,
  Mail,
  User,
  Phone,
  MapPin,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  Compass,
  Building2,
  Navigation2,
  Globe2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DONOR_BLOOD_GROUPS } from '../utils/bloodCompatibility';
import { INDIA_STATES_DATA, POPULAR_REGIONAL_HUBS, getStateData } from '../utils/indiaLocations';

export default function AuthPage({ initialTab = 'login', onNavigate, onSuccess }) {
  const { login, register } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab); // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Form State - Pan-India by default
  const [selectedState, setSelectedState] = useState('Karnataka');
  const [selectedCity, setSelectedCity] = useState('Bengaluru');
  const [isCustomCity, setIsCustomCity] = useState(false);
  const [customCityName, setCustomCityName] = useState('');
  const [localArea, setLocalArea] = useState('');

  const [accountRole, setAccountRole] = useState('donor_acceptor'); // 'donor_acceptor' | 'hospital'
  const [hospitalName, setHospitalName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');

  const [registerData, setRegisterData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    password: '',
    blood_group: 'O+',
    agree_terms: true
  });

  // Handle Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await login({ email: loginEmail, password: loginPassword });
      if (onSuccess) onSuccess();
      else if (onNavigate) onNavigate('donor');
    } catch (err) {
      // Privacy-preserving error message: does not reveal whether email exists
      setErrorMessage(err.message || 'Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle State Dropdown Change
  const handleStateChange = (stateName) => {
    setSelectedState(stateName);
    const sData = getStateData(stateName);
    if (sData && sData.cities && sData.cities.length > 0) {
      const firstCity = sData.cities[0];
      setSelectedCity(firstCity.name);
      setIsCustomCity(false);
      setCustomCityName('');
    } else if (sData) {
      setSelectedCity('Other');
      setIsCustomCity(true);
    }
  };

  // Handle City Dropdown Change
  const handleCityChange = (cityName) => {
    if (cityName === 'OTHER_CUSTOM') {
      setIsCustomCity(true);
      setSelectedCity('Other');
    } else {
      setIsCustomCity(false);
      setSelectedCity(cityName);
    }
  };

  // Quick Select Regional Hub
  const handleSelectHub = (hub) => {
    setSelectedState(hub.state);
    setSelectedCity(hub.city);
    setIsCustomCity(false);
    setCustomCityName('');
  };

  // Handle Register Submit
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!registerData.agree_terms) {
      setErrorMessage('Please accept the volunteer donation protocol to register.');
      return;
    }

    if (accountRole === 'hospital') {
      if (!hospitalName.trim()) {
        setErrorMessage('Please enter the Hospital / Clinic legal name.');
        return;
      }
      if (!licenseNumber.trim()) {
        setErrorMessage('Please enter the Medical License / Registration number.');
        return;
      }
    }

    const effectiveCity = isCustomCity ? (customCityName.trim() || selectedState) : selectedCity;
    const finalLocality = [localArea.trim(), effectiveCity, selectedState].filter(Boolean).join(', ');

    setIsSubmitting(true);
    try {
      await register({
        full_name: registerData.full_name,
        email: registerData.email,
        phone_number: registerData.phone_number,
        password: registerData.password,
        blood_group: accountRole === 'hospital' ? (registerData.blood_group || 'O+') : registerData.blood_group,
        locality: finalLocality,
        city: effectiveCity,
        state: selectedState,
        role: accountRole,
        hospital_name: accountRole === 'hospital' ? hospitalName.trim() : null,
        license_number: accountRole === 'hospital' ? licenseNumber.trim() : null
      });
      if (onSuccess) onSuccess();
      else if (onNavigate) onNavigate('donor');
    } catch (err) {
      // Privacy-preserving error message: does not reveal whether email exists
      setErrorMessage(err.message || 'Registration failed. If you already have an account, please log in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStateData = getStateData(selectedState) || INDIA_STATES_DATA[0];

  return (
    <div className="min-h-[calc(100vh-80px)] py-8 px-4 sm:px-6 lg:px-8 flex flex-col justify-center animate-fadeIn">

      {/* Top Back Button */}
      <div className="max-w-md sm:max-w-2xl mx-auto w-full mb-4">
        <button
          onClick={() => onNavigate && onNavigate('acceptor')}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Portal</span>
        </button>
      </div>

      <div className="max-w-md sm:max-w-2xl mx-auto w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">

        {/* Header Banner */}
        <div className="p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-red-950 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 text-white shadow-lg shadow-red-600/30 mb-3">
            <Heart className="w-6 h-6 fill-white animate-pulse" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Pulse<span className="text-red-500">Connect</span> Authentication
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium max-w-md mx-auto">
            🇮🇳 Pan-India Emergency Donor Network — Open to all 28 States & 8 Union Territories.
          </p>

          {/* Tab Switcher */}
          <div className="flex items-center justify-center p-1 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 max-w-xs mx-auto mt-6">
            <button
              onClick={() => {
                setActiveTab('login');
                setErrorMessage('');
              }}
              className={`flex-1 py-2 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${activeTab === 'login'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white'
                }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setActiveTab('register');
                setErrorMessage('');
              }}
              className={`flex-1 py-2 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${activeTab === 'register'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white'
                }`}
            >
              Register
            </button>
          </div>
        </div>

        {/* Error Alert Box - Privacy Preserving */}
        {errorMessage && (
          <div className="mx-6 sm:mx-8 mt-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 flex items-start gap-3 text-red-700 dark:text-red-300 text-xs sm:text-sm font-semibold animate-slideUp">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* 1. LOGIN FORM */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="p-6 sm:p-8 space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@pulseconnect.org"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 text-base sm:text-sm font-medium transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <span className="text-xs text-slate-400 dark:text-slate-500">Encrypted with Bcrypt</span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 text-base sm:text-sm font-medium transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-extrabold text-sm shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Donor Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Switch to Register */}
            <div className="text-center pt-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Want to become a life-saving blood donor anywhere in India?{' '}
              </span>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('register');
                  setErrorMessage('');
                }}
                className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline"
              >
                Create an account
              </button>
            </div>
          </form>
        )}

        {/* 2. REGISTER FORM - PAN-INDIA */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="p-6 sm:p-8 space-y-4 sm:space-y-5">

            {/* Pan-India Coverage Banner */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-red-500/10 via-amber-500/10 to-emerald-500/10 border border-red-200 dark:border-red-900/40 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-red-600/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <Globe2 className="w-4 h-4" />
              </div>
              <div className="text-xs text-slate-700 dark:text-slate-300">
                <span className="font-extrabold text-red-600 dark:text-red-400">Pan-India Registration Active: </span>
                Donors & healthcare providers from any State, District, or City across India can volunteer.
              </div>
            </div>

            {/* Account Type Selector: Donor vs Hospital */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Select Account Type *
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  id="select-donor-role-btn"
                  onClick={() => setAccountRole('donor_acceptor')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
                    accountRole === 'donor_acceptor'
                      ? 'bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Heart className="w-3.5 h-3.5" />
                  <span>Donor / Acceptor</span>
                </button>
                <button
                  type="button"
                  id="select-hospital-role-btn"
                  onClick={() => setAccountRole('hospital')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
                    accountRole === 'hospital'
                      ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Hospital / Clinic</span>
                </button>
              </div>
            </div>

            {/* Hospital Specific Notice & Inputs */}
            {accountRole === 'hospital' && (
              <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/80 space-y-3 animate-fadeIn">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-purple-900 dark:text-purple-200 leading-relaxed font-medium">
                    <strong className="font-bold">Hospital Trust Protocol:</strong> Hospital accounts default to unverified status and are reviewed by PulseConnect administrators. Once verified, your emergency broadcasts are granted the exclusive <strong>"Hospital Verified"</strong> badge.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Hospital / Clinic Name *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <input
                      type="text"
                      required
                      value={hospitalName}
                      onChange={(e) => setHospitalName(e.target.value)}
                      placeholder="e.g. Apollo Multi-Specialty Hospital"
                      className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Clinical License / Registration Number *
                  </label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <input
                      type="text"
                      required
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      placeholder="e.g. NABH-KA-2026-88192 or State Health Reg No."
                      className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Full Name / Contact Person */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                {accountRole === 'hospital' ? 'Authorized Officer / CMO Name *' : 'Full Name *'}
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  required
                  value={registerData.full_name}
                  onChange={(e) => setRegisterData({ ...registerData, full_name: e.target.value })}
                  placeholder="e.g. Dr. Rajesh Varma"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 text-base sm:text-sm font-medium transition-all"
                />
              </div>
            </div>

            {/* Email & Phone Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type="email"
                    required
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    placeholder="rajesh@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 text-base sm:text-sm font-medium transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Emergency Phone *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type="tel"
                    required
                    value={registerData.phone_number}
                    onChange={(e) => setRegisterData({ ...registerData, phone_number: e.target.value })}
                    placeholder="+91 98450 12345"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 text-base sm:text-sm font-medium font-mono transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Password * (Bcrypt Salted & Hashed)
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  placeholder="Min 6 characters"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 text-base sm:text-sm font-medium transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Blood Group Quick-Select */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Your Blood Group *
              </label>
              <div className="grid grid-cols-4 gap-2">
                {DONOR_BLOOD_GROUPS.map((bg) => (
                  <button
                    key={bg}
                    type="button"
                    onClick={() => setRegisterData({ ...registerData, blood_group: bg })}
                    className={`py-2 rounded-xl text-xs sm:text-sm font-extrabold border transition-all ${registerData.blood_group === bg
                      ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-600/20'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                  >
                    {bg}
                  </button>
                ))}
              </div>
            </div>

            {/* --- LOCATION SECTION: PAN-INDIA SETTINGS --- */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4">

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-red-500" />
                    <span>Donor Location (All Over India) *</span>
                  </label>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Select your State & City and enter your local area or hospital for emergency donor matching.
                  </p>
                </div>
              </div>

              {/* Quick Hub Chips */}
              <div>
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Popular Hubs (Quick Select)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_REGIONAL_HUBS.map((hub) => {
                    const isSelected = selectedState === hub.state && selectedCity === hub.city;
                    return (
                      <button
                        key={hub.label}
                        type="button"
                        onClick={() => handleSelectHub(hub)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${isSelected
                          ? 'bg-red-600 text-white shadow-sm border border-red-600'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                          }`}
                      >
                        {hub.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* State and City Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* State / UT Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    State / UT (All India) *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                      value={selectedState}
                      onChange={(e) => handleStateChange(e.target.value)}
                      className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-base sm:text-sm font-medium transition-all appearance-none cursor-pointer"
                    >
                      {INDIA_STATES_DATA.map((item) => (
                        <option key={item.state} value={item.state}>
                          {item.state}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      ▼
                    </div>
                  </div>
                </div>

                {/* City / District Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    City / District *
                  </label>
                  <div className="relative">
                    <Navigation2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                      value={isCustomCity ? 'OTHER_CUSTOM' : selectedCity}
                      onChange={(e) => handleCityChange(e.target.value)}
                      className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-base sm:text-sm font-medium transition-all appearance-none cursor-pointer"
                    >
                      {currentStateData.cities.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                      <option value="OTHER_CUSTOM">
                        + Other / Custom City or District...
                      </option>
                    </select>
                    <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      ▼
                    </div>
                  </div>
                </div>

              </div>

              {/* If Custom City selected, show manual text input */}
              {isCustomCity && (
                <div className="animate-slideDown">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Enter City / District / Town Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customCityName}
                    onChange={(e) => setCustomCityName(e.target.value)}
                    placeholder="e.g. Nashik, Siliguri, Roorkee, Warangal..."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-base sm:text-sm font-medium transition-all"
                  />
                </div>
              )}

              {/* Locality / Neighborhood / Hospital Landmark */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Locality / Landmark / Hospital (Optional)
                  </label>
                </div>
                <div className="relative">
                  <Compass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={localArea}
                    onChange={(e) => setLocalArea(e.target.value)}
                    placeholder="e.g. Near AIIMS Hospital, Civil Lines, Andheri West, Sector 14..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-base sm:text-sm font-medium transition-all"
                  />
                </div>
              </div>

            </div>

            {/* Terms Agreement Checkbox */}
            <label className="flex items-start gap-2.5 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={registerData.agree_terms}
                onChange={(e) => setRegisterData({ ...registerData, agree_terms: e.target.checked })}
                className="w-4 h-4 rounded text-red-600 focus:ring-red-500 accent-red-600 mt-0.5"
              />
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                I volunteer as an on-call blood donor for critical emergencies in my region and agree to the 90-day medical cooldown guideline.
              </span>
            </label>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-extrabold text-sm shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Registering Profile...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Complete Registration</span>
                </>
              )}
            </button>

            {/* Switch to Login */}
            <div className="text-center pt-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Already registered in the network?{' '}
              </span>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setErrorMessage('');
                }}
                className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline"
              >
                Sign In
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
