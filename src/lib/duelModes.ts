import type { DuelMode } from '@/types';
import { Layers, Timer, Trophy } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type DuelModeStatus = 'available' | 'coming-soon';

export interface DuelModeMeta {
  value: DuelMode;
  status: DuelModeStatus;
  /** Short display label for the picker. */
  label: string;
  /** One-line marketing description for the picker / coming-soon panel. */
  description: string;
  icon: LucideIcon;
}

/**
 * Single source of truth for duel modes. Adding a new mode = adding a row
 * here; the settings picker and the Duel page both read from this list.
 */
export const DUEL_MODES: readonly DuelModeMeta[] = [
  {
    value: 'side-by-side',
    status: 'available',
    label: 'Side-by-side cards',
    description: 'Two items appear side by side. Tap one to pick.',
    icon: Layers,
  },
  {
    value: 'speed-round',
    status: 'coming-soon',
    label: 'Speed round',
    description: 'Quick-fire duels with a per-pair timer.',
    icon: Timer,
  },
  {
    value: 'bracket',
    status: 'coming-soon',
    label: 'Bracket',
    description: 'Pick the best of three or four items at once.',
    icon: Trophy,
  },
];

const KNOWN_VALUES = new Set<DuelMode>(DUEL_MODES.map((m) => m.value));

export function isAvailableDuelMode(value: DuelMode): boolean {
  const meta = DUEL_MODES.find((m) => m.value === value);
  return meta?.status === 'available';
}

export function getDuelModeMeta(value: DuelMode): DuelModeMeta {
  // Falls back to the first available mode if a stale value slips through.
  return (
    DUEL_MODES.find((m) => m.value === value) ??
    DUEL_MODES.find((m) => m.status === 'available')!
  );
}

/**
 * Coerce an unknown value (e.g. from localStorage) to a valid DuelMode.
 * Stale or unknown strings (including the legacy `'swipe'` mode) are
 * mapped to the default available mode.
 */
export function coerceDuelMode(stored: unknown): DuelMode {
  if (typeof stored === 'string' && KNOWN_VALUES.has(stored as DuelMode)) {
    return stored as DuelMode;
  }
  return 'side-by-side';
}
