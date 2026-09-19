import React from 'react';
import { Activity, Radio, Heart, User, Search, ShieldCheck, LogIn, Clock } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../context/AuthContext';

export default function Navbar({
  onOpenSOS,
  onOpenProfile,
  isAvailable,
  onToggleAvailability,
  isInCooldown = false,
  cooldownDaysRemaining = 0,
  activeSOSCount = 0,
  currentView = 'acceptor',
  onNavigate
}) {
  const { user, isAuthenticated } = useAuth();
  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            
            {/* Brand Logo & Tagline */}
            <div 
              onClick={() => onNavigate && onNavigate('acceptor')}
              className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none"
            >
              <div className="relative flex items-center justify-center w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 shadow-md sm:shadow-lg shadow-red-500/25 shrink-0">
                <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-white fill-white animate-pulse" />
                <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 flex h-2.5 w-2.5 sm:h-3.5 sm:w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 bg-emerald-500 border-2 border-white"></span>
                </span>
              </div>
              <div>
                <span className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  Pulse<span className="text-red-600 dark:text-red-500">Connect</span>
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                  Ultra-Fast Proximity Blood Donor Network
                </p>
              </div>
            </div>

            {/* Center Navigation Switcher (Acceptor | Donor | Tracker) - Visible on Tablet/Desktop */}
            <nav className="hidden md:flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs sm:text-sm font-bold">
              
              {/* 1. Acceptor Portal */}
              <button
                id="nav-acceptor-btn"
                onClick={() => onNavigate && onNavigate('acceptor')}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl transition-all ${
                  currentView === 'acceptor'
                    ? 'bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 shadow-sm shadow-slate-200 dark:shadow-slate-950'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>Need Blood</span>
              </button>

              {/* 2. Donor Portal */}
              <button
                id="nav-donor-btn"
                onClick={() => onNavigate && onNavigate('donor')}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl transition-all ${
                  currentView === 'donor'
                    ? 'bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 shadow-sm shadow-slate-200 dark:shadow-slate-950'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Donate Blood</span>
                {activeSOSCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[10px] font-black">
                    {activeSOSCount}
                  </span>
                )}
              </button>

              {/* 3. Live Request Tracker */}
              <button
                id="status-tracker-nav-btn"
                onClick={() => onNavigate && onNavigate('tracker')}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl transition-all ${
                  currentView === 'tracker'
                    ? 'bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 shadow-sm shadow-slate-200 dark:shadow-slate-950'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Request</span>
                <span>Tracker</span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </button>

              {/* 4. Admin Portal (Admin Only) */}
              {user?.role === 'admin' && (
                <button
                  id="nav-admin-btn"
                  onClick={() => onNavigate && onNavigate('admin')}
                  className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl transition-all ${
                    currentView === 'admin'
                      ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                      : 'text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </button>
              )}
            </nav>

            {/* Right Navigation & Action Controls */}
            <div className="flex items-center gap-1.5 sm:gap-3">
              
              {/* 1-Click Theme Toggle Button (Icon-Only, No Text) */}
              <ThemeToggle />

              {/* Quick Donor Availability Switch or Cooldown Indicator */}
              {isInCooldown ? (
                <button
                  onClick={onToggleAvailability}
                  className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold border bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 transition-all cursor-not-allowed shadow-sm"
                  title={`Biological Cooldown Active: ${cooldownDaysRemaining} days remaining. You cannot switch On-Duty until recovery completes.`}
                >
                  <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span className="hidden lg:inline">In Cooldown ({cooldownDaysRemaining}d)</span>
                  <span className="lg:hidden">Cooldown ({cooldownDaysRemaining}d)</span>
                </button>
              ) : (
                <button
                  onClick={onToggleAvailability}
                  className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all duration-200 ${
                    isAvailable
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/70 shadow-sm shadow-emerald-500/10'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                  title="Toggle your availability as a donor"
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${isAvailable ? 'bg-emerald-600 shadow-sm shadow-emerald-500' : 'bg-slate-400'}`} />
                  <span className="hidden lg:inline">{isAvailable ? 'Ready to Donate' : 'Off-Duty'}</span>
                </button>
              )}

              {/* High-Contrast SOS Emergency Button (No "Broadcast" Word) */}
              <button
                id="sos-trigger-btn"
                onClick={onOpenSOS}
                className="relative flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-red-600 hover:bg-red-700 active:scale-95 transition-all duration-150 shadow-md sm:shadow-lg shadow-red-600/30 pulse-glow-red"
                title="Emergency SOS Blood Request"
              >
                <Radio className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-white" />
                <span>SOS</span>
                {activeSOSCount > 0 && (
                  <span className="flex items-center justify-center w-3.5 h-3.5 sm:w-4 sm:h-4 text-[9px] sm:text-[10px] bg-white text-red-600 font-extrabold rounded-full shadow">
                    {activeSOSCount}
                  </span>
                )}
              </button>

              {/* Profile or Sign In Button */}
              {isAuthenticated ? (
                <button
                  id="nav-profile-btn"
                  onClick={onOpenProfile}
                  className={`flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-2 rounded-xl border transition-all ${
                    currentView === 'profile'
                      ? 'bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 font-bold shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  title="Donor Profile & Dossier"
                >
                  <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-black shrink-0">
                    {user?.blood_group || user?.full_name?.charAt(0) || <User className="w-3.5 h-3.5" />}
                  </div>
                  <span className="hidden sm:inline text-xs font-bold truncate max-w-[100px]">
                    {user?.full_name?.split(' ')[0] || 'Profile'}
                  </span>
                </button>
              ) : (
                <button
                  id="nav-signin-btn"
                  onClick={() => onNavigate && onNavigate('login')}
                  className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold border border-red-300 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Mobile Fixed Bottom Navigation Bar (< 768px) */}
      <nav 
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-3 py-1.5 shadow-lg shadow-slate-900/10 transition-colors"
      >
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {/* 1. Need Blood (Acceptor) */}
          <button
            onClick={() => onNavigate && onNavigate('acceptor')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
              currentView === 'acceptor'
                ? 'text-red-600 dark:text-red-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div className={`p-1 rounded-lg ${currentView === 'acceptor' ? 'bg-red-50 dark:bg-red-950/60' : ''}`}>
              <Search className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5">Need Blood</span>
          </button>

          {/* 2. Donate (Donor) */}
          <button
            onClick={() => onNavigate && onNavigate('donor')}
            className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
              currentView === 'donor'
                ? 'text-red-600 dark:text-red-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div className={`p-1 rounded-lg ${currentView === 'donor' ? 'bg-red-50 dark:bg-red-950/60' : ''}`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5">Donate</span>
            {activeSOSCount > 0 && (
              <span className="absolute top-0.5 right-1.5 w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-black flex items-center justify-center shadow">
                {activeSOSCount}
              </span>
            )}
          </button>

          {/* 3. Quick SOS Center Button */}
          <button
            onClick={onOpenSOS}
            className="flex flex-col items-center justify-center -mt-4 p-2.5 rounded-2xl bg-red-600 text-white shadow-lg shadow-red-600/40 active:scale-95 transition-transform"
            title="Emergency SOS"
          >
            <Radio className="w-5 h-5 animate-spin" />
            <span className="text-[9px] font-black uppercase tracking-wider mt-0.5">SOS</span>
          </button>

          {/* 4. Request Tracker */}
          <button
            onClick={() => onNavigate && onNavigate('tracker')}
            className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
              currentView === 'tracker'
                ? 'text-red-600 dark:text-red-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div className={`p-1 rounded-lg ${currentView === 'tracker' ? 'bg-red-50 dark:bg-red-950/60' : ''}`}>
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5">Tracker</span>
            <span className="absolute top-1 right-2.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </button>

          {/* 5. Profile */}
          <button
            id="mobile-nav-profile-btn"
            onClick={onOpenProfile}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
              currentView === 'profile' || currentView === 'login' || currentView === 'register'
                ? 'text-red-600 dark:text-red-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div className={`p-1 rounded-lg ${currentView === 'profile' || currentView === 'login' || currentView === 'register' ? 'bg-red-50 dark:bg-red-950/60' : ''}`}>
              {isAuthenticated ? (
                <div className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-black">
                  {user?.blood_group || user?.full_name?.charAt(0) || <User className="w-3.5 h-3.5" />}
                </div>
              ) : (
                <User className="w-5 h-5" />
              )}
            </div>
            <span className="text-[10px] mt-0.5">{isAuthenticated ? 'Profile' : 'Sign In'}</span>
          </button>

          {/* 6. Admin Portal (Mobile - Admin Only) */}
          {user?.role === 'admin' && (
            <button
              id="mobile-nav-admin-btn"
              onClick={() => onNavigate && onNavigate('admin')}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                currentView === 'admin'
                  ? 'text-purple-600 dark:text-purple-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className={`p-1 rounded-lg ${currentView === 'admin' ? 'bg-purple-50 dark:bg-purple-950/60' : ''}`}>
                <ShieldCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-[10px] mt-0.5">Admin</span>
            </button>
          )}
        </div>
      </nav>
    </>
  );
}
