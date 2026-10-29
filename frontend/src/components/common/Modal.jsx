import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Fond sombre flouté */}
      <div
        className="fixed inset-0 bg-navy-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={`relative w-full ${maxWidth} bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all my-8`}
        >
          {/* En-tête */}
          <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/70">
            <h3 className="text-base font-bold text-navy-950 tracking-tight">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-navy-950 p-1.5 rounded-xl hover:bg-slate-200/60 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Corps */}
          <div className="p-6 max-h-[80vh] overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

