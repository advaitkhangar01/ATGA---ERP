import React from 'react';

interface BarcodeProps {
  value: string;
  width?: number;
  height?: number;
  showText?: boolean;
}

export function BarcodeGenerator({ value, width = 180, height = 50, showText = true }: BarcodeProps) {
  // Generate a deterministic pattern of lines based on the string value
  const generatePattern = (val: string) => {
    let hash = 0;
    for (let i = 0; i < val.length; i++) {
      hash = val.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const pattern = [];
    let state = Math.abs(hash) || 123456789;
    
    // Simple LCG to get bars
    for (let i = 0; i < 38; i++) {
      state = (state * 9301 + 49297) % 233280;
      const w = (state % 3) + 1; // bar width 1, 2, or 3
      const isBlack = state % 2 === 0;
      pattern.push({ width: w, isBlack });
    }
    
    // Add start and stop character guards
    return [
      { width: 2, isBlack: true },
      { width: 1, isBlack: false },
      { width: 1, isBlack: true },
      ...pattern,
      { width: 2, isBlack: true },
      { width: 1, isBlack: false },
      { width: 3, isBlack: true },
    ];
  };

  const pattern = generatePattern(value);
  
  // Calculate total units
  const totalUnits = pattern.reduce((acc, p) => acc + p.width, 0);
  const unitWidth = width / totalUnits;

  let currentX = 0;

  return (
    <div className="flex flex-col items-center justify-center p-2 bg-white rounded border border-zinc-200">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <g>
          {pattern.map((bar, idx) => {
            const barW = bar.width * unitWidth;
            const x = currentX;
            currentX += barW;
            
            if (bar.isBlack) {
              return (
                <rect
                  key={idx}
                  x={x}
                  y={0}
                  width={barW}
                  height={height}
                  fill="black"
                />
              );
            }
            return null;
          })}
        </g>
      </svg>
      {showText && (
        <span className="text-[10px] font-mono tracking-widest text-black mt-1 font-bold">
          {value.toUpperCase()}
        </span>
      )}
    </div>
  );
}
