import React from 'react';
import { Users, AlertCircle, HeartHandshake, Zap } from 'lucide-react';

export default function HeroStats({ stats }) {
  const d = stats || { total_donors: 0, active_ready_donors: 0, active_emergencies: 0, total_lives_saved: 0, avg_response_time_minutes: 0 };
  const cards = [
    { title: 'Ready Donors', value: d.active_ready_donors, sub: `${d.total_donors} in registry`, icon: Users, badge: 'text-emerald-700 bg-emerald-50 border-emerald-200', iconColor: 'text-emerald-600' },
    { title: 'Active SOS Alerts', value: d.active_emergencies, sub: 'High Priority Emergencies', icon: AlertCircle, badge: 'text-red-700 bg-red-50 border-red-200', iconColor: 'text-red-600' },
    { title: 'Lives Saved', value: `${d.total_lives_saved}+`, sub: 'Completed Handshakes', icon: HeartHandshake, badge: 'text-rose-700 bg-rose-50 border-rose-200', iconColor: 'text-rose-600' },
    { title: 'Avg Match Speed', value: `${d.avg_response_time_minutes}m`, sub: 'Within Golden Hour', icon: Zap, badge: 'text-amber-700 bg-amber-50 border-amber-200', iconColor: 'text-amber-600' }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 my-6">
      {cards.map((card, idx) => (
        <div key={idx} className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">{card.title}</span>
            <div className={`p-2 rounded-xl border ${card.badge}`}><card.icon className={`w-4 h-4 ${card.iconColor}`} /></div>
          </div>
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{card.value}</span>
          <p className="text-xs text-slate-400 mt-1 font-medium truncate">{card.sub}</p>
        </div>
      ))}
    </div>
  );
}
