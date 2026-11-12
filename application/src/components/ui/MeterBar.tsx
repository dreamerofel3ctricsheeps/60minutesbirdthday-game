import React from 'react';

interface MeterBarProps {
  label: string;
  value: number; // 0 - 100
  color: string;
  icon?: React.ReactNode;
}

export const MeterBar: React.FC<MeterBarProps> = ({ label, value, color, icon }) => {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className="flex flex-col gap-1 w-full min-w-[120px]">
      <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-slate-300">
        <span className="flex items-center gap-1">
          {icon}
          {label}
        </span>
        <span>{Math.round(clamped)}%</span>
      </div>
      <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
        <div
          className={`h-full transition-all duration-300 ${color}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};
