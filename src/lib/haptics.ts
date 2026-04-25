/**
 * Tiny haptic helper. Vibrates the device for `ms` milliseconds when the
 * Vibration API is available. Silently no-ops when unavailable or when the
 * user prefers reduced motion.
 */
export function triggerHaptic(ms: number): void {
  if (typeof navigator === 'undefined') return;
  if (!('vibrate' in navigator)) return;
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  }
  try {
    navigator.vibrate(ms);
  } catch {
    // ignore
  }
}
