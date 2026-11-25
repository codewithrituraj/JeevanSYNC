import React, { useEffect, useRef, useState } from 'react';
import { Ambulance, MapPin, Phone, User, X, AlertTriangle, CheckCircle, Navigation, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const EmergencyModal = ({ isOpen, onClose, initialReason = '' }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    patientName: user?.name || '',
    patientPhone: user?.phone || '',
    pickupAddress: '',
    pickupLatitude: 28.5355,
    pickupLongitude: 77.2090,
    urgencyLevel: 'CRITICAL',
    notes: initialReason || '',
  });
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dispatchResult, setDispatchResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [emergencyType, setEmergencyType] = useState('Other');
  const [patientCount, setPatientCount] = useState(1);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    closeButtonRef.current?.focus();
    const handleKeyDown = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorMessage('Geolocation is not supported by your browser. Please enter address manually.');
      return;
    }

    setIsLocating(true);
    setErrorMessage(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          pickupLatitude: pos.coords.latitude,
          pickupLongitude: pos.coords.longitude,
          pickupAddress: prev.pickupAddress || `GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
        }));
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        setErrorMessage('Could not fetch GPS location. Please enter pickup landmark/address.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    if (!/^\d{10}$/.test(formData.patientPhone.replace(/\D/g, ''))) {
      setErrorMessage('Enter a valid 10-digit Indian mobile number.');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await api.post('/coordination/ambulance/request', {
        ...formData,
        notes: [formData.notes, `Emergency type: ${emergencyType}`, `Patients: ${patientCount}`].filter(Boolean).join(' | '),
        patientId: user?.id || undefined,
        pickupLatitude: Number(formData.pickupLatitude),
        pickupLongitude: Number(formData.pickupLongitude),
      });

      if (res.success) {
        setDispatchResult(res.data);
      }
    } catch (err) {
      setErrorMessage(err.error?.message || err.message || 'Failed to dispatch ambulance. Please call 112 directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border-2 border-red-500 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-5 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <Ambulance className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight leading-tight">
                Emergency Ambulance Dispatch
              </h2>
              <p className="text-xs text-red-100 font-medium">
                Direct integration with nearest emergency network
              </p>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close ambulance dispatch"
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto smooth-scroll space-y-4">
          {dispatchResult ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Ambulance assigned
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  Assigned Facility: <span className="font-bold text-slate-800">{dispatchResult.hospital?.name || 'Nearest Regional Emergency Unit'}</span>
                </p>
                <p className="text-sm font-bold text-emerald-700 mt-2">Estimated arrival: 12–18 minutes</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Dispatch ID:</span>
                  <span className="font-mono font-bold text-slate-800">{dispatchResult.id.slice(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Urgency Level:</span>
                  <span className="font-bold text-red-600">{dispatchResult.urgencyLevel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-bold text-emerald-600 uppercase">{dispatchResult.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Emergency Helpline:</span>
                  <a href={`tel:${dispatchResult.hospital?.emergencyContact || '112'}`} className="font-bold text-blue-600 underline">
                    {dispatchResult.hospital?.emergencyContact || '112'}
                  </a>
                </div>
              </div>

              <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                🚨 Keep your phone line clear. The paramedic unit is contacting you.
              </p>

              <div className="grid grid-cols-2 gap-2">
                <a href={`tel:${dispatchResult.hospital?.emergencyContact || '112'}`} className="text-center bg-red-600 text-white font-semibold py-2.5 rounded-xl hover:bg-red-700">Call driver</a>
                <button onClick={onClose} className="bg-slate-900 text-white font-semibold py-2.5 rounded-xl hover:bg-slate-800">Close</button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-red-800">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-600 mt-0.5" />
                <span>
                  For life-threatening emergencies (heart attack, severe accident, stroke), submitting this form notifies the nearest emergency fleet immediately.
                </span>
              </div>

              {errorMessage && (
                <div className="bg-rose-100 border border-rose-300 text-rose-800 text-xs p-3 rounded-xl font-medium">
                  {errorMessage}
                </div>
              )}

              <div>
                <p className="block text-xs font-bold text-slate-700 mb-2">Emergency type</p>
                <div className="flex flex-wrap gap-2">
                  {['Heart attack', 'Accident', 'Stroke', 'Breathing', 'Other'].map((type) => (
                    <button type="button" key={type} onClick={() => setEmergencyType(type)} className={`rounded-full px-3 py-2 text-xs font-bold border ${emergencyType === type ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-700 border-slate-300'}`}>{type}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="patient-count">Number of patients</label>
                <input id="patient-count" type="number" min="1" max="20" value={patientCount} onChange={(e) => setPatientCount(e.target.value)} className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl" />
              </div>

              {/* Patient Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Patient Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Enter patient name"
                    value={formData.patientName}
                    onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Contact Phone Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile number"
                    value={formData.patientPhone}
                    onChange={(e) => setFormData({ ...formData, patientPhone: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Location & GPS Autofill */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Pickup Landmark & Address *
                  </label>
                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    disabled={isLocating}
                    className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    {isLocating ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Navigation className="w-3 h-3" />
                    )}
                    <span>{isLocating ? 'Locating...' : 'Autofill GPS'}</span>
                  </button>
                </div>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Flat 302, Green Heights, Saket, Delhi"
                    value={formData.pickupAddress}
                    onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Emergency Symptoms/Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Emergency Situation / Symptoms (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Chest pain, difficulty breathing, trauma"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              {/* Submit Dispatch */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 text-sm transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Dispatching Nearest Ambulance...</span>
                    </>
                  ) : (
                    <>
                      <Ambulance className="w-5 h-5" />
                      <span>CONFIRM EMERGENCY DISPATCH NOW</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
