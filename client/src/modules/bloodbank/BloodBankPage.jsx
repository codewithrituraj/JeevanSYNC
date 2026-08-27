import React, { useState, useEffect } from 'react';
import { Droplet, Search, PhoneCall, Building2, MapPin, RefreshCw, AlertCircle, Plus, Edit2, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const BloodBankPage = () => {
  const { user, hasRole } = useAuth();
  const [bloodList, setBloodList] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateFormData, setUpdateFormData] = useState({
    hospitalId: user?.hospitalId || '',
    bloodGroup: 'O_POS',
    unitsAvailable: 10,
  });

  const bloodGroups = [
    { label: 'All Groups', value: '' },
    { label: 'A+', value: 'A_POS' },
    { label: 'A-', value: 'A_NEG' },
    { label: 'B+', value: 'B_POS' },
    { label: 'B-', value: 'B_NEG' },
    { label: 'AB+', value: 'AB_POS' },
    { label: 'AB-', value: 'AB_NEG' },
    { label: 'O+', value: 'O_POS' },
    { label: 'O-', value: 'O_NEG' },
  ];

  const formatGroupLabel = (group) => {
    return group.replace('_POS', '+').replace('_NEG', '-');
  };

  useEffect(() => {
    loadBloodStock();
  }, [selectedGroup]);

  const loadBloodStock = async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (selectedGroup) params.bloodGroup = selectedGroup;
      if (searchCity) params.city = searchCity;
      const res = await api.get('/bloodbank/availability', { params });
      if (res.success) {
        setBloodList(res.data);
      }
    } catch (err) {
      console.error('Error fetching blood inventory:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStock = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/bloodbank/update', {
        hospitalId: updateFormData.hospitalId || user?.hospitalId,
        bloodGroup: updateFormData.bloodGroup,
        unitsAvailable: Number(updateFormData.unitsAvailable),
      });
      if (res.success) {
        setShowUpdateModal(false);
        loadBloodStock();
      }
    } catch (err) {
      alert(err.error?.message || 'Failed to update stock');
    }
  };

  const canManageStock = hasRole('HOSPITAL_ADMIN', 'RECEPTION_STAFF', 'SUPER_ADMIN');

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 shadow-sm">
            <Droplet className="w-7 h-7 fill-red-600 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Live Blood Bank & Donor Units
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Real-time verified blood unit availability across regional hospital banks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canManageStock && (
            <button
              onClick={() => setShowUpdateModal(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Update Stock</span>
            </button>
          )}

          <button
            onClick={loadBloodStock}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
            title="Refresh availability"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Blood Group Filter Badges */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
        {bloodGroups.map((bg) => (
          <button
            key={bg.value}
            onClick={() => setSelectedGroup(bg.value)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedGroup === bg.value
                ? 'bg-red-600 text-white shadow-md shadow-red-500/20'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {bg.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Filter by city name (e.g. New Delhi, Gurugram)..."
          value={searchCity}
          onChange={(e) => setSearchCity(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && loadBloodStock()}
          className="w-full text-sm bg-transparent focus:outline-none"
        />
        <button
          onClick={loadBloodStock}
          className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-4 py-2 rounded-xl"
        >
          Search
        </button>
      </div>

      {/* Blood Units Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
        </div>
      ) : bloodList.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6">
          <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-800">No blood stock entries found</p>
          <p className="text-xs text-slate-500 mt-1">Try selecting a different blood group or clearing city filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {bloodList.map((item) => {
            const isLow = item.unitsAvailable < 5;
            const isMedium = item.unitsAvailable >= 5 && item.unitsAvailable < 15;

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:border-red-300 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-12 h-12 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 text-white font-black text-lg flex items-center justify-center shadow-md shadow-red-500/20">
                        {formatGroupLabel(item.bloodGroup)}
                      </span>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Blood Group
                        </span>
                        <h3 className="text-base font-extrabold text-slate-900">
                          {formatGroupLabel(item.bloodGroup)}
                        </h3>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-lg font-black block ${
                          isLow ? 'text-red-600' : isMedium ? 'text-amber-600' : 'text-emerald-600'
                        }`}
                      >
                        {item.unitsAvailable}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">
                        Units Available
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 text-xs space-y-1">
                    <p className="font-bold text-slate-800 flex items-center gap-1.5 truncate">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>{item.hospital?.name}</span>
                    </p>
                    <p className="text-slate-500 flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>{item.hospital?.address}, {item.hospital?.city}</span>
                    </p>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center gap-2">
                  <a
                    href={`tel:${item.hospital?.emergencyContact || item.hospital?.contactPhone}`}
                    className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call Blood Bank</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Update Stock Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl p-5 space-y-4 shadow-xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-red-600" />
              <span>Update Hospital Blood Unit Stock</span>
            </h2>

            <form onSubmit={handleUpdateStock} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Blood Group</label>
                <select
                  value={updateFormData.bloodGroup}
                  onChange={(e) => setUpdateFormData({ ...updateFormData, bloodGroup: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                >
                  {bloodGroups.filter(b => b.value).map((bg) => (
                    <option key={bg.value} value={bg.value}>{bg.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Units Available</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={updateFormData.unitsAvailable}
                  onChange={(e) => setUpdateFormData({ ...updateFormData, unitsAvailable: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(false)}
                  className="flex-1 bg-slate-100 text-slate-700 text-xs font-bold py-2.5 rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-red-600 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-red-700 shadow-md"
                >
                  Save Stock Units
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
