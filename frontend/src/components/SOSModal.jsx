import React, { useState } from 'react';
import { X, Radio, ArrowRight, ArrowLeft, Upload, CheckCircle2, ShieldAlert, MapPin, Building2, UserCheck, AlertOctagon } from 'lucide-react';
import { DONOR_BLOOD_GROUPS } from '../utils/bloodCompatibility';

export default function SOSModal({ isOpen, onClose, onSubmitSOS }) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    patient_name: '',
    blood_group: 'O-',
    units_needed: 2,
    component_type: 'Whole Blood',
    urgency_level: 'Immediate',
    hospital_name: '',
    hospital_locality: '',
    contact_person: '',
    contact_phone: '',
    verification_slip: null,
  });

  const [slipPreview, setSlipPreview] = useState(null);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleChange('verification_slip', file);
      setSlipPreview(URL.createObjectURL(file));
    }
  };

  const handleAutofillLocation = () => {
    handleChange('hospital_name', 'Manipal Hospital (Old Airport Road)');
    handleChange('hospital_locality', 'Kodihalli, Bengaluru');
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null) {
          data.append(key, formData[key]);
        }
      });

      await onSubmitSOS(data);
      setIsSubmitting(false);
      onClose();
    } catch {
      setIsSubmitting(false);
    }


  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="px-5 sm:px-8 py-4 sm:py-5 bg-gradient-to-r from-red-600 to-rose-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-md">
              <Radio className="w-5 h-5 text-white animate-spin" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black tracking-tight">Broadcast SOS Emergency</h3>
              <p className="text-xs text-red-100 font-medium">Alert verified nearby donors instantly</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3-Step Progress Indicator */}
        <div className="px-4 sm:px-8 py-3 sm:py-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 transition-colors shrink-0">
          <div className="flex items-center justify-between max-w-md mx-auto">
            
            {/* Step 1 */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className={`flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full text-xs font-bold ${
                step >= 1 ? 'bg-red-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                1
              </span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 hidden sm:inline">Blood & Units</span>
            </div>

            <div className={`flex-1 h-0.5 mx-2 sm:mx-3 ${step >= 2 ? 'bg-red-600' : 'bg-slate-200 dark:bg-slate-700'}`} />

            {/* Step 2 */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className={`flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full text-xs font-bold ${
                step >= 2 ? 'bg-red-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                2
              </span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 hidden sm:inline">Hospital Location</span>
            </div>

            <div className={`flex-1 h-0.5 mx-2 sm:mx-3 ${step >= 3 ? 'bg-red-600' : 'bg-slate-200 dark:bg-slate-700'}`} />

            {/* Step 3 */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className={`flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full text-xs font-bold ${
                step >= 3 ? 'bg-red-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                3
              </span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 hidden sm:inline">Verification</span>
            </div>

          </div>
        </div>

        {/* Step Content */}
        <form onSubmit={handleFinalSubmit} className="p-4 sm:p-8 overflow-y-auto flex-1">
          
          {/* STEP 1: Blood Group, Units, Urgency */}
          {step === 1 && (
            <div className="space-y-4 sm:space-y-5 animate-fadeIn">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                  Patient Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.patient_name}
                  onChange={(e) => handleChange('patient_name', e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-red-600/20 focus:border-red-600 text-base sm:text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                  Required Blood Group *
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {DONOR_BLOOD_GROUPS.map((bg) => (
                    <button
                      key={bg}
                      type="button"
                      onClick={() => handleChange('blood_group', bg)}
                      className={`py-2 sm:py-2.5 rounded-xl font-extrabold text-sm border transition-all ${
                        formData.blood_group === bg
                          ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-600/20'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {bg}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                    Units Needed (Bags)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.units_needed}
                    onChange={(e) => handleChange('units_needed', Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-600/20 focus:border-red-600 text-base sm:text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                    Component Type
                  </label>
                  <select
                    value={formData.component_type}
                    onChange={(e) => handleChange('component_type', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-600/20 focus:border-red-600 text-base sm:text-sm font-medium"
                  >
                    <option value="Whole Blood">Whole Blood</option>
                    <option value="Platelets">Platelets</option>
                    <option value="Plasma">Plasma</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                  Urgency Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Immediate', 'Within 6 Hours', 'Within 24 Hours'].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => handleChange('urgency_level', level)}
                      className={`py-2 px-1.5 sm:px-2 text-xs font-bold rounded-xl border transition-all ${
                        formData.urgency_level === level
                          ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800 ring-2 ring-red-600/20'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Hospital & Location */}
          {step === 2 && (
            <div className="space-y-4 sm:space-y-5 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-2xl bg-red-50/70 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50">
                <div className="flex items-center gap-2 text-xs font-semibold text-red-800 dark:text-red-300">
                  <MapPin className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                  <span>Hospital Location Details</span>
                </div>
                <button
                  type="button"
                  onClick={handleAutofillLocation}
                  className="px-2.5 py-1 text-xs font-bold bg-white dark:bg-slate-800 text-red-700 dark:text-red-300 rounded-lg border border-red-300 dark:border-red-800 hover:bg-red-50 dark:hover:bg-slate-700 shadow-sm self-start sm:self-auto"
                >
                  Quick Fill Demo Hospital
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                  Hospital Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.hospital_name}
                  onChange={(e) => handleChange('hospital_name', e.target.value)}
                  placeholder="e.g. Manipal Hospital Old Airport Rd"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-red-600/20 focus:border-red-600 text-base sm:text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                  Hospital Locality / Area *
                </label>
                <input
                  type="text"
                  required
                  value={formData.hospital_locality}
                  onChange={(e) => handleChange('hospital_locality', e.target.value)}
                  placeholder="e.g. Kodihalli / Indiranagar"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-red-600/20 focus:border-red-600 text-base sm:text-sm font-medium"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Contact & Medical Slip */}
          {step === 3 && (
            <div className="space-y-4 sm:space-y-5 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                    Contact Person Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.contact_person}
                    onChange={(e) => handleChange('contact_person', e.target.value)}
                    placeholder="e.g. Sunita Mehta (Attendant)"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-red-600/20 focus:border-red-600 text-base sm:text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                    Emergency Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.contact_phone}
                    onChange={(e) => handleChange('contact_phone', e.target.value)}
                    placeholder="e.g. +91 98450 12345"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-red-600/20 focus:border-red-600 text-base sm:text-sm font-medium font-mono"
                  />
                </div>
              </div>

              {/* Prescription / Slip Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                  Doctor Prescription / Hospital Blood Requisition Slip (Optional)
                </label>
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-red-500 rounded-2xl p-5 text-center transition-colors bg-slate-50 dark:bg-slate-800/50 cursor-pointer">
                  <input
                    type="file"
                    id="slip-upload"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="slip-upload" className="cursor-pointer">
                    {slipPreview ? (
                      <div className="flex flex-col items-center">
                        <img
                          src={slipPreview}
                          alt="Slip Preview"
                          className="h-28 object-contain rounded-lg shadow mb-2"
                        />
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          File attached: {formData.verification_slip?.name}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="w-8 h-8 text-slate-400 mb-1" />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                          Click to upload blood requisition slip
                        </span>
                        <span className="text-xs text-slate-400 mt-0.5">PNG, JPG, PDF up to 10MB</span>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Emergency Summary Preview */}
              <div className="p-3.5 rounded-2xl bg-red-50/80 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                <div className="font-extrabold text-red-700 dark:text-red-400 flex items-center gap-1.5">
                  <AlertOctagon className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                  <span>Review Emergency Broadcast:</span>
                </div>
                <p>
                  <strong>Patient:</strong> {formData.patient_name || 'Not specified'} ({formData.units_needed} units of {formData.blood_group} {formData.component_type})
                </p>
                <p>
                  <strong>Hospital:</strong> {formData.hospital_name || 'Not specified'}, {formData.hospital_locality}
                </p>
                <p>
                  <strong>Contact:</strong> {formData.contact_person || 'Not specified'} ({formData.contact_phone})
                </p>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-5 sm:pt-6 border-t border-slate-100 dark:border-slate-800 mt-5 sm:mt-6">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : <div />}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => {
                  if (step === 1 && !formData.patient_name) {
                    alert('Please enter patient name');
                    return;
                  }
                  if (step === 2 && (!formData.hospital_name || !formData.hospital_locality)) {
                    alert('Please enter hospital name and locality');
                    return;
                  }
                  setStep(step + 1);
                }}
                className="flex items-center gap-1.5 px-5 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/20 transition-all"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting || !formData.contact_person || !formData.contact_phone}
                className="flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/30 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Broadcasting SOS...</span>
                  </>
                ) : (
                  <>
                    <Radio className="w-4 h-4 animate-spin" />
                    <span>Dispatch Emergency SOS</span>
                  </>
                )}
              </button>
            )}
          </div>

        </form>

      </div>
    </div>
  );
}
