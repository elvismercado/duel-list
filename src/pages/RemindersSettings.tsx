import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { S } from '@/lib/strings';
import { getSettings, updateSettings, getAllLists, getList } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ButtonGroup } from '@/components/ui/button-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Bell } from 'lucide-react';
import type {
  CustomCadenceUnit,
  ReminderCadence,
  ReminderChannel,
  ReminderSettings,
} from '@/types';

const PRESET_HOURS = [9, 12, 19, 21] as const;

function isPresetHour(hour: number, minute: number): boolean {
  return minute === 0 && (PRESET_HOURS as readonly number[]).includes(hour);
}

export default function RemindersSettingsPage() {
  const [settings, setSettings] = useState(getSettings);
  const navigate = useNavigate();
  const r = settings.reminders;

  function patch(p: Partial<ReminderSettings>) {
    updateSettings({ reminders: { ...r, ...p } });
    setSettings(getSettings());
  }

  function handleTest() {
    navigate('/?testReminder=1');
  }

  const preferredMode: 'preset' | 'custom' = isPresetHour(r.preferredHour, r.preferredMinute)
    ? 'preset'
    : 'custom';

  function handlePreferredPreset(hourStr: string) {
    if (hourStr === 'custom') {
      // Switch to custom — keep existing or default to 8:30
      if (preferredMode === 'preset') {
        patch({ preferredHour: 8, preferredMinute: 30 });
      }
      return;
    }
    patch({ preferredHour: parseInt(hourStr, 10), preferredMinute: 0 });
  }

  const allLists = getAllLists();

  const cadenceLabel = (() => {
    switch (r.cadence) {
      case 'off': return S.settings.remindersCadenceOff;
      case 'daily': return S.settings.remindersCadenceDaily;
      case 'weekly': return S.settings.remindersCadenceWeekly;
      case 'monthly': return S.settings.remindersCadenceMonthly;
      case 'custom': return `${r.customCount} ${unitLabel(r.customUnit)}`;
    }
  })();

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" aria-label={S.settings.remindersBack}>
          <Link to="/settings">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{S.settings.remindersHeading}</h1>
      </div>

      <p className="text-sm text-muted-foreground">{S.settings.remindersHelp}</p>

      <div>
        <Button variant="outline" onClick={handleTest}>
          <Bell className="h-4 w-4 mr-1" />
          {S.settings.remindersTestButton}
        </Button>
        <p className="text-xs text-muted-foreground mt-1">
          {S.settings.remindersTestHelp}
        </p>
      </div>

      <Separator />

      {/* Master toggle */}
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm font-medium">{S.settings.remindersEnabledLabel}</label>
        <Button
          variant={r.enabled ? 'default' : 'outline'}
          size="sm"
          onClick={() => patch({ enabled: !r.enabled })}
          aria-pressed={r.enabled}
        >
          {r.enabled ? 'On' : 'Off'}
        </Button>
      </div>

      {r.enabled && (
        <>
          {/* Cadence */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{S.settings.remindersCadenceLabel}</label>
            <ButtonGroup<ReminderCadence>
              value={r.cadence}
              onChange={(v) => patch({ cadence: v })}
              ariaLabel={S.settings.remindersCadenceLabel}
              options={[
                { value: 'daily', label: S.settings.remindersCadenceDaily },
                { value: 'weekly', label: S.settings.remindersCadenceWeekly },
                { value: 'monthly', label: S.settings.remindersCadenceMonthly },
                { value: 'custom', label: S.settings.remindersCadenceCustom },
              ]}
            />
            <p className="text-xs text-muted-foreground">{cadenceLabel}</p>
          </div>

          {/* Custom count + unit */}
          {r.cadence === 'custom' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {S.settings.remindersCustomCountLabel}
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={99}
                  value={r.customCount}
                  onChange={(e) => {
                    const n = Math.max(1, Math.min(99, parseInt(e.target.value, 10) || 1));
                    patch({ customCount: n });
                  }}
                  className="w-20"
                />
                <Select
                  value={r.customUnit}
                  onValueChange={(v) => patch({ customUnit: v as CustomCadenceUnit })}
                >
                  <SelectTrigger className="w-auto">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">{S.settings.remindersUnitDay}</SelectItem>
                    <SelectItem value="week">{S.settings.remindersUnitWeek}</SelectItem>
                    <SelectItem value="month">{S.settings.remindersUnitMonth}</SelectItem>
                    <SelectItem value="year">{S.settings.remindersUnitYear}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Preferred time */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {S.settings.remindersPreferredHourLabel}
            </label>
            <ButtonGroup<string>
              value={preferredMode === 'preset' ? String(r.preferredHour) : 'custom'}
              onChange={handlePreferredPreset}
              ariaLabel={S.settings.remindersPreferredHourLabel}
              options={[
                { value: '9', label: S.settings.remindersPreferredHourMorning },
                { value: '12', label: S.settings.remindersPreferredHourMidday },
                { value: '19', label: S.settings.remindersPreferredHourEvening },
                { value: '21', label: S.settings.remindersPreferredHourNight },
                { value: 'custom', label: S.settings.remindersPreferredHourCustom },
              ]}
            />
            {preferredMode === 'custom' && (
              <div className="space-y-1">
                <label htmlFor="preferred-time" className="text-xs text-muted-foreground">
                  {S.settings.remindersPreferredTimeCustomLabel}
                </label>
                <Input
                  id="preferred-time"
                  type="time"
                  value={`${pad(r.preferredHour)}:${pad(r.preferredMinute)}`}
                  onChange={(e) => {
                    const [h, m] = e.target.value.split(':').map((v) => parseInt(v, 10));
                    if (Number.isFinite(h) && Number.isFinite(m)) {
                      patch({ preferredHour: h, preferredMinute: m });
                    }
                  }}
                  className="w-32"
                />
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {S.settings.remindersPreferredCurrent(
                `${pad(r.preferredHour)}:${pad(r.preferredMinute)}`,
              )}
            </p>
          </div>

          {/* Quiet hours */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="text-sm font-medium">
                {S.settings.remindersQuietHoursToggleLabel}
              </label>
              <Button
                variant={r.quietHoursEnabled ? 'default' : 'outline'}
                size="sm"
                onClick={() => patch({ quietHoursEnabled: !r.quietHoursEnabled })}
                aria-pressed={r.quietHoursEnabled}
              >
                {r.quietHoursEnabled ? 'On' : 'Off'}
              </Button>
            </div>
            {r.quietHoursEnabled && (
              <>
                <div className="flex items-center gap-2">
                  <Select
                    value={String(r.quietHoursStart)}
                    onValueChange={(v) =>
                      patch({ quietHoursStart: parseInt(v, 10) })
                    }
                  >
                    <SelectTrigger className="w-auto">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={String(i)}>
                          {pad(i)}:00
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-muted-foreground">→</span>
                  <Select
                    value={String(r.quietHoursEnd)}
                    onValueChange={(v) =>
                      patch({ quietHoursEnd: parseInt(v, 10) })
                    }
                  >
                    <SelectTrigger className="w-auto">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={String(i)}>
                          {pad(i)}:00
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground">
                  {S.settings.remindersQuietHoursHelp}
                </p>
              </>
            )}
          </div>

          {/* Channel */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{S.settings.remindersChannelLabel}</label>
            <Select
              value={r.channel}
              onValueChange={(v) => patch({ channel: v as ReminderChannel })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in-app">{S.settings.remindersChannelInApp}</SelectItem>
                <SelectItem value="os">{S.settings.remindersChannelOs}</SelectItem>
                <SelectItem value="both">{S.settings.remindersChannelBoth}</SelectItem>
              </SelectContent>
            </Select>
            {r.channel !== 'in-app' && (
              <p className="text-xs text-muted-foreground">
                {S.settings.remindersOsUnsupported}
              </p>
            )}
          </div>

          {/* Per-list opt-out */}
          {allLists.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {S.settings.remindersPerListHeading}
              </label>
              <p className="text-xs text-muted-foreground">
                {S.settings.remindersPerListHelp}
              </p>
              <div className="space-y-2">
                {allLists.map((entry) => {
                  const skipped = r.perListOptOut.includes(entry.id);
                  const list = getList(entry.id);
                  const itemCount =
                    list?.items.filter((i) => !i.removed).length ?? 0;
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => {
                        const set = new Set(r.perListOptOut);
                        if (skipped) set.delete(entry.id);
                        else set.add(entry.id);
                        patch({ perListOptOut: Array.from(set) });
                      }}
                      aria-pressed={skipped}
                      className="w-full flex items-center gap-3 rounded-lg border bg-muted/30 hover:bg-muted/60 transition-colors p-3 text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{entry.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {S.settings.remindersPerListItemsCount(itemCount)}
                        </div>
                      </div>
                      <div
                        className={
                          'inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ' +
                          (skipped
                            ? 'bg-muted text-muted-foreground'
                            : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300')
                        }
                      >
                        <span
                          className={
                            'h-1.5 w-1.5 rounded-full ' +
                            (skipped ? 'bg-muted-foreground/50' : 'bg-emerald-500')
                          }
                        />
                        {skipped
                          ? S.settings.remindersPerListSkipped
                          : S.settings.remindersPerListReminding}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function unitLabel(unit: CustomCadenceUnit): string {
  switch (unit) {
    case 'day': return S.settings.remindersUnitDay;
    case 'week': return S.settings.remindersUnitWeek;
    case 'month': return S.settings.remindersUnitMonth;
    case 'year': return S.settings.remindersUnitYear;
  }
}
