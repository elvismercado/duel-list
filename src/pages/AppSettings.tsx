import { S } from '@/lib/strings';
import { getSettings, updateSettings, getStorageUsage } from '@/lib/storage';
import { useExport } from '@/hooks/useExport';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Download, Sparkles, Compass, Bell } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import type { CustomCadenceUnit, ReminderSettings } from '@/types';

function cadenceShortLabel(r: ReminderSettings): string {
  switch (r.cadence) {
    case 'off': return S.settings.remindersCadenceOff;
    case 'daily': return S.settings.remindersCadenceDaily;
    case 'weekly': return S.settings.remindersCadenceWeekly;
    case 'monthly': return S.settings.remindersCadenceMonthly;
    case 'custom': {
      const unit = unitShortLabel(r.customUnit);
      return `${r.customCount} ${unit}`;
    }
  }
}

function unitShortLabel(unit: CustomCadenceUnit): string {
  switch (unit) {
    case 'day': return S.settings.remindersUnitDay;
    case 'week': return S.settings.remindersUnitWeek;
    case 'month': return S.settings.remindersUnitMonth;
    case 'year': return S.settings.remindersUnitYear;
  }
}

function timeShortLabel(r: ReminderSettings): string {
  return `${r.preferredHour.toString().padStart(2, '0')}:${r.preferredMinute
    .toString()
    .padStart(2, '0')}`;
}

export default function AppSettingsPage() {
  const [settings, setSettings] = useState(getSettings);
  const { exportAll, exportAppData } = useExport();
  const storage = getStorageUsage();

  function handleThemeChange(theme: string) {
    updateSettings({ theme: theme as 'system' | 'light' | 'dark' });
    setSettings(getSettings());
    // Apply theme to document
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(prefersDark ? 'dark' : 'light');
    } else {
      root.classList.add(theme);
    }
  }

  function handleDuelModeChange(mode: string) {
    updateSettings({ duelMode: mode as 'side-by-side' | 'swipe' });
    setSettings(getSettings());
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{S.settings.title}</h1>

      {/* Theme */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{S.settings.themeLabel}</label>
        <Select
          value={settings.theme ?? 'system'}
          onValueChange={handleThemeChange}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="system">{S.settings.themeSystem}</SelectItem>
            <SelectItem value="light">{S.settings.themeLight}</SelectItem>
            <SelectItem value="dark">{S.settings.themeDark}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Duel mode */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{S.settings.duelModeLabel}</label>
        <Select
          value={settings.duelMode ?? 'side-by-side'}
          onValueChange={handleDuelModeChange}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="side-by-side">{S.settings.duelModeSideBySide}</SelectItem>
            <SelectItem value="swipe">{S.settings.duelModeSwipe}</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {S.settings.duelModeHelp}
        </p>
      </div>

      <Separator />

      {/* About / Features */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground">{S.settings.aboutHeading}</h2>
        <div className="flex gap-2 flex-wrap">
          <Button asChild variant="outline" size="sm">
            <Link to="/features">
              <Sparkles className="h-4 w-4 mr-1" />
              {S.settings.whatsInDuelList}
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/welcome">
              <Compass className="h-4 w-4 mr-1" />
              {S.settings.replayOnboarding}
            </Link>
          </Button>
        </div>
      </div>

      <Separator />

      {/* Export */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">{S.settings.exportHeading}</h2>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={exportAll}>
            <Download className="h-4 w-4 mr-1" />
            {S.export.exportAll}
          </Button>
          <Button variant="outline" size="sm" onClick={exportAppData}>
            <Download className="h-4 w-4 mr-1" />
            {S.export.exportAppData}
          </Button>
        </div>
      </div>

      <Separator />

      {/* Reminders nav card */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground">
          {S.settings.remindersHeading}
        </h2>
        <Button asChild variant="outline" className="w-full justify-between">
          <Link to="/settings/reminders">
            <span className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              {S.settings.remindersOpenLink}
            </span>
            <span className="text-xs text-muted-foreground">
              {settings.reminders.enabled
                ? S.settings.remindersStatusActive(
                    cadenceShortLabel(settings.reminders),
                    timeShortLabel(settings.reminders),
                  )
                : S.settings.remindersStatusOff}
            </span>
          </Link>
        </Button>
      </div>

      <Separator />

      {/* Storage */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground">
          {S.settings.storageHeading}
        </h2>
        <Progress value={storage.percentage} className="h-2" />
        <p className="text-xs text-muted-foreground">
          {S.settings.storageUsage(storage.current / 1024, storage.limit / 1024 / 1024)}
        </p>
      </div>
    </div>
  );
}
