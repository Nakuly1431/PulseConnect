import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Radio,
  ArrowRight,
  ArrowLeft,
  Upload,
  CheckCircle2,
  AlertCircle,
  MapPin,
  AlertOctagon,
  Edit3,
  KeyRound,
  Smartphone,
  RefreshCw,
  Clock,
  ShieldCheck,
  Check,
  Droplet,
  Plus,
  Minus,
  LocateFixed,
  Navigation2,
  Loader2
} from 'lucide-react';
import { DONOR_BLOOD_GROUPS } from '../utils/bloodCompatibility';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { validateIndianPhone } from '../utils/phoneValidation';
import { 
  isFirebaseConfigured, 
  sendFirebasePhoneOtp, 
  confirmFirebasePhoneOtp 
} from '../services/firebase';

export default function SOSModal({
  isOpen,
  onClose,
  onSubmitSOS,
  onUpdateSOS,
  mode = 'create',
  initialData = null,
  onNavigateTracker
}) {
  const { user, isAuthenticated } = useAuth();
  const isEditMode = mode === 'edit' && Boolean(initialData);

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedEmergency, setConfirmedEmergency] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    patient_name: '',
    blood_group: 'O-',
    units_needed: 1,
    component_type: 'Whole Blood',
    urgency_level: 'Immediate',
    hospital_name: '',
    hospital_locality: '',
    contact_person: '',
    contact_phone: '',
    latitude: 0.0,
    longitude: 0.0,
    verification_slip: null,
  });

  const [slipPreview, setSlipPreview] = useState(null);

  // Phone OTP Verification State (Option B)
  const [otpCode, setOtpCode] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [debugOtp, setDebugOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [firebaseConfirmation, setFirebaseConfirmation] = useState(null);
  const [isUsingFirebase, setIsUsingFirebase] = useState(false);

  // GPS Auto-Detection State
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsStatus, setGpsStatus] = useState(null);

  // Populate data if in edit mode or reset on open
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && initialData) {
        setFormData({
          patient_name: initialData.patient_name || '',
          blood_group: initialData.blood_group || 'O-',
          units_needed: initialData.units_needed || 1,
          component_type: initialData.component_type || 'Whole Blood',
          urgency_level: initialData.urgency_level || 'Immediate',
          hospital_name: initialData.hospital_name || '',
          hospital_locality: initialData.hospital_locality || '',
          contact_person: initialData.contact_person || '',
          contact_phone: initialData.contact_phone || '',
          latitude: initialData.latitude || 0.0,
          longitude: initialData.longitude || 0.0,
          verification_slip: null,
        });
        setStep(1);
        setConfirmedEmergency(null);
        setOtpSent(true);
        setGpsStatus(null);
        setIsDetectingGps(false);
      } else if (isAuthenticated && user) {
        // Logged-in user: auto-populate from profile and skip Step 1 straight to Step 2!
        setFormData({
          patient_name: user.full_name || '',
          blood_group: user.blood_group || 'O-',
          units_needed: 1,
          component_type: 'Whole Blood',
          urgency_level: 'Immediate',
          hospital_name: user.hospital_name || '',
          hospital_locality: user.locality || '',
          contact_person: user.full_name || '',
          contact_phone: user.phone_number || '',
          latitude: user.latitude || 0.0,
          longitude: user.longitude || 0.0,
          verification_slip: null,
        });
        setStep(2); // Automatically skip Step 1!
        setConfirmedEmergency(null);
        setOtpSent(true); // Account phone is verified
        setOtpCode('');
        setDebugOtp('');
        setOtpError('');
        setFirebaseConfirmation(null);
        setIsUsingFirebase(false);
        setGpsStatus(null);
        setIsDetectingGps(false);
      } else {
        setFormData({
          patient_name: '',
          blood_group: 'O-',
          units_needed: 1,
          component_type: 'Whole Blood',
          urgency_level: 'Immediate',
          hospital_name: '',
          hospital_locality: '',
          contact_person: '',
          contact_phone: '',
          latitude: 0.0,
          longitude: 0.0,
          verification_slip: null,
        });
        setStep(1);
        setConfirmedEmergency(null);
        setOtpSent(false);
        setOtpCode('');
        setDebugOtp('');
        setOtpError('');
        setFirebaseConfirmation(null);
        setIsUsingFirebase(false);
        setGpsStatus(null);
        setIsDetectingGps(false);
      }
    }
  }, [isOpen, isEditMode, initialData, isAuthenticated, user]);

  // Resend Countdown Timer
  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  const phoneValidation = useMemo(() => validateIndianPhone(formData.contact_phone), [formData.contact_phone]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleChange('verification_slip', file);
      setSlipPreview(URL.createObjectURL(file));
    }
  };

  const handleAutofillLocation = () => {
    handleChange('hospital_name', 'Manipal Hospital (Old Airport Road)');
    handleChange('hospital_locality', 'Kodihalli, Bengaluru');
    handleChange('latitude', 12.9592);
    handleChange('longitude', 77.6534);
    setGpsStatus({
      success: true,
      message: 'Demo coordinates set: 12.9592° N, 77.6534° E (Kodihalli, Bengaluru)'
    });
  };

  // GPS Auto-Detection & Reverse Geocoding
  const handleUseGPSLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus({ success: false, message: 'Geolocation is not supported by your browser.' });
      return;
    }

    setIsDetectingGps(true);
    setGpsStatus(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const latVal = parseFloat(latitude.toFixed(5));
        const lngVal = parseFloat(longitude.toFixed(5));

        handleChange('latitude', latVal);
        handleChange('longitude', lngVal);

        let detectedHospital = '';
        let detectedLocality = '';

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=17&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            
            detectedHospital = addr.hospital || addr.clinic || addr.healthcare || addr.amenity || '';
            
            const areaParts = [
              addr.suburb || addr.neighbourhood || addr.residential || addr.road,
              addr.city || addr.town || addr.municipality || addr.district,
              addr.state
            ].filter(Boolean);

            detectedLocality = areaParts.join(', ');
          }
        } catch (fetchErr) {
          console.warn('GPS reverse geocoding note:', fetchErr);
        }

        if (detectedHospital && !formData.hospital_name) {
          handleChange('hospital_name', detectedHospital);
        }
        if (detectedLocality) {
          handleChange('hospital_locality', detectedLocality);
        }

        setGpsStatus({
          success: true,
          message: `GPS Locked: ${latVal.toFixed(4)}° N, ${lngVal.toFixed(4)}° E${detectedLocality ? ` (${detectedLocality})` : ''}`
        });
        setIsDetectingGps(false);
      },
      (err) => {
        setIsDetectingGps(false);
        let msg = 'Unable to retrieve GPS coordinates.';
        if (err.code === 1) msg = 'Location permission denied. Please allow location access in your browser.';
        else if (err.code === 2) msg = 'Location unavailable. Please check your device GPS.';
        else if (err.code === 3) msg = 'GPS request timed out. Please retry.';
        setGpsStatus({ success: false, message: msg });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // Send Phone OTP
  const handleSendOTP = async () => {
    if (!phoneValidation.isValid) {
      setOtpError(phoneValidation.message);
      return;
    }
    setOtpError('');
    setIsSendingOtp(true);
    try {
      if (isFirebaseConfigured()) {
        const { confirmationResult } = await sendFirebasePhoneOtp(formData.contact_phone.trim(), 'recaptcha-container');
        setFirebaseConfirmation(confirmationResult);
        setIsUsingFirebase(true);
        setOtpSent(true);
        setDebugOtp('');
        setResendTimer(30);
      } else {
        const res = await api.sendSOSOtp(phoneValidation.e164 || formData.contact_phone.trim());
        setOtpSent(true);
        setIsUsingFirebase(false);
        if (res?.data?.debug_otp) {
          setDebugOtp(res.data.debug_otp);
        }
        setResendTimer(30);
      }
    } catch (err) {
      setOtpError(err.message || 'Failed to dispatch verification code. Please retry.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Dispatch SOS Create or Update
  const handleSubmit = async (e) => {
    e.preventDefault();
    setOtpError('');

    if (!phoneValidation.isValid) {
      setOtpError(`Emergency Phone: ${phoneValidation.message}`);
      return;
    }

    if (isEditMode) {
      // Execute Edit Update
      setIsSubmitting(true);
      try {
        const updatePayload = {
          patient_name: formData.patient_name,
          blood_group: formData.blood_group,
          units_needed: Number(formData.units_needed),
          component_type: formData.component_type,
          urgency_level: formData.urgency_level,
          hospital_name: formData.hospital_name,
          hospital_locality: formData.hospital_locality,
          contact_person: formData.contact_person,
          contact_phone: formData.contact_phone,
          latitude: formData.latitude,
          longitude: formData.longitude,
        };
        await onUpdateSOS(initialData.id, updatePayload, initialData.edit_token);
        setIsSubmitting(false);
        onClose();
      } catch (err) {
        setIsSubmitting(false);
        setOtpError(err.message || 'Failed to update emergency details.');
      }
      return;
    }

    // CREATE MODE: Phone OTP check only required for unauthenticated guest users
    if (!isAuthenticated) {
      if (!otpSent) {
        setOtpError('Please verify your phone number with an OTP before dispatching.');
        return;
      }
      if (!otpCode.trim()) {
        setOtpError('Please enter the 6-digit verification code.');
        return;
      }

      if (isUsingFirebase && firebaseConfirmation) {
        setIsSubmitting(true);
        try {
          await confirmFirebasePhoneOtp(firebaseConfirmation, otpCode.trim());
        } catch (fbErr) {
          setIsSubmitting(false);
          setOtpError(fbErr.message || 'Invalid SMS verification code. Please check and retry.');
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null) {
          data.append(key, formData[key]);
        }
      });
      data.append('otp_code', otpCode.trim());

      const created = await onSubmitSOS(data);
      setIsSubmitting(false);
      // Transition to Post-Confirmation Stressed User Review Screen!
      if (created) {
        setConfirmedEmergency(created);
      } else {
        onClose();
      }
    } catch (err) {
      setIsSubmitting(false);
      setOtpError(err.message || 'Verification failed. Please check the OTP code.');
    }
  };

  // Switch to Edit Mode immediately from the confirmation screen
  const handleEditFromConfirmation = () => {
    if (confirmedEmergency) {
      setFormData({
        patient_name: confirmedEmergency.patient_name,
        blood_group: confirmedEmergency.blood_group,
        units_needed: confirmedEmergency.units_needed,
        component_type: confirmedEmergency.component_type,
        urgency_level: confirmedEmergency.urgency_level,
        hospital_name: confirmedEmergency.hospital_name,
        hospital_locality: confirmedEmergency.hospital_locality,
        contact_person: confirmedEmergency.contact_person,
        contact_phone: confirmedEmergency.contact_phone,
        verification_slip: null,
      });
      setConfirmedEmergency(null);
      setStep(1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors max-h-[92vh] flex flex-col">

        {/* Modal Header */}
        <div className={`px-5 sm:px-8 py-4 sm:py-5 text-white flex items-center justify-between shrink-0 ${
          isEditMode
            ? 'bg-gradient-to-r from-amber-600 to-orange-600'
            : 'bg-gradient-to-r from-red-600 to-rose-600'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-md">
              {isEditMode ? (
                <Edit3 className="w-5 h-5 text-white" />
              ) : (
                <Radio className="w-5 h-5 text-white animate-spin" />
              )}
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black tracking-tight">
                {confirmedEmergency
                  ? `Emergency SOS #${confirmedEmergency.id} Broadcasted`
                  : isEditMode
                    ? `Edit Emergency SOS #${initialData?.id || ''}`
                    : 'Broadcast SOS Emergency'}
              </h3>
              <p className="text-xs text-red-100 font-medium">
                {confirmedEmergency
                  ? 'Active broadcast live to matching donors nearby'
                  : isEditMode
                    ? 'Correct any mistyped patient, blood group, units, or hospital details'
                    : 'Alert verified nearby donors instantly with phone verification'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* POST-CONFIRMATION STRESSED USER SCREEN */}
        {confirmedEmergency ? (
          <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1 animate-fadeIn">
            {/* Empathy & Reassurance Banner */}
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/60 rounded-xl text-amber-700 dark:text-amber-400 shrink-0 h-fit">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                <p className="font-extrabold text-amber-900 dark:text-amber-300">
                  Filing an emergency under extreme pressure is tough.
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  It is completely normal to accidentally mistype details (e.g. blood group B+ vs B-, units needed, or hospital ward).
                  Please double-check your filing below:
                </p>
              </div>
            </div>

            {/* Broadcast Details Card */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Dispatched Broadcast Summary
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-black bg-red-600 text-white shadow-sm">
                  {confirmedEmergency.blood_group} ({confirmedEmergency.units_needed} Units)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-xs">Patient Name</span>
                  <span className="font-bold text-slate-900 dark:text-white">{confirmedEmergency.patient_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-xs">Component Type</span>
                  <span className="font-bold text-slate-900 dark:text-white">{confirmedEmergency.component_type}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-xs">Hospital / Locality</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {confirmedEmergency.hospital_name}, {confirmedEmergency.hospital_locality}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-xs">Contact Person & Phone</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {confirmedEmergency.contact_person} ({confirmedEmergency.contact_phone})
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleEditFromConfirmation}
                className="w-full sm:w-1/2 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-extrabold text-sm shadow-md transition-all"
              >
                <Edit3 className="w-4 h-4" />
                <span>Notice a Mistake? Edit Details</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onNavigateTracker) onNavigateTracker();
                  onClose();
                }}
                className="w-full sm:w-1/2 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 text-white font-extrabold text-sm shadow transition-all"
              >
                <Radio className="w-4 h-4 text-red-400" />
                <span>Track on Live Mission Board</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* 3-Step Progress Indicator */}
            <div className="px-4 sm:px-8 py-3 sm:py-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 transition-colors shrink-0">
              <div className="flex items-center justify-between max-w-md mx-auto">
                {/* Step 1 */}
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 sm:gap-2 cursor-pointer focus:outline-none"
                >
                  <span className={`flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full text-xs font-bold ${
                    step === 1
                      ? 'bg-red-600 text-white ring-2 ring-red-600/30'
                      : isAuthenticated && user
                        ? 'bg-emerald-600 text-white'
                        : step >= 1
                          ? 'bg-red-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    {isAuthenticated && user && step > 1 ? '✓' : '1'}
                  </span>
                  <div className="hidden sm:block text-left">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                      Blood & Units
                    </span>
                    {isAuthenticated && user && (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block -mt-0.5">
                        Auto-filled ({formData.blood_group})
                      </span>
                    )}
                  </div>
                </button>

                <div className={`flex-1 h-0.5 mx-2 sm:mx-3 ${step >= 2 ? 'bg-red-600' : 'bg-slate-200 dark:bg-slate-700'}`} />

                {/* Step 2 */}
                <button
                  type="button"
                  onClick={() => {
                    if (formData.patient_name) setStep(2);
                  }}
                  className="flex items-center gap-1.5 sm:gap-2 cursor-pointer focus:outline-none"
                >
                  <span className={`flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full text-xs font-bold ${
                    step >= 2 ? 'bg-red-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    2
                  </span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 hidden sm:inline">Hospital Location</span>
                </button>

                <div className={`flex-1 h-0.5 mx-2 sm:mx-3 ${step >= 3 ? 'bg-red-600' : 'bg-slate-200 dark:bg-slate-700'}`} />

                {/* Step 3 */}
                <button
                  type="button"
                  onClick={() => {
                    if (formData.patient_name && formData.hospital_name) setStep(3);
                  }}
                  className="flex items-center gap-1.5 sm:gap-2 cursor-pointer focus:outline-none"
                >
                  <span className={`flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full text-xs font-bold ${
                    step >= 3 ? 'bg-red-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    3
                  </span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 hidden sm:inline">
                    {isEditMode ? 'Contact & Save' : 'Verify & Dispatch'}
                  </span>
                </button>
              </div>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="p-4 sm:p-8 overflow-y-auto flex-1">
              
              {/* STEP 1: Blood Group, Units, Urgency */}
              {step === 1 && (
                <div className="space-y-4 sm:space-y-5 animate-fadeIn">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                      Patient Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.patient_name}
                      onChange={(e) => handleChange('patient_name', e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-red-600/20 focus:border-red-600 text-base sm:text-sm font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                      Required Blood Group *
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {DONOR_BLOOD_GROUPS.map((bg) => (
                        <button
                          key={bg}
                          type="button"
                          onClick={() => handleChange('blood_group', bg)}
                          className={`py-2 sm:py-2.5 rounded-xl font-extrabold text-sm border transition-all ${
                            formData.blood_group === bg
                              ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-600/20'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          {bg}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Units Needed with Liquid Wave Infusion Bag Visualizer */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-red-50/60 via-slate-50 to-rose-50/30 dark:from-slate-800/80 dark:via-slate-800/50 dark:to-slate-800/80 border border-red-100 dark:border-slate-700/80">
                    <div className="flex items-center justify-between mb-2.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase flex items-center gap-1.5">
                        <Droplet className="w-3.5 h-3.5 text-red-600 fill-red-600 animate-pulse" />
                        <span>Units Needed (Blood Volume)</span>
                      </label>
                      <span className="text-xs font-black text-red-600 dark:text-red-400">
                        {formData.units_needed || 1} Bag{(formData.units_needed || 1) > 1 ? 's' : ''} • ~{(formData.units_needed || 1) * 350} ml
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      {/* Fluid Blood Bag Display with Wave Slosh Animation */}
                      <div className="relative w-20 h-28 bg-white dark:bg-slate-900 rounded-2xl border-2 border-red-400/80 dark:border-red-600/60 shadow-md overflow-hidden shrink-0 flex flex-col justify-end">
                        {/* Hanging Tab */}
                        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-5 h-1 bg-slate-300 dark:bg-slate-700 rounded-full z-20" />
                        
                        {/* Interactive Wave Fill Level */}
                        <div 
                          className="w-full bg-gradient-to-t from-red-700 via-red-600 to-rose-500 transition-all duration-500 ease-out relative"
                          style={{ height: `${Math.min(100, Math.max(14, (formData.units_needed || 1) * 10))}%` }}
                        >
                          {/* Animated liquid wave crest */}
                          <div className="absolute -top-3 left-0 right-0 w-[200%] h-4 overflow-hidden pointer-events-none">
                            <svg className="w-full h-full liquid-wave-animation opacity-80" viewBox="0 0 1200 120" preserveAspectRatio="none">
                              <path d="M0,0 C150,90 350,-40 500,50 C650,140 900,-20 1200,40 L1200,120 L0,120 Z" fill="#f43f5e" />
                            </svg>
                          </div>
                        </div>

                        {/* Front Bag Gauge Markings */}
                        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-1.5 z-10">
                          <div className="flex justify-between items-center text-[8px] font-mono font-bold text-slate-400 dark:text-slate-500 pt-1">
                            <span>10U</span>
                            <span>MAX</span>
                          </div>
                          <div className="text-center font-black text-xs text-white drop-shadow">
                            <span className="px-1.5 py-0.5 rounded bg-black/40 backdrop-blur-xs font-mono">
                              {formData.units_needed || 1}U
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-[8px] font-mono font-bold text-slate-400 dark:text-slate-500 pb-0.5">
                            <span>1U</span>
                            <span>{(formData.units_needed || 1) * 350}ml</span>
                          </div>
                        </div>
                      </div>

                      {/* Interactive Stepper & Quick Unit Selection Chips */}
                      <div className="flex-1 w-full space-y-2.5">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleChange('units_needed', Math.max(1, (formData.units_needed || 1) - 1))}
                            className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-white hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 flex items-center justify-center font-black text-lg transition-all active:scale-95 shadow-sm"
                            aria-label="Decrease Units"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={formData.units_needed}
                            onChange={(e) => handleChange('units_needed', Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
                            className="flex-1 text-center py-2 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-extrabold text-base focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                          />

                          <button
                            type="button"
                            onClick={() => handleChange('units_needed', Math.min(10, (formData.units_needed || 1) + 1))}
                            className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-white hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 flex items-center justify-center font-black text-lg transition-all active:scale-95 shadow-sm"
                            aria-label="Increase Units"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Quick Bag Presets */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase shrink-0">
                            Quick:
                          </span>
                          {[1, 2, 3, 4, 6].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => handleChange('units_needed', num)}
                              className={`flex-1 py-1 rounded-lg text-xs font-bold border transition-all ${
                                formData.units_needed === num
                                  ? 'bg-red-600 text-white border-red-600 shadow-sm'
                                  : 'bg-white dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                              }`}
                            >
                              {num} {num === 1 ? 'Bag' : 'Bags'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Component Type */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                      Component Type
                    </label>
                    <select
                      value={formData.component_type}
                      onChange={(e) => handleChange('component_type', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-600/20 focus:border-red-600 text-base sm:text-sm font-medium"
                    >
                      <option value="Whole Blood">Whole Blood</option>
                      <option value="Platelets">Platelets</option>
                      <option value="Plasma">Plasma</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                      Urgency Level
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Immediate', 'Within 6 Hours', 'Within 24 Hours'].map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => handleChange('urgency_level', level)}
                          className={`py-2 px-1.5 sm:px-2 text-xs font-bold rounded-xl border transition-all ${
                            formData.urgency_level === level
                              ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800 ring-2 ring-red-600/20'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Hospital & Location */}
              {step === 2 && (
                <div className="space-y-4 sm:space-y-5 animate-fadeIn">
                  {isAuthenticated && user && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-800 dark:text-emerald-300">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>
                          Step 1 Auto-filled: <strong>{formData.patient_name}</strong> ({formData.blood_group} • {formData.units_needed} Units)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline shrink-0"
                      >
                        Change Blood / Patient ➔
                      </button>
                    </div>
                  )}

                  {/* GPS Live Detection & Location Action Panel */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-red-50/80 via-slate-50 to-rose-50/50 dark:from-slate-800/90 dark:via-slate-800/60 dark:to-slate-800/90 border border-red-200/80 dark:border-slate-700 space-y-2.5 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                        <MapPin className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                        <span>Hospital Location & GPS Coordinates</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Live GPS Button */}
                        <button
                          type="button"
                          onClick={handleUseGPSLocation}
                          disabled={isDetectingGps}
                          className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-red-600 hover:bg-red-700 text-white shadow-sm flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                          {isDetectingGps ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Detecting GPS...</span>
                            </>
                          ) : (
                            <>
                              <LocateFixed className="w-3.5 h-3.5" />
                              <span>Use Live GPS Location</span>
                            </>
                          )}
                        </button>

                        {/* Quick Fill Demo Hospital */}
                        <button
                          type="button"
                          onClick={handleAutofillLocation}
                          className="px-2.5 py-1.5 text-xs font-bold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 shadow-xs transition-all cursor-pointer"
                        >
                          Demo Hospital
                        </button>
                      </div>
                    </div>

                    {/* GPS Status Alert */}
                    {gpsStatus && (
                      <div className={`p-2 rounded-xl text-xs flex items-center gap-2 font-medium transition-all ${
                        gpsStatus.success
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                          : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/40'
                      }`}>
                        {gpsStatus.success ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                        )}
                        <span>{gpsStatus.message}</span>
                      </div>
                    )}

                    {/* Coordinates Badge */}
                    {formData.latitude !== 0.0 && formData.longitude !== 0.0 && (
                      <div className="flex items-center gap-2 text-[11px] font-mono font-semibold text-slate-600 dark:text-slate-400">
                        <Navigation2 className="w-3.5 h-3.5 text-red-500 rotate-45 shrink-0" />
                        <span>GPS Coordinates: <strong>{formData.latitude.toFixed(4)}° N, {formData.longitude.toFixed(4)}° E</strong> (Auto-matched with nearby donors)</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                      Hospital Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.hospital_name}
                      onChange={(e) => handleChange('hospital_name', e.target.value)}
                      placeholder="e.g. Manipal Hospital Old Airport Rd"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-red-600/20 focus:border-red-600 text-base sm:text-sm font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                      Hospital Locality / Area / Ward *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.hospital_locality}
                      onChange={(e) => handleChange('hospital_locality', e.target.value)}
                      placeholder="e.g. Kodihalli / Indiranagar / ICU Ward 3"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-red-600/20 focus:border-red-600 text-base sm:text-sm font-medium"
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: Contact & Medical Slip & Phone OTP */}
              {step === 3 && (
                <div className="space-y-4 sm:space-y-5 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                        Contact Person Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.contact_person}
                        onChange={(e) => handleChange('contact_person', e.target.value)}
                        placeholder="e.g. Sunita Mehta (Attendant)"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-red-600/20 focus:border-red-600 text-base sm:text-sm font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                        Emergency Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.contact_phone}
                        onChange={(e) => {
                          handleChange('contact_phone', e.target.value);
                          if (!isEditMode) setOtpSent(false); // Reset OTP if phone changes
                        }}
                        placeholder="e.g. +91 98450 12345"
                        className={`w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-red-600/20 text-base sm:text-sm font-medium font-mono transition-colors ${
                          !formData.contact_phone.trim()
                            ? 'border-slate-200 dark:border-slate-700'
                            : phoneValidation.isValid
                            ? 'border-emerald-500 dark:border-emerald-500 focus:border-emerald-500'
                            : 'border-amber-500 dark:border-amber-500 focus:border-amber-500'
                        }`}
                      />
                      {formData.contact_phone.trim() && (
                        <div className={`mt-1.5 text-xs flex items-center gap-1.5 transition-all ${
                          phoneValidation.isValid
                            ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                            : 'text-amber-600 dark:text-amber-400 font-medium'
                        }`}>
                          {phoneValidation.isValid ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                              <span>Valid Indian Mobile ({phoneValidation.formatted})</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>{phoneValidation.message}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* PHONE OTP VERIFICATION BOX (Option B) - For Create Mode */}
                  {!isEditMode && (
                    isAuthenticated && user ? (
                      <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-300">
                        <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <div>
                          <p className="font-extrabold text-emerald-900 dark:text-emerald-200">
                            Logged in as {user.full_name}
                          </p>
                          <p className="text-emerald-700 dark:text-emerald-400">
                            Emergency contact phone <strong>{formData.contact_phone}</strong> is verified via your active account. Zero SMS OTP delay.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                        <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4 text-red-600 dark:text-red-400" />
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                            Phone Verification (Anti-Spam & Golden Hour Safety)
                          </span>
                        </div>
                        {otpSent && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Code Sent</span>
                          </span>
                        )}
                      </div>

                      {!otpSent ? (
                        <div className="flex flex-col sm:flex-row items-center gap-2">
                          <p className="text-xs text-slate-500 dark:text-slate-400 flex-1">
                            Click to receive a 6-digit SMS verification code to verify this phone number before broadcasting.
                          </p>
                          <button
                            type="button"
                            onClick={handleSendOTP}
                            disabled={isSendingOtp || !phoneValidation.isValid}
                            className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSendingOtp ? 'Sending Code...' : 'Send Verification Code'}
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              maxLength={6}
                              value={otpCode}
                              onChange={(e) => setOtpCode(e.target.value)}
                              placeholder="Enter 6-digit code"
                              className="w-44 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white font-mono font-bold tracking-widest text-center text-sm focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                            />

                            <button
                              type="button"
                              onClick={handleSendOTP}
                              disabled={resendTimer > 0 || isSendingOtp}
                              className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-red-600 disabled:opacity-50 transition-colors"
                            >
                              {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                            </button>
                          </div>

                          {/* Invisible reCAPTCHA container for Firebase Phone Auth */}
                          <div id="recaptcha-container"></div>

                          {/* Real-Time Firebase Gateway Banner */}
                          {isUsingFirebase && (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300">
                                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span>Real-time SMS dispatched via Google Firebase. (Check SMS or Truecaller / Spam folder).</span>
                              </div>
                              <div className="flex items-center justify-between px-1 text-[11px] text-slate-500">
                                <span>Carrier SMS delayed by telecom?</span>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    setIsSendingOtp(true);
                                    try {
                                      const res = await api.sendSOSOtp(phoneValidation.e164 || formData.contact_phone.trim());
                                      setIsUsingFirebase(false);
                                      if (res?.data?.debug_otp) {
                                        setDebugOtp(res.data.debug_otp);
                                      }
                                    } catch (err) {
                                      setOtpError(err.message);
                                    } finally {
                                      setIsSendingOtp(false);
                                    }
                                  }}
                                  className="text-red-600 dark:text-red-400 hover:underline font-bold"
                                >
                                  Switch to Instant Simulator Code
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Quick Demo Code helper for testing (only when in dev simulator) */}
                          {!isUsingFirebase && debugOtp && (
                            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-xs">
                              <KeyRound className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span className="text-slate-600 dark:text-slate-300">
                                Simulator Code: <strong>{debugOtp}</strong>
                              </span>
                              <button
                                type="button"
                                onClick={() => setOtpCode(debugOtp)}
                                className="ml-auto px-2 py-0.5 text-[11px] font-bold bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 rounded border border-amber-200 hover:bg-amber-50"
                              >
                                Auto-fill Code
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {otpError && (
                        <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                          {otpError}
                        </p>
                      )}
                    </div>
                  )
                )}

                  {/* Prescription / Slip Upload */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                      Doctor Prescription / Hospital Blood Requisition Slip (Optional)
                    </label>
                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-red-500 rounded-2xl p-4 text-center transition-colors bg-slate-50 dark:bg-slate-800/50 cursor-pointer">
                      <input
                        type="file"
                        id="slip-upload"
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <label htmlFor="slip-upload" className="cursor-pointer">
                        {slipPreview ? (
                          <div className="flex flex-col items-center">
                            <img
                              src={slipPreview}
                              alt="Slip Preview"
                              className="h-24 object-contain rounded-lg shadow mb-1.5"
                            />
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                              File attached: {formData.verification_slip?.name}
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <Upload className="w-7 h-7 text-slate-400 mb-1" />
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                              Click to upload blood requisition slip
                            </span>
                            <span className="text-xs text-slate-400 mt-0.5">PNG, JPG, PDF up to 10MB</span>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Emergency Summary Preview */}
                  <div className="p-3.5 rounded-2xl bg-red-50/80 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                    <div className="font-extrabold text-red-700 dark:text-red-400 flex items-center gap-1.5">
                      <AlertOctagon className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                      <span>{isEditMode ? 'Updated Broadcast Preview:' : 'Review Emergency Broadcast:'}</span>
                    </div>
                    <p>
                      <strong>Patient:</strong> {formData.patient_name || 'Not specified'} ({formData.units_needed} units of {formData.blood_group} {formData.component_type})
                    </p>
                    <p>
                      <strong>Hospital:</strong> {formData.hospital_name || 'Not specified'}, {formData.hospital_locality}
                    </p>
                    <p>
                      <strong>Contact:</strong> {formData.contact_person || 'Not specified'} ({formData.contact_phone})
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation & Submission Controls */}
              <div className="flex items-center justify-between pt-5 sm:pt-6 border-t border-slate-100 dark:border-slate-800 mt-5 sm:mt-6">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep(step - 1)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                ) : <div />}

                {step < 3 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (step === 1 && !formData.patient_name) {
                        alert('Please enter patient name');
                        return;
                      }
                      if (step === 2 && (!formData.hospital_name || !formData.hospital_locality)) {
                        alert('Please enter hospital name and locality');
                        return;
                      }
                      setStep(step + 1);
                    }}
                    className="flex items-center gap-1.5 px-5 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/20 transition-all"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting || !formData.contact_person || !formData.contact_phone}
                    className={`flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold text-white shadow-lg active:scale-95 transition-all disabled:opacity-50 ${
                      isEditMode
                        ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30'
                        : 'bg-red-600 hover:bg-red-700 shadow-red-600/30'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>{isEditMode ? 'Saving Changes...' : 'Broadcasting SOS...'}</span>
                      </>
                    ) : (
                      <>
                        {isEditMode ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Save & Update Broadcast</span>
                          </>
                        ) : (
                          <>
                            <Radio className="w-4 h-4 animate-spin" />
                            <span>Dispatch Emergency SOS</span>
                          </>
                        )}
                      </>
                    )}
                  </button>
                )}
              </div>

            </form>
          </>
        )}

      </div>
    </div>
  );
}
