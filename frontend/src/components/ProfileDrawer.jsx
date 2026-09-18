import React from 'react';
import { X, UserCheck, ShieldCheck, Heart, Clock, Award, CheckCircle, AlertTriangle, Calendar, LogOut, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ProfileDrawer({
  isOpen,
  onClose,
  donor,
  isAvailable,
  onToggleAvailability,
  onOpenAuth
}) {
  const { user, isAuthenticated, logout } = useAuth();
  if (!isOpen) return null;

  const currentDonor = user || donor || {
    full_name: "Guest Visitor",
    blood_group: "—",
    phone_number: "—",
    locality: "Not signed in",
    is_verified: false,
    total_donations: 0,
    cooldown_until: null,
    last_donation_date: null
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/50 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col justify-between overflow-y-auto animate-slideLeft border-l border-slate-200 dark:border-slate-800 transition-colors">
        
        {/* Drawer Header */}
        <div>
          <div className="p-6 bg-gradient-to-r from-red-600 to-rose-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-xl">
                {currentDonor.blood_group}
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight">{currentDonor.full_name}</h3>
                <p className="text-xs text-red-100 font-medium">{currentDonor.locality}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            
            {/* Availability Flip Switch */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-center justify-between transition-colors">
              <div>
                <span className="text-sm font-bold text-slate-800 dark:text-white block">Donor Readiness Status</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {isAvailable ? 'Visible in emergency donor searches' : 'Hidden from emergency broadcasts'}
                </span>
              </div>
              <button
                type="button"
                onClick={onToggleAvailability}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isAvailable ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isAvailable ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 90-Day Cooldown Tracker */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  90-Day Cooldown Protocol
                </span>
                <span className={`text-xs font-black px-2 py-0.5 rounded-md ${
                  currentDonor.cooldown_until
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                    : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                }`}>
                  {currentDonor.cooldown_until ? 'Active Cooldown' : '100% Eligible'}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                Mandatory 90-day biological replenishment interval between red blood cell donations to protect donor health.
              </p>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mt-2">
                <div
                  className={`h-full rounded-full ${currentDonor.cooldown_until ? 'bg-amber-500 w-3/4' : 'bg-emerald-500 w-full'}`}
                />
              </div>
            </div>

            {/* Community Impact Tier */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/40 dark:to-rose-950/30 border border-red-200/70 dark:border-red-900/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-red-600 text-white shadow-md shadow-red-600/20">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Honor Tier</span>
                  <h4 className="text-base font-extrabold text-slate-900 dark:text-white">Life Saver Master</h4>
                  <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                    {currentDonor.total_donations || 8} Verified Donations Completed
                  </span>
                </div>
              </div>
            </div>

            {/* Verification & Eligibility Checklist */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Donor Eligibility Standards
              </h4>
              <ul className="space-y-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Age between 18 and 65 years</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Weight ≥ 50 kg</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Hemoglobin level ≥ 12.5 g/dL</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Government ID & Phone Verified</span>
                </li>
              </ul>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 transition-colors space-y-2">
          {isAuthenticated ? (
            <button
              onClick={async () => {
                await logout();
                onClose();
              }}
              className="w-full py-2.5 px-4 rounded-xl text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-950/70 transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          ) : (
            <button
              onClick={() => {
                onClose();
                if (onOpenAuth) onOpenAuth('login');
              }}
              className="w-full py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In / Register</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            Close Drawer
          </button>
        </div>

      </div>
    </div>
  );
}
