import React, { useState } from 'react';
import { 
  Radio, 
  Search, 
  Heart, 
  Activity, 
  ShieldCheck, 
  Info, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight,
  Sparkles,
  Building,
  Clock,
  ChevronRight,
  FileText,
  HeartHandshake,
  MapPin
} from 'lucide-react';
import DonorSearch from './DonorSearch';
import DonorCard from './DonorCard';
import { BLOOD_COMPATIBILITY_MAP, DONOR_BLOOD_GROUPS } from '../utils/bloodCompatibility';

export default function AcceptorPage({
  donors = [],
  isLoading = false,
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
  onRequestBlood,
  onOpenSOS,
  onNavigateTracker,
  onNavigateDonor,
  activeSOSCount = 0
}) {
  // Blood Compatibility interactive selector for acceptor
  const [recipientBloodGroup, setRecipientBloodGroup] = useState('O+');

  const compatibleTypes = BLOOD_COMPATIBILITY_MAP[recipientBloodGroup] || [recipientBloodGroup];
  const hasEnteredCity = Boolean(searchQuery && searchQuery.trim());

  return (
    <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-10 2xl:px-12 py-6 sm:py-8 space-y-8 animate-fadeIn relative">
      {/* Acceptor Portal Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-red-950 text-white p-6 sm:p-10 shadow-xl border border-red-900/30">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        {/* Animated ECG Cardiac Monitor Waveform Overlay */}
        <div className="absolute -bottom-2 left-0 right-0 h-24 overflow-hidden pointer-events-none opacity-30">
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1200 100">
            <path
              d="M0,50 L200,50 L220,10 L235,90 L250,20 L265,70 L280,50 L500,50 L520,10 L535,90 L550,20 L565,70 L580,50 L800,50 L820,10 L835,90 L850,20 L865,70 L880,50 L1200,50"
              fill="none"
              stroke="#f43f5e"
              strokeWidth="3"
              className="ecg-line"
            />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-400/30 text-red-300 text-xs font-bold uppercase tracking-wider mb-4">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
              Acceptor & Hospital Portal
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Need Blood Urgently? <br />
              <span className="bg-gradient-to-r from-red-400 via-rose-300 to-amber-200 bg-clip-text text-transparent">
                Find Compatible Donors in Minutes.
              </span>
            </h1>

            <p className="mt-3 text-xs sm:text-base text-slate-300 font-medium leading-relaxed">
              Instantly connect with verified volunteer donors across your city, district, and region, 
              or trigger an emergency SOS broadcast to notify volunteer medical donors immediately.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                id="acceptor-hero-sos-btn"
                onClick={onOpenSOS}
                className="relative flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-red-600 hover:bg-red-500 active:scale-95 text-white font-extrabold text-sm shadow-xl shadow-red-600/40 transition-all pulse-glow-red w-full sm:w-auto overflow-visible group"
              >
                <span className="radar-ring" />
                <span className="radar-ring radar-ring-delayed" />
                <Radio className="w-4 h-4 animate-spin relative z-10" />
                <span className="relative z-10">Emergency Blood Request</span>
              </button>

              <button
                onClick={onNavigateTracker}
                className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm backdrop-blur-md transition-all w-full sm:w-auto"
              >
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Track My Requests</span>
                {activeSOSCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-red-500 text-xs font-black">
                    {activeSOSCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Quick Guidance Box */}
          <div className="lg:w-80 shrink-0 bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-200">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Patient Safety Assurance</span>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-200">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>100% Volunteer donors with contact verification.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Automated 90-day biological cooldown enforcement.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Encrypted direct calling and location privacy.</span>
              </li>
            </ul>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
              <span>Want to donate instead?</span>
              <button
                onClick={onNavigateDonor}
                className="font-bold text-red-300 hover:text-white flex items-center gap-1 transition-colors"
              >
                <span>Donor Portal</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Blood Compatibility Helper for Acceptors */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
              <Sparkles className="w-4 h-4" />
              <span>Medical Compatibility Matrix</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white mt-1">
              Who can donate blood to you?
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
              Select the patient's blood group below to see medically safe donor blood types.
            </p>
          </div>

          {/* Recipient Blood Group Quick Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            {DONOR_BLOOD_GROUPS.map(bg => (
              <button
                key={bg}
                onClick={() => {
                  setRecipientBloodGroup(bg);
                  if (onSelectBloodGroup) onSelectBloodGroup(bg);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                  recipientBloodGroup === bg
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {bg}
              </button>
            ))}
          </div>
        </div>

        {/* Compatibility Result Bar */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 flex items-center justify-center font-black text-lg shadow-sm border border-red-200 dark:border-red-900/50">
              {recipientBloodGroup}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
                Compatible Donors for {recipientBloodGroup} Patient:
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {compatibleTypes.map(type => (
                  <span
                    key={type}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                  >
                    ✓ {type}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 md:border-l md:border-slate-200 dark:md:border-slate-700 md:pl-4">
            <Info className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
            <span>
              {recipientBloodGroup === 'AB+' 
                ? 'Universal Recipient: Can receive blood from all donor groups.'
                : recipientBloodGroup === 'O-'
                ? 'Rare Universal Donor: Can only safely receive blood from O- donors.'
                : `Patients with ${recipientBloodGroup} can safely accept red blood cells from ${compatibleTypes.join(', ')}.`}
            </span>
          </div>
        </div>
      </section>

      {/* Live Donor Search & Filter Component */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Find Nearby Donors</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Filter by blood group, city, district, locality, and real-time availability.
            </p>
          </div>
        </div>

        <DonorSearch
          selectedBloodGroup={selectedBloodGroup}
          onSelectBloodGroup={onSelectBloodGroup}
          searchQuery={searchQuery}
          onChangeSearchQuery={onChangeSearchQuery}
          onlyAvailable={onlyAvailable}
          onToggleOnlyAvailable={onToggleOnlyAvailable}
          radiusKm={radiusKm}
          onChangeRadiusKm={onChangeRadiusKm}
          searchCenter={searchCenter}
          onChangeSearchCenter={onChangeSearchCenter}
          totalMatchingDonors={donors.length}
        />
      </section>

      {/* Donors Results Grid */}
      <section aria-label="Available Blood Donors">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="h-64 rounded-2xl bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
            ))}
          </div>
        ) : !hasEnteredCity ? (
          <div className="p-8 sm:p-14 rounded-3xl bg-white dark:bg-slate-900 border-2 border-dashed border-red-200 dark:border-red-950/70 text-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-4 shadow-sm ring-4 ring-red-500/10">
              <MapPin className="w-8 h-8 animate-bounce" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Enter Your City to View Nearby Donors
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto mt-2 leading-relaxed font-medium">
              To protect donor privacy and guarantee accurate emergency proximity matching, volunteer donor profiles are only displayed after you enter your city, locality, or district.
            </p>

            {/* Quick City Buttons */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 max-w-xl mx-auto">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider w-full mb-1">
                Tap a City or Locality to View Donors:
              </span>
              {['Bhubaneswar', 'Khordha', 'Patia', 'Nayapalli', 'Saheed Nagar', 'Chandrasekharpur', 'Khandagiri', 'Jatni'].map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => onChangeSearchQuery && onChangeSearchQuery(city)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-300 border border-slate-200 dark:border-slate-700 transition-all active:scale-95 shadow-xs"
                >
                  📍 {city}
                </button>
              ))}
            </div>
          </div>
        ) : donors.length === 0 ? (
          <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Matching Donors in "{searchQuery}"</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
              Try increasing the emergency search radius or selecting "All" blood groups to broaden your search.
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  onSelectBloodGroup('All');
                  onToggleOnlyAvailable(false);
                  if (onChangeRadiusKm) onChangeRadiusKm(100);
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm transition-colors"
              >
                Expand Search Radius (100+ km)
              </button>
              <button
                onClick={onOpenSOS}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md shadow-red-600/20 transition-colors"
              >
                Broadcast Urgent SOS
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-6">
            {donors.map(donor => (
              <DonorCard
                key={donor.id}
                donor={donor}
                onRequestBlood={onRequestBlood}
              />
            ))}
          </div>
        )}
      </section>

      {/* Recipient Protocol & Preparation Guidelines - Spacious & Screen-Adjusting */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 lg:p-10 border border-slate-200/90 dark:border-slate-800 shadow-sm transition-colors space-y-8">
        
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs font-bold uppercase tracking-wider mb-2.5">
              <Building className="w-3.5 h-3.5" />
              <span>Hospital Transfusion Protocol</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Clinical Guidelines for Recipients & Families
            </h3>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium mt-2 leading-relaxed">
              Essential medical safety checkpoints, paperwork preparation, and lab cross-matching protocols 
              when receiving blood from volunteer donors.
            </p>
          </div>

          <div className="flex items-center gap-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0 bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>NABH & Medical Board Standard</span>
          </div>
        </div>

        {/* Spacious, Screen-Adjusting 4-Card Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 lg:gap-6">
          
          {/* Card 01 */}
          <div className="p-6 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 hover:border-red-300 dark:hover:border-red-800 hover:shadow-lg transition-all flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-2xl bg-red-100 dark:bg-red-950/70 text-red-600 dark:text-red-400 flex items-center justify-center font-black text-base shadow-sm">
                  01
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                  Paperwork
                </span>
              </div>
              <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Doctor's Requisition
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium mt-2">
                Keep the physician requisition slip, patient IP/MRN identification, and hospital blood bank contact number immediately available before contacting donors.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-200/80 dark:border-slate-700/80 text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>Mandatory for Blood Banks</span>
            </div>
          </div>

          {/* Card 02 */}
          <div className="p-6 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-300 dark:hover:border-emerald-800 hover:shadow-lg transition-all flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-base shadow-sm">
                  02
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-emerald-100/80 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300">
                  Laboratory
                </span>
              </div>
              <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Cross-Matching Test
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium mt-2">
                The hospital blood bank must test the donor pilot tube with the patient serum for major & minor compatibility before transfusion begins.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-200/80 dark:border-slate-700/80 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Requires 30–45 minutes</span>
            </div>
          </div>

          {/* Card 03 */}
          <div className="p-6 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 hover:border-amber-300 dark:hover:border-amber-800 hover:shadow-lg transition-all flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-base shadow-sm">
                  03
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-amber-100/80 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300">
                  Urgency
                </span>
              </div>
              <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Golden Hour Priority
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium mt-2">
                For trauma, ICU, or active surgical hemorrhage, immediately trigger an emergency SOS broadcast to alert all verified donors in your vicinity.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-200/80 dark:border-slate-700/80 text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>First 60 minutes are vital</span>
            </div>
          </div>

          {/* Card 04 */}
          <div className="p-6 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 hover:border-red-300 dark:hover:border-red-800 hover:shadow-lg transition-all flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center font-black text-base shadow-sm">
                  04
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-rose-100/80 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300">
                  Ethical
                </span>
              </div>
              <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                100% Free & Voluntary
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium mt-2">
                Voluntary blood donation is purely humanitarian. Never pay money to middlemen or touts; donor matching on PulseConnect is completely free.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-200/80 dark:border-slate-700/80 text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Zero Middlemen or Fees</span>
            </div>
          </div>

        </div>

      </section>

    </div>
  );
}
