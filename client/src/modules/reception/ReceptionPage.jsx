import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Search,
  User,
  Stethoscope,
  Building,
  CheckCircle,
  Phone,
  Navigation,
  Loader2,
  CalendarCheck
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const ReceptionPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'my-appointments'
  const [hospitals, setHospitals] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [myAppointments, setMyAppointments] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingNotes, setBookingNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    loadHospitals();
    loadDoctors();
    if (isAuthenticated) {
      loadMyAppointments();
    }
  }, [isAuthenticated]);

  const loadHospitals = async () => {
    try {
      const res = await api.get('/reception/hospitals');
      if (res.success) setHospitals(res.data);
    } catch (err) {
      console.error('Error loading hospitals:', err);
    }
  };

  const loadDoctors = async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (selectedSpecialty) params.specialty = selectedSpecialty;
      if (searchCity) params.city = searchCity;
      const res = await api.get('/reception/doctors', { params });
      if (res.success) setDoctors(res.data);
    } catch (err) {
      console.error('Error loading doctors:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMyAppointments = async () => {
    try {
      const res = await api.get('/reception/appointments/my');
      if (res.success) setMyAppointments(res.data);
    } catch (err) {
      console.error('Error loading appointments:', err);
    }
  };

  const handleSelectDoctor = async (doctor) => {
    setSelectedDoctor(doctor);
    setSelectedSlot(null);
    setBookingSuccess(null);
    setErrorMessage(null);
    await loadSlots(doctor.id, selectedDate);
  };

  const loadSlots = async (doctorId, date) => {
    setIsLoading(true);
    try {
      const res = await api.get(`/reception/doctors/${doctorId}/slots`, {
        params: { date },
      });
      if (res.success) {
        setAvailableSlots(res.data);
      }
    } catch (err) {
      console.error('Error fetching slots:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !selectedSlot) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const slotTimeIso = `${selectedDate}T${selectedSlot}:00`;
      const res = await api.post('/reception/appointments/book', {
        doctorId: selectedDoctor.id,
        hospitalId: selectedDoctor.hospitalId,
        slotTime: slotTimeIso,
        notes: bookingNotes,
        source: 'WEB',
      });

      if (res.success) {
        setBookingSuccess(res.data);
        if (isAuthenticated) {
          loadMyAppointments();
        }
      }
    } catch (err) {
      setErrorMessage(err.error?.message || err.message || 'Booking failed');
    } finally {
      setIsLoading(false);
    }
  };

  const specialties = ['Cardiology', 'Neurology', 'General Medicine', 'Orthopedics', 'Pediatrics'];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-emerald-600" />
            <span>Doctor Consultation & Slot Booking</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Book certified hospital specialists across multi-facility networks
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'browse'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Find Doctors
          </button>
          <button
            onClick={() => setActiveTab('my-appointments')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'my-appointments'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            My Bookings ({myAppointments.length})
          </button>
        </div>
      </div>

      {activeTab === 'browse' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Search & Filter Doctors */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Specialty
                  </label>
                  <select
                    value={selectedSpecialty}
                    onChange={(e) => {
                      setSelectedSpecialty(e.target.value);
                      setTimeout(loadDoctors, 50);
                    }}
                    className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="">All Specialties</option>
                    {specialties.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    City / Location
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="e.g. New Delhi, Gurugram"
                      value={searchCity}
                      onChange={(e) => setSearchCity(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && loadDoctors()}
                      className="w-full text-sm pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Doctor Cards List */}
            {isLoading && !selectedDoctor ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
              </div>
            ) : doctors.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 p-6">
                <Stethoscope className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No doctors found matching filters</p>
                <p className="text-xs text-slate-400 mt-1">Try clearing specialty or city filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {doctors.map((doc) => {
                  const isSelected = selectedDoctor?.id === doc.id;
                  return (
                    <div
                      key={doc.id}
                      onClick={() => handleSelectDoctor(doc)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white shadow-sm flex flex-col justify-between ${
                        isSelected
                          ? 'border-emerald-600 ring-2 ring-emerald-600/20 bg-emerald-50/20'
                          : 'border-slate-200 hover:border-emerald-300 hover:shadow-md'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-sm flex items-center justify-center">
                              {doc.user.name[0]}
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                                {doc.user.name}
                              </h3>
                              <p className="text-xs text-emerald-700 font-semibold">
                                {doc.specialty}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg">
                            ₹{doc.consultationFee}
                          </span>
                        </div>

                        <div className="text-xs text-slate-600 space-y-1 pt-1">
                          <p className="text-slate-500 font-medium">
                            🎓 {doc.qualification} • {doc.experienceYears} yrs exp
                          </p>
                          <p className="flex items-center gap-1 text-slate-700 truncate">
                            <Building className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span>{doc.hospital.name}, {doc.hospital.city}</span>
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Slots available</span>
                        </span>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                          isSelected ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {isSelected ? 'Selected' : 'Select'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Booking Sidebar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-fit space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <CalendarCheck className="w-5 h-5 text-emerald-600" />
              <span>Confirm Appointment Slot</span>
            </h2>

            {bookingSuccess ? (
              <div className="text-center py-4 space-y-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Appointment Confirmed!
                </h3>
                <p className="text-xs text-slate-600">
                  Booking ID: <span className="font-mono font-bold text-slate-800">{bookingSuccess.id.slice(0, 8).toUpperCase()}</span>
                </p>
                <div className="p-3 bg-slate-50 rounded-xl text-left text-xs space-y-1 border border-slate-200">
                  <p><strong>Doctor:</strong> {bookingSuccess.doctor?.user?.name || selectedDoctor?.user?.name}</p>
                  <p><strong>Hospital:</strong> {bookingSuccess.hospital?.name || selectedDoctor?.hospital?.name}</p>
                  <p><strong>Date & Time:</strong> {new Date(bookingSuccess.slotTime).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => {
                    setBookingSuccess(null);
                    setSelectedDoctor(null);
                    setSelectedSlot(null);
                  }}
                  className="w-full bg-emerald-600 text-white text-xs font-bold py-2 rounded-xl"
                >
                  Book Another Appointment
                </button>
              </div>
            ) : selectedDoctor ? (
              <div className="space-y-4">
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 text-xs">
                  <p className="font-bold text-emerald-950">{selectedDoctor.user.name}</p>
                  <p className="text-emerald-800">{selectedDoctor.specialty} • {selectedDoctor.hospital.name}</p>
                  <p className="text-emerald-700 font-semibold mt-1">Fee: ₹{selectedDoctor.consultationFee}</p>
                </div>

                {errorMessage && (
                  <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                    {errorMessage}
                  </div>
                )}

                {/* Select Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Appointment Date
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      loadSlots(selectedDoctor.id, e.target.value);
                    }}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Select Time Slot */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Available Time Slots ({selectedDate})
                  </label>
                  {isLoading ? (
                    <div className="text-center py-3 text-xs text-slate-400">Loading slots...</div>
                  ) : availableSlots.length === 0 ? (
                    <div className="text-center py-3 text-xs text-slate-400 bg-slate-50 rounded-xl">
                      No slots available for this day
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot.time}
                          disabled={!slot.available}
                          onClick={() => setSelectedSlot(slot.time)}
                          className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all ${
                            selectedSlot === slot.time
                              ? 'bg-emerald-600 text-white shadow-md'
                              : slot.available
                              ? 'bg-slate-100 hover:bg-emerald-100 text-slate-800'
                              : 'bg-slate-50 text-slate-300 cursor-not-allowed line-through'
                          }`}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Clinical Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Reason for Consultation (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Routine checkup, BP follow-up"
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <button
                  disabled={!selectedSlot || isLoading}
                  onClick={handleBookAppointment}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 text-white text-xs font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CalendarCheck className="w-4 h-4" />
                      <span>CONFIRM & BOOK SLOT (₹{selectedDoctor.consultationFee})</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">
                👈 Select a doctor from the list to choose your consultation slot
              </div>
            )}
          </div>
        </div>
      ) : (
        /* My Bookings View */
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900">My Consultation Bookings</h2>
          {myAppointments.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              You have no scheduled appointments yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {myAppointments.map((appt) => (
                <div key={appt.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        {appt.doctor?.user?.name || 'Doctor'}
                      </span>
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase">
                        {appt.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      🏥 {appt.hospital?.name} • 📍 {appt.hospital?.address}
                    </p>
                    {appt.notes && (
                      <p className="text-xs text-slate-600 italic">Notes: {appt.notes}</p>
                    )}
                  </div>
                  <div className="text-right sm:flex-shrink-0">
                    <p className="text-xs font-bold text-slate-900">
                      🕒 {new Date(appt.slotTime).toLocaleDateString()} at {new Date(appt.slotTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Ref: {appt.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
