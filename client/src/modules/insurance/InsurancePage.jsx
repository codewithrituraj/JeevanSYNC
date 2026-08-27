import React, { useState, useEffect } from 'react';
import { Shield, Search, CheckCircle, Phone, Building, ExternalLink, Loader2 } from 'lucide-react';
import api from '../../services/api';

export const InsurancePage = () => {
  const [providers, setProviders] = useState([]);
  const [coverageList, setCoverageList] = useState([]);
  const [isCashlessOnly, setIsCashlessOnly] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadProviders();
    loadCoverage();
  }, [isCashlessOnly]);

  const loadProviders = async () => {
    try {
      const res = await api.get('/insurance/providers');
      if (res.success) setProviders(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadCoverage = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/insurance/check', {
        params: { isCashless: isCashlessOnly },
      });
      if (res.success) setCoverageList(res.data);
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
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 shadow-sm">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Insurance Network & Cashless Hospital Lookup
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Verify cashless claim eligibility, TPA desks, and coverage terms before admission
            </p>
          </div>
        </div>
      </div>

      {/* Provider Quick Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {providers.map((p) => (
          <div key={p.id} className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <p className="text-xs font-bold text-slate-900 leading-tight">{p.name}</p>
            <p className="text-[10px] text-slate-400 font-mono">TPA Code: {p.code}</p>
            {p.contactPhone && (
              <a href={`tel:${p.contactPhone}`} className="text-[11px] text-emerald-600 font-semibold block">
                📞 {p.contactPhone}
              </a>
            )}
          </div>
        ))}
      </div>

      {/* Hospital Coverage Network */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Network Hospital Coverage
          </h2>
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={isCashlessOnly}
              onChange={(e) => setIsCashlessOnly(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
            />
            <span>Cashless Empanelled Only</span>
          </label>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          </div>
        ) : coverageList.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            No coverage mappings found
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coverageList.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {c.hospital?.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {c.hospital?.city} • 📞 {c.hospital?.contactPhone}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    {c.isCashless ? 'Cashless Ready' : 'Reimbursement'}
                  </span>
                </div>

                <div className="text-xs text-slate-700 pt-1 border-t border-slate-200/60">
                  <p><strong>Insurer:</strong> {c.insuranceProvider?.name}</p>
                  <p className="text-slate-600 mt-0.5">{c.coverageDetails}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
