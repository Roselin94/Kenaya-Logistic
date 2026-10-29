import React from 'react';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

export default function Alert({ type = 'info', message, onClose }) {
  if (!message) return null;

  const styles = {
    info: {
      bg: 'bg-blue-50 text-blue-900 border-blue-200',
      icon: Info,
      iconColor: 'text-blue-600'
    },
    success: {
      bg: 'bg-emerald-50 text-emerald-900 border-emerald-200',
      icon: CheckCircle,
      iconColor: 'text-emerald-600'
    },
    warning: {
      bg: 'bg-amber-50 text-amber-900 border-amber-200',
      icon: AlertCircle,
      iconColor: 'text-amber-600'
    },
    error: {
      bg: 'bg-rose-50 text-rose-900 border-rose-200',
      icon: XCircle,
      iconColor: 'text-rose-600'
    }
  };

  const current = styles[type] || styles.info;
  const Icon = current.icon;

  return (
    <div className={`p-4 rounded-xl border flex items-start gap-3 ${current.bg} shadow-sm`}>
      <Icon className={`${current.iconColor} shrink-0 mt-0.5`} size={18} />
      <div className="flex-1 text-xs font-medium leading-relaxed">{message}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 text-xs font-bold px-1"
        >
          ✕
        </button>
      )}
    </div>
  );
}

