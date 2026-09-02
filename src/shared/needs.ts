// Needs → design. The reader's agent declares what it knows about the person (from its own memory
// and the current situation). The page — not the agent — decides how the interface responds, from
// a fixed set of layouts, themes and type scales that the site's designers prepared. Explicit
// preferences (set_display) always win over inferred defaults.

export type Vision = 'typical' | 'low-vision' | 'light-sensitive' | 'color-blind' | 'screen-reader';
export type Motor = 'typical' | 'limited-precision' | 'keyboard-only' | 'one-handed';
export type Reading = 'typical' | 'dyslexia' | 'easily-distracted' | 'plain-language';
export type Device = 'desktop' | 'phone' | 'tablet' | 'unknown';
export type Light = 'normal' | 'dark-room' | 'bright-sunlight';

export interface Needs {
  vision: Vision;
  motor: Motor;
  reading: Reading;
  device: Device;
  light: Light;
  /** free text the agent may pass along, shown to the reader (never interpreted) */
  note?: string;
}

export const DEFAULT_NEEDS: Needs = { vision: 'typical', motor: 'typical', reading: 'typical', device: 'unknown', light: 'normal' };

export type Theme = 'light' | 'dark' | 'sepia' | 'high-contrast';
export type TextSize = 'small' | 'normal' | 'large' | 'xl';
export type Font = 'serif' | 'sans' | 'readable';
export type Spacing = 'compact' | 'normal' | 'relaxed';
export type Layout = 'standard' | 'focus' | 'wide';
export type Targets = 'normal' | 'large';

export interface Display {
  theme: Theme;
  textSize: TextSize;
  font: Font;
  spacing: Spacing;
  layout: Layout;
  targets: Targets;
  reducedMotion: boolean;
  showPanels: boolean;
  /** one section at a time, with the rest dimmed */
  spotlight: boolean;
  /** avoid meaning carried by hue alone; use labels/patterns */
  colorSafe: boolean;
}

export const DEFAULT_DISPLAY: Display = { theme: 'light', textSize: 'normal', font: 'serif', spacing: 'normal', layout: 'standard', targets: 'normal', reducedMotion: false, showPanels: true, spotlight: false, colorSafe: false };

export interface DesignDecision {
  setting: keyof Display;
  value: Display[keyof Display];
  because: string;
}

/** Map needs to a display configuration, with a reason for every change from the default. */
export function resolveDesign(needs: Needs): { display: Display; decisions: DesignDecision[] } {
  const d: Display = { ...DEFAULT_DISPLAY };
  const decisions: DesignDecision[] = [];
  const set = <K extends keyof Display>(k: K, v: Display[K], because: string) => {
    if (d[k] !== v) {
      d[k] = v;
      decisions.push({ setting: k, value: v, because });
    }
  };
  // Light and environment first; vision needs override them.
  if (needs.light === 'dark-room') set('theme', 'dark', 'dark room');
  if (needs.light === 'bright-sunlight') {
    set('theme', 'high-contrast', 'bright sunlight');
    set('textSize', 'large', 'bright sunlight');
  }
  if (needs.device === 'phone') {
    set('layout', 'focus', 'phone');
    set('textSize', d.textSize === 'normal' ? 'large' : d.textSize, 'phone');
  }
  switch (needs.vision) {
    case 'low-vision':
      set('textSize', 'xl', 'low vision');
      set('theme', needs.light === 'dark-room' ? 'dark' : 'high-contrast', 'low vision');
      set('spacing', 'relaxed', 'low vision');
      set('layout', 'wide', 'low vision');
      set('font', 'readable', 'low vision');
      set('targets', 'large', 'low vision');
      break;
    case 'light-sensitive':
      set('theme', 'dark', 'light sensitivity');
      set('reducedMotion', true, 'light sensitivity');
      break;
    case 'color-blind':
      set('colorSafe', true, 'color blindness');
      break;
    case 'screen-reader':
      set('layout', 'focus', 'screen reader: linear document order');
      set('showPanels', false, 'screen reader');
      set('reducedMotion', true, 'screen reader');
      break;
  }
  switch (needs.motor) {
    case 'limited-precision':
      set('targets', 'large', 'limited precision');
      set('spacing', 'relaxed', 'limited precision');
      break;
    case 'keyboard-only':
      set('reducedMotion', true, 'keyboard navigation');
      break;
    case 'one-handed':
      set('layout', 'focus', 'one-handed');
      set('targets', 'large', 'one-handed');
      break;
  }
  switch (needs.reading) {
    case 'dyslexia':
      set('font', 'readable', 'dyslexia');
      set('spacing', 'relaxed', 'dyslexia');
      set('theme', d.theme === 'light' ? 'sepia' : d.theme, 'dyslexia: lower glare');
      set('textSize', d.textSize === 'normal' || d.textSize === 'small' ? 'large' : d.textSize, 'dyslexia');
      break;
    case 'easily-distracted':
      set('layout', 'focus', 'easily distracted');
      set('showPanels', false, 'easily distracted');
      set('spotlight', true, 'easily distracted: one section at a time');
      set('reducedMotion', true, 'easily distracted');
      break;
    case 'plain-language':
      set('spacing', 'relaxed', 'plain language');
      break;
  }
  return { display: d, decisions };
}

/** Content adjustments implied by needs (applied to the reader context unless the reader set them). */
export function contentImplications(needs: Needs): { plainLanguage?: boolean; preferNovice?: boolean } {
  if (needs.reading === 'plain-language') return { plainLanguage: true, preferNovice: true };
  if (needs.reading === 'dyslexia') return { plainLanguage: true };
  if (needs.vision === 'screen-reader') return {};
  return {};
}

export const DISPLAY_PRESETS: Record<string, { label: string; display: Partial<Display> }> = {
  'reading-in-bed': { label: 'Reading in bed', display: { theme: 'dark', textSize: 'large', layout: 'focus', showPanels: false } },
  presenting: { label: 'Presenting on a screen', display: { textSize: 'xl', layout: 'wide', showPanels: false, spacing: 'relaxed' } },
  'low-vision': { label: 'Low vision', display: { theme: 'high-contrast', textSize: 'xl', spacing: 'relaxed', layout: 'wide', font: 'readable', targets: 'large' } },
  commute: { label: 'On the move', display: { textSize: 'large', layout: 'focus', targets: 'large', showPanels: false } },
  default: { label: 'Default', display: { ...DEFAULT_DISPLAY } },
};
