import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HeartPulse, Phone, Lock, ArrowRight, Loader2, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('9811223344');
  const [password, setPassword] = useState('Password@123');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      await login(identifier, password);
      navigate('/');
    } catch (err) {
      setErrorMessage(err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (phone) => {
    setIdentifier(phone);
    setPassword('Password@123');
  };

  return (
    <div className="max-w-md mx-auto py-6 sm:py-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/30">
          <HeartPulse className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Welcome to Jeevan<span className="text-emerald-600">SYNC</span>
        </h1>
        <p className="text-xs text-slate-500">
          Secure sign in to your healthcare coordination portal
        </p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl space-y-5">
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl font-medium">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Phone Number or Email
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                placeholder="10-digit mobile or email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 text-sm transition-all"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Sign In Securely</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Fast-Fill Buttons */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
            One-Tap Demo Credentials
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickFill('9811223344')}
              className="p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 text-left"
            >
              <span className="font-bold text-slate-800 block">👤 Patient</span>
              <span className="text-[10px] text-slate-500">Rohan Mehra</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('9876543213')}
              className="p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 text-left"
            >
              <span className="font-bold text-slate-800 block">🩺 Doctor</span>
              <span className="text-[10px] text-slate-500">Dr. Ananya Sen</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('9876543211')}
              className="p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 text-left"
            >
              <span className="font-bold text-slate-800 block">🏥 Hospital Admin</span>
              <span className="text-[10px] text-slate-500">Vikram (Max Saket)</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('9876543210')}
              className="p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 text-left"
            >
              <span className="font-bold text-slate-800 block">👑 Super Admin</span>
              <span className="text-[10px] text-slate-500">Dr. Rajesh Verma</span>
            </button>
          </div>
        </div>

        <div className="text-center pt-2">
          <p className="text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-emerald-600 hover:text-emerald-700 underline">
              Create one now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
