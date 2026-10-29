import React, { useState, useMemo } from 'react';
import { MapPin, CheckCircle2, Phone, Clock, Send, Navigation, Lock } from 'lucide-react';

export default function DonorCard({ donor, onRequestBlood }) {
  const [showFullPhone, setShowFullPhone] = useState(false);
  const isEligible = donor.is_available && !donor.is_in_cooldown;

  const { hasAccepted, isPending } = useMemo(() => {
    if (donor.has_accepted || donor.is_accepted || donor.request_status === 'Accepted' || donor.status === 'Accepted') {
      return { hasAccepted: true, isPending: false };
    }
    try {
      const tracker = JSON.parse(localStorage.getItem('pulseconnect_tracker_cache') || '[]');
      if (tracker.some(r => r.source_type?.includes('Direct') && String(r.assigned_donor?.id) === String(donor.id) && r.status === 'Accepted')) {
        return { hasAccepted: true, isPending: false };
      }
      const myReqs = JSON.parse(localStorage.getItem('pulseconnect_my_direct_requests') || '[]');
      return { hasAccepted: false, isPending: myReqs.some(r => String(r.donor_id) === String(donor.id)) };
    } catch {
      return { hasAccepted: false, isPending: false };
    }
  }, [donor]);

  return (
    <div className={`flex flex-col justify-between p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border transition-all ${isEligible ? 'border-slate-200 dark:border-slate-800 hover:border-red-400' : 'border-slate-200/70 dark:border-slate-800/70 opacity-85 bg-slate-50/50'}`}>
      <div>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 text-white shadow-md">
            <span className="text-xl font-black">{donor.blood_group}</span>
            <span className={`absolute -bottom-1 -right-1 rounded-full h-3.5 w-3.5 ring-2 ring-white dark:ring-slate-900 ${donor.is_available ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
          </div>

          <div className="flex flex-col items-end gap-1.5">
            {donor.is_verified && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" />Verified Donor
              </span>
            )}
            {donor.is_in_cooldown ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"><Clock className="w-3.5 h-3.5" />In 90-Day Cooldown</span>
            ) : donor.is_available ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"><span className="w-2 h-2 rounded-full bg-emerald-500" />Ready to Donate</span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">Off-Duty</span>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">{donor.full_name}</h3>
            {donor.distance_km != null && (
              <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-extrabold bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200/80 dark:border-red-900/50">
                <Navigation className="w-3 h-3 text-red-500" />
                <span>{donor.distance_km < 1 ? `${Math.round(donor.distance_km * 1000)} m` : `${Number(donor.distance_km).toFixed(1)} km`}</span>
              </span>
            )}
          </div>
          <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 truncate">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{donor.locality}</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 block font-medium">City</span>
            <span className="text-slate-900 dark:text-white font-bold text-sm truncate block">{donor.city || 'Regional'}</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 block font-medium">Donations</span>
            <span className="text-slate-900 dark:text-white font-bold text-sm">{donor.total_donations || 0} times</span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 px-3 py-2 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span>{hasAccepted && showFullPhone ? donor.phone_number : (donor.masked_phone || '+91 ••••• ••••')}</span>
          </div>
          {isPending && !hasAccepted ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-100/50 dark:bg-blue-900/40 px-2 py-0.5 rounded-md"><Clock className="w-3 h-3" />Awaiting Reply</span>
          ) : hasAccepted ? (
            <button type="button" onClick={() => setShowFullPhone(!showFullPhone)} className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold">{showFullPhone ? 'Hide' : 'Reveal'}</button>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-200/50 dark:bg-slate-700/50 px-2 py-0.5 rounded-md"><Lock className="w-3 h-3" />Protected</span>
          )}
        </div>
      </div>

      <div className="mt-5">
        <button
          onClick={() => isEligible && onRequestBlood && onRequestBlood(donor)}
          disabled={!isEligible}
          className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${!isEligible ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700' : 'bg-red-600 hover:bg-red-700 active:scale-95 text-white shadow-md'}`}
        >
          {!donor.is_available ? <span>Currently Off-Duty</span> : donor.is_in_cooldown ? <span>In Cooldown</span> : (<><Send className="w-4 h-4" /><span>Request Blood</span></>)}
        </button>
      </div>
    </div>
  );
}
