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

/** Background CSS for a saturated, theme-agnostic disc. */
export function avatarBackground(id: string): string {
  return `hsl(${avatarHue(id)} 60% 45%)`;
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
