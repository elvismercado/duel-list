import { S } from '@/lib/strings';
import { getSettings, updateSettings, getStorageUsage } from '@/lib/storage';
import { applyTheme, type Theme } from '@/lib/theme';
import { useExport } from '@/hooks/useExport';
import { formatHourMinute } from '@/lib/datetime';
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
import { Download, Sparkles, Compass, Bell, HelpCircle, Sliders } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import type { AppSettings, CustomCadenceUnit, ReminderSettings } from '@/types';
import { CopyLastErrorButton } from '@/components/ErrorBoundary';
import { clearErrorLog, getLastError } from '@/lib/errorLog';

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

function timeShortLabel(r: ReminderSettings, fmt: AppSettings['timeFormat']): string {
  return formatHourMinute(r.preferredHour, r.preferredMinute, fmt);
}

export default function AppSettingsPage() {
  const [settings, setSettings] = useState(getSettings);
  const { exportAll, exportAppData } = useExport();
  const storage = getStorageUsage();

  function handleThemeChange(theme: string) {
    const t = theme as Theme;
    updateSettings({ theme: t });
    setSettings(getSettings());
    applyTheme(t);
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

      {/* Time format */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{S.settings.timeFormatLabel}</label>
        <Select
          value={settings.timeFormat ?? '24h'}
          onValueChange={(v) => {
            updateSettings({ timeFormat: v as '12h' | '24h' });
            setSettings(getSettings());
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">{S.settings.timeFormat24h}</SelectItem>
            <SelectItem value="12h">{S.settings.timeFormat12h}</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {S.settings.timeFormatHelp}
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
          <Button asChild variant="outline" size="sm">
            <Link to="/settings/glossary">
              <HelpCircle className="h-4 w-4 mr-1" />
              {S.glossary.openLink}
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

      {/* New list defaults nav card */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground">
          {S.settings.defaultsHeading}
        </h2>
        <Button asChild variant="outline" className="w-full justify-between">
          <Link to="/settings/defaults">
            <span className="flex items-center gap-2">
              <Sliders className="h-4 w-4" />
              {S.settings.defaultsOpenLink}
            </span>
          </Link>
        </Button>
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
                    timeShortLabel(settings.reminders, settings.timeFormat ?? '24h'),
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

      <Separator />

      <DeveloperZone />
    </div>
  );
}

function DeveloperZone() {
  const [throwNow, setThrowNow] = useState(false);
  const [logTick, setLogTick] = useState(0);
  const last = getLastError();

  function handleClear() {
    if (!last) return;
    if (!window.confirm(S.settings.devClearLogConfirm)) return;
    clearErrorLog();
    setLogTick((t) => t + 1);
  }

  return (
    <details className="rounded-lg border bg-card">
      <summary className="cursor-pointer select-none px-3 py-2 text-sm font-semibold text-muted-foreground">
        {S.settings.developerHeading}
      </summary>
      <div className="space-y-3 px-3 pb-3 pt-1">
        <p className="text-xs text-muted-foreground">{S.settings.developerHelp}</p>

        <div className="space-y-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setThrowNow(true)}
          >
            {S.settings.devTriggerError}
          </Button>
          <p className="text-xs text-muted-foreground">
            {S.settings.devTriggerErrorHelp}
          </p>
          {throwNow && <ErrorBomb />}
        </div>

        <div className="space-y-1">
          {last ? (
            <p
              className="text-xs text-muted-foreground truncate"
              title={`${new Date(last.ts).toLocaleString()} \u00b7 ${last.message}`}
            >
              {S.settings.devLastErrorPreview(
                new Date(last.ts).toLocaleString(),
                last.message,
              )}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {S.settings.devNoErrorYet}
            </p>
          )}
          <div className="flex gap-2 flex-wrap">
            {/* key forces a refetch of getLastError after clear */}
            <CopyLastErrorButton key={logTick} variant="outline" />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClear}
              disabled={!last}
            >
              {S.settings.devClearLog}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {S.settings.devCopyLastErrorHelp}
          </p>
        </div>
      </div>
    </details>
  );
}

function ErrorBomb(): never {
  throw new Error('Manually triggered from Developer zone');
}
