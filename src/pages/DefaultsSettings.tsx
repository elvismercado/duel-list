import { useState } from 'react';
import { toast } from 'sonner';
import { S } from '@/lib/strings';
import {
  applyDefaultToAllLists,
  getAllLists,
  getSettings,
  updateSettings,
} from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ButtonGroup } from '@/components/ui/button-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { HelpHint } from '@/components/HelpHint';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { SESSION_PRESETS } from '@/lib/constants';

type ConfirmKind = 'kFactor' | 'sessionLength' | null;

function kFactorLabel(value: number): string {
  if (value === 48) return S.settings.kFactorQuick;
  if (value === 16) return S.settings.kFactorTight;
  return S.settings.kFactorGradual;
}

function sessionLengthLabel(value: number): string {
  if (value === 0) return S.settings.sessionLengthUnlimited;
  return `${value} ${S.settings.sessionLengthUnit}`;
}

export default function DefaultsSettingsPage() {
  const [settings, setSettings] = useState(getSettings);
  const [confirm, setConfirm] = useState<ConfirmKind>(null);
  const listCount = getAllLists().length;

  function handleKFactorChange(value: string) {
    updateSettings({ defaultKFactor: parseInt(value, 10) });
    setSettings(getSettings());
  }

  function handleSessionLengthChange(raw: string) {
    const n = parseInt(raw, 10);
    if (Number.isNaN(n) || n < 0) return;
    updateSettings({ defaultSessionLength: Math.min(n, 500) });
    setSettings(getSettings());
  }

  function handleApply(field: 'kFactor' | 'sessionLength') {
    const value =
      field === 'kFactor'
        ? settings.defaultKFactor
        : settings.defaultSessionLength;
    const count = applyDefaultToAllLists(field, value);
    setConfirm(null);
    if (count === 0) {
      toast(S.settings.applyNoChange);
    } else {
      toast.success(S.settings.applySuccess(count));
    }
  }

  const confirmTitle =
    confirm === 'kFactor'
      ? S.settings.applyKFactorConfirmTitle
      : S.settings.applySessionConfirmTitle;
  const confirmMessage =
    confirm === 'kFactor'
      ? S.settings.applyKFactorConfirmMessage(
          kFactorLabel(settings.defaultKFactor),
          listCount,
        )
      : confirm === 'sessionLength'
        ? S.settings.applySessionConfirmMessage(
            sessionLengthLabel(settings.defaultSessionLength),
            listCount,
          )
        : '';

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{S.settings.defaultsTitle}</h1>
        <p className="text-xs text-muted-foreground mt-1">
          {S.settings.defaultsSubtitle}
        </p>
      </div>

      {/* Default K-Factor */}
      <div className="space-y-2">
        <div className="flex items-center gap-1">
          <label className="text-sm font-medium">{S.settings.kFactorLabel}</label>
          <HelpHint anchor="ranking-speed" term={S.glossary.termRankingSpeedLabel} />
        </div>
        <Select
          value={String(settings.defaultKFactor)}
          onValueChange={handleKFactorChange}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="48" title={S.settings.kFactorTooltipQuick}>
              {S.settings.kFactorQuick}
            </SelectItem>
            <SelectItem value="32" title={S.settings.kFactorTooltipGradual}>
              {S.settings.kFactorGradual}
            </SelectItem>
            <SelectItem value="16" title={S.settings.kFactorTooltipTight}>
              {S.settings.kFactorTight}
            </SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">{S.settings.defaultsKFactorHelp}</p>
        {listCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirm('kFactor')}
          >
            {S.settings.applyToAllLists}
          </Button>
        )}
      </div>

      <Separator />

      {/* Default Session Length */}
      <div className="space-y-2">
        <div className="flex items-center gap-1">
          <label className="text-sm font-medium">{S.settings.sessionLengthLabel}</label>
          <HelpHint anchor="session" term={S.glossary.termSessionLabel} />
        </div>
        <ButtonGroup<string>
          value={
            settings.defaultSessionLength === 0
              ? '0'
              : SESSION_PRESETS.includes(
                    settings.defaultSessionLength as typeof SESSION_PRESETS[number],
                  )
                ? String(settings.defaultSessionLength)
                : 'custom'
          }
          onChange={(v) => {
            if (v === 'custom') {
              handleSessionLengthChange('15');
            } else {
              handleSessionLengthChange(v);
            }
          }}
          ariaLabel={S.settings.sessionLengthLabel}
          options={[
            ...SESSION_PRESETS.map((n) => ({ value: String(n), label: String(n) })),
            { value: '0', label: S.settings.sessionLengthUnlimited },
            { value: 'custom', label: S.settings.sessionLengthCustom },
          ]}
        />
        {!SESSION_PRESETS.includes(
          settings.defaultSessionLength as typeof SESSION_PRESETS[number],
        ) &&
          settings.defaultSessionLength !== 0 && (
            <div className="flex gap-2">
              <Input
                id="defaults-session-length-input"
                type="number"
                min={1}
                max={500}
                value={settings.defaultSessionLength}
                onChange={(e) => handleSessionLengthChange(e.target.value)}
                className="w-28"
              />
              <span className="text-sm text-muted-foreground self-center">
                {S.settings.sessionLengthUnit}
              </span>
            </div>
          )}
        <p className="text-xs text-muted-foreground">{S.settings.defaultsSessionHelp}</p>
        {listCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirm('sessionLength')}
          >
            {S.settings.applyToAllLists}
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={confirm !== null}
        title={confirmTitle}
        message={confirmMessage}
        confirmLabel={S.settings.applyConfirmButton}
        onConfirm={() => confirm && handleApply(confirm)}
        onCancel={() => setConfirm(null)}
        danger
      />
    </div>
  );
}
