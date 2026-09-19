import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  X,
  Lock,
  Unlock,
  Heart,
  Calendar,
  Building,
  MapPin,
  Phone,
  User,
  Activity,
  Droplets,
  Scale,
  Clock,
  Sparkles,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { getCooldownInfo, getCompatibleDonorTypes, isBloodCompatible } from '../utils/bloodCompatibility';

export default function DonorVerificationModal({
  isOpen,
  onClose,
  emergency,
  currentDonor,
  onConfirmDonation
}) {
  const cooldownInfo = getCooldownInfo(currentDonor);
  const donorBloodGroup = currentDonor?.blood_group;
  const targetBloodGroup = emergency?.blood_group;
  const compatibleDonorGroups = targetBloodGroup ? getCompatibleDonorTypes(targetBloodGroup) : [];
  const isCompatible = isBloodCompatible(donorBloodGroup, targetBloodGroup);

  // Compulsory Verification Checklist Items
  const [checklist, setChecklist] = useState({
    age_weight: false,
    healthy_today: false,
    cooldown_90_days: false,
    lifestyle_clearance: false,
    nutrition_hydration: false,
    voluntary_declaration: false
  });

  const [contactPhone, setContactPhone] = useState('');
  const [phoneConfirmed, setPhoneConfirmed] = useState(false);
  const [showIncompleteWarning, setShowIncompleteWarning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize or reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setChecklist({
        age_weight: false,
        healthy_today: false,
        cooldown_90_days: false,
        lifestyle_clearance: false,
        nutrition_hydration: false,
        voluntary_declaration: false
      });
      setContactPhone(currentDonor?.phone_number || '');
      setPhoneConfirmed(Boolean(currentDonor?.phone_number));
      setShowIncompleteWarning(false);
      setIsSubmitting(false);
    }
  }, [isOpen, currentDonor]);

  if (!isOpen) return null;

  const totalCriteria = 6;
  const verifiedCount = Object.values(checklist).filter(Boolean).length;
  const progressPercent = Math.round((verifiedCount / totalCriteria) * 100);
  
  // A donor in cooldown or incompatible blood type can NEVER be fully verified
  const isFullyVerified = isCompatible && !cooldownInfo.isInCooldown && verifiedCount === totalCriteria && (phoneConfirmed || Boolean(contactPhone.trim()));

  const handleToggleCheck = (key) => {
    if (key === 'cooldown_90_days' && cooldownInfo.isInCooldown) {
      setShowIncompleteWarning(true);
      return; // Strictly block checking cooldown if donor is in active cooldown!
    }
    setChecklist(prev => {
      const next = { ...prev, [key]: !prev[key] };
      return next;
    });
    setShowIncompleteWarning(false);
  };

  const handleVerifyAll = () => {
    setChecklist({
      age_weight: true,
      healthy_today: true,
      // If donor is in active cooldown, this MUST remain false!
      cooldown_90_days: !cooldownInfo.isInCooldown,
      lifestyle_clearance: true,
      nutrition_hydration: true,
      voluntary_declaration: true
    });
    setPhoneConfirmed(true);
    if (cooldownInfo.isInCooldown) {
      setShowIncompleteWarning(true);
    } else {
      setShowIncompleteWarning(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isCompatible) {
      setShowIncompleteWarning(true);
      return;
    }
    if (cooldownInfo.isInCooldown) {
      setShowIncompleteWarning(true);
      return;
    }
    if (!isFullyVerified) {
      setShowIncompleteWarning(true);
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirmDonation({
        verifiedAt: new Date().toISOString(),
        verifiedPhone: contactPhone,
        checklist,
        allVerified: true,
        lastDonationDate: cooldownInfo.lastDonationDate
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="px-5 sm:px-7 py-4 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white flex items-center justify-between shrink-0 relative overflow-hidden shadow-md">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none -mr-16 -mt-16" />
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 border border-white/30 shadow-inner">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight leading-tight">
                  Mandatory Pre-Donation Verification
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                  Compulsory
                </span>
              </div>
              <p className="text-xs text-red-100 font-medium">
                National blood safety protocol requires verifying donor eligibility before every donation.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/25 text-white transition-colors relative z-10"
            title="Cancel & Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6 flex-1 text-slate-800 dark:text-slate-100">
          
          {/* Target Emergency Case Summary (if provided) */}
          {emergency && (
            <div className="p-4 rounded-2xl bg-red-50/80 dark:bg-red-950/40 border border-red-200/80 dark:border-red-900/60 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-red-700 dark:text-red-400">
                    Emergency Mission Target
                  </span>
                  <h4 className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                    {emergency.patient_name} needs {emergency.units_needed} Unit(s) of {emergency.component_type || 'Blood'}
                  </h4>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-300 mt-1">
                    <span className="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200">
                      <Building className="w-3.5 h-3.5 text-red-600" />
                      {emergency.hospital_name}
                    </span>
                    <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                      <MapPin className="w-3.5 h-3.5" />
                      {emergency.hospital_locality}
                    </span>
                  </div>
                </div>

                <div className={`shrink-0 flex flex-col items-center justify-center w-16 h-16 rounded-2xl font-black shadow-md border ${
                  isCompatible
                    ? 'bg-red-600 text-white shadow-red-600/30 border-red-500'
                    : 'bg-slate-800 text-white shadow-slate-900/40 border-slate-700'
                }`}>
                  <span className="text-lg leading-none">{emergency.blood_group}</span>
                  <span className={`text-[10px] font-bold uppercase mt-1 ${isCompatible ? 'text-emerald-200' : 'text-amber-300'}`}>
                    {isCompatible ? 'Match ✓' : 'Incompatible'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Active Biological Incompatibility Alert */}
          {!isCompatible && (
            <div className="p-4 rounded-2xl bg-red-600/10 dark:bg-red-950/45 border-2 border-red-500 text-red-950 dark:text-red-200 space-y-2.5 animate-fadeIn">
              <div className="flex items-center gap-2 font-black text-sm text-red-700 dark:text-red-400">
                <AlertTriangle className="w-5 h-5 text-red-600 animate-bounce shrink-0" />
                <span>ABO/Rh Blood Group Incompatibility Detected</span>
                <span className="ml-auto px-2 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-black uppercase">
                  Donation Blocked
                </span>
              </div>
              <div className="text-xs space-y-1.5 leading-relaxed">
                <p>
                  Your registered blood type is <strong className="px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/60 font-mono text-red-800 dark:text-red-200">{donorBloodGroup || 'Unknown'}</strong>, but recipient {emergency?.patient_name} strictly requires <strong className="px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/60 font-mono text-red-800 dark:text-red-200">{targetBloodGroup}</strong>.
                </p>
                <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-red-200 dark:border-red-900/50 text-[11px]">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Medically Approved Donor Types for {targetBloodGroup}: </span>
                  <span className="font-mono font-extrabold text-red-600 dark:text-red-400">{compatibleDonorGroups.join(', ')}</span>
                </div>
                <p className="text-[11px] text-red-700 dark:text-red-400/90 pt-0.5">
                  Transfusing biologically incompatible red blood cells triggers acute hemolytic transfusion reactions (AHTR) which can be fatal. To protect patient and donor safety, PulseConnect strictly prohibits incompatible donation dispatch.
                </p>
              </div>
            </div>
          )}

          {/* Active Biological Cooldown Alert (if donor has an unexpired cooldown from previous donation) */}
          {cooldownInfo.isInCooldown && (
            <div className="p-4 rounded-2xl bg-amber-500/15 dark:bg-amber-950/40 border-2 border-amber-500 text-amber-900 dark:text-amber-200 space-y-2 animate-fadeIn">
              <div className="flex items-center gap-2 font-black text-sm text-amber-700 dark:text-amber-300">
                <AlertTriangle className="w-5 h-5 text-amber-600 animate-bounce shrink-0" />
                <span>Active 90-Day Biological Cooldown Detected</span>
                <span className="ml-auto px-2 py-0.5 rounded-md bg-amber-600 text-white text-[10px] font-black uppercase">
                  Donation Blocked
                </span>
              </div>
              <div className="text-xs space-y-1 leading-relaxed">
                <p>
                  <strong>Previous Donation History:</strong> System records show you last donated blood on{' '}
                  <span className="font-mono font-bold underline text-amber-800 dark:text-amber-300">
                    {cooldownInfo.lastDonationDate || 'record'}
                  </span>
                  . Your body is currently replenishing erythrocytes.
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-bold">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                    Next Eligible Date: {cooldownInfo.cooldownUntil}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300">
                    {cooldownInfo.daysRemaining} Day(s) Remaining
                  </span>
                </div>
                <p className="text-[11px] text-amber-800/90 dark:text-amber-300/80 pt-1">
                  National blood transfusion guidelines strictly prohibit donation before 90 days have elapsed. This prevents chronic iron deficiency and donor anemia.
                </p>
              </div>
            </div>
          )}

          {/* Verification Progress Indicator */}
          <div className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-red-600" />
                Compulsory Checklist Progress
              </span>
              <span className={`font-black text-xs px-2.5 py-0.5 rounded-full ${
                isFullyVerified 
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
              }`}>
                {verifiedCount} / {totalCriteria} Criteria Verified ({progressPercent}%)
              </span>
            </div>

            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isFullyVerified ? 'bg-emerald-500 w-full' : 'bg-gradient-to-r from-amber-500 to-red-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {cooldownInfo.isInCooldown 
                  ? `Cooldown violated: Item #3 cannot be verified (${cooldownInfo.daysRemaining} days left).`
                  : 'All 6 items must be checked before donation dispatch is permitted.'}
              </span>
              <button
                type="button"
                onClick={handleVerifyAll}
                className="text-[11px] font-bold text-red-600 dark:text-red-400 hover:text-red-700 hover:underline flex items-center gap-1 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Verify All (I Meet All Criteria)</span>
              </button>
            </div>
          </div>

          {/* Compulsory Medical & Health Checklist */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                1. Medical & Health Fitness Standards (Mandatory)
              </h4>
              <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase">
                Must Check All
              </span>
            </div>

            {/* Checklist Item 1: Age & Weight */}
            <label
              onClick={() => handleToggleCheck('age_weight')}
              className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                checklist.age_weight
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <input
                type="checkbox"
                checked={checklist.age_weight}
                onChange={() => {}}
                className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600 shrink-0 cursor-pointer"
              />
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                  <Scale className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Age & Weight Requirement</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                  I am between 18 and 65 years of age and weigh at least 50 kg (110 lbs).
                </p>
              </div>
            </label>

            {/* Checklist Item 2: Healthy Today */}
            <label
              onClick={() => handleToggleCheck('healthy_today')}
              className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                checklist.healthy_today
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <input
                type="checkbox"
                checked={checklist.healthy_today}
                onChange={() => {}}
                className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600 shrink-0 cursor-pointer"
              />
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                  <Heart className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Infection & Symptom Free</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                  I feel healthy today with no active fever, flu, cold, sore throat, cough, or antibiotic treatment in the past 7 days.
                </p>
              </div>
            </label>

            {/* Checklist Item 3: 90-Day Cooldown (Enforced by Previous Donation History) */}
            <label
              onClick={() => handleToggleCheck('cooldown_90_days')}
              className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all ${
                cooldownInfo.isInCooldown
                  ? 'bg-red-50/70 dark:bg-red-950/30 border-red-300 dark:border-red-800 cursor-not-allowed opacity-90'
                  : checklist.cooldown_90_days
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 cursor-pointer'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer'
              }`}
            >
              <input
                type="checkbox"
                checked={checklist.cooldown_90_days}
                disabled={cooldownInfo.isInCooldown}
                onChange={() => {}}
                className={`mt-1 w-4 h-4 rounded shrink-0 ${
                  cooldownInfo.isInCooldown
                    ? 'text-slate-400 accent-slate-400 cursor-not-allowed'
                    : 'text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer'
                }`}
              />
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                  {cooldownInfo.isInCooldown ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                  <span className={cooldownInfo.isInCooldown ? 'text-red-700 dark:text-red-400 font-extrabold' : ''}>
                    {cooldownInfo.isInCooldown
                      ? `90-Day Biological Interval Violated (${cooldownInfo.daysRemaining} days left)`
                      : '90-Day Biological Interval Respected'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                  {cooldownInfo.isInCooldown ? (
                    <span className="text-red-600 dark:text-red-400 font-semibold">
                      Your system history shows a donation on {cooldownInfo.lastDonationDate || 'record'}. You cannot donate until {cooldownInfo.cooldownUntil}.
                    </span>
                  ) : cooldownInfo.lastDonationDate ? (
                    `Verified from history: Last donation on ${cooldownInfo.lastDonationDate} (>90 days ago). Full erythrocyte restoration confirmed.`
                  ) : (
                    'At least 90 days have elapsed since my last blood donation, ensuring complete erythrocyte restoration.'
                  )}
                </p>
              </div>
            </label>

            {/* Checklist Item 4: Lifestyle & Surgical Clearance */}
            <label
              onClick={() => handleToggleCheck('lifestyle_clearance')}
              className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                checklist.lifestyle_clearance
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <input
                type="checkbox"
                checked={checklist.lifestyle_clearance}
                onChange={() => {}}
                className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600 shrink-0 cursor-pointer"
              />
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Lifestyle & Surgical Safety Clearance</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                  No tattoos, body piercings, acupuncture, or major dental surgeries in the past 6 months; no alcohol consumed in the past 24 hours.
                </p>
              </div>
            </label>

            {/* Checklist Item 5: Nutrition & Hydration */}
            <label
              onClick={() => handleToggleCheck('nutrition_hydration')}
              className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                checklist.nutrition_hydration
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <input
                type="checkbox"
                checked={checklist.nutrition_hydration}
                onChange={() => {}}
                className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600 shrink-0 cursor-pointer"
              />
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                  <Droplets className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Adequate Hydration & Nutrition</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                  I have eaten a meal within the last 4 hours, am well-hydrated, and have no known anemia or blood-borne illnesses.
                </p>
              </div>
            </label>

            {/* Checklist Item 6: Voluntary Consent & Truthfulness */}
            <label
              onClick={() => handleToggleCheck('voluntary_declaration')}
              className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                checklist.voluntary_declaration
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <input
                type="checkbox"
                checked={checklist.voluntary_declaration}
                onChange={() => {}}
                className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600 shrink-0 cursor-pointer"
              />
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                  <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Voluntary Consent & Truthful Declaration</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                  I declare under medical penalty that my answers are truthful and I voluntarily commit to donate blood for this emergency.
                </p>
              </div>
            </label>
          </div>

          {/* 2. Donor Identity & Contact Confirmation */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-red-600" />
                2. Donor Identification & Contact Handshake
              </h4>
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-black">
                {currentDonor?.blood_group || 'Registered'} Donor
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Donor Name</span>
                <div className="font-bold text-slate-800 dark:text-slate-200">
                  {currentDonor?.full_name || 'Volunteer Hero'}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Emergency Dispatch Phone</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => {
                      setContactPhone(e.target.value);
                      setPhoneConfirmed(Boolean(e.target.value.trim()));
                    }}
                    placeholder="+91 98765 43210"
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  {contactPhone.trim() && (
                    <span className="p-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Compulsory Alert Banner */}
          {!isCompatible ? (
            <div className="p-3.5 rounded-2xl bg-red-600/15 dark:bg-red-950/50 border border-red-500 text-red-900 dark:text-red-200 text-xs font-semibold flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span>
                <strong>Blood Type Incompatible:</strong> Your blood group ({donorBloodGroup}) cannot be transfused into {targetBloodGroup}. Only {compatibleDonorGroups.join(', ')} donors are biologically eligible.
              </span>
            </div>
          ) : cooldownInfo.isInCooldown ? (
            <div className="p-3.5 rounded-2xl bg-amber-500/15 dark:bg-amber-950/50 border border-amber-400 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs font-semibold flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>
                <strong>Donation Ineligible:</strong> Active 90-day cooldown until {cooldownInfo.cooldownUntil} ({cooldownInfo.daysRemaining} days left). Pre-donation clearance cannot be granted.
              </span>
            </div>
          ) : showIncompleteWarning ? (
            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-200 text-xs font-semibold flex items-center gap-2.5 animate-shake">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span>
                <strong>Verification Incomplete!</strong> You must check all 6 medical criteria and confirm your contact phone before you can proceed to donate.
              </span>
            </div>
          ) : isFullyVerified ? (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                <strong>Donor Verification Passed:</strong> Blood type compatibility ({donorBloodGroup} → {targetBloodGroup}) and all medical criteria confirmed. You are certified for emergency donation dispatch!
              </span>
            </div>
          ) : null}

        </div>

        {/* Modal Footer Action Bar */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel & Stand Down
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isFullyVerified || isSubmitting || cooldownInfo.isInCooldown || !isCompatible}
            className={`w-full sm:w-auto px-6 py-3 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all shadow-md ${
              isFullyVerified && !cooldownInfo.isInCooldown && isCompatible
                ? 'bg-red-600 hover:bg-red-700 active:scale-95 text-white shadow-red-600/30 cursor-pointer'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none'
            }`}
          >
            {!isCompatible ? (
              <>
                <Lock className="w-4 h-4 text-red-500" />
                <span>Incompatible Blood ({donorBloodGroup || '—'} → {targetBloodGroup})</span>
              </>
            ) : cooldownInfo.isInCooldown ? (
              <>
                <Lock className="w-4 h-4 text-amber-500" />
                <span>Blocked: In Cooldown ({cooldownInfo.daysRemaining}d Left)</span>
              </>
            ) : isFullyVerified ? (
              <>
                <Unlock className="w-4 h-4 text-white" />
                <span>{isSubmitting ? 'Dispatching...' : 'Verify & Proceed to Donate'}</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-slate-400" />
                <span>Verify All ({verifiedCount}/6) to Unlock Donation</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
