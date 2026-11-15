import React, { useState, useMemo } from 'react';

// 1. Donut Chart Component
interface DonutData {
  name: string;
  value: number;
  color: string;
}

export function DonutChart({ data }: { data: DonutData[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  const radius = 60;
  const strokeWidth = 24;
  const size = 180;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  const computedSlices = useMemo(() => {
    let accumulated = 0;
    return data.map((item) => {
      const percentage = total > 0 ? item.value / total : 0;
      const strokeDashoffset = circumference - percentage * circumference;
      const strokeDasharray = `${circumference} ${circumference}`;
      const rotation = total > 0 ? (accumulated / total) * 360 : 0;
      accumulated += item.value;

      return {
        ...item,
        strokeDashoffset,
        strokeDasharray,
        rotation,
      };
    });
  }, [data, total, circumference]);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-around gap-4 py-4 w-full">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={center} cy={center} r={radius} fill="transparent" stroke="#27272a" strokeWidth={strokeWidth} className="opacity-10 dark:opacity-20" />
          {computedSlices.map((item, idx) => {
            const isHovered = hoveredIdx === idx;

            return (
              <circle
                key={item.name}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={item.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={item.strokeDasharray}
                strokeDashoffset={item.strokeDashoffset}
                transform={`rotate(${item.rotation} ${center} ${center})`}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-black text-zinc-800 dark:text-zinc-100">
            {hoveredIdx !== null ? data[hoveredIdx].value.toLocaleString() : total.toLocaleString()}
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
            {hoveredIdx !== null ? data[hoveredIdx].name : 'Total Qty'}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 w-full sm:w-auto min-w-[120px] max-w-full">
        {data.map((item, idx) => (
          <div
            key={item.name}
            className={`flex items-center justify-between gap-2 p-1 rounded-lg transition-colors cursor-pointer ${
              hoveredIdx === idx ? 'bg-zinc-100 dark:bg-zinc-850' : 'hover:bg-zinc-50 dark:hover:bg-zinc-850/40'
            }`}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 truncate" title={item.name}>{item.name}</span>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-[11px] font-bold text-zinc-950 dark:text-zinc-100">{item.value}</span>
              <span className="text-[9px] text-zinc-400 dark:text-zinc-505 ml-1">
                ({((item.value / total) * 100).toFixed(0)}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 2. Bar Chart Component
interface BarData {
  label: string;
  value: number;
  secondaryVal?: number;
}

export function BarChart({ data, height = 200, color = '#4f46e5' }: { data: BarData[]; height?: number; color?: string }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const maxVal = Math.max(...data.map((d) => d.value + (d.secondaryVal || 0)), 10);

  return (
    <div className="w-full flex flex-col justify-end pt-6">
      <div className="flex items-end gap-2 sm:gap-4 w-full justify-between" style={{ height }}>
        {data.map((bar, idx) => {
          const mainPct = (bar.value / maxVal) * 100;
          const secPct = bar.secondaryVal ? (bar.secondaryVal / maxVal) * 100 : 0;
          
          return (
            <div
              key={bar.label}
              className="flex-1 flex flex-col items-center group relative cursor-pointer"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Tooltip */}
              {hoveredIdx === idx && (
                <div className="absolute bottom-full mb-2 z-20 bg-zinc-950 dark:bg-zinc-800 text-white dark:text-zinc-100 text-[10px] p-2 rounded-lg shadow-xl pointer-events-none flex flex-col gap-0.5 border border-zinc-700">
                  <span className="font-bold border-b border-zinc-700 pb-0.5 mb-0.5">{bar.label}</span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    Stock: {bar.value}
                  </span>
                  {bar.secondaryVal !== undefined && (
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      Defects: {bar.secondaryVal}
                    </span>
                  )}
                </div>
              )}

              {/* Bar Stack */}
              <div className="w-full max-w-[32px] bg-zinc-100 dark:bg-zinc-800/50 rounded-t-md overflow-hidden flex flex-col justify-end h-full">
                {bar.secondaryVal && (
                  <div
                    style={{ height: `${secPct}%` }}
                    className="w-full bg-rose-500 hover:brightness-110"
                  />
                )}
                <div
                  style={{ height: `${mainPct}%`, backgroundColor: color }}
                  className="w-full hover:brightness-110"
                />
              </div>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-2 truncate w-full text-center">
                {bar.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 3. Line / Area Trend Chart
interface TrendData {
  label: string;
  value: number;
}

export function AreaChart({ data, height = 180, color = '#6366f1' }: { data: TrendData[]; height?: number; color?: string }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const maxVal = Math.max(...data.map((d) => d.value), 10);
  
  const width = 500;
  const padding = 30;
  
  const points = data.map((d, idx) => {
    const x = padding + (idx / (data.length - 1)) * (width - 2 * padding);
    const y = height - padding - (d.value / maxVal) * (height - 2 * padding);
    return { x, y, label: d.label, val: d.value };
  });

  const pathD = points.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const areaD = points.length > 0 
    ? `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z` 
    : '';

  return (
    <div className="relative w-full flex flex-col">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible">
        {/* Gradients */}
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#27272a" strokeWidth={1} className="opacity-10 dark:opacity-20" />
        <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#27272a" strokeWidth={1} strokeDasharray="3 3" className="opacity-10 dark:opacity-20" />

        {/* Fill Area */}
        <path
          d={areaD}
          fill="url(#areaGrad)"
        />

        {/* Line Path */}
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data Interactive Nodes */}
        {points.map((p, idx) => (
          <g key={idx}>
            <circle
              cx={p.x}
              cy={p.y}
              r={hoveredIdx === idx ? 6 : 4}
              fill={color}
              stroke="white"
              strokeWidth={2}
              className="cursor-pointer transition-all shadow-md"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
            {hoveredIdx === idx && (
              <foreignObject x={p.x - 40} y={p.y - 45} width="80" height="40" className="overflow-visible z-20 pointer-events-none">
                <div className="bg-zinc-950 dark:bg-zinc-800 text-white text-[10px] p-1.5 rounded border border-zinc-700 shadow-xl text-center flex flex-col">
                  <span className="font-bold truncate">{p.label}</span>
                  <span>Qty: {p.val}</span>
                </div>
              </foreignObject>
            )}
          </g>
        ))}
      </svg>
      <div className="flex justify-between px-6 -mt-2">
        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold">{data[0]?.label}</span>
        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold">{data[Math.floor(data.length / 2)]?.label}</span>
        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold">{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}

// 4. Heatmap Matrix
export function HeatmapChart() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const times = ['Morning', 'Afternoon', 'Evening', 'Night'];
  
  // Matrix data (simulated traffic values 0-9)
  const matrix = [
    [7, 3, 2, 0], // Mon
    [4, 8, 9, 2], // Tue
    [3, 5, 6, 1], // Wed
    [9, 2, 7, 3], // Thu
    [5, 4, 8, 0], // Fri
  ];

  const getColor = (val: number) => {
    if (val === 0) return 'bg-zinc-100 dark:bg-zinc-800/40 text-transparent';
    if (val < 4) return 'bg-indigo-200 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200';
    if (val < 7) return 'bg-indigo-400 dark:bg-indigo-800/60 text-white';
    return 'bg-indigo-600 dark:bg-indigo-600 text-white';
  };

  return (
    <div className="flex flex-col gap-2 py-2 w-full">
      <div className="flex items-center gap-1 mb-1 text-[10px] text-zinc-400 dark:text-zinc-500 font-bold ml-10">
        {times.map((t) => (
          <span key={t} className="flex-1 text-center">{t}</span>
        ))}
      </div>
      {days.map((day, dIdx) => (
        <div key={day} className="flex items-center gap-1 w-full">
          <span className="w-8 text-[11px] font-bold text-zinc-500 dark:text-zinc-400">{day}</span>
          <div className="flex-1 flex gap-1">
            {matrix[dIdx].map((val, tIdx) => (
              <div
                key={tIdx}
                className={`flex-1 h-10 rounded-lg flex items-center justify-center text-xs font-black transition-all hover:scale-105 cursor-pointer border border-transparent hover:border-zinc-400 dark:hover:border-zinc-600 ${getColor(val)}`}
                title={`Activity Score: ${val}`}
              >
                {val > 0 ? val : ''}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
