import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { S } from '@/lib/strings';
import { getSettings, updateSettings, getAllLists, getList } from '@/lib/storage';
import { formatHourMinute } from '@/lib/datetime';
import {
  getPermission,
  notificationsSupported,
  requestPermission,
  showLocal,
  triggerSupported,
} from '@/lib/notifications';
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
import { Bell } from 'lucide-react';
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
  const fmt = settings.timeFormat ?? '24h';

  function patch(p: Partial<ReminderSettings>) {
    updateSettings({ reminders: { ...r, ...p } });
    setSettings(getSettings());
  }

  async function handleTest() {
    const wantsOs = r.channel === 'os' || r.channel === 'both';
    // Clicking "Send test" with OS chosen but permission still 'default' is
    // strong intent.prompt now so the user sees an actual OS notification
    // instead of silently falling back to the in-app banner.
    if (wantsOs && getPermission() === 'default') {
      await requestPermission();
    }
    const osDeliverable = wantsOs && getPermission() === 'granted';
    if (osDeliverable) {
      void showLocal({
        title: S.settings.osNotificationTitle,
        body: S.settings.osNotificationBody('Duel⚡List', 0),
        url: '/',
      });
    }
    // Show the in-app banner whenever the channel includes in-app, or as a
    // fallback when OS was chosen but isn't actually deliverable yet.
    const wantsInApp = r.channel === 'in-app' || r.channel === 'both';
    if (wantsInApp || !osDeliverable) {
      navigate('/?testReminder=1');
    }
  }

  const preferredMode: 'preset' | 'custom' = isPresetHour(r.preferredHour, r.preferredMinute)
    ? 'preset'
    : 'custom';

  function handlePreferredPreset(hourStr: string) {
    if (hourStr === 'custom') {
      // Switch to custom.keep existing or default to 8:30
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
      <h1 className="text-2xl font-bold">{S.settings.remindersHeading}</h1>

      <p className="text-sm text-muted-foreground">{S.settings.remindersHelp}</p>

      <div>
        <Button variant="outline" onClick={() => void handleTest()}>
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
                  inputMode="numeric"
                  min={1}
                  max={99}
                  value={r.customCount}
                  onChange={(e) => {
                    const n = Math.max(1, Math.min(99, parseInt(e.target.value, 10) || 1));
                    patch({ customCount: n });
                  }}
                  className="w-20"
                  aria-label={S.settings.remindersCustomCountLabel}
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
                { value: '9', label: S.settings.remindersPreferredHourMorning(formatHourMinute(9, 0, fmt)) },
                { value: '12', label: S.settings.remindersPreferredHourMidday(formatHourMinute(12, 0, fmt)) },
                { value: '19', label: S.settings.remindersPreferredHourEvening(formatHourMinute(19, 0, fmt)) },
                { value: '21', label: S.settings.remindersPreferredHourNight(formatHourMinute(21, 0, fmt)) },
                { value: 'custom', label: S.settings.remindersPreferredHourCustom },
              ]}
            />
            {preferredMode === 'custom' && (
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">
                  {S.settings.remindersPreferredTimeCustomLabel}
                </span>
                <PreferredTimePicker
                  hour={r.preferredHour}
                  minute={r.preferredMinute}
                  fmt={fmt}
                  onChange={(h, m) => patch({ preferredHour: h, preferredMinute: m })}
                />
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {S.settings.remindersPreferredCurrent(
                formatHourMinute(r.preferredHour, r.preferredMinute, fmt),
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
                    value={String(r.quietHoursStart * 60 + (r.quietHoursStartMinute ?? 0))}
                    onValueChange={(v) => {
                      const total = parseInt(v, 10);
                      patch({
                        quietHoursStart: Math.floor(total / 60),
                        quietHoursStartMinute: total % 60,
                      });
                    }}
                  >
                    <SelectTrigger className="w-auto">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {QUIET_HOUR_STEPS.map(([h, m]) => (
                        <SelectItem key={h * 60 + m} value={String(h * 60 + m)}>
                          {formatHourMinute(h, m, fmt)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-muted-foreground">→</span>
                  <Select
                    value={String(r.quietHoursEnd * 60 + (r.quietHoursEndMinute ?? 0))}
                    onValueChange={(v) => {
                      const total = parseInt(v, 10);
                      patch({
                        quietHoursEnd: Math.floor(total / 60),
                        quietHoursEndMinute: total % 60,
                      });
                    }}
                  >
                    <SelectTrigger className="w-auto">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {QUIET_HOUR_STEPS.map(([h, m]) => (
                        <SelectItem key={h * 60 + m} value={String(h * 60 + m)}>
                          {formatHourMinute(h, m, fmt)}
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
              <OsPermissionPanel />
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
                            : 'bg-success/15 text-success')
                        }
                      >
                        <span
                          className={
                            'h-1.5 w-1.5 rounded-full ' +
                            (skipped ? 'bg-muted-foreground/50' : 'bg-success')
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

const MINUTE_STEPS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55] as const;

const QUIET_HOUR_STEPS: ReadonlyArray<readonly [number, number]> = Array.from(
  { length: 96 },
  (_, i) => [Math.floor(i / 4), (i % 4) * 15] as const,
);

function PreferredTimePicker({
  hour,
  minute,
  fmt,
  onChange,
}: {
  hour: number;
  minute: number;
  fmt: '12h' | '24h';
  onChange: (h: number, m: number) => void;
}) {
  // Snap displayed minute to nearest 5-min step for selection display.
  const snappedMinute = MINUTE_STEPS.reduce((best, step) =>
    Math.abs(step - minute) < Math.abs(best - minute) ? step : best,
  0);

  if (fmt === '24h') {
    return (
      <div className="flex items-center gap-1">
        <Select
          value={String(hour)}
          onValueChange={(v) => onChange(parseInt(v, 10), snappedMinute)}
        >
          <SelectTrigger className="w-auto" aria-label="Hour"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Array.from({ length: 24 }, (_, i) => (
              <SelectItem key={i} value={String(i)}>{pad(i)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-muted-foreground">:</span>
        <Select
          value={String(snappedMinute)}
          onValueChange={(v) => onChange(hour, parseInt(v, 10))}
        >
          <SelectTrigger className="w-auto" aria-label="Minute"><SelectValue /></SelectTrigger>
          <SelectContent>
            {MINUTE_STEPS.map((m) => (
              <SelectItem key={m} value={String(m)}>{pad(m)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  // 12h mode
  const period: 'AM' | 'PM' = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const setFrom12 = (h12: number, m: number, p: 'AM' | 'PM') => {
    const h24 = (h12 % 12) + (p === 'PM' ? 12 : 0);
    onChange(h24, m);
  };

  return (
    <div className="flex items-center gap-1">
      <Select
        value={String(hour12)}
        onValueChange={(v) => setFrom12(parseInt(v, 10), snappedMinute, period)}
      >
        <SelectTrigger className="w-auto" aria-label="Hour"><SelectValue /></SelectTrigger>
        <SelectContent>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
            <SelectItem key={h} value={String(h)}>{h}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-muted-foreground">:</span>
      <Select
        value={String(snappedMinute)}
        onValueChange={(v) => setFrom12(hour12, parseInt(v, 10), period)}
      >
        <SelectTrigger className="w-auto" aria-label="Minute"><SelectValue /></SelectTrigger>
        <SelectContent>
          {MINUTE_STEPS.map((m) => (
            <SelectItem key={m} value={String(m)}>{pad(m)}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={period}
        onValueChange={(v) => setFrom12(hour12, snappedMinute, v as 'AM' | 'PM')}
      >
        <SelectTrigger className="w-auto" aria-label="AM or PM"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="AM">AM</SelectItem>
          <SelectItem value="PM">PM</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function OsPermissionPanel() {
  const supported = notificationsSupported();
  const [permission, setPermission] = useState<NotificationPermission>(
    supported ? getPermission() : 'denied',
  );
  const [scheduleSupported, setScheduleSupported] = useState<boolean | null>(null);

  useEffect(() => {
    if (!supported) return;
    void triggerSupported().then(setScheduleSupported);
  }, [supported]);

  if (!supported) {
    return (
      <p className="text-xs text-muted-foreground">
        {S.settings.remindersOsUnsupported}
      </p>
    );
  }

  async function handleEnable() {
    const next = await requestPermission();
    setPermission(next);
    if (next === 'granted') {
      void triggerSupported().then(setScheduleSupported);
    }
  }

  return (
    <div className="space-y-2 rounded-md border bg-muted/30 p-3">
      {permission === 'granted' && (
        <p className="text-xs text-muted-foreground">
          {S.settings.remindersPermissionGranted}
        </p>
      )}
      {permission === 'denied' && (
        <p className="text-xs text-muted-foreground">
          {S.settings.remindersPermissionDenied}
        </p>
      )}
      {permission === 'default' && (
        <>
          <p className="text-xs text-muted-foreground">
            {S.settings.remindersPermissionDefault}
          </p>
          <Button size="sm" variant="outline" onClick={handleEnable}>
            <Bell className="h-4 w-4 mr-1" />
            {S.settings.remindersPermissionEnableButton}
          </Button>
        </>
      )}
      {permission === 'granted' && scheduleSupported === false && (
        <p className="text-xs text-muted-foreground">
          {S.settings.remindersTriggerUnsupportedHelp}
        </p>
      )}
    </div>
  );
}

