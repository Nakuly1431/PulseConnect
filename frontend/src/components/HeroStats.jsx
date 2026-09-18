import React from 'react';
import { Users, AlertCircle, HeartHandshake, Zap, Award, Clock } from 'lucide-react';

export default function HeroStats({ stats }) {
  const data = stats || {
    total_donors: 0,
    active_ready_donors: 0,
    active_emergencies: 0,
    total_lives_saved: 0,
    avg_response_time_minutes: 0,
    golden_hour_success_rate: "0%"
  };

  const statCards = [
    {
      title: 'Ready Donors',
      value: data.active_ready_donors,
      subtext: `${data.total_donors} in registry`,
      icon: Users,
      badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      iconColor: 'text-emerald-600',
    },
    {
      title: 'Active SOS Alerts',
      value: data.active_emergencies,
      subtext: 'High Priority Emergencies',
      icon: AlertCircle,
      badgeColor: 'text-red-700 bg-red-50 border-red-200',
      iconColor: 'text-red-600',
    },
    {
      title: 'Lives Saved',
      value: `${data.total_lives_saved}+`,
      subtext: 'Completed Handshakes',
      icon: HeartHandshake,
      badgeColor: 'text-rose-700 bg-rose-50 border-rose-200',
      iconColor: 'text-rose-600',
    },
    {
      title: 'Avg Match Speed',
      value: `${data.avg_response_time_minutes}m`,
      subtext: 'Within Golden Hour',
      icon: Zap,
      badgeColor: 'text-amber-700 bg-amber-50 border-amber-200',
      iconColor: 'text-amber-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 my-6">
      {statCards.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div
            key={idx}
            className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm font-semibold text-slate-500">
                {item.title}
              </span>
              <div className={`p-2 rounded-xl border ${item.badgeColor}`}>
                <Icon className={`w-4 h-4 ${item.iconColor}`} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {item.value}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium truncate">
              {item.subtext}
            </p>
          </div>
        );
      })}
    </div>
  );
}
