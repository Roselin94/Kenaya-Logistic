import React from 'react';

export default function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'navy',
  badge
}) {
  const colorMap = {
    navy: 'from-navy-900 to-navy-800 text-white',
    gold: 'from-amber-500 to-gold-600 text-white',
    emerald: 'from-emerald-600 to-teal-700 text-white',
    blue: 'from-blue-600 to-indigo-700 text-white',
    rose: 'from-rose-600 to-red-700 text-white',
    white: 'bg-white text-navy-950 border border-slate-200'
  };

  const isWhite = color === 'white';

  return (
    <div
      className={`rounded-xl p-3.5 shadow-xs transition-all duration-150 hover:shadow-sm ${
        isWhite ? colorMap.white : `bg-gradient-to-br ${colorMap[color]}`
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className={`text-[10px] font-semibold uppercase tracking-wider ${isWhite ? 'text-slate-400' : 'text-white/75'}`}>
            {title}
          </div>
          <div className={`text-lg sm:text-xl font-bold mt-0.5 tracking-tight ${isWhite ? 'text-navy-950' : 'text-white'}`}>
            {value}
          </div>
        </div>

        {Icon && (
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isWhite
                ? 'bg-navy-50 text-navy-900 border border-navy-100'
                : 'bg-white/15 text-white backdrop-blur-sm'
            }`}
          >
            <Icon size={16} />
          </div>
        )}
      </div>

      {(subtitle || trend || badge) && (
        <div className="mt-3 pt-3 border-t border-slate-100/20 flex items-center justify-between text-xs">
          {subtitle && (
            <span className={isWhite ? 'text-slate-500' : 'text-white/80'}>
              {subtitle}
            </span>
          )}
          {badge && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white">
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

