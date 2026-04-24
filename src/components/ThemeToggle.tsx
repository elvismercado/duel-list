import { useState } from 'react';
import { Monitor, Sun, Moon } from 'lucide-react';
import { S } from '@/lib/strings';
import { getSettings, updateSettings } from '@/lib/storage';
import { applyTheme, cycleTheme, type Theme } from '@/lib/theme';

const ICON: Record<Theme, typeof Monitor> = {
  system: Monitor,
  light: Sun,
  dark: Moon,
};

const LABEL: Record<Theme, string> = {
  system: S.settings.themeSystem,
  light: S.settings.themeLight,
  dark: S.settings.themeDark,
};

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => getSettings().theme as Theme);

  function handleClick() {
    const next = cycleTheme(theme);
    updateSettings({ theme: next });
    applyTheme(next);
    setTheme(next);
  }

  const Icon = ICON[theme];
  const next = cycleTheme(theme);

  return (
    <button
      type="button"
      onClick={handleClick}
      className="p-1 rounded-md hover:bg-accent min-h-[44px] min-w-[44px] flex items-center justify-center"
      aria-label={S.app.themeToggleAria(LABEL[theme], LABEL[next])}
      title={S.app.themeToggleAria(LABEL[theme], LABEL[next])}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
