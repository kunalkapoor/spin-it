
export type SpinDuration = 'slow' | 'medium' | 'fast' | 'instant';
export type PaletteType = 'colorful' | 'monochrome' | 'muted' | 'custom';
export type FairnessMode = 'random' | 'balanced' | 'elimination';

export interface WheelOption {
  id: string;
  label: string;
  weight: number;
  color?: string;
}

export interface WheelData {
  id: string;
  title: string;
  options: WheelOption[];
  createdAt: number;
  config: {
    duration: SpinDuration;
    palette: PaletteType;
    fairness: FairnessMode;
    customColors: string[];
  };
}

export type AppView = 'home' | 'create' | 'edit' | 'spin';
