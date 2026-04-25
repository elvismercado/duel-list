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
import type { AppSettings, CustomCadenceUnit, ReminderSettings, DuelMode } from '@/types';
import { CopyLastErrorButton } from '@/components/ErrorBoundary';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { clearErrorLog, getLastError } from '@/lib/errorLog';
import { DUEL_MODES } from '@/lib/duelModes';

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
    updateSettings({ duelMode: mode as DuelMode });
    setSettings(getSettings());
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{S.settings.titleApp}</h1>

      {/* ==================== Ranking & sessions ==================== */}
      <section aria-labelledby="group-ranking" className="space-y-4">
        <h2
          id="group-ranking"
          className="text-sm font-semibold text-muted-foreground uppercase tracking-wide"
        >
          {S.settings.groupRanking}
        </h2>

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
              {DUEL_MODES.map((mode) => (
                <SelectItem key={mode.value} value={mode.value}>
                  <span className="flex items-center gap-2">
                    <span>{mode.label}</span>
                    {mode.status === 'coming-soon' && (
                      <span className="inline-flex items-center rounded-full bg-brand-soft text-brand-deep px-2 py-0.5 text-[10px] font-medium">
                        {S.settings.duelModeComingSoonBadge}
                      </span>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{S.settings.duelModeHelp}</p>
        </div>

        {/* New list defaults nav card */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">{S.settings.defaultsHeading}</h3>
          <Button asChild variant="outline" className="w-full justify-between">
            <Link to="/settings/defaults">
              <span className="flex items-center gap-2">
                <Sliders className="h-4 w-4" />
                {S.settings.defaultsOpenLink}
              </span>
            </Link>
          </Button>
        </div>

        {/* Reminders nav card */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">{S.settings.remindersHeading}</h3>
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
      </section>

      <Separator />

      {/* ==================== Appearance ==================== */}
      <section aria-labelledby="group-appearance" className="space-y-4">
        <h2
          id="group-appearance"
          className="text-sm font-semibold text-muted-foreground uppercase tracking-wide"
        >
          {S.settings.groupAppearance}
        </h2>

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
          <p className="text-xs text-muted-foreground">{S.settings.timeFormatHelp}</p>
        </div>
      </section>

      <Separator />

      {/* ==================== Your data ==================== */}
      <section aria-labelledby="group-data" className="space-y-4">
        <h2
          id="group-data"
          className="text-sm font-semibold text-muted-foreground uppercase tracking-wide"
        >
          {S.settings.groupData}
        </h2>

        {/* Export */}
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

        {/* Storage */}
        <div className="space-y-1">
          <Progress value={storage.percentage} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {S.settings.storageUsage(storage.current / 1024, storage.limit / 1024 / 1024)}
          </p>
        </div>
      </section>

      <Separator />

      {/* ==================== Help & info ==================== */}
      <section aria-labelledby="group-help" className="space-y-4">
        <h2
          id="group-help"
          className="text-sm font-semibold text-muted-foreground uppercase tracking-wide"
        >
          {S.settings.groupHelp}
        </h2>

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
      </section>

      <Separator />

      <DeveloperZone />
    </div>
  );
}

function DeveloperZone() {
  const [throwNow, setThrowNow] = useState(false);
  const [logTick, setLogTick] = useState(0);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const last = getLastError();

  function handleClear() {
    if (!last) return;
    setClearConfirmOpen(true);
  }

  function confirmClear() {
    clearErrorLog();
    setLogTick((t) => t + 1);
    setClearConfirmOpen(false);
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
      <ConfirmDialog
        open={clearConfirmOpen}
        title={S.settings.devClearLog}
        message={S.settings.devClearLogConfirm}
        confirmLabel={S.settings.devClearLog}
        danger
        onConfirm={confirmClear}
        onCancel={() => setClearConfirmOpen(false)}
      />
    </details>
  );
}

function ErrorBomb(): never {
  throw new Error('Manually triggered from Developer zone');
}
