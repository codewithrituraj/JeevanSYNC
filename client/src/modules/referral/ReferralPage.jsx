import React, { useState, useEffect } from 'react';
import { ArrowRight, Building, FileText, CheckCircle, Clock, Plus, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const ReferralPage = () => {
  const { user, hasRole } = useAuth();
  const [referrals, setReferrals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadReferrals();
  }, []);

  const loadReferrals = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/referrals/my');
      if (res.success) setReferrals(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ArrowRight className="w-6 h-6 text-indigo-600" />
            <span>Digital Patient Referrals & Facility Transfers</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Cross-hospital clinical transfer with unified digital records and queue priority preservation
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      ) : referrals.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6">
          <p className="text-sm font-bold text-slate-700">No active digital referrals</p>
          <p className="text-xs text-slate-400 mt-1">When doctors refer patients across hospitals, digital case sheets appear here automatically.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {referrals.map((ref) => (
            <div
              key={ref.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700 font-bold">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Patient: {ref.patient?.name || 'Patient'}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">
                      Ref ID: {ref.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold px-3 py-1 bg-amber-100 text-amber-800 rounded-full w-fit uppercase">
                  {ref.status}
                </span>
              </div>

              {/* Hospital Transfer Route */}
              <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Referring Facility</span>
                  <p className="font-bold text-slate-800">{ref.fromHospital?.name}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <div className="space-y-0.5 text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Destination Facility</span>
                  <p className="font-bold text-slate-800">{ref.toHospital?.name}</p>
                </div>
              </div>

              {/* Clinical Snapshot */}
              <div className="space-y-1.5 text-xs text-slate-700 bg-indigo-50/40 p-3 rounded-xl border border-indigo-100">
                <p><strong>Clinical Reason:</strong> {ref.reason}</p>
                {ref.recordSnapshot?.initialDiagnosis && (
                  <p><strong>Initial Diagnosis:</strong> {ref.recordSnapshot.initialDiagnosis}</p>
                )}
                {ref.recordSnapshot?.referringPhysician && (
                  <p><strong>Referring Doctor:</strong> {ref.recordSnapshot.referringPhysician}</p>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span>Created {new Date(ref.createdAt).toLocaleDateString()}</span>
                <span className="text-indigo-600 font-semibold">Priority Intake Active</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
