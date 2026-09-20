import React, { useState } from 'react';
import { MapPin, CheckCircle2, ShieldCheck, Phone, Clock, Send, Check, AlertCircle, Navigation } from 'lucide-react';

export default function DonorCard({ donor, onRequestBlood }) {
  const [requestStatus, setRequestStatus] = useState('idle'); // 'idle' | 'sending' | 'sent'
  const [showFullPhone, setShowFullPhone] = useState(false);

  const handleRequest = async () => {
    if (requestStatus === 'sent' || donor.is_in_cooldown || !donor.is_available) return;
    
    // Instant Optimistic Transition
    setRequestStatus('sending');
    try {
      if (onRequestBlood) {
        await onRequestBlood(donor.id);
      }
      setRequestStatus('sent');
    } catch {
      setRequestStatus('idle');
    }
  };

  const isEligible = donor.is_available && !donor.is_in_cooldown;

  return (
    <div className={`relative flex flex-col justify-between p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border transition-all duration-300 card-shimmer ${
      isEligible 
        ? 'border-slate-200 dark:border-slate-800 hover:border-red-400 dark:hover:border-red-500/50' 
        : 'border-slate-200/70 dark:border-slate-800/70 opacity-85 bg-slate-50/50 dark:bg-slate-900/50'
    }`}>
      
      {/* Top Details & Blood Group Badge */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-4">
          
          {/* Blood Group Badge */}
          <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 text-white shadow-md shadow-red-500/20 group-hover:scale-105 transition-transform">
            <span className="text-xl font-black tracking-tight">{donor.blood_group}</span>
            <div className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
              <span className={`rounded-full h-3.5 w-3.5 ${donor.is_available ? 'bg-emerald-500 beacon-green ring-2 ring-white dark:ring-slate-900' : 'bg-slate-300 dark:bg-slate-600 ring-2 ring-white dark:ring-slate-900'}`} />
            </div>
          </div>

          {/* Verification & Cooldown Tags */}
          <div className="flex flex-col items-end gap-1.5">
            {donor.is_verified && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified Donor
              </span>
            )}
            
            {donor.is_in_cooldown ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                <Clock className="w-3.5 h-3.5" />
                In 90-Day Cooldown
              </span>
            ) : donor.is_available ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 beacon-green" />
                Ready to Donate
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                Off-Duty
              </span>
            )}
          </div>

        </div>

        {/* Donor Name & Location */}
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
              {donor.full_name}
            </h3>
            {donor.distance_km != null && (
              <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-extrabold bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200/80 dark:border-red-900/50 shadow-xs">
                <Navigation className="w-3 h-3 text-red-500 fill-red-500/20" />
                <span>{donor.distance_km < 1 ? `${Math.round(donor.distance_km * 1000)} m` : `${Number(donor.distance_km).toFixed(1)} km`}</span>
              </span>
            )}
          </div>
          
          <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
            <span className="truncate">{donor.locality}</span>
          </p>
        </div>

        {/* Donation Statistics & City / Region */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 dark:text-slate-500 block font-medium">City / District</span>
            <span className="text-slate-900 dark:text-white font-bold text-sm truncate block">
              {donor.city || 'Regional'}
            </span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 dark:text-slate-500 block font-medium">Donations</span>
            <span className="text-slate-900 dark:text-white font-bold text-sm">
              {donor.total_donations || 0} times
            </span>
          </div>
        </div>

        {/* Masked Contact Info */}
        <div className="flex items-center justify-between mt-3 px-3 py-2 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium font-mono">
            <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span>{showFullPhone ? donor.phone_number : donor.masked_phone || donor.phone_number}</span>
          </div>
          <button
            onClick={() => setShowFullPhone(!showFullPhone)}
            className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-semibold underline decoration-dotted"
          >
            {showFullPhone ? 'Hide' : 'Reveal'}
          </button>
        </div>
      </div>

      {/* Action Button: One-Click Request Blood with Optimistic State */}
      <div className="mt-5">
        <button
          onClick={handleRequest}
          disabled={!isEligible || requestStatus === 'sent' || requestStatus === 'sending'}
          className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold transition-all duration-200 ${
            requestStatus === 'sent'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : requestStatus === 'sending'
              ? 'bg-red-400 text-white cursor-wait'
              : !isEligible
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700'
              : 'bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white shadow-md shadow-red-600/20'
          }`}
        >
          {requestStatus === 'sent' ? (
            <>
              <Check className="w-4 h-4" />
              <span>Request Sent ✓</span>
            </>
          ) : requestStatus === 'sending' ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Sending Match...</span>
            </>
          ) : !donor.is_available ? (
            <span>Currently Off-Duty</span>
          ) : donor.is_in_cooldown ? (
            <span>In Cooldown</span>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Request Blood</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
}
