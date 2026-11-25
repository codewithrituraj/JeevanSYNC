import React from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';

export const PageHeaderCard = ({ icon: Icon, title, description, accent = 'emerald', actions }) => (
  <div className="page-header-card">
    <div className="flex items-center gap-3 min-w-0">
      {Icon && <div className={`page-icon page-icon-${accent}`}><Icon className="w-6 h-6" /></div>}
      <div className="min-w-0">
        <h1 className="page-title">{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
    </div>
    {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
  </div>
);

export const StatusChip = ({ children, tone = 'neutral' }) => (
  <span className={`status-chip status-${tone}`}>{children}</span>
);

export const ProgressBar = ({ value = 0, label }) => {
  const safeValue = Math.min(100, Math.max(0, Number(value) || 0));
  const tone = safeValue > 90 ? 'danger' : safeValue >= 70 ? 'warning' : 'success';
  return (
    <div className="space-y-1.5">
      {label && <div className="flex justify-between text-xs font-semibold text-slate-600"><span>{label}</span><span>{safeValue}%</span></div>}
      <div className="progress-track" aria-label={`${safeValue}% occupied`}><div className={`progress-fill progress-${tone}`} style={{ width: `${safeValue}%` }} /></div>
    </div>
  );
};

export const LoadingState = ({ label = 'Loading live data…' }) => <div className="empty-panel"><Loader2 className="w-7 h-7 animate-spin text-emerald-600 mx-auto" /><p className="mt-2 text-sm text-slate-500">{label}</p></div>;

export const ErrorState = ({ message = 'We could not load this data.', onRetry }) => <div className="empty-panel"><AlertCircle className="w-8 h-8 text-amber-500 mx-auto" /><p className="mt-2 text-sm font-semibold text-slate-700">{message}</p>{onRetry && <button onClick={onRetry} className="button-secondary mt-3">Retry</button>}</div>;

export const EmptyState = ({ title, description, action }) => <div className="empty-panel"><p className="text-sm font-bold text-slate-800">{title}</p>{description && <p className="text-xs text-slate-500 mt-1">{description}</p>}{action && <div className="mt-3">{action}</div>}</div>;
