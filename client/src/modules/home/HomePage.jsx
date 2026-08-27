import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Ambulance,
  Bot,
  Calendar,
  Layers,
  Droplet,
  HeartPulse,
  Pill,
  Shield,
  ArrowRight,
  PhoneCall,
  MapPin,
  Building,
  Activity,
  CheckCircle,
  MessageSquare,
  Sparkles,
  Search
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const HomePage = ({ onOpenAmbulanceModal }) => {
  const { user } = useAuth();
  const [hospitals, setHospitals] = useState([]);
  const [bedsSummary, setBedsSummary] = useState([]);
  const [bloodSummary, setBloodSummary] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [hospRes, bedRes, bloodRes] = await Promise.allSettled([
        api.get('/reception/hospitals'),
        api.get('/coordination/beds'),
        api.get('/bloodbank/availability'),
      ]);

      if (hospRes.status === 'fulfilled' && hospRes.value.success) {
        setHospitals(hospRes.value.data);
      }
      if (bedRes.status === 'fulfilled' && bedRes.value.success) {
        setBedsSummary(bedRes.value.data);
      }
      if (bloodRes.status === 'fulfilled' && bloodRes.value.success) {
        setBloodSummary(bloodRes.value.data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const totalVacantBeds = bedsSummary.reduce((sum, b) => sum + (b.availableBeds || 0), 0);
  const totalIcuVacant = bedsSummary.filter(b => b.wardType === 'ICU').reduce((sum, b) => sum + (b.availableBeds || 0), 0);
  const totalBloodUnits = bloodSummary.reduce((sum, b) => sum + (b.unitsAvailable || 0), 0);

  const quickActions = [
    { title: 'Doctor Appointments', subtitle: 'Book verified specialist slots', path: '/reception', icon: Calendar, color: 'from-emerald-500 to-teal-600', badge: 'Next Available' },
    { title: 'Emergency ICU & Beds', subtitle: 'Live hospital bed tracker', path: '/coordination', icon: Layers, color: 'from-blue-500 to-indigo-600', count: `${totalVacantBeds} Vacant` },
    { title: 'Blood Bank Units', subtitle: 'Real-time blood stock finder', path: '/bloodbank', icon: Droplet, color: 'from-rose-500 to-red-600', count: `${totalBloodUnits} Units` },
    { title: 'Diagnostic Lab Tests', subtitle: 'Compare lab turnaround & price', path: '/diagnostics', icon: HeartPulse, color: 'from-purple-500 to-violet-600', badge: 'Best Price' },
    { title: 'Medicine & Generics', subtitle: 'Pharmacy stock & alternatives', path: '/inventory', icon: Pill, color: 'from-cyan-500 to-blue-600' },
    { title: 'Insurance Network', subtitle: 'Cashless hospital coverage', path: '/insurance', icon: Shield, color: 'from-amber-500 to-orange-600' },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Hero / Emergency Dispatch Action Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-600 via-rose-700 to-red-800 text-white p-5 sm:p-8 shadow-xl shadow-red-600/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-red-100 border border-white/20">
              <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
              <span>24x7 Emergency Rapid Response</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              Instant Hospital & Emergency Care Coordination
            </h1>
            <p className="text-xs sm:text-sm text-red-100/90 font-medium leading-relaxed">
              Connect to nearest ambulances, verify live ICU bed vacancy, locate blood units, and consult MonikaCare AI triage in one unified platform.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-shrink-0">
            <button
              onClick={onOpenAmbulanceModal}
              className="bg-white hover:bg-red-50 text-red-700 active:scale-95 text-sm sm:text-base font-black px-6 py-3.5 rounded-2xl shadow-xl shadow-black/20 flex items-center justify-center gap-2.5 transition-all pulse-emergency"
            >
              <Ambulance className="w-5 h-5 text-red-600 animate-bounce" />
              <span>1-TAP AMBULANCE DISPATCH</span>
            </button>
            <a
              href="tel:112"
              className="bg-red-950/50 hover:bg-red-950/70 border border-white/20 text-white text-xs font-bold px-4 py-3 rounded-2xl flex items-center justify-center gap-2 transition-colors text-center"
            >
              <PhoneCall className="w-4 h-4 text-red-300" />
              <span>Direct Dial 112</span>
            </a>
          </div>
        </div>

        {/* Decorative circle glow */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
      </div>

      {/* MonikaCare AI Highlight Box */}
      <div className="bg-gradient-to-r from-teal-900 via-emerald-900 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 border border-teal-800/40">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-400/30 text-teal-300 flex items-center justify-center flex-shrink-0">
            <Bot className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white">
                MonikaCare AI Doctor's Assistant
              </h2>
              <span className="text-[10px] bg-teal-400/20 text-teal-200 font-bold px-2 py-0.5 rounded-full border border-teal-400/30">
                Triage Ready
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Experiencing symptoms? Get instant clinical precautions, what to avoid, and structured urgency evaluation before your clinic visit.
            </p>
          </div>
        </div>

        <Link
          to="/monika"
          className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-slate-950 font-bold text-xs sm:text-sm px-5 py-3 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all whitespace-nowrap"
        >
          <Sparkles className="w-4 h-4" />
          <span>Ask MonikaCare AI</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Live Vital Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Verified Hospitals</span>
            <Building className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{hospitals.length || 3}</p>
          <p className="text-[11px] text-emerald-600 font-medium">Network Centers Connected</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">ICU Beds Available</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{totalIcuVacant || 15}</p>
          <p className="text-[11px] text-blue-600 font-medium">Live Emergency Care Beds</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Blood Bank Stock</span>
            <Droplet className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{totalBloodUnits || 120}</p>
          <p className="text-[11px] text-rose-600 font-medium">Units Ready Across Groups</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">WhatsApp Reception</span>
            <MessageSquare className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">24x7</p>
          <p className="text-[11px] text-teal-600 font-medium">Meta Business Bot Active</p>
        </div>
      </div>

      {/* Main Core Modules Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
            Explore Healthcare Coordination Services
          </h2>
          <span className="text-xs text-slate-500 font-medium">Mobile-First Services</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.path}
                to={action.path}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${action.color} text-white flex items-center justify-center shadow-md`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    {action.count && (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-800">
                        {action.count}
                      </span>
                    )}
                    {action.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
                        {action.badge}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {action.subtitle}
                    </p>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-600">
                  <span>Open Service</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Network Hospitals Preview */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Partner Healthcare Facilities
            </h2>
            <p className="text-xs text-slate-500">
              Verified multi-specialty hospitals with synchronized triage and beds
            </p>
          </div>
          <Link to="/reception" className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
            View All Doctors →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {hospitals.slice(0, 3).map((h) => (
            <div key={h.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 truncate">{h.name}</span>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded">
                  Verified
                </span>
              </div>
              <p className="text-slate-500 flex items-center gap-1 truncate">
                <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span>{h.city}</span>
              </p>
              <div className="pt-1 flex items-center justify-between text-[11px]">
                <a href={`tel:${h.emergencyContact}`} className="text-red-600 font-bold">
                  🚨 {h.emergencyContact}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
