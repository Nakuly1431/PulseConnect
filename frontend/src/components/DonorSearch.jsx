import React from 'react';
import { Search, Info, MapPin, X } from 'lucide-react';
import { BLOOD_GROUPS, getCompatibleDonorTypes } from '../utils/bloodCompatibility';

const POPULAR_SEARCH_CITIES = [
  'Bengaluru',
  'Delhi',
  'Mumbai',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Pune',
  'Ahmedabad'
];

export default function DonorSearch({
  selectedBloodGroup,
  onSelectBloodGroup,
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
            Pan-India city, state, and regional donor matching for life-saving emergencies
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

      {/* 2. City, State & Locality Search */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-red-500" />
            <span>Search by City, State, Locality or Hospital</span>
          </label>
          {searchQuery && (
            <button
              onClick={() => onChangeSearchQuery('')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400 hover:underline self-start sm:self-auto"
            >
              <X className="w-3 h-3" />
              <span>Clear Filter</span>
            </button>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onChangeSearchQuery(e.target.value)}
            placeholder="Type city (e.g. Mumbai, Delhi, Bengaluru), state, or hospital name..."
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all"
          />
        </div>

        {/* Popular City Filter Chips */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Quick Cities:
          </span>
          {POPULAR_SEARCH_CITIES.map((city) => {
            const isActive = searchQuery.toLowerCase() === city.toLowerCase();
            return (
              <button
                key={city}
                type="button"
                onClick={() => onChangeSearchQuery(isActive ? '' : city)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-red-600 text-white shadow-sm border border-red-600'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {city}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
