import React, { useState } from 'react';
import {
  Heart, Lock, Mail, User, Phone, MapPin, ArrowRight,
  CheckCircle2, AlertCircle, Eye, EyeOff, ShieldCheck,
  ArrowLeft, Compass, Building2, Navigation2, Globe2, LocateFixed, Loader2,
  KeyRound, RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DONOR_BLOOD_GROUPS } from '../utils/bloodCompatibility';
import { INDIA_STATES_DATA, POPULAR_REGIONAL_HUBS, getStateData } from '../utils/indiaLocations';
import { validateIndianPhone } from '../utils/phoneValidation';

export default function AuthPage({ initialTab = 'login', onNavigate, onSuccess }) {
  const { login, register, forgotPassword, resetPassword } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isReadOnly, setIsReadOnly] = useState(true);
  const handleInputInteraction = () => { if (isReadOnly) setIsReadOnly(false); };

  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState('request'); // 'request' | 'verify' | 'success'
  const [forgotDebugOtp, setForgotDebugOtp] = useState('');
  const [forgotMaskedPhone, setForgotMaskedPhone] = useState('');
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('');
  const [isForgotSubmitting, setIsForgotSubmitting] = useState(false);

  // Register Form State
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [isCustomCity, setIsCustomCity] = useState(false);
  const [customCityName, setCustomCityName] = useState('');
  const [localArea, setLocalArea] = useState('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [gpsLocationStatus, setGpsLocationStatus] = useState(null);
  const [userCoords, setUserCoords] = useState({ lat: 0.0, lng: 0.0 });

  const [accountRole, setAccountRole] = useState('donor_acceptor');
  const [hospitalName, setHospitalName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [adminRequestSubmitted, setAdminRequestSubmitted] = useState(false);

  const [registerData, setRegisterData] = useState({
    full_name: '', email: '', phone_number: '', password: '',
    blood_group: 'O+', agree_terms: true
  });

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      const user = await login({ email: loginEmail, password: loginPassword });
      if (onSuccess) onSuccess(user);
      else if (onNavigate) onNavigate(user?.role === 'admin' ? 'admin' : 'donor');
    } catch (err) {
      setErrorMessage(err.message || 'Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendForgotCode = async (e) => {
    e?.preventDefault();
    const targetEmail = forgotEmail.trim();
    if (!targetEmail) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }
    setErrorMessage('');
    setIsForgotSubmitting(true);
    try {
      const res = await forgotPassword(targetEmail);
      setForgotStep('verify');
      setForgotDebugOtp(res?.data?.debug_otp || '');
      setForgotMaskedPhone(res?.data?.masked_phone || '');
      setForgotSuccessMsg(res?.data?.message || 'Verification code sent successfully!');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to send verification code. Please check your email.');
    } finally {
      setIsForgotSubmitting(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!forgotOtp.trim()) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter identical passwords.');
      return;
    }
    setErrorMessage('');
    setIsForgotSubmitting(true);
    try {
      const res = await resetPassword({
        email: forgotEmail.trim(),
        otp: forgotOtp.trim(),
        newPassword: newPassword
      });
      setForgotStep('success');
      setLoginEmail(forgotEmail.trim());
      setLoginPassword(newPassword);
      setForgotSuccessMsg(res?.data?.message || 'Password reset successfully!');
    } catch (err) {
      setErrorMessage(err.message || 'Invalid or expired verification code.');
    } finally {
      setIsForgotSubmitting(false);
    }
  };

  const handleStateChange = (stateName) => {
    setSelectedState(stateName);
    setSelectedCity('');
    setIsCustomCity(false);
    setCustomCityName('');
    setGpsLocationStatus(null);
  };

  const handleCityChange = (cityName) => {
    if (cityName === 'OTHER_CUSTOM') {
      setIsCustomCity(true);
      setSelectedCity('Other');
    } else {
      setIsCustomCity(false);
      setSelectedCity(cityName);
      const cData = getStateData(selectedState)?.cities?.find(c => c.name === cityName);
      if (cData) setUserCoords({ lat: cData.lat, lng: cData.lng });
    }
  };

  const handleSelectHub = (hub) => {
    setSelectedState(hub.state);
    setSelectedCity(hub.city);
    setIsCustomCity(false);
    setCustomCityName('');
    setUserCoords({ lat: hub.lat, lng: hub.lng });
    setGpsLocationStatus(null);
  };

  const handleUseGPS = () => {
    if (!navigator.geolocation) {
      setErrorMessage('Geolocation is not supported by your browser.');
      return;
    }
    setIsDetectingLocation(true);
    setGpsLocationStatus(null);
    setErrorMessage('');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserCoords({ lat: latitude, lng: longitude });
        let detectedState = '', detectedCity = '', detectedArea = '';

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            detectedState = addr.state || '';
            detectedCity = addr.city || addr.town || addr.municipality || addr.district || addr.county || addr.suburb || '';
            detectedArea = addr.suburb || addr.neighbourhood || addr.residential || addr.road || '';
          }
        } catch (err) {
          console.warn('Reverse geocoding notice:', err);
        }

        if (!detectedState) {
          let minDist = Infinity;
          INDIA_STATES_DATA.forEach(s => s.cities.forEach(c => {
            const d = Math.hypot(c.lat - latitude, c.lng - longitude);
            if (d < minDist) { minDist = d; detectedState = s.state; detectedCity = c.name; }
          }));
        }

        const matchState = INDIA_STATES_DATA.find(s =>
          s.state.toLowerCase() === (detectedState || '').toLowerCase() ||
          (detectedState || '').toLowerCase().includes(s.state.toLowerCase()) ||
          s.state.toLowerCase().includes((detectedState || '').toLowerCase())
        );

        const finalState = matchState ? matchState.state : detectedState;
        if (finalState) setSelectedState(finalState);

        if (matchState && detectedCity) {
          const matchCity = matchState.cities.find(c =>
            c.name.toLowerCase() === detectedCity.toLowerCase() ||
            c.name.toLowerCase().includes(detectedCity.toLowerCase()) ||
            detectedCity.toLowerCase().includes(c.name.toLowerCase())
          );
          if (matchCity) {
            setSelectedCity(matchCity.name);
            setIsCustomCity(false);
            setCustomCityName('');
          } else {
            setSelectedCity('OTHER_CUSTOM');
            setIsCustomCity(true);
            setCustomCityName(detectedCity);
          }
        } else if (detectedCity) {
          setSelectedCity('OTHER_CUSTOM');
          setIsCustomCity(true);
          setCustomCityName(detectedCity);
        }

        if (detectedArea && !localArea) setLocalArea(detectedArea);
        setGpsLocationStatus({ success: true, message: `Location auto-detected: ${detectedCity || 'Location'}, ${finalState}` });
        setIsDetectingLocation(false);
      },
      (err) => {
        setIsDetectingLocation(false);
        const msgs = { 1: 'Location permission denied. Please allow access or select manually.', 2: 'Location unavailable.', 3: 'Location request timed out.' };
        setErrorMessage(msgs[err.code] || 'Unable to retrieve your location.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!registerData.agree_terms) {
      setErrorMessage('Please accept the volunteer donation protocol to register.');
      return;
    }
    if (accountRole === 'hospital') {
      if (!hospitalName.trim()) { setErrorMessage('Please enter the Hospital / Clinic legal name.'); return; }
      if (!licenseNumber.trim()) { setErrorMessage('Please enter the Medical License / Registration number.'); return; }
    }
    if (!selectedState) {
      setErrorMessage('Please select your State / UT or use the GPS location button.');
      return;
    }

    const effectiveCity = isCustomCity ? customCityName.trim() : selectedCity;
    if (!effectiveCity) { setErrorMessage('Please select or enter your City / District.'); return; }

    const phoneCheck = validateIndianPhone(registerData.phone_number);
    if (!phoneCheck.isValid) { setErrorMessage(`Emergency Phone: ${phoneCheck.message}`); return; }

    const finalLocality = [localArea.trim(), effectiveCity, selectedState].filter(Boolean).join(', ');

    setIsSubmitting(true);
    try {
      const user = await register({
        full_name: registerData.full_name,
        email: registerData.email,
        phone_number: phoneCheck.e164 || registerData.phone_number,
        password: registerData.password,
        blood_group: registerData.blood_group || 'O+',
        locality: finalLocality,
        city: effectiveCity,
        state: selectedState,
        latitude: userCoords.lat || 0.0,
        longitude: userCoords.lng || 0.0,
        role: accountRole,
        hospital_name: (accountRole === 'hospital' || accountRole === 'admin') ? (hospitalName.trim() || null) : null,
        license_number: accountRole === 'hospital' ? (licenseNumber.trim() || null) : null
      });

      if (accountRole === 'admin') setAdminRequestSubmitted(true);
      else if (onSuccess) onSuccess(user);
      else if (onNavigate) onNavigate('donor');
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed. If you already have an account, please log in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const phoneCheck = validateIndianPhone(registerData.phone_number);
  const currentStateData = selectedState ? getStateData(selectedState) : null;
  const currentStateCities = currentStateData ? currentStateData.cities : [];

  return (
    <div className="min-h-[calc(100vh-80px)] py-8 px-4 sm:px-6 lg:px-8 flex flex-col justify-center animate-fadeIn">
      <div className="max-w-md sm:max-w-2xl mx-auto w-full mb-4">
        <button onClick={() => onNavigate?.('acceptor')} className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /><span>Back to Portal</span>
        </button>
      </div>

      <div className="max-w-md sm:max-w-2xl mx-auto w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
        {/* Header */}
        <div className="p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-red-950 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 text-white shadow-lg shadow-red-600/30 mb-3">
            <Heart className="w-6 h-6 fill-white animate-pulse" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Pulse<span className="text-red-500">Connect</span> Authentication</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium max-w-md mx-auto">🇮🇳 Pan-India Emergency Donor Network — Open to all 28 States & 8 Union Territories.</p>

          <div className="flex items-center justify-center p-1 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 max-w-xs mx-auto mt-6">
            {['login', 'register'].map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setErrorMessage(''); setIsReadOnly(tab === 'login'); }}
                className={`flex-1 py-2 px-4 rounded-xl text-xs sm:text-sm font-extrabold capitalize transition-all ${activeTab === tab ? 'bg-red-600 text-white shadow-md' : 'text-slate-300 hover:text-white'}`}
              >
                {tab === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>
        </div>

        {errorMessage && (
          <div className="mx-6 sm:mx-8 mt-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 flex items-start gap-3 text-red-700 dark:text-red-300 text-xs sm:text-sm font-semibold animate-slideUp">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" /><span>{errorMessage}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="p-6 sm:p-8 space-y-5">
            <div>
              <label htmlFor="login-email" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Email Address / Registered ID</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="email" name="email" id="login-email" required autoComplete="username"
                  readOnly={isReadOnly} onFocus={handleInputInteraction} onClick={handleInputInteraction}
                  value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                  placeholder="name@pulseconnect.org"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-medium transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="login-password" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('forgot_password');
                    setErrorMessage('');
                    setForgotEmail(loginEmail || '');
                    setForgotStep('request');
                    setForgotSuccessMsg('');
                    setForgotOtp('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'} name="password" id="login-password" required autoComplete="current-password"
                  readOnly={isReadOnly} onFocus={handleInputInteraction} onClick={handleInputInteraction}
                  value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-medium transition-all"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-extrabold text-sm shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
              {isSubmitting ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Signing In...</span></>
              ) : (
                <><span>Sign In to Donor Portal</span><ArrowRight className="w-4 h-4" /></>
              )}
            </button>

            <div className="text-center pt-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">Want to become a life-saving blood donor anywhere in India? </span>
              <button type="button" onClick={() => { setActiveTab('register'); setErrorMessage(''); }} className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline">Create an account</button>
            </div>
          </form>
        )}

        {/* FORGOT PASSWORD FORM */}
        {activeTab === 'forgot_password' && (
          <div className="p-6 sm:p-8 space-y-5 animate-fadeIn">
            {/* Header / Back button */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <button
                type="button"
                onClick={() => { setActiveTab('login'); setErrorMessage(''); }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </button>
              <span className="text-xs font-extrabold text-red-600 dark:text-red-400 flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5" />
                <span>Password Recovery</span>
              </span>
            </div>

            {forgotSuccessMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-2.5 text-emerald-800 dark:text-emerald-300 text-xs font-semibold animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                <div className="flex-1">
                  <span>{forgotSuccessMsg}</span>
                  {forgotDebugOtp && forgotStep === 'verify' && (
                    <div className="mt-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700/60 flex items-center justify-between">
                      <span className="text-[11px] font-mono text-slate-700 dark:text-slate-300">
                        Demo Verification Code: <strong>{forgotDebugOtp}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => setForgotOtp(forgotDebugOtp)}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all cursor-pointer"
                      >
                        Autofill Code
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 1: REQUEST CODE */}
            {forgotStep === 'request' && (
              <form onSubmit={handleSendForgotCode} className="space-y-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Reset Account Password</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Enter the email address registered with your PulseConnect donor or hospital account. We will send an instant 6-digit verification code.
                  </p>
                </div>

                <div>
                  <label htmlFor="forgot-email" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Registered Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="email"
                      id="forgot-email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="e.g. subrat.jena@demo.pulseconnect.org"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-medium transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isForgotSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-extrabold text-sm shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {isForgotSubmitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /><span>Sending Verification Code...</span></>
                  ) : (
                    <><span>Send 6-Digit Reset Code</span><ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>
            )}

            {/* STEP 2: VERIFY CODE & SET NEW PASSWORD */}
            {forgotStep === 'verify' && (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Verify & Set New Password</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Enter the code sent to <strong>{forgotEmail}</strong>
                    {forgotMaskedPhone ? ` and mobile ${forgotMaskedPhone}` : ''}.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="forgot-otp" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      6-Digit Verification Code *
                    </label>
                    <button
                      type="button"
                      onClick={handleSendForgotCode}
                      disabled={isForgotSubmitting}
                      className="text-[11px] font-bold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className="w-3 h-3" /><span>Resend Code</span>
                    </button>
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      id="forgot-otp"
                      maxLength={6}
                      required
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-base font-mono font-bold tracking-widest text-center transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="new-password" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    New Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      id="new-password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-medium transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirm-password" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Confirm New Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      id="confirm-password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-type new password"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-medium transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isForgotSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-extrabold text-sm shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {isForgotSubmitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /><span>Resetting Password...</span></>
                  ) : (
                    <><span>Update Password & Save</span><CheckCircle2 className="w-4 h-4" /></>
                  )}
                </button>
              </form>
            )}

            {/* STEP 3: SUCCESS CONFIRMATION */}
            {forgotStep === 'success' && (
              <div className="text-center py-4 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Password Updated!</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    Your password has been securely reset with Bcrypt encryption. You can now sign in using your new password.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setActiveTab('login'); setErrorMessage(''); }}
                  className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-extrabold text-sm shadow-lg shadow-red-600/30 transition-all cursor-pointer"
                >
                  Sign In with New Password
                </button>
              </div>
            )}
          </div>
        )}

        {/* REGISTER TAB */}
        {activeTab === 'register' && (
          adminRequestSubmitted ? (
            <div className="p-6 sm:p-10 text-center space-y-6 animate-fadeIn">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/20">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div className="space-y-2 max-w-md mx-auto">
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Admin Access Request Submitted!</h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Your registration requesting <strong className="text-indigo-600 dark:text-indigo-400">System Administrator</strong> privileges has been recorded in the platform directory.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 max-w-md mx-auto text-left space-y-3">
                <div className="flex items-center gap-3"><div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-black shrink-0">✓</div><span className="text-xs font-medium text-slate-700 dark:text-slate-300">Account profile registered & credentials encrypted</span></div>
                <div className="flex items-center gap-3"><div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-black shrink-0 animate-pulse">🔔</div><span className="text-xs font-medium text-slate-700 dark:text-slate-300">In-app alert notification sent to active administrators</span></div>
                <div className="flex items-center gap-3"><div className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs font-black shrink-0">⏳</div><span className="text-xs font-medium text-slate-700 dark:text-slate-300">Awaiting admin review in <strong>Pending Verifications</strong></span></div>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                <button type="button" onClick={() => { setAdminRequestSubmitted(false); setActiveTab('login'); }} className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5">
                  <span>Go to Sign In</span><ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => onNavigate?.('acceptor')} className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-200 transition-all border border-slate-200 dark:border-slate-700">Return to Home</button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="p-6 sm:p-8 space-y-4 sm:space-y-5">
              <div className="p-3 rounded-2xl bg-gradient-to-r from-red-500/10 via-amber-500/10 to-emerald-500/10 border border-red-200 dark:border-red-900/40 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-red-600/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0"><Globe2 className="w-4 h-4" /></div>
                <div className="text-xs text-slate-700 dark:text-slate-300"><span className="font-extrabold text-red-600 dark:text-red-400">Pan-India Registration Active: </span>Donors & healthcare providers from any State, District, or City across India can volunteer.</div>
              </div>

              {/* Account Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Select Account Type *</label>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  {[
                    { id: 'donor_acceptor', label: 'Donor', icon: Heart, activeClass: 'text-red-600 dark:text-red-400' },
                    { id: 'hospital', label: 'Hospital', icon: Building2, activeClass: 'text-purple-600 dark:text-purple-400' },
                    { id: 'admin', label: 'Admin', icon: ShieldCheck, activeClass: 'text-indigo-600 dark:text-indigo-400' }
                  ].map(r => {
                    const Icon = r.icon;
                    const isSel = accountRole === r.id;
                    return (
                      <button key={r.id} type="button" onClick={() => setAccountRole(r.id)} className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${isSel ? `bg-white dark:bg-slate-900 ${r.activeClass} shadow-sm` : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}>
                        <Icon className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{r.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {accountRole === 'admin' && (
                <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 space-y-3 animate-fadeIn">
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
                    <div><p className="text-xs text-indigo-900 dark:text-indigo-200 font-bold">Admin Access Approval Protocol</p><p className="text-xs text-indigo-800/90 dark:text-indigo-300 font-medium">Public admin registrations require approval by existing Administrators in Pending Verifications.</p></div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Department / Organization / Role (Optional)</label>
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="text" value={hospitalName} onChange={e => setHospitalName(e.target.value)} placeholder="e.g. State Blood Cell, Govt. Health Dept." className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  </div>
                </div>
              )}

              {accountRole === 'hospital' && (
                <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/80 space-y-3 animate-fadeIn">
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-purple-900 dark:text-purple-200 font-medium">Hospital accounts are reviewed by administrators to grant the <strong>"Hospital Verified"</strong> badge.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Hospital / Clinic Name *</label>
                    <input type="text" required value={hospitalName} onChange={e => setHospitalName(e.target.value)} placeholder="e.g. Apollo Multi-Specialty Hospital" className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Clinical License / Registration Number *</label>
                    <input type="text" required value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)} placeholder="e.g. NABH-KA-2026-88192" className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">{accountRole === 'hospital' ? 'Authorized Officer / CMO Name *' : accountRole === 'admin' ? 'Administrator Full Name *' : 'Full Name *'}</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" required value={registerData.full_name} onChange={e => setRegisterData({ ...registerData, full_name: e.target.value })} placeholder="e.g. Subrat Kumar Jena" className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Email Address *</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="email" required value={registerData.email} onChange={e => setRegisterData({ ...registerData, email: e.target.value })} placeholder="rajesh@example.com" className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Emergency Phone *</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="tel" required value={registerData.phone_number} onChange={e => setRegisterData({ ...registerData, phone_number: e.target.value })} placeholder="+91 98450 12345" className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-sm font-medium font-mono focus:outline-none focus:ring-2 ${!registerData.phone_number.trim() ? 'border-slate-200 dark:border-slate-700 focus:ring-red-500' : phoneCheck.isValid ? 'border-emerald-500 focus:ring-emerald-500' : 'border-amber-500 focus:ring-amber-500'}`} />
                  </div>
                  {registerData.phone_number.trim() && (
                    <div className={`mt-1.5 text-xs flex items-center gap-1.5 ${phoneCheck.isValid ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-medium'}`}>
                      {phoneCheck.isValid ? <><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /><span>Valid Mobile ({phoneCheck.formatted})</span></> : <><AlertCircle className="w-3.5 h-3.5 shrink-0" /><span>{phoneCheck.message}</span></>}
                    </div>
                  )}
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Password * (Bcrypt Salted & Hashed)</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type={showPassword ? 'text' : 'password'} required minLength={6} value={registerData.password} onChange={e => setRegisterData({ ...registerData, password: e.target.value })} placeholder="Min 6 characters" className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Blood Group */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Your Blood Group *</label>
                <div className="grid grid-cols-4 gap-2">
                  {DONOR_BLOOD_GROUPS.map(bg => (
                    <button key={bg} type="button" onClick={() => setRegisterData({ ...registerData, blood_group: bg })} className={`py-2 rounded-xl text-xs sm:text-sm font-extrabold border transition-all ${registerData.blood_group === bg ? 'bg-red-600 text-white border-red-600 shadow-md' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'}`}>
                      {bg}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5"><MapPin className="w-4 h-4 text-red-500" /><span>Donor Location (All Over India) *</span></label>
                    <p className="text-[11px] text-slate-400 mt-0.5">Use GPS for 1-click entry or choose State and City below.</p>
                  </div>
                  <button type="button" onClick={handleUseGPS} disabled={isDetectingLocation} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 active:scale-95 transition-all shadow-md disabled:opacity-60 shrink-0">
                    {isDetectingLocation ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Detecting...</span></> : <><LocateFixed className="w-4 h-4" /><span>Use GPS Location</span></>}
                  </button>
                </div>

                {gpsLocationStatus && (
                  <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs ${gpsLocationStatus.success ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-700 dark:text-emerald-300' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                    <CheckCircle2 className="w-4 h-4 shrink-0" /><span className="font-semibold">{gpsLocationStatus.message}</span>
                  </div>
                )}

                {/* Popular Hubs */}
                <div>
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Popular Hubs (Quick Select)</span>
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_REGIONAL_HUBS.map(hub => {
                      const isSel = selectedState === hub.state && selectedCity === hub.city;
                      return (
                        <button key={hub.label} type="button" onClick={() => handleSelectHub(hub)} className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${isSel ? 'bg-red-600 text-white shadow-sm border border-red-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 border border-slate-200 dark:border-slate-700'}`}>
                          {hub.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* State & City Selects */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select value={selectedState} onChange={e => handleStateChange(e.target.value)} className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500 appearance-none">
                      <option value="" disabled>-- Select State / UT --</option>
                      {INDIA_STATES_DATA.map(item => <option key={item.state} value={item.state}>{item.state}</option>)}
                    </select>
                    <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">▼</div>
                  </div>

                  <div className="relative">
                    <Navigation2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select disabled={!selectedState} value={isCustomCity ? 'OTHER_CUSTOM' : selectedCity} onChange={e => handleCityChange(e.target.value)} className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500 appearance-none disabled:opacity-50">
                      <option value="" disabled>{selectedState ? '-- Select City / District --' : '-- Select State First --'}</option>
                      {currentStateCities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                      {selectedState && <option value="OTHER_CUSTOM" className="font-bold text-red-600 dark:text-red-400">+ Other / Custom City or District...</option>}
                    </select>
                    <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">▼</div>
                  </div>
                </div>

                {selectedState && !isCustomCity && (
                  <div className="flex items-center justify-between px-1 -mt-2">
                    <button
                      type="button"
                      onClick={() => handleCityChange('OTHER_CUSTOM')}
                      className="text-[11px] font-bold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>City not in the list?</span>
                      <span className="underline font-black">+ Other City (Type manually)</span>
                    </button>
                  </div>
                )}

                {isCustomCity && (
                  <div className="p-3 rounded-2xl bg-red-50/70 dark:bg-red-950/40 border border-red-300 dark:border-red-800 animate-fadeIn space-y-1.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-red-700 dark:text-red-300 block">
                        Write City Name (Not Listed Above) *
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomCity(false);
                          setSelectedCity(currentStateCities[0]?.name || '');
                          setCustomCityName('');
                        }}
                        className="text-[11px] font-semibold text-slate-500 hover:text-red-600 dark:text-slate-400 underline cursor-pointer"
                      >
                        Back to City List
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      value={customCityName}
                      onChange={e => setCustomCityName(e.target.value)}
                      placeholder="e.g. Nashik, Siliguri, Roorkee, Sambalpur..."
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-red-300 dark:border-red-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 shadow-xs"
                    />
                  </div>
                )}

                <div className="relative">
                  <Compass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" value={localArea} onChange={e => setLocalArea(e.target.value)} placeholder="Locality / Landmark / Hospital (Optional)" className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
              </div>

              {/* Agreement */}
              <label className="flex items-start gap-2.5 cursor-pointer pt-2">
                <input type="checkbox" checked={registerData.agree_terms} onChange={e => setRegisterData({ ...registerData, agree_terms: e.target.checked })} className="w-4 h-4 rounded mt-0.5 text-red-600 focus:ring-red-500" />
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  {accountRole === 'admin' ? 'I certify applying for legitimate administrator access subject to approval.' : accountRole === 'hospital' ? 'I certify representing an authorized healthcare facility.' : 'I volunteer as an on-call blood donor for critical emergencies in my region and agree to the 90-day cooldown.'}
                </span>
              </label>

              {/* Submit */}
              <button type="submit" disabled={isSubmitting} className={`w-full py-3 px-4 rounded-xl active:scale-95 text-white font-extrabold text-sm shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 ${accountRole === 'admin' ? 'bg-indigo-600 hover:bg-indigo-700' : accountRole === 'hospital' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-red-600 hover:bg-red-700'}`}>
                {isSubmitting ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Submitting...</span></>
                ) : (
                  <><ShieldCheck className="w-4 h-4" /><span>{accountRole === 'admin' ? 'Submit Admin Registration Request' : accountRole === 'hospital' ? 'Register Hospital Facility' : 'Complete Registration'}</span></>
                )}
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">Already registered? </span>
                <button type="button" onClick={() => { setActiveTab('login'); setErrorMessage(''); }} className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline">Sign In</button>
              </div>
            </form>
          )
        )}
      </div>
    </div>
  );
}
