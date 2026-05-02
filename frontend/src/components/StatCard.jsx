import React from 'react';

export default function StatCard({ icon, title, value, color }) {
  const borderColors = {
    red: 'border-red-500',
    orange: 'border-orange-500',
    cyan: 'border-cyan-500',
    green: 'border-green-500',
  };

  return (
    <div className={`bg-slate-800 rounded-xl p-5 border-l-4 ${borderColors[color] || 'border-cyan-500'}`}>
      <div className="flex justify-between items-center">
        <div>
          <p className="text-slate-400 text-sm">{title}</p>
          <p className="text-white text-2xl font-bold mt-1">{value}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}