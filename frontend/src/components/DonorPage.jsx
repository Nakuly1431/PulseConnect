import React, { useState } from 'react';
import {
  Radio,
  Heart,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MapPin,
  Building,
  Phone,
  User,
  Award,
  Calendar,
  Activity,
  ChevronRight,
  Flame,
  Check,
  HelpCircle,
  ArrowRight,
  Lock
} from 'lucide-react';
import { formatTimeAgo, getCooldownInfo, isBloodCompatible } from '../utils/bloodCompatibility';

export default function DonorPage({
  emergencies = [],
  stats,
  isAvailable,
  onToggleAvailability,
  currentDonor,
  onRespondToEmergency,
  onOpenProfile,
  onNavigateTracker,
  onNavigateAcceptor
}) {
  const cooldownInfo = getCooldownInfo(currentDonor);
  // Pre-donation Eligibility Interactive Checklist State
  const [eligibilityChecks, setEligibilityChecks] = useState({
    age: true,
    weight: true,
    healthyToday: true,
    noRecentTattoo: true,
    cooldownRespected: true
  });

  const toggleCheck = (key) => {
    setEligibilityChecks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const allEligible = Object.values(eligibilityChecks).every(Boolean);

  const donorData = currentDonor || {
    full_name: "Volunteer Donor",
    blood_group: "—",
    phone_number: "—",
    locality: "Not signed in",
    is_verified: false,
    total_donations: 0,
    cooldown_until: null,
    last_donation_date: null
  };

  return (
    <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-10 2xl:px-12 py-6 sm:py-8 space-y-8 animate-fadeIn">
      
      {/* Donor Portal Hero Header */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-700 via-rose-700 to-slate-900 text-white p-6 sm:p-10 shadow-xl border border-red-500/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-bold uppercase tracking-wider mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Volunteer Donor Command Center
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Ready to Save Lives? <br />
              <span className="bg-gradient-to-r from-amber-200 via-white to-rose-200 bg-clip-text text-transparent">
                Answer Emergency SOS Calls.
              </span>
            </h1>

            <p className="mt-3 text-xs sm:text-base text-red-100 font-medium leading-relaxed">
              Every unit of blood you give can save up to three lives. Stay on-duty to receive direct emergency 
              dispatch calls from hospital ICUs and trauma units in the critical Golden Hour.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={onOpenProfile}
                className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-white hover:bg-red-50 text-red-700 font-extrabold text-sm shadow-xl shadow-black/20 transition-all active:scale-95 w-full sm:w-auto"
              >
                <User className="w-4 h-4" />
                <span>My Donor Profile & Card</span>
              </button>

              <button
                onClick={onNavigateTracker}
                className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/20 text-white font-bold text-sm backdrop-blur-md transition-all w-full sm:w-auto"
              >
                <Activity className="w-4 h-4 text-emerald-300" />
                <span>My Response Missions</span>
              </button>
            </div>
          </div>

          {/* Quick Donor Readiness & Cooldown Card */}
          <div className="lg:w-88 shrink-0 bg-white/15 backdrop-blur-md rounded-2xl p-5 border border-white/20 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-red-100">
                {cooldownInfo.isInCooldown ? 'Medical Cooldown' : 'Duty Readiness'}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                cooldownInfo.isInCooldown
                  ? 'bg-amber-400 text-slate-950'
                  : isAvailable
                  ? 'bg-emerald-400 text-slate-900'
                  : 'bg-slate-800 text-slate-300'
              }`}>
                {cooldownInfo.isInCooldown
                  ? `● IN COOLDOWN (${cooldownInfo.daysRemaining}d)`
                  : isAvailable
                  ? '● ON-DUTY'
                  : '○ OFF-DUTY'}
              </span>
            </div>

            {cooldownInfo.isInCooldown ? (
              /* When in Cooldown: Pure Read-Only Medical Status (NO switch button) */
              <div className="p-4 rounded-xl bg-slate-950/40 border border-amber-400/20 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-black text-white flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span>90-Day Biological Cooldown</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      Next eligible: <strong className="text-amber-300">{cooldownInfo.cooldownUntil}</strong>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Last donation on {cooldownInfo.lastDonationDate || 'record'}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[10px] font-bold uppercase shrink-0">
                    Rest Period
                  </span>
                </div>

                {/* Replenishment Progress indicator */}
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all"
                    style={{ width: `${cooldownInfo.progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>Day {Math.max(1, 90 - cooldownInfo.daysRemaining)} of 90</span>
                  <span>{cooldownInfo.daysRemaining} days left</span>
                </div>
              </div>
            ) : (
              /* When NOT in Cooldown: Emergency Duty Readiness Switch */
              <div className="p-4 rounded-xl bg-slate-950/40 border border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-sm font-black text-white">
                    {isAvailable ? 'Ready for Dispatches' : 'Standing By (Off-Duty)'}
                  </div>
                  <div className="text-xs text-slate-300 mt-0.5">
                    {isAvailable
                      ? 'Broadcasting location to ICUs'
                      : 'Hidden from emergency searches'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onToggleAvailability}
                  className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isAvailable ? 'bg-emerald-500' : 'bg-slate-600'
                  }`}
                  title={isAvailable ? 'Set Off-Duty' : 'Set Ready to Donate'}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isAvailable ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            )}

            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-red-100">
              <span>Need blood for a patient?</span>
              <button
                onClick={onNavigateAcceptor}
                className="font-bold text-white hover:underline flex items-center gap-1"
              >
                <span>Acceptor Portal</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Key Stats Bar for Donors */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{emergencies.length}</div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active SOS Alerts</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Heart className="w-6 h-6 fill-emerald-600 dark:fill-emerald-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{stats?.total_lives_saved ?? 0}</div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Community Lives Saved</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{stats?.avg_response_mins || '14'} min</div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Avg Response Time</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{donorData.total_donations || 8}</div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Your Verified Donations</div>
          </div>
        </div>
      </section>

      {/* Main Grid: Active SOS Emergency Missions & Cooldown Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Live SOS Emergency Missions Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
                </span>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  Live Emergency SOS Missions
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Critical hospital requests matching your regional network that need immediate donor response.
              </p>
            </div>

            <button
              onClick={onNavigateTracker}
              className="text-xs font-bold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center gap-1 transition-colors"
            >
              <span>View All Missions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {emergencies.length === 0 ? (
            <div className="p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">All Regional Requests Addressed</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                There are currently no active emergency alerts in your region. 
                Thank you for staying on-duty and keeping your availability active!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {emergencies.map(emergency => {
                const isImmediate = emergency.urgency_level === 'Immediate';
                const hasDonorGroup = donorData.blood_group && donorData.blood_group !== '—';
                const isCompatible = isBloodCompatible(donorData.blood_group, emergency.blood_group);
                return (
                  <div
                    key={emergency.id}
                    className={`p-5 sm:p-6 rounded-3xl border transition-all duration-200 ${
                      isImmediate
                        ? 'bg-red-50/40 dark:bg-red-950/30 border-red-200/80 dark:border-red-900/60 shadow-md shadow-red-500/5'
                        : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-sm'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      
                      {/* Emergency Case Info */}
                      <div className="flex items-start gap-3.5">
                        <div className={`w-14 h-14 rounded-2xl text-white flex flex-col items-center justify-center font-black shadow-md shrink-0 ${
                          hasDonorGroup && !isCompatible
                            ? 'bg-slate-700 shadow-slate-800/30'
                            : 'bg-red-600 shadow-red-600/30'
                        }`}>
                          <span className="text-lg leading-none">{emergency.blood_group}</span>
                          <span className="text-[10px] font-bold text-red-100 uppercase mt-0.5">Needed</span>
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Case #{emergency.id}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                              isImmediate
                                ? 'bg-red-600 text-white animate-pulse'
                                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                            }`}>
                              {emergency.urgency_level} Urgency
                            </span>
                            {hasDonorGroup && (
                              isCompatible ? (
                                <span 
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800"
                                  title={`Your blood group (${donorData.blood_group}) is biologically compatible with recipient (${emergency.blood_group})`}
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Compatible Match</span>
                                </span>
                              ) : (
                                <span 
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-900/60"
                                  title={`Your blood group (${donorData.blood_group}) cannot be transfused into recipient (${emergency.blood_group})`}
                                >
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>Incompatible Blood</span>
                                </span>
                              )
                            )}
                            {emergency.posted_by_verified_hospital && (
                              <span 
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm shadow-emerald-500/25 border border-emerald-500/40"
                                title="Verified by PulseConnect Medical Administration — Certified Healthcare Facility"
                              >
                                <ShieldCheck className="w-3 h-3" />
                                <span>Hospital Verified</span>
                              </span>
                            )}
                            <span className="text-xs text-slate-400 dark:text-slate-500">• {formatTimeAgo(emergency.created_at)}</span>
                          </div>

                          <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                            {emergency.patient_name} ({emergency.units_needed} Units of {emergency.component_type || 'Blood'})
                          </h3>

                          <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-600 dark:text-slate-300 mt-1.5 font-medium">
                            <span className="flex items-center gap-1 text-slate-800 dark:text-slate-200 font-bold">
                              <Building className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                              {emergency.hospital_name}
                            </span>
                            <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                              <MapPin className="w-3.5 h-3.5" />
                              {emergency.hospital_locality}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Accept Action Button with Verification Notice */}
                      <div className="sm:shrink-0 flex flex-col sm:items-end gap-1 w-full sm:w-auto">
                        <button
                          onClick={() => onRespondToEmergency(emergency)}
                          className={`w-full sm:w-auto px-5 py-3 rounded-xl font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
                            hasDonorGroup && !isCompatible
                              ? 'bg-slate-800 hover:bg-slate-700 text-red-300 border border-red-500/40'
                              : cooldownInfo.isInCooldown
                              ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40'
                              : 'bg-red-600 hover:bg-red-700 active:scale-95 text-white shadow-red-600/25'
                          }`}
                        >
                          {hasDonorGroup && !isCompatible ? (
                            <>
                              <Lock className="w-4 h-4 text-red-400" />
                              <span>Incompatible Blood Type</span>
                            </>
                          ) : cooldownInfo.isInCooldown ? (
                            <>
                              <Lock className="w-4 h-4 text-amber-400" />
                              <span>In Cooldown ({cooldownInfo.daysRemaining}d Left)</span>
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-4 h-4 text-amber-300" />
                              <span>Verify & Accept Mission</span>
                            </>
                          )}
                        </button>
                        <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center sm:text-right w-full">
                          {hasDonorGroup && !isCompatible
                            ? `Requires ${emergency.blood_group} donor`
                            : cooldownInfo.isInCooldown
                            ? 'Blocked by 90-day cooldown'
                            : 'Compulsory Verification'}
                        </span>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Cooldown, Gamification & Eligibility Quiz */}
        <div className="space-y-6">
          
          {/* 90-Day Biological Cooldown Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <Clock className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span>Biological Cooldown</span>
              </div>
              <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                cooldownInfo.isInCooldown
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                  : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
              }`}>
                {cooldownInfo.isInCooldown ? `Active Cooldown (${cooldownInfo.daysRemaining}d Left)` : '100% Eligible'}
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
                <span>Erythrocyte Regeneration</span>
                <span>{cooldownInfo.isInCooldown ? `Day ${90 - cooldownInfo.daysRemaining} / 90` : 'Fully Replenished'}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden mt-1.5 border border-slate-200 dark:border-slate-700">
                <div
                  className={`h-full rounded-full transition-all ${
                    cooldownInfo.isInCooldown ? 'bg-amber-500' : 'bg-emerald-500 w-full'
                  }`}
                  style={{ width: `${cooldownInfo.progressPercent}%` }}
                />
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              {cooldownInfo.isInCooldown ? (
                <span>
                  Last donated on <strong className="text-slate-800 dark:text-slate-200">{cooldownInfo.lastDonationDate || 'record'}</strong>. Full replenishment on <strong className="text-slate-800 dark:text-slate-200">{cooldownInfo.cooldownUntil}</strong>.
                </span>
              ) : (
                'A 90-day biological replenishment interval between red blood cell donations safeguards your hemoglobin levels and long-term health.'
              )}
            </p>

            <button
              onClick={onOpenProfile}
              className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition-colors"
            >
              View Full Donation History & Card
            </button>
          </div>

          {/* Gamified Honor Tier Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-red-50 via-rose-50 to-amber-50/50 dark:from-red-950/40 dark:via-rose-950/30 dark:to-slate-900 border border-red-200/80 dark:border-red-900/50 shadow-sm transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-md shadow-red-600/30">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-red-600 dark:text-red-400">
                  Donor Honor Rank
                </span>
                <h4 className="text-base font-black text-slate-900 dark:text-white">Life Saver Master</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  {donorData.total_donations || 0} verified life-saving contributions
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-red-200/60 dark:border-red-900/40 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
              <span>Next Milestone: 10 Donations</span>
              <span className="font-bold text-red-700 dark:text-red-400">2 to Gold Hero</span>
            </div>
          </div>

          {/* Interactive Pre-Donation Eligibility Quiz */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Eligibility Self-Check
              </h3>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                allEligible ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                {allEligible ? 'Eligible Today' : 'Requirements Incomplete'}
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Quick pre-check before you head out for a donation:
            </p>

            <div className="space-y-2">
              {[
                { key: 'age', label: 'Age is between 18 and 65 years' },
                { key: 'weight', label: 'Weight is 50 kg or above' },
                { key: 'healthyToday', label: 'Feel healthy today (no fever or antibiotics)' },
                { key: 'noRecentTattoo', label: 'No tattoo or piercing in last 6 months' },
                { key: 'cooldownRespected', label: 'At least 90 days since last donation' }
              ].map(item => (
                <label
                  key={item.key}
                  onClick={() => toggleCheck(item.key)}
                  className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={eligibilityChecks[item.key]}
                    onChange={() => {}}
                    className="w-4 h-4 rounded text-red-600 focus:ring-red-500 accent-red-600"
                  />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{item.label}</span>
                </label>
              ))}
            </div>

            {allEligible ? (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>You are medically ready to donate! Keep hydrated.</span>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Please ensure all criteria are met before donating.</span>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
