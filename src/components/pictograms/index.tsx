import React from 'react';

interface PictogramProps {
  className?: string;
  size?: number;
}

export function WindshieldIcon({ className = 'text-blue-700', size = 20 }: PictogramProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      stroke="currentColor"
      fill="none"
      className={className}
      aria-label="Windshield Front"
    >
      <path d="M3 17 L6 6 L18 6 L21 17 Z" strokeWidth="2" strokeLinejoin="round" />
      <path d="M7 14 Q12 11 17 14" strokeWidth="1.5" />
    </svg>
  );
}

export function BackLightIcon({ className = 'text-amber-700', size = 20 }: PictogramProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      stroke="currentColor"
      fill="none"
      className={className}
      aria-label="Back Light Rear"
    >
      <path d="M4 17 L7 7 L17 7 L20 17 Z" strokeWidth="2" strokeLinejoin="round" />
      <line x1="7" y1="11" x2="17" y2="11" strokeWidth="1.2" strokeDasharray="1 1" />
      <line x1="6" y1="14" x2="18" y2="14" strokeWidth="1.2" strokeDasharray="1 1" />
    </svg>
  );
}

export function FrontDoorGlassIcon({ className = 'text-emerald-700', size = 20 }: PictogramProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      stroke="currentColor"
      fill="none"
      className={className}
      aria-label="Front Door Glass"
    >
      <path d="M4 19 L4 9 L14 5 L20 9 L20 19 Z" strokeWidth="2" strokeLinejoin="round" />
      <line x1="4" y1="19" x2="20" y2="19" strokeWidth="2" />
    </svg>
  );
}

export function RearDoorGlassIcon({ className = 'text-indigo-700', size = 20 }: PictogramProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      stroke="currentColor"
      fill="none"
      className={className}
      aria-label="Rear Door Glass"
    >
      <path d="M4 19 L4 7 L18 7 L20 19 Z" strokeWidth="2" strokeLinejoin="round" />
      <line x1="4" y1="19" x2="20" y2="19" strokeWidth="2" />
    </svg>
  );
}

export function QuarterGlassIcon({ className = 'text-purple-700', size = 20 }: PictogramProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      stroke="currentColor"
      fill="none"
      className={className}
      aria-label="Quarter Glass"
    >
      <path d="M4 18 L19 18 L19 6 Z" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export function VentGlassIcon({ className = 'text-slate-700', size = 20 }: PictogramProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      stroke="currentColor"
      fill="none"
      className={className}
      aria-label="Vent Glass"
    >
      <path d="M5 19 L19 19 L19 10 L10 5 Z" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Universal Glass Pictogram Selector
 */
export function GlassPictogram({
  glassType,
  position,
  className,
  size = 18
}: {
  glassType?: string;
  position?: string;
  className?: string;
  size?: number;
}) {
  const t = (glassType || '').toLowerCase();
  const p = (position || '').toLowerCase();

  if (t.includes('windshield') || p.includes('front') && !t.includes('door')) {
    return <WindshieldIcon className={className || 'text-blue-700'} size={size} />;
  }
  if (t.includes('rear') || t.includes('back') || p.includes('rear') && !t.includes('door')) {
    return <BackLightIcon className={className || 'text-amber-700'} size={size} />;
  }
  if (t.includes('door') && (p.includes('front') || p.includes('fl') || p.includes('fr'))) {
    return <FrontDoorGlassIcon className={className || 'text-emerald-700'} size={size} />;
  }
  if (t.includes('door') && (p.includes('rear') || p.includes('rl') || p.includes('rr'))) {
    return <RearDoorGlassIcon className={className || 'text-indigo-700'} size={size} />;
  }
  if (t.includes('quarter') || t.includes('qg')) {
    return <QuarterGlassIcon className={className || 'text-purple-700'} size={size} />;
  }
  if (t.includes('vent') || t.includes('vg')) {
    return <VentGlassIcon className={className || 'text-slate-700'} size={size} />;
  }

  // Fallback to Windshield
  return <WindshieldIcon className={className || 'text-slate-600'} size={size} />;
}
