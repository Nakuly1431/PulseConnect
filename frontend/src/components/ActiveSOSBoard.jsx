import React from 'react';
import { Clock, MapPin, Building, ShieldCheck, Send } from 'lucide-react';
import { formatTimeAgo } from '../utils/bloodCompatibility';

export default function ActiveSOSBoard({ emergencies = [], onRespondToEmergency, onViewTracker }) {
  if (!emergencies?.length) {
    return (
      <div className="p-8 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto mb-3">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800 dark:text-white">No Critical Active Emergencies</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
          All urgent requests within the current vicinity have been dispatched or fulfilled.
        </p>
        {onViewTracker && (
          <button onClick={onViewTracker} className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all">
            <span>Check Dispatched Missions in Request Tracker</span>
            <Send className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="mb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Urgent SOS Emergency Board</span>
            <span className="relative flex h-3 w-3 items-center justify-center">
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600 shadow-md shadow-red-500" />
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">Broadcasts requiring immediate donor response under the Golden Hour protocol</p>
        </div>

        {onViewTracker && (
          <button onClick={onViewTracker} className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-sm transition-all">
            <span>View All Request Statuses</span>
            <span className="text-red-600 font-black">➔</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {emergencies.map((item) => {
          const isImmediate = item.urgency_level === 'Immediate';
          return (
            <div key={item.id} className={`flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-slate-800 border transition-all hover:-translate-y-1 hover:shadow-xl ${isImmediate ? 'border-red-400/80 shadow-md shadow-red-500/10' : 'border-slate-200 dark:border-slate-700'}`}>
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${isImmediate ? 'bg-red-600 text-white' : 'bg-amber-100 text-amber-800'}`}>{item.urgency_level}</span>
                    {item.posted_by_verified_hospital && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm border border-emerald-500/40">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Hospital Verified</span>
                      </span>
                    )}
                  </div>
                  <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-medium"><Clock className="w-3.5 h-3.5" />{formatTimeAgo(item.created_at)}</span>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{item.patient_name}</h3>
                    <div className="px-3 py-1 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300 font-black text-base">{item.blood_group}</div>
                  </div>
                  <div className="inline-block mt-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs">{item.units_needed} Units Needed • {item.component_type}</div>
                </div>

                <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 text-xs text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200"><Building className="w-3.5 h-3.5 text-slate-400 shrink-0" /><span className="truncate">{item.hospital_name}</span></div>
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400"><MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /><span className="truncate">{item.hospital_locality}</span></div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button onClick={() => onRespondToEmergency(item)} className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-red-600 hover:bg-red-700 active:scale-95 transition-all shadow-md shadow-red-600/20">
                  <Send className="w-3.5 h-3.5" />
                  <span>Dispatch & Accept</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
