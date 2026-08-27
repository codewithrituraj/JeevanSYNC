import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Activity,
  Ambulance,
  HeartPulse,
  Droplet,
  Bot,
  Calendar,
  Layers,
  FileText,
  Bell,
  Shield,
  Pill,
  Menu,
  X,
  User as UserIcon,
  LogOut,
  ChevronRight,
  PhoneCall
} from 'lucide-react';

export const Navbar = ({ onOpenAmbulanceModal }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Home', path: '/', icon: Activity },
    { name: 'MonikaCare AI', path: '/monika', icon: Bot, highlight: true },
    { name: 'Reception & Doctors', path: '/reception', icon: Calendar },
    { name: 'Emergency Beds', path: '/coordination', icon: Layers },
    { name: 'Blood Bank', path: '/bloodbank', icon: Droplet },
    { name: 'Diagnostics', path: '/diagnostics', icon: HeartPulse },
    { name: 'Medicines', path: '/inventory', icon: Pill },
    { name: 'Referrals', path: '/referrals', icon: ChevronRight },
    { name: 'Insurance', path: '/insurance', icon: Shield },
  ];

  return (
    <>
      {/* Top Banner for Emergency */}
      <div className="bg-slate-900 text-white px-3 py-1.5 text-xs font-medium flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="flex h-2 w-2 relative flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span className="truncate text-slate-300">
            National Emergency Coordination Network Active (24x7)
          </span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <a
            href="tel:112"
            className="text-red-400 hover:text-red-300 font-bold flex items-center gap-1 transition-colors"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>112 / 108</span>
          </a>
        </div>
      </div>

      {/* Main Responsive Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              <Link to="/" className="flex items-center gap-2 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                  <HeartPulse className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl font-black tracking-tight text-slate-900">
                      Jeevan<span className="text-emerald-600">SYNC</span>
                    </span>
                    <span className="text-[10px] uppercase tracking-wider font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                      Live
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium leading-none hidden sm:block">
                    Healthcare Coordination Platform
                  </p>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.slice(0, 6).map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 font-semibold'
                        : link.highlight
                        ? 'text-teal-700 bg-teal-50/70 hover:bg-teal-100/70'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right Action Center */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Critical 1-Tap Ambulance Action Button */}
              <button
                onClick={onOpenAmbulanceModal}
                className="bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs sm:text-sm font-bold px-3.5 py-2 rounded-xl shadow-lg shadow-red-500/25 flex items-center gap-2 transition-all pulse-emergency"
              >
                <Ambulance className="w-4 h-4 animate-bounce" />
                <span className="hidden sm:inline">1-Tap Ambulance</span>
                <span className="sm:hidden">Ambulance</span>
              </button>

              {/* User Dropdown / Auth Buttons */}
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <Link
                    to="/history"
                    className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg relative"
                    title="Medical History"
                  >
                    <FileText className="w-5 h-5" />
                  </Link>

                  <Link
                    to="/reminders"
                    className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg relative"
                    title="Reminders"
                  >
                    <Bell className="w-5 h-5" />
                  </Link>

                  <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

                  <div className="flex items-center gap-2 bg-slate-100 py-1.5 px-2.5 rounded-xl">
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                      {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="text-left hidden md:block">
                      <p className="text-xs font-semibold text-slate-900 leading-tight max-w-[100px] truncate">
                        {user?.name}
                      </p>
                      <p className="text-[10px] text-emerald-700 font-medium leading-none">
                        {user?.role}
                      </p>
                    </div>
                    <button
                      onClick={logout}
                      className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                      title="Logout"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="text-sm font-semibold text-slate-700 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/register"
                    className="text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl transition-all shadow-sm"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Slide-down Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-1 shadow-xl animate-in slide-in-from-top duration-200">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 pb-1">
              Modules & Services
            </p>
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span>{link.name}</span>
                  </div>
                  {link.highlight && (
                    <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
                      AI Triage
                    </span>
                  )}
                </Link>
              );
            })}

            {isAuthenticated && (
              <div className="pt-3 mt-3 border-t border-slate-100 space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 pb-1">
                  My Profile & Records
                </p>
                <Link
                  to="/history"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-700 hover:bg-slate-50"
                >
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span>Medical Records & History</span>
                </Link>
                <Link
                  to="/reminders"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Bell className="w-4 h-4 text-slate-500" />
                  <span>Medication & Appointment Reminders</span>
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        )}
      </header>
    </>
  );
};
