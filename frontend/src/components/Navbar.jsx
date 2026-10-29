import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Activity, Radio, Heart, User, Search, ShieldCheck, LogIn, LogOut, Clock, Bell, CheckCheck, ExternalLink } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { formatTimeAgo } from '../utils/bloodCompatibility';

export default function Navbar({
  onOpenSOS, onOpenProfile, isAvailable, onToggleAvailability,
  isInCooldown = false, cooldownDaysRemaining = 0, activeSOSCount = 0,
  currentView = 'acceptor', onNavigate, onLogout
}) {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);

  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.fetchMyNotifications();
      if (res?.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unread_count || 0);
      }
    } catch (err) {
      console.debug('Failed to fetch notifications', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 10000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  useEffect(() => {
    const handleOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setIsNotifOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
      try {
        await api.markNotificationRead(notif.id);
        setNotifications(p => p.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
        setUnreadCount(p => Math.max(0, p - 1));
      } catch (err) {
        console.debug('Failed to mark notification read', err);
      }
    }
    setIsNotifOpen(false);
    onNavigate?.('tracker');
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(p => p.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.debug('Failed to mark all read', err);
    }
  };

  const navItems = [
    { id: 'nav-acceptor-btn', view: 'acceptor', label: 'Need Blood', icon: Search },
    { id: 'nav-donor-btn', view: 'donor', label: 'Donate Blood', icon: ShieldCheck, badge: activeSOSCount },
    { id: 'status-tracker-nav-btn', view: 'tracker', label: 'Request Tracker', icon: Activity, dot: true },
    ...(user?.role === 'admin' && user?.is_verified ? [{ id: 'nav-admin-btn', view: 'admin', label: 'Admin', icon: ShieldCheck, isAdmin: true }] : [])
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 relative">
        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div onClick={() => onNavigate?.('acceptor')} className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none group">
              <div className="relative flex items-center justify-center w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 shadow-md shadow-red-500/25 shrink-0 group-hover:scale-105 transition-transform">
                <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-white fill-white heartbeat-icon" />
                <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5 sm:h-3.5 sm:w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 bg-emerald-500 border-2 border-white" />
                </span>
              </div>
              <div>
                <span className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">Pulse<span className="text-red-600 dark:text-red-500">Connect</span></span>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block">Ultra-Fast Proximity Blood Donor Network</p>
              </div>
            </div>

            <nav className="hidden md:flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs sm:text-sm font-bold">
              {navItems.map((item) => {
                const active = currentView === item.view;
                return (
                  <button
                    key={item.id} id={item.id} onClick={() => onNavigate?.(item.view)}
                    className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl transition-all ${
                      active ? (item.isAdmin ? 'bg-purple-600 text-white shadow-sm' : 'bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 shadow-sm') :
                      (item.isAdmin ? 'text-purple-600 dark:text-purple-400 hover:text-purple-700' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white')
                    }`}
                  >
                    <item.icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                    {item.badge > 0 && <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[10px] font-black">{item.badge}</span>}
                    {item.dot && <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" /></span>}
                  </button>
                );
              })}
            </nav>

            <div className="flex items-center gap-1.5 sm:gap-3">
              <ThemeToggle />

              {isAuthenticated && (
                isInCooldown ? (
                  <button onClick={onToggleAvailability} className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold border bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 cursor-not-allowed">
                    <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Frozen ({cooldownDaysRemaining}d)</span>
                  </button>
                ) : (
                  <button onClick={onToggleAvailability} className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${isAvailable ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'}`}>
                    <span className={`w-2.5 h-2.5 rounded-full ${isAvailable ? 'bg-emerald-600' : 'bg-slate-400'}`} />
                    <span className="hidden lg:inline">{isAvailable ? 'Ready to Donate' : 'Off-Duty'}</span>
                  </button>
                )
              )}

              {isAuthenticated && (
                <div className="relative" ref={notifRef}>
                  <button id="nav-notification-bell-btn" onClick={() => setIsNotifOpen(p => !p)} className="relative p-1.5 sm:p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 shadow-sm" title="SOS Emergency Notifications">
                    <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex items-center justify-center rounded-full h-4 w-4 bg-red-600 text-white text-[9px] font-black">{unreadCount > 9 ? '9+' : unreadCount}</span>
                      </span>
                    )}
                  </button>

                  {isNotifOpen && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-fadeIn">
                      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <Bell className="w-4 h-4 text-red-600" />
                          <span className="text-xs font-bold text-slate-800 dark:text-white">Emergency Alerts</span>
                          {unreadCount > 0 && <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[10px] font-black">{unreadCount} new</span>}
                        </div>
                        {unreadCount > 0 && (
                          <button onClick={handleMarkAllRead} className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline">
                            <CheckCheck className="w-3.5 h-3.5" /><span>Mark read</span>
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                        {!notifications.length ? (
                          <div className="p-6 text-center text-slate-400">
                            <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                            <p className="text-xs font-medium">No alerts yet</p>
                          </div>
                        ) : (
                          notifications.map(notif => (
                            <div key={notif.id} onClick={() => handleNotificationClick(notif)} className={`p-3.5 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer ${!notif.is_read ? 'bg-red-50/40 dark:bg-red-950/20' : ''}`}>
                              <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${!notif.is_read ? 'bg-red-600' : 'bg-slate-300 dark:bg-slate-600'}`} />
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs leading-snug ${!notif.is_read ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>{notif.message}</p>
                                <div className="flex items-center justify-between gap-2 mt-1 text-[10px] text-slate-400">
                                  <span>{formatTimeAgo(notif.created_at)}</span>
                                  <span className="text-purple-600 dark:text-purple-400 font-bold flex items-center gap-0.5"><span>Track</span><ExternalLink className="w-2.5 h-2.5" /></span>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-800 text-center border-t border-slate-200 dark:border-slate-800">
                        <button onClick={() => { setIsNotifOpen(false); onNavigate?.('tracker'); }} className="text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-red-600">View Request Tracker →</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button id="sos-trigger-btn" onClick={onOpenSOS} className="relative flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-red-600 hover:bg-red-700 active:scale-95 transition-all shadow-md shadow-red-600/30">
                <Radio className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-white" />
                <span>SOS</span>
                {activeSOSCount > 0 && <span className="flex items-center justify-center w-3.5 h-3.5 text-[9px] bg-white text-red-600 font-extrabold rounded-full shadow">{activeSOSCount}</span>}
              </button>

              {isAuthenticated ? (
                <div className="flex items-center gap-1">
                  <button id="nav-profile-btn" onClick={onOpenProfile} className={`flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-2 rounded-xl border transition-all ${currentView === 'profile' ? 'bg-red-50 dark:bg-red-950/60 border-red-300 text-red-600 font-bold' : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100'}`}>
                    <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-black shrink-0">{user?.blood_group || user?.full_name?.charAt(0) || <User className="w-3.5 h-3.5" />}</div>
                    <span className="hidden sm:inline text-xs font-bold truncate max-w-[100px]">{user?.full_name?.split(' ')[0] || 'Profile'}</span>
                  </button>
                  <button id="nav-logout-btn" onClick={onLogout} className="p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors" title="Log Out"><LogOut className="w-4 h-4" /></button>
                </div>
              ) : (
                <button id="nav-signin-btn" onClick={() => onNavigate?.('login')} className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold border border-red-300 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors">
                  <LogIn className="w-3.5 h-3.5" /><span>Sign In</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden pointer-events-none opacity-85">
          <svg className="w-full h-5 absolute -bottom-1" preserveAspectRatio="none" viewBox="0 0 1200 20">
            <path d="M0,10 L280,10 L295,2 L305,18 L315,4 L325,14 L335,10 L580,10 L595,2 L605,18 L615,4 L625,14 L635,10 L880,10 L895,2 L905,18 L915,4 L925,14 L935,10 L1200,10" fill="none" stroke="#ef4444" strokeWidth="2" className="ecg-line" />
          </svg>
        </div>
      </header>

      {/* Mobile Bottom Bar */}
      <nav aria-label="Mobile Navigation" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-3 pt-1.5 shadow-lg" style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom, 0.375rem))' }}>
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {[
            { view: 'acceptor', label: 'Need Blood', icon: Search },
            { view: 'donor', label: 'Donate', icon: ShieldCheck, badge: activeSOSCount },
            { isSOS: true },
            { view: 'tracker', label: 'Tracker', icon: Activity, dot: true },
            { view: 'profile', label: isAuthenticated ? 'Profile' : 'Sign In', icon: User, isUser: true },
            ...(user?.role === 'admin' && user?.is_verified ? [{ view: 'admin', label: 'Admin', icon: ShieldCheck, isAdmin: true }] : [])
          ].map((item, idx) => {
            if (item.isSOS) {
              return (
                <button key="sos" onClick={onOpenSOS} className="flex flex-col items-center justify-center -mt-4 p-2.5 rounded-2xl bg-red-600 text-white shadow-lg active:scale-95 transition-transform" title="Emergency SOS">
                  <Radio className="w-5 h-5 animate-spin" /><span className="text-[9px] font-black uppercase mt-0.5">SOS</span>
                </button>
              );
            }
            const active = currentView === item.view || (item.isUser && ['profile', 'login', 'register'].includes(currentView));
            const Icon = item.icon;
            return (
              <button
                key={idx} onClick={() => item.isUser ? onOpenProfile() : onNavigate?.(item.view)}
                className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${active ? (item.isAdmin ? 'text-purple-600 font-bold' : 'text-red-600 font-bold') : 'text-slate-500 dark:text-slate-400'}`}
              >
                <div className={`p-1 rounded-lg ${active ? (item.isAdmin ? 'bg-purple-50 dark:bg-purple-950/60' : 'bg-red-50 dark:bg-red-950/60') : ''}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] mt-0.5">{item.label}</span>
                {item.badge > 0 && <span className="absolute top-0.5 right-1.5 w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-black flex items-center justify-center shadow">{item.badge}</span>}
                {item.dot && <span className="absolute top-1 right-2.5 flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" /></span>}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
