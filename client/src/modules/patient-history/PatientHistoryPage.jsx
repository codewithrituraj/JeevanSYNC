import React, { useState, useEffect } from 'react';
import { FileText, Shield, Stethoscope, Pill, Calendar, Building, Lock, Loader2, Eye } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const PatientHistoryPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [filterType, setFilterType] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadHistory();
    }
  }, [isAuthenticated, filterType]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (filterType) params.recordType = filterType;
      const res = await api.get('/patient-history/my-history', { params });
      if (res.success) {
        setRecords(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const recordTypes = [
    { label: 'All Records', value: '' },
    { label: 'Consultations', value: 'CONSULTATION' },
    { label: 'Prescriptions', value: 'PRESCRIPTION' },
    { label: 'Lab Reports', value: 'LAB_REPORT' },
    { label: 'Discharge Summaries', value: 'DISCHARGE_SUMMARY' },
  ];

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto text-center py-16 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <Lock className="w-12 h-12 text-slate-400 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Sign in to Access Medical Records</h2>
        <p className="text-xs text-slate-500">
          Patient medical history is protected with AES-256 field encryption and HIPAA-compliant access audit logging.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Encrypted Patient Medical Records
            </h1>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] uppercase font-bold px-2 py-0.5 rounded flex items-center gap-1">
              <Shield className="w-3 h-3" />
              <span>AES-256</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Audit-logged clinical timeline of doctor consultations, prescriptions, and lab tests
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {recordTypes.map((rt) => (
          <button
            key={rt.value}
            onClick={() => setFilterType(rt.value)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filterType === rt.value
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {rt.label}
          </button>
        ))}
      </div>

      {/* Records Timeline */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-slate-600 animate-spin" />
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700">No medical records found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((rec) => {
            const clinical = rec.clinicalData || {};
            const metadata = rec.metadata || {};

            return (
              <div
                key={rec.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 hover:border-emerald-300 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">
                          {rec.recordType.replace('_', ' ')}
                        </h3>
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          {metadata.department || 'Clinical'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {metadata.doctorName || rec.doctor?.name || 'Treating Physician'} • {metadata.hospitalName || rec.hospital?.name}
                      </p>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 font-medium">
                    📅 {metadata.visitDate || new Date(rec.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Clinical details snippet */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs space-y-2">
                  {clinical.symptoms && (
                    <p><strong>Chief Symptoms:</strong> {clinical.symptoms}</p>
                  )}
                  {clinical.diagnosis && (
                    <p className="text-emerald-900"><strong>Diagnosis:</strong> {clinical.diagnosis}</p>
                  )}
                  {clinical.clinicalNotes && (
                    <p className="text-slate-600"><strong>Notes:</strong> {clinical.clinicalNotes}</p>
                  )}

                  {clinical.prescriptions?.length > 0 && (
                    <div className="pt-2 border-t border-slate-200 space-y-1">
                      <p className="font-bold text-slate-800 flex items-center gap-1">
                        <Pill className="w-3.5 h-3.5 text-teal-600" />
                        <span>Prescribed Medications:</span>
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {clinical.prescriptions.map((p, idx) => (
                          <div key={idx} className="bg-white p-2 rounded-lg border border-slate-200">
                            <p className="font-bold text-slate-900">{p.medicine}</p>
                            <p className="text-[11px] text-slate-500">{p.dosage} {p.duration ? `• ${p.duration}` : ''}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {clinical.precautions && (
                    <p className="text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-100">
                      <strong>Precautions:</strong> {clinical.precautions}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                  <span>Record ID: {rec.id.slice(0, 8).toUpperCase()}</span>
                  <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                    <Shield className="w-3 h-3" />
                    <span>HIPAA Access Audit Logged</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
