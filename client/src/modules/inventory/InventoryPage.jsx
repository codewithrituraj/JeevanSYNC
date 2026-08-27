import React, { useState, useEffect } from 'react';
import { Pill, Search, Building2, AlertTriangle, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import api from '../../services/api';

export const InventoryPage = () => {
  const [medicines, setMedicines] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadMedicines();
  }, []);

  const loadMedicines = async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (searchQuery) params.query = searchQuery;
      const res = await api.get('/inventory/search', { params });
      if (res.success) {
        setMedicines(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center flex-shrink-0 shadow-sm">
            <Pill className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Hospital Pharmacy & Medicine Stock
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Live stock checks with automated generic & brand alternative matching
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search by brand name or generic composition (e.g. Dolo, Pantoprazole, Augmentin)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && loadMedicines()}
          className="w-full text-sm bg-transparent focus:outline-none"
        />
        <button
          onClick={loadMedicines}
          className="bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-slate-800"
        >
          Search
        </button>
      </div>

      {/* Medicine Results */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        </div>
      ) : medicines.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6">
          <p className="text-sm font-bold text-slate-700">No medicines found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {medicines.map((med) => {
            const outOfStock = med.isOutOfStock;

            return (
              <div
                key={med.id}
                className={`bg-white rounded-2xl border p-5 shadow-sm transition-all flex flex-col justify-between ${
                  outOfStock ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200 hover:border-teal-300'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 leading-tight">
                        {med.medicineName}
                      </h3>
                      <p className="text-xs text-teal-700 font-semibold mt-0.5">
                        Generic: {med.genericName}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {med.dosageForm} • Strength: {med.strength}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-black text-slate-900 block">
                        ₹{med.price}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          outOfStock
                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {outOfStock ? 'Out of Stock' : `${med.stockQty} In Stock`}
                      </span>
                    </div>
                  </div>

                  {/* Out of stock alternative suggestions box */}
                  {outOfStock && med.suggestedAlternatives?.length > 0 && (
                    <div className="bg-white border border-amber-200 rounded-xl p-3 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <span>Available Equivalent & Generic Alternatives:</span>
                      </div>

                      <div className="space-y-1.5">
                        {med.suggestedAlternatives.map((alt, aIdx) => (
                          <div
                            key={aIdx}
                            className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-lg border border-slate-100"
                          >
                            <div>
                              <p className="font-bold text-slate-800">{alt.name}</p>
                              <p className="text-[10px] text-slate-500">{alt.manufacturer}</p>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-emerald-700">₹{alt.price}</span>
                              <span className="text-[10px] block text-emerald-600 font-semibold">Available</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{med.hospital?.name}</span>
                  </span>
                  <a
                    href={`tel:${med.hospital?.contactPhone}`}
                    className="font-bold text-teal-700 hover:text-teal-900"
                  >
                    Pharmacy Desk 📞
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
