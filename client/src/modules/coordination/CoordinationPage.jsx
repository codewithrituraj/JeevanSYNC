import React, { useState, useEffect } from 'react';
import {
  Layers,
  Ambulance,
  Building,
  RefreshCw,
  Search,
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield,
  Activity,
  Plus,
  Loader2
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const CoordinationPage = ({ onOpenAmbulanceModal }) => {
  const { user, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState('beds'); // 'beds' | 'ambulances'
  const [beds, setBeds] = useState([]);
  const [ambulances, setAmbulances] = useState([]);
  const [selectedWard, setSelectedWard] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadBeds();
    if (user) {
      loadAmbulanceRequests();
    }
  }, [selectedWard, user]);

  const loadBeds = async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (selectedWard) params.wardType = selectedWard;
      if (searchCity) params.city = searchCity;
      const res = await api.get('/coordination/beds', { params });
      if (res.success) {
        setBeds(res.data);
      }
    } catch (err) {
      console.error('Error loading bed availability:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAmbulanceRequests = async () => {
    try {
      const res = await api.get('/coordination/ambulance/requests');
      if (res.success) {
        setAmbulances(res.data);
      }
    } catch (err) {
      console.error('Error loading ambulance requests:', err);
    }
  };

  const handleUpdateAmbulanceStatus = async (id, status) => {
    try {
      const res = await api.patch(`/coordination/ambulance/${id}/status`, { status });
      if (res.success) {
        loadAmbulanceRequests();
      }
    } catch (err) {
      alert(err.error?.message || 'Failed to update status');
    }
  };

  const wardTypes = [
    { label: 'All Wards', value: '' },
    { label: 'ICU (Critical Care)', value: 'ICU' },
    { label: 'HDU (High Dependency)', value: 'HDU' },
    { label: 'Emergency Trauma', value: 'EMERGENCY' },
    { label: 'General Ward', value: 'GENERAL' },
    { label: 'NICU (Neonatal)', value: 'NICU' },
    { label: 'Pediatric', value: 'PEDIATRIC' },
  ];

  const canManageAmbulances = hasRole('HOSPITAL_ADMIN', 'RECEPTION_STAFF', 'SUPER_ADMIN');

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
            <Layers className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Hospital Emergency Coordination
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Live ICU & Ward bed availability and active ambulance dispatch tracker
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick 1-Tap Trigger */}
          <button
            onClick={onOpenAmbulanceModal}
            className="bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-red-500/20"
          >
            <Ambulance className="w-4 h-4" />
            <span>Request Ambulance</span>
          </button>

          <button
            onClick={() => {
              loadBeds();
              if (user) loadAmbulanceRequests();
            }}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
            title="Refresh live data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab('beds')}
          className={`pb-2 px-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'beds'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Live Bed Availability</span>
        </button>
        <button
          onClick={() => setActiveTab('ambulances')}
          className={`pb-2 px-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'ambulances'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Ambulance className="w-4 h-4" />
          <span>Active Ambulance Dispatches ({ambulances.length})</span>
        </button>
      </div>

      {activeTab === 'beds' ? (
        <div className="space-y-4">
          {/* Ward Type Filters */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {wardTypes.map((wt) => (
              <button
                key={wt.value}
                onClick={() => setSelectedWard(wt.value)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedWard === wt.value
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {wt.label}
              </button>
            ))}
          </div>

          {/* Bed Cards Grid */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : beds.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6">
              <p className="text-sm font-bold text-slate-700">No bed records found matching filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {beds.map((bed) => {
                const available = bed.availableBeds;
                const isFull = available === 0;

                return (
                  <div
                    key={bed.id}
                    className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:border-blue-300 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            {bed.wardType} WARD
                          </span>
                          <h3 className="text-sm font-bold text-slate-900 mt-1">
                            {bed.hospital?.name}
                          </h3>
                          <p className="text-xs text-slate-500">
                            {bed.hospital?.city} • {bed.hospital?.address}
                          </p>
                        </div>

                        <div className="text-right">
                          <span
                            className={`text-xl font-black block leading-none ${
                              isFull ? 'text-red-600' : 'text-emerald-600'
                            }`}
                          >
                            {available}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">
                            Beds Vacant
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-slate-500 font-semibold">
                          <span>Occupancy ({bed.occupancyRate}%)</span>
                          <span>{bed.occupiedBeds} / {bed.totalBeds} Occupied</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              bed.occupancyRate >= 90
                                ? 'bg-red-500'
                                : bed.occupancyRate >= 70
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, bed.occupancyRate)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-400 text-[10px]">
                        Updated {new Date(bed.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <a
                        href={`tel:${bed.hospital?.emergencyContact || bed.hospital?.contactPhone}`}
                        className="text-blue-600 hover:text-blue-800 font-bold text-xs"
                      >
                        Call Reception 📞
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Ambulance Requests View */
        <div className="space-y-4">
          {ambulances.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6">
              <Ambulance className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No active ambulance dispatches found</p>
              <button
                onClick={onOpenAmbulanceModal}
                className="mt-3 bg-red-600 text-white font-bold text-xs px-4 py-2 rounded-xl"
              >
                Request Ambulance Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ambulances.map((amb) => (
                <div
                  key={amb.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3 border-l-4 border-l-red-500"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          {amb.patientName}
                        </span>
                        <span className="text-[10px] font-bold uppercase bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                          {amb.urgencyLevel}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">📞 {amb.patientPhone}</p>
                    </div>

                    <span className="text-xs font-bold uppercase px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg">
                      {amb.status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-700 space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <p><strong>Pickup Address:</strong> {amb.pickupAddress}</p>
                    <p><strong>GPS Coordinates:</strong> {amb.pickupLatitude}, {amb.pickupLongitude}</p>
                    {amb.notes && <p><strong>Medical Notes:</strong> {amb.notes}</p>}
                    <p><strong>Assigned Hospital:</strong> {amb.hospital?.name || 'Regional Fleet Dispatch'}</p>
                  </div>

                  {canManageAmbulances && (
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400">Update Status:</span>
                      {['DISPATCHED', 'EN_ROUTE', 'COMPLETED'].map((st) => (
                        <button
                          key={st}
                          onClick={() => handleUpdateAmbulanceStatus(amb.id, st)}
                          className="text-[10px] font-bold px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 uppercase"
                        >
                          {st.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
