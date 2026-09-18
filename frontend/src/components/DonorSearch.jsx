import React from 'react';
import { Search, Sliders, Filter, Navigation, Info } from 'lucide-react';
import { BLOOD_GROUPS, getCompatibleDonorTypes } from '../utils/bloodCompatibility';

export default function DonorSearch({
  selectedBloodGroup,
  onSelectBloodGroup,
  radiusKm,
  onChangeRadius,
  searchQuery,
  onChangeSearchQuery,
  onlyAvailable,
  onToggleOnlyAvailable,
  totalMatchingDonors = 0
}) {
  const compatibleTypes = getCompatibleDonorTypes(selectedBloodGroup);

  return (
    <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm mb-8 transition-colors">

      {/* Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Find Compatible Donors</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-bold border border-red-200 dark:border-red-900/50">
              {totalMatchingDonors} Ready
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Haversine proximity algorithm matching verified donors within your emergency radius
          </p>
        </div>

        {/* Only Available Switch */}
        <div className="flex items-center gap-2.5 self-start md:self-auto bg-slate-50 dark:bg-slate-800 px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 transition-colors">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Available Donors Only</span>
          <button
            type="button"
            onClick={() => onToggleOnlyAvailable(!onlyAvailable)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${onlyAvailable ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600'
              }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${onlyAvailable ? 'translate-x-5' : 'translate-x-0'
                }`}
            />
          </button>
        </div>
      </div>

      {/* 1. Quick-Tap Blood Group Selector Pills */}
      <div className="mb-6">
        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
          Select Recipient / Patient Blood Group
        </label>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {BLOOD_GROUPS.map((group) => {
            const isSelected = selectedBloodGroup === group;
            return (
              <button
                key={group}
                onClick={() => onSelectBloodGroup(group)}
                className={`px-4 sm:px-5 py-2.5 rounded-xl font-bold text-sm sm:text-base whitespace-nowrap transition-all duration-150 ${isSelected
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/30 scale-105 ring-2 ring-red-600 ring-offset-2 ring-offset-white dark:ring-offset-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
                  }`}
              >
                {group}
              </button>
            );
          })}
        </div>

        {/* Compatibility Matrix Helper Note */}
        {selectedBloodGroup !== 'All' && (
          <div className="flex items-center gap-2 mt-2.5 text-xs text-slate-600 dark:text-slate-300 bg-red-50/70 dark:bg-red-950/40 px-3.5 py-2 rounded-xl border border-red-100 dark:border-red-900/50 font-medium">
            <Info className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            <span>
              <strong>Medical Match:</strong> A patient with <strong>{selectedBloodGroup}</strong> can receive red blood cells from:{' '}
              <span className="font-bold text-red-700 dark:text-red-400">
                {compatibleTypes.join(', ')}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* 2. Interactive Radius Slider & Locality Search */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">

        {/* Locality & Hospital Text Filter */}
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            City, State, Locality or Hospital
          </label>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onChangeSearchQuery(e.target.value)}
              placeholder="e.g. Mumbai, Delhi, Bengaluru, Apollo, AIIMS..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all"
            />
          </div>
        </div>

        {/* Interactive Search Radius Slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Search Radius
            </label>
            <span className="text-sm font-extrabold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 px-2 py-0.5 rounded-lg border border-red-200 dark:border-red-900/50">
              Within {radiusKm} km
            </span>
          </div>

          <input
            type="range"
            min="2"
            max="100"
            step="1"
            value={radiusKm}
            onChange={(e) => onChangeRadius(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-600"
          />

          <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 font-medium mt-1.5">
            <button
              onClick={() => onChangeRadius(5)}
              className="hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              5 km (Immediate)
            </button>
            <button
              onClick={() => onChangeRadius(15)}
              className="hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              15 km (City Zone)
            </button>
            <button
              onClick={() => onChangeRadius(50)}
              className="hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              50 km (Metro District)
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
