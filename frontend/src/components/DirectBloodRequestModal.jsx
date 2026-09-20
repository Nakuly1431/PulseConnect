import React, { useState } from 'react';
import {
  X,
  HeartHandshake,
  User,
  Phone,
  Building,
  MapPin,
  Clock,
  AlertTriangle,
  Send,
  ShieldCheck,
  Droplet,
  FileText
} from 'lucide-react';
import { BLOOD_GROUPS } from '../utils/bloodCompatibility';

const COMPONENT_OPTIONS = [
  'Whole Blood',
  'Packed Red Blood Cells (PRBC)',
  'Platelets (RDP / SDP)',
  'Fresh Frozen Plasma (FFP)',
  'Cryoprecipitate'
];

export default function DirectBloodRequestModal({
  isOpen,
  onClose,
  donor,
  onSubmit
}) {
  if (!isOpen || !donor) return null;

  const [formData, setFormData] = useState({
    patient_name: '',
    blood_group: donor.blood_group || 'O+',
    units_needed: 1,
    component_type: 'Whole Blood',
    hospital_name: '',
    hospital_locality: donor.locality || '',
    requester_name: '',
    requester_phone: '',
    relationship: 'Family Member',
    urgency_level: 'Immediate',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Form Validations
    if (!formData.patient_name.trim()) {
      setErrorMessage('Please enter the patient’s full name.');
      return;
    }
    if (!formData.hospital_name.trim()) {
      setErrorMessage('Please enter the hospital or medical center name.');
      return;
    }
    if (!formData.requester_name.trim()) {
      setErrorMessage('Please enter your name as the requester/attendant.');
      return;
    }

    const cleanPhone = formData.requester_phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number so the donor can contact you.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        requester_phone: cleanPhone,
        units_needed: Number(formData.units_needed) || 1
      });
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to dispatch blood request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6 animate-scaleUp">
        
        {/* Header */}
        <div className="relative p-6 sm:p-7 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none -mr-16 -mt-16" />
          
          <div className="flex items-start justify-between gap-4 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-black uppercase tracking-wider mb-2">
                <HeartHandshake className="w-3.5 h-3.5" />
                <span>Direct Blood Request</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                Request Blood from Verified Donor
              </h2>
              <p className="text-xs sm:text-sm text-red-100 font-medium mt-1">
                Fill in patient and hospital details. The donor will be notified immediately.
              </p>
            </div>

            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Donor Target Badge */}
          <div className="mt-4 p-3 rounded-2xl bg-black/25 backdrop-blur-md border border-white/20 flex flex-wrap items-center justify-between gap-2 text-xs relative z-10">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-white text-red-700 font-black flex items-center justify-center text-sm shadow-sm">
                {donor.blood_group}
              </span>
              <div>
                <span className="font-extrabold text-white text-sm">{donor.full_name}</span>
                <span className="text-red-200 text-xs block">
                  {donor.locality ? `${donor.locality}, ` : ''}{donor.city || 'Odisha'}
                </span>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/25 border border-emerald-400/40 text-emerald-200 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Verified Volunteer Donor
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-shake">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Patient & Blood Need Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <Droplet className="w-3.5 h-3.5 text-red-500" />
              <span>1. Patient & Transfusion Need</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Patient Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Patient Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="patient_name"
                  value={formData.patient_name}
                  onChange={handleChange}
                  placeholder="e.g. Ramesh Chandra Patnaik"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-600/30 focus:border-red-600 transition-all"
                  required
                />
              </div>

              {/* Blood Group Required */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Blood Group Required <span className="text-red-500">*</span>
                </label>
                <select
                  name="blood_group"
                  value={formData.blood_group}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600/30 focus:border-red-600 transition-all"
                >
                  {BLOOD_GROUPS.filter(g => g !== 'All').map(bg => (
                    <option key={bg} value={bg}>
                      {bg} {bg === donor.blood_group ? '(Exact Match with Donor)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Units Needed */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Units Needed <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="10"
                    name="units_needed"
                    value={formData.units_needed}
                    onChange={handleChange}
                    className="w-24 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-black text-center text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600/30 focus:border-red-600 transition-all"
                    required
                  />
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Unit(s) of Blood</span>
                </div>
              </div>

              {/* Component Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Component Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="component_type"
                  value={formData.component_type}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600/30 focus:border-red-600 transition-all"
                >
                  {COMPONENT_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Hospital Location */}
          <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <Building className="w-3.5 h-3.5 text-red-500" />
              <span>2. Hospital Location</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Hospital Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Hospital Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="hospital_name"
                  value={formData.hospital_name}
                  onChange={handleChange}
                  placeholder="e.g. AIIMS Bhubaneswar, Apollo Hospital"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-600/30 focus:border-red-600 transition-all"
                  required
                />
              </div>

              {/* Hospital Locality / Ward */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Ward / Department / Locality <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="hospital_locality"
                  value={formData.hospital_locality}
                  onChange={handleChange}
                  placeholder="e.g. ICU Bed 4, Sijua, Patrapada"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-600/30 focus:border-red-600 transition-all"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 3: Requester Contact & Urgency */}
          <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <Phone className="w-3.5 h-3.5 text-red-500" />
              <span>3. Requester Callback Information</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Requester Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Your Name (Attendant / Doctor) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="requester_name"
                  value={formData.requester_name}
                  onChange={handleChange}
                  placeholder="e.g. Priyabrata Mohanty"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-600/30 focus:border-red-600 transition-all"
                  required
                />
              </div>

              {/* Callback Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Callback Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="requester_phone"
                  value={formData.requester_phone}
                  onChange={handleChange}
                  placeholder="10-digit mobile number"
                  maxLength="10"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-600/30 focus:border-red-600 transition-all"
                  required
                />
              </div>

              {/* Urgency Level */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Urgency Level
                </label>
                <select
                  name="urgency_level"
                  value={formData.urgency_level}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600/30 focus:border-red-600 transition-all"
                >
                  <option value="Immediate">Immediate (Within 1-2 Hours - Critical)</option>
                  <option value="Critical">Critical (Within 6-12 Hours)</option>
                  <option value="Scheduled">Scheduled Transfusion (Within 24 Hours)</option>
                </select>
              </div>

              {/* Clinical Note */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Medical Reason / Note (Optional)
                </label>
                <input
                  type="text"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="e.g. Scheduled emergency surgery, dengue platelet drop"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-600/30 focus:border-red-600 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Notice */}
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-xs leading-relaxed flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <span>
              <strong>Instant Notification:</strong> Submitting this form sends an in-app emergency alert directly to <strong>{donor.full_name}</strong> with your patient details, hospital location, and callback number for direct coordination.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-sm transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-extrabold text-sm shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Dispatching & Notifying...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Request & Notify Donor</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
