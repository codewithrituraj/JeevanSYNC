import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, Calendar, Bot, Layers, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const BottomNav = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const navItems = [
    { label: 'Home', path: '/', icon: Activity },
    { label: 'Book', path: '/reception', icon: Calendar },
    { label: 'Monika AI', path: '/monika', icon: Bot, isCenter: true },
    { label: 'Beds & Blood', path: '/coordination', icon: Layers },
    { label: isAuthenticated ? 'Records' : 'Login', path: isAuthenticated ? '/history' : '/login', icon: User },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          if (item.isCenter) {
            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative -top-5 flex flex-col items-center group"
              >
                <div
                  className={`w-13 h-13 p-3.5 rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95 ${
                    isActive
                      ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-emerald-500/30'
                      : 'bg-gradient-to-tr from-teal-600 to-emerald-500 text-white shadow-teal-500/30 group-hover:scale-105'
                  }`}
                >
                  <Icon className="w-6 h-6 animate-pulse" />
                </div>
                <span className="text-[10px] font-bold text-slate-800 mt-1">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-colors ${
                isActive
                  ? 'text-emerald-600 font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
