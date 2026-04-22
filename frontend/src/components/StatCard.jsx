import React from 'react';

export default function StatCard({ icon: Icon, title, value, subtitle, color }) {
  const bgColors = {
    blue: 'bg-blue-50',
    red: 'bg-red-50',
    green: 'bg-green-50',
    yellow: 'bg-yellow-50',
  };

  const textColors = {
    blue: 'text-blue-600',
    red: 'text-red-600',
    green: 'text-green-600',
    yellow: 'text-yellow-600',
  };

  return (
    <div className={`${bgColors[color] || bgColors.blue} rounded-lg p-6 border border-gray-200 hover:shadow-lg transition`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        </div>
        <Icon className={`w-10 h-10 ${textColors[color] || textColors.blue}`} />
      </div>
    </div>
  );
}
