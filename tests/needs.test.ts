import { describe, expect, it } from 'vitest';
import { DEFAULT_NEEDS, resolveDesign, contentImplications } from '../src/shared/needs';

describe('needs → design', () => {
  it('leaves defaults alone for typical needs', () => {
    const r = resolveDesign(DEFAULT_NEEDS);
    expect(r.decisions).toEqual([]);
    expect(r.display.theme).toBe('light');
  });
  it('low vision gets xl text, high contrast, readable font, big targets, and reasons', () => {
    const r = resolveDesign({ ...DEFAULT_NEEDS, vision: 'low-vision' });
    expect(r.display.textSize).toBe('xl');
    expect(r.display.theme).toBe('high-contrast');
    expect(r.display.font).toBe('readable');
    expect(r.display.targets).toBe('large');
    expect(r.decisions.every((d) => d.because.includes('low vision'))).toBe(true);
  });
  it('low vision in a dark room stays dark rather than white high-contrast', () => {
    const r = resolveDesign({ ...DEFAULT_NEEDS, vision: 'low-vision', light: 'dark-room' });
    expect(r.display.theme).toBe('dark');
    expect(r.display.textSize).toBe('xl');
  });
  it('easily distracted readers get focus layout with spotlight and no panels', () => {
    const r = resolveDesign({ ...DEFAULT_NEEDS, reading: 'easily-distracted' });
    expect(r.display.layout).toBe('focus');
    expect(r.display.spotlight).toBe(true);
    expect(r.display.showPanels).toBe(false);
  });
  it('dyslexia gets a readable font, relaxed spacing, sepia, and plain-language content', () => {
    const r = resolveDesign({ ...DEFAULT_NEEDS, reading: 'dyslexia' });
    expect(r.display.font).toBe('readable');
    expect(r.display.spacing).toBe('relaxed');
    expect(r.display.theme).toBe('sepia');
    expect(contentImplications({ ...DEFAULT_NEEDS, reading: 'dyslexia' }).plainLanguage).toBe(true);
  });
  it('phone in bright sunlight: focus layout, large text, high contrast', () => {
    const r = resolveDesign({ ...DEFAULT_NEEDS, device: 'phone', light: 'bright-sunlight' });
    expect(r.display.layout).toBe('focus');
    expect(r.display.theme).toBe('high-contrast');
    expect(['large', 'xl']).toContain(r.display.textSize);
  });
  it('color blindness turns on color-safe encoding only', () => {
    const r = resolveDesign({ ...DEFAULT_NEEDS, vision: 'color-blind' });
    expect(r.display.colorSafe).toBe(true);
    expect(r.decisions.length).toBe(1);
  });
});
