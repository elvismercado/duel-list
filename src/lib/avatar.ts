/**
 * Deterministic color + initial avatar helpers.
 *
 * Used to give each item a stable visual identity so two side-by-side
 * choice cards never look interchangeable — even when scores are hidden.
 */

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** Hue derived from id, evenly distributed across the colour wheel. */
export function avatarHue(id: string): number {
  return hashString(id) % 360;
}

/**
 * Background CSS for a saturated, theme-agnostic disc. Lightness is locked
 * to a darker band so white foreground text passes WCAG AA across the
 * whole hue wheel (yellow/lime would otherwise fail).
 */
export function avatarBackground(id: string): string {
  return `hsl(${avatarHue(id)} 55% 35%)`;
}

/**
 * Detect emoji / pictographic codepoints. Emoji avatars look better with
 * no colored background tint behind them, so callers can swap to a
 * neutral disc when this returns true.
 */
export function isEmojiInitial(initial: string): boolean {
  const cp = initial.codePointAt(0);
  if (cp === undefined) return false;
  // Most emoji and pictographic ranges live above U+2000; covers
  // miscellaneous symbols, dingbats, and the supplementary planes used by
  // modern emoji.
  return (
    cp >= 0x2000 ||
    // ASCII letters/digits never trigger this.
    false
  );
}

/** First non-whitespace character of a name, uppercased. Falls back to '?'. */
export function avatarInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  // Use codePointAt to handle surrogate pairs (e.g. emoji) gracefully.
  const cp = trimmed.codePointAt(0);
  if (cp === undefined) return '?';
  return String.fromCodePoint(cp).toUpperCase();
}
