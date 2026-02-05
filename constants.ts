
export const PALETTES = {
  colorful: [
    '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', 
    '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#6366f1'
  ],
  monochrome: [
    '#1e293b', '#334155', '#475569', '#64748b', '#94a3b8',
    '#cbd5e1', '#e2e8f0', '#f1f5f9', '#f8fafc', '#0f172a'
  ],
  muted: [
    '#f87171', '#60a5fa', '#34d399', '#fbbf24', '#a78bfa',
    '#f472b6', '#22d3ee', '#fb923c', '#a3e635', '#818cf8'
  ],
};

export const STORAGE_KEY = 'spin_it_wheels_data';

export const DURATION_VALUES = {
  slow: 0.992,     // Friction: longer spin
  medium: 0.985,   // Standard friction
  fast: 0.95,      // Lower friction for higher top speed
  instant: 0.15,   // Very high friction for a 'zip' effect
};
