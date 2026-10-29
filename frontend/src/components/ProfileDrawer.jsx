import React, { useEffect } from 'react';
import { X, Clock, Award, CheckCircle, LogOut, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ProfileDrawer({ isOpen, onClose, isAvailable, onToggleAvailability, onOpenAuth }) {
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    if (isOpen && (!isAuthenticated || !user)) {
      onClose();
      if (onOpenAuth) onOpenAuth('login');
    }
  }, [isOpen, isAuthenticated, user, onClose, onOpenAuth]);

  if (!isOpen || !isAuthenticated || !user) return null;

  const daysRem = user.cooldown_days_remaining || 0;
  const pct = user.is_in_cooldown ? Math.round((Math.max(0, 90 - daysRem) / 90) * 100) : 100;
  const honorTier = (user.total_donations || 0) >= 5 ? 'Life Saver Master' : (user.total_donations || 0) >= 1 ? 'Active Lifesaver' : 'New Volunteer Donor';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/50 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col justify-between overflow-y-auto animate-slideLeft border-l border-slate-200 dark:border-slate-800">
        <div>
          <div className="p-6 bg-gradient-to-r from-red-600 to-rose-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-xl">{user.blood_group}</div>
              <div>
                <h3 className="text-lg font-black tracking-tight">{user.full_name}</h3>
                <p className="text-xs text-red-100 font-medium">{user.locality}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white"><X className="w-5 h-5" /></button>
          </div>

          <div className="p-6 space-y-6">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-slate-800 dark:text-white block">Donor Readiness Status</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{isAvailable ? 'Visible in emergency donor searches' : 'Hidden from emergency broadcasts'}</span>
              </div>
              <button type="button" onClick={onToggleAvailability} className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${isAvailable ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600'}`}>
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${isAvailable ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />90-Day Cooldown Protocol</span>
                <span className={`text-xs font-black px-2 py-0.5 rounded-md ${user.is_in_cooldown ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300' : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'}`}>
                  {user.is_in_cooldown ? `${daysRem}d remaining` : '100% Eligible'}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">Mandatory 90-day biological replenishment interval between red blood cell donations to protect donor health.</p>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mt-2">
                <div className={`h-full rounded-full transition-all ${user.is_in_cooldown ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/40 dark:to-rose-950/30 border border-red-200/70 dark:border-red-900/50">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-red-600 text-white shadow-md"><Award className="w-6 h-6" /></div>
                <div>
                  <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Honor Tier</span>
                  <h4 className="text-base font-extrabold text-slate-900 dark:text-white">{honorTier}</h4>
                  <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">{user.total_donations ?? 0} Verified Donations Completed</span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Donor Eligibility Standards</h4>
              <ul className="space-y-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                {['Age between 18 and 65 years', 'Weight ≥ 50 kg', 'Hemoglobin level ≥ 12.5 g/dL', 'Government ID & Phone Verified'].map((std, i) => (
                  <li key={i} className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" /><span>{std}</span></li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 space-y-2">
          {isAuthenticated ? (
            <button onClick={async () => { await logout(); onClose(); if (onOpenAuth) onOpenAuth('login'); }} className="w-full py-2.5 px-4 rounded-xl text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 hover:bg-red-100 transition-colors flex items-center justify-center gap-2">
              <LogOut className="w-4 h-4" /><span>Log Out</span>
            </button>
          ) : (
            <button onClick={() => { onClose(); if (onOpenAuth) onOpenAuth('login'); }} className="w-full py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition-colors flex items-center justify-center gap-2">
              <LogIn className="w-4 h-4" /><span>Sign In / Register</span>
            </button>
          )}
          <button onClick={onClose} className="w-full py-2.5 px-4 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 transition-colors shadow-sm">Close Drawer</button>
        </div>
      </div>
    </div>
  );
}
