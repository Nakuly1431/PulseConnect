import React, { useState } from 'react';
import { Search, Info, MapPin, X, Radar, Navigation, LocateFixed, Globe, Building2 } from 'lucide-react';
import { BLOOD_GROUPS, getCompatibleDonorTypes } from '../utils/bloodCompatibility';
import { INDIA_STATES_DATA, POPULAR_REGIONAL_HUBS, getStateData } from '../utils/indiaLocations';


export default function DonorSearch({
  selectedBloodGroup,
  onSelectBloodGroup,
  searchQuery,
  onChangeSearchQuery,
  onlyAvailable,
  onToggleOnlyAvailable,
  radiusKm = 25,
  onChangeRadiusKm,
  searchCenter,
  onChangeSearchCenter,
  totalMatchingDonors = 0
}) {
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('GPS not supported');
      setTimeout(() => setLocationStatus(''), 3000);
      return;
    }
    setIsLocating(true);
    setLocationStatus('Detecting GPS...');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let detectedCity = '';
        let detectedState = '';

        try {
          // OpenStreetMap Nominatim reverse geocoding
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            detectedState = addr.state || '';
            detectedCity = addr.city || addr.town || addr.municipality || addr.district || addr.county || addr.suburb || '';
          }
        } catch (fetchErr) {
          console.warn('Network reverse geocoding notice:', fetchErr);
        }

        // Match detectedState and detectedCity against INDIA_STATES_DATA
        let matched = null;
        let matchedCityName = '';

        if (detectedState) {
          matched = INDIA_STATES_DATA.find(s => 
            s.state.toLowerCase() === detectedState.toLowerCase() ||
            detectedState.toLowerCase().includes(s.state.toLowerCase()) ||
            s.state.toLowerCase().includes(detectedState.toLowerCase())
          );
        }

        if (matched && detectedCity) {
          const directCity = matched.cities.find(c => 
            c.name.toLowerCase() === detectedCity.toLowerCase() ||
            detectedCity.toLowerCase().includes(c.name.toLowerCase()) ||
            c.name.toLowerCase().includes(detectedCity.toLowerCase())
          );
          if (directCity) {
            matchedCityName = directCity.name;
          } else {
            // Pick closest city in matched state
            let bestCity = matched.cities[0]?.name || '';
            let minDist = Infinity;
            matched.cities.forEach(c => {
              const d = Math.hypot(c.lat - latitude, c.lng - longitude);
              if (d < minDist) {
                minDist = d;
                bestCity = c.name;
              }
            });
            matchedCityName = bestCity;
          }
        }

        // Geometric fallback: if no state matched or network unavailable, find closest Indian state & city by distance
        if (!matched || !matchedCityName) {
          let closestStateObj = null;
          let closestCityObj = null;
          let minDistance = Infinity;

          INDIA_STATES_DATA.forEach(s => {
            s.cities.forEach(c => {
              const d = Math.hypot(c.lat - latitude, c.lng - longitude);
              if (d < minDistance) {
                minDistance = d;
                closestStateObj = s;
                closestCityObj = c;
              }
            });
          });

          if (closestStateObj && closestCityObj) {
            matched = closestStateObj;
            matchedCityName = closestCityObj.name;
          }
        }

        setIsLocating(false);
        const stateName = matched ? matched.state : (detectedState || 'India');
        const finalCity = matchedCityName || detectedCity || (matched ? matched.cities[0]?.name : 'Bhubaneswar');

        setLocationStatus(`GPS: ${finalCity}`);

        // 1. Auto-fill the search query so State & City dropdowns and donor list instantly populate
        if (onChangeSearchQuery) {
          onChangeSearchQuery(finalCity);
        }

        // 2. Set searchCenter to the precise GPS coordinates and friendly city/state name
        if (onChangeSearchCenter) {
          onChangeSearchCenter({
            lat: latitude,
            lng: longitude,
            name: `${finalCity}, ${stateName}`
          });
        }

        // 3. Set suitable emergency radius
        if (onChangeRadiusKm && radiusKm < 25) {
          onChangeRadiusKm(25);
        }

        setTimeout(() => setLocationStatus(''), 4000);
      },
      (err) => {
        setIsLocating(false);
        setLocationStatus('GPS unavailable');
        setTimeout(() => setLocationStatus(''), 3000);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const compatibleTypes = getCompatibleDonorTypes(selectedBloodGroup);

  // Derive matched state and city list from current query or state selection
  const matchedState = INDIA_STATES_DATA.find(
    s => s.state.toLowerCase() === (searchQuery || '').trim().toLowerCase() ||
         s.cities.some(c => c.name.toLowerCase() === (searchQuery || '').trim().toLowerCase())
  );
  const selectedStateName = matchedState ? matchedState.state : '';
  const currentCities = matchedState ? matchedState.cities : [];

  const handleStateSelect = (stateName) => {
    if (!stateName) {
      // Clear state: reset query, radius, and center to defaults
      onChangeSearchQuery('');
      if (onChangeRadiusKm) onChangeRadiusKm(25);
      if (onChangeSearchCenter) {
        onChangeSearchCenter({ lat: 20.2961, lng: 85.8245, name: 'Bhubaneswar' });
      }
      return;
    }
    const st = getStateData(stateName);
    if (st) {
      onChangeSearchQuery(st.state);
      if (onChangeRadiusKm && radiusKm < 100) {
        onChangeRadiusKm(100); // Set to 100km (All Region) to cover entire state
      }
      if (onChangeSearchCenter) {
        onChangeSearchCenter({
          lat: st.lat,
          lng: st.lng,
          name: `${st.state} Region`
        });
      }
    }
  };

  const handleCitySelect = (cityName) => {
    if (!cityName) return;
    const cityObj = currentCities.find(c => c.name.toLowerCase() === cityName.toLowerCase());
    onChangeSearchQuery(cityName);
    if (cityObj && onChangeSearchCenter) {
      onChangeSearchCenter({
        lat: cityObj.lat,
        lng: cityObj.lng,
        name: `${cityObj.name}, ${selectedStateName}`
      });
    }
  };

  const handleHubSelect = (hub) => {
    onChangeSearchQuery(hub.city);
    if (onChangeRadiusKm && radiusKm < 50) {
      onChangeRadiusKm(50);
    }
    if (onChangeSearchCenter) {
      onChangeSearchCenter({
        lat: hub.lat,
        lng: hub.lng,
        name: `${hub.city}, ${hub.state}`
      });
    }
  };

  return (
    <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm mb-8 transition-colors">

      {/* Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex flex-wrap items-center gap-2">
            <span>Find Compatible Donors</span>
            {searchQuery?.trim() ? (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                {totalMatchingDonors} Donors in {searchQuery}
              </span>
            ) : (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-600" />
                <span>Enter City to View Donors</span>
              </span>
            )}
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

      {/* 2. Emergency Distance Radius Slider */}
      <div className="pt-5 pb-5 border-t border-slate-100 dark:border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center font-bold shadow-sm">
              <Radar className="w-4 h-4 text-red-600 dark:text-red-400 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <label htmlFor="radius-slider" className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Emergency Search Radius
                </label>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {searchCenter?.name || 'Bhubaneswar Hub'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Adjust radar to discover verified nearby volunteer donors
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* GPS Button */}
            <button
              type="button"
              onClick={handleGetLocation}
              disabled={isLocating}
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                searchCenter?.name === 'My GPS Location'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'
              }`}
              title="Use your device GPS location"
            >
              <LocateFixed className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-red-500' : 'text-red-500'}`} />
              <span>{locationStatus || (searchCenter?.name === 'My GPS Location' ? 'Using GPS' : 'Use My GPS')}</span>
            </button>

            {/* Current Range Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-600/30">
              <Navigation className="w-3 h-3" />
              <span>{radiusKm >= 100 ? 'All Distances (100+ km)' : `Within ${radiusKm} km`}</span>
            </div>
          </div>
        </div>

        {/* Custom Range Slider */}
        <div className="pt-2">
          <div className="relative flex items-center">
            <input
              id="radius-slider"
              type="range"
              min="2"
              max="100"
              step="1"
              value={radiusKm}
              onChange={(e) => onChangeRadiusKm && onChangeRadiusKm(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-600 dark:accent-red-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mt-1.5">
            <span>2 km (Local)</span>
            <span className="hidden sm:inline">15 km (City)</span>
            <span className="hidden sm:inline">35 km (District)</span>
            <span>100 km (All Region)</span>
          </div>
        </div>

        {/* Quick Radius Preset Pills */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Quick Radius:
          </span>
          {[5, 10, 25, 50, 100].map((preset) => {
            const isSelected = radiusKm === preset || (preset === 100 && radiusKm >= 100);
            return (
              <button
                key={preset}
                type="button"
                onClick={() => onChangeRadiusKm && onChangeRadiusKm(preset)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/20 scale-105'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {preset >= 100 ? 'All Region' : `${preset} km`}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Pan-India State, City & Locality Search */}
      <div className={`p-5 rounded-2xl border transition-all ${
        !searchQuery
          ? 'bg-red-50/30 dark:bg-red-950/20 border-red-300 dark:border-red-900/60 ring-2 ring-red-500/10'
          : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
      } space-y-4`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Globe className="w-4 h-4 text-red-600 animate-pulse" />
            <span>Select State / UT or Search City (All 36 States & UTs)</span>
            {!searchQuery && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-600 text-white uppercase tracking-wider">
                Required
              </span>
            )}
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

        {/* State / UT and City Dual Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* State Dropdown */}
          <div className="relative">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500 pointer-events-none" />
            <select
              id="donor-search-state-select"
              value={selectedStateName}
              onChange={(e) => handleStateSelect(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600/30 focus:border-red-600 transition-all cursor-pointer shadow-xs appearance-none"
            >
              <option value="">-- Select Any State / UT (36 States & UTs) --</option>
              {INDIA_STATES_DATA.map((s) => (
                <option key={s.state} value={s.state}>
                  {s.state}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
              ▼
            </div>
          </div>

          {/* City / District Dropdown */}
          <div className="relative">
            <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              id="donor-search-city-select"
              disabled={!selectedStateName}
              value={currentCities.some(c => c.name.toLowerCase() === (searchQuery || '').toLowerCase()) ? searchQuery : ''}
              onChange={(e) => handleCitySelect(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600/30 focus:border-red-600 transition-all cursor-pointer shadow-xs appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">
                {selectedStateName ? `-- Select Specific City in ${selectedStateName} --` : '-- Select State First for Cities --'}
              </option>
              {currentCities.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
              ▼
            </div>
          </div>
        </div>

        {/* Free-text Keyword Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onChangeSearchQuery(e.target.value)}
            placeholder="Or type any State, City, or Locality (e.g. Maharashtra, Mumbai, Bengaluru, Delhi, Odisha)..."
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-600/30 focus:border-red-600 transition-all shadow-xs"
          />
        </div>

        {/* Popular Pan-India Regional Hub Chips */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
              <Radar className="w-3 h-3 text-red-500" />
              <span>Popular Hubs:</span>
            </span>
            {POPULAR_REGIONAL_HUBS.map((hub) => {
              const isActive = (searchQuery || '').toLowerCase() === hub.city.toLowerCase() ||
                               (searchQuery || '').toLowerCase() === hub.state.toLowerCase();
              return (
                <button
                  key={hub.label}
                  type="button"
                  onClick={() => handleHubSelect(hub)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-red-600 text-white shadow-sm border border-red-600 scale-105'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {hub.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
}
