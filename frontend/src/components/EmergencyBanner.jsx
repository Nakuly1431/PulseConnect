import React from 'react';
import { AlertTriangle, Clock, MapPin, X, ArrowRight, ShieldAlert } from 'lucide-react';
import { formatDistance } from '../utils/bloodCompatibility';


export default function EmergencyBanner({ emergency, onRespond, onDismiss }) {
  if (!emergency) return null;

  return (
    <div className="relative bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-md border-b border-red-800 animate-fadeIn">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          
          {/* Emergency Details */}
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md shrink-0">
              <ShieldAlert className="w-5 h-5 text-white animate-bounce" />
            </span>
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-medium">
              <span className="px-2 py-0.5 rounded-md bg-white text-red-700 font-extrabold text-xs uppercase tracking-wide">
                URGENT: {emergency.urgency_level}
              </span>
              <span className="font-bold underline decoration-white/50">
                {emergency.patient_name}
              </span>
              <span>needs</span>
              <span className="px-2 py-0.5 rounded bg-black/30 font-extrabold text-white text-xs">
                {emergency.units_needed} Units {emergency.blood_group} ({emergency.component_type})
              </span>
              <span className="flex items-center gap-1 opacity-90 text-xs">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                {emergency.hospital_name}
              </span>
              {emergency.distance_km && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-white/20">
                  {formatDistance(emergency.distance_km)}
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto shrink-0 mt-1 sm:mt-0 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-white/20">
            <button
              onClick={() => onRespond(emergency)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 rounded-lg bg-white text-red-700 font-bold text-xs sm:text-sm hover:bg-red-50 active:scale-95 transition-all shadow-sm"
            >
              <span>Dispatch Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="p-2 sm:p-1 rounded-md text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                title="Dismiss Banner"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
