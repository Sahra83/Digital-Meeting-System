import React from 'react';

export function PieChart({ data }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No data available</div>;

  let currentPercent = 0;
  const stops = data.map((item) => {
    const percent = (item.value / total) * 100;
    const stop = `${item.color} ${currentPercent}% ${currentPercent + percent}%`;
    currentPercent += percent;
    return stop;
  });

  return (
    <div className="flex flex-col items-center">
      <div 
        className="w-40 h-40 rounded-full shadow-inner" 
        style={{ background: `conic-gradient(${stops.join(', ')})` }}
      />
      <div className="mt-6 w-full flex flex-wrap justify-center gap-4">
        {data.map(item => (
          <div key={item.label} className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-slate-600 font-medium">{item.label}</span>
            <span className="font-bold text-slate-900 ml-1">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BarChart({ data }) {
  if (!data || data.length === 0) return <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No data available</div>;
  const max = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="flex items-end gap-2 h-48 w-full">
      {data.map((item, idx) => {
        const heightPercent = (item.value / max) * 100;
        return (
          <div key={idx} className="flex flex-col items-center flex-1 group">
            <div className="relative w-full flex justify-center h-full items-end">
              <div 
                className="w-full max-w-[40px] bg-blue-600 rounded-t-sm transition-all duration-500 group-hover:bg-blue-500"
                style={{ height: `${heightPercent}%`, minHeight: heightPercent > 0 ? '4px' : '0' }}
              >
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs py-1 px-2 rounded font-semibold whitespace-nowrap pointer-events-none">
                  {item.value}
                </div>
              </div>
            </div>
            <span className="text-xs text-slate-500 mt-2 truncate w-full text-center px-1" title={item.label}>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function LineChart({ data }) {
  if (!data || data.length < 2) return <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Not enough data to form a trend</div>;
  
  const values = data.map(d => d.value);
  const max = Math.max(...values, 1);
  const min = 0;
  const range = max - min;
  
  const width = 100;
  const height = 100;
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d.value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="flex flex-col w-full h-48">
      <div className="flex-1 relative w-full border-b border-l border-slate-200">
        <svg viewBox="-5 -5 110 110" preserveAspectRatio="none" className="w-full h-full overflow-visible">
          <polyline
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
            className="drop-shadow-sm"
          />
          {data.map((d, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - ((d.value - min) / range) * height;
            return (
              <circle key={i} cx={x} cy={y} r="3" fill="#10b981" className="hover:r-5 transition-all cursor-pointer">
                <title>{d.label}: {d.value}</title>
              </circle>
            );
          })}
        </svg>
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-xs text-slate-400 truncate">{data[0].label}</span>
        <span className="text-xs text-slate-400 truncate">{data[data.length - 1].label}</span>
      </div>
    </div>
  );
}
