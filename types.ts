export type FontType = 'inter' | 'space-grotesk' | 'playfair-display' | 'cinzel' | 'jetbrains-mono' | 'fredoka';

export type BackgroundType = 'nebula' | 'retrowave' | 'aurora' | 'confetti' | 'matrix';

export type MusicType = 'lofi' | 'inspirational' | 'synthwave' | 'none';

export type ColorType = 'white' | 'gold' | 'cyan' | 'rose' | 'emerald';

export type AnimationType = 'fade' | 'zoom' | 'slide' | 'pulsate';

export interface Quote {
  id: number;
  text: string;
  author: string;
}

export interface HistoryEntry {
  id: string;
  date: string;
  daysLeft: number;
  quote: Quote;
  font: FontType;
  background: BackgroundType;
  music: MusicType;
  color: ColorType;
  animation: AnimationType;
  videoUrl?: string; // Blob URL of the generated video
}
