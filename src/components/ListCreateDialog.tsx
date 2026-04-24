import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { S } from '@/lib/strings';
import { SAMPLE_KEYS, getSampleList } from '@/lib/samples';

interface ListCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (
    name: string,
    kFactor: number,
    sessionLength: number,
    templateItems?: string[],
  ) => void;
}

const SESSION_PRESETS = [5, 10, 20, 50];

export function ListCreateDialog({
  open,
  onClose,
  onCreate,
}: ListCreateDialogProps) {
  const [name, setName] = useState('');
  const [kFactor, setKFactor] = useState('32');
  const [sessionLength, setSessionLength] = useState(10);

  function reset() {
    setName('');
    setKFactor('32');
    setSessionLength(10);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate(trimmed, parseInt(kFactor, 10), sessionLength);
    reset();
    onClose();
  }

  function handleQuickStart(key: string) {
    const sample = getSampleList(key);
    if (!sample) return;
    onCreate(
      sample.name,
      32,
      10,
      sample.items.map((i) => i.name),
    );
    reset();
    onClose();
  }

  function handleSessionLengthInput(raw: string) {
    const n = parseInt(raw, 10);
    if (Number.isNaN(n) || n < 0) return;
    setSessionLength(Math.min(n, 500));
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && (reset(), onClose())}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{S.home.createList}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2 rounded-md border bg-muted/40 p-3">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">{S.list.quickStartHeading}</p>
              <p className="text-xs text-muted-foreground">{S.list.quickStartDesc}</p>
            </div>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {SAMPLE_KEYS.map((key) => {
                const sample = getSampleList(key);
                if (!sample) return null;
                return (
                  <Button
                    key={`quick-${key}`}
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-auto flex-col items-start gap-0.5 px-2 py-1.5 text-left"
                    onClick={() => handleQuickStart(key)}
                  >
                    <span className="text-xs font-medium truncate w-full">{sample.name}</span>
                    <span className="text-[10px] font-normal text-muted-foreground">
                      {S.list.templateItemCount(sample.items.length)}
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{S.list.name}</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={S.list.namePlaceholder}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {S.settings.kFactorLabel}
            </label>
            <Select value={kFactor} onValueChange={setKFactor}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="48">{S.settings.kFactorQuick}</SelectItem>
                <SelectItem value="32">{S.settings.kFactorGradual}</SelectItem>
                <SelectItem value="16">{S.settings.kFactorTight}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="create-session-length">
              {S.settings.sessionLengthLabel}
            </label>
            <div className="flex gap-2">
              <Input
                id="create-session-length"
                type="number"
                min={0}
                max={500}
                value={sessionLength}
                onChange={(e) => handleSessionLengthInput(e.target.value)}
                className="w-28"
              />
              <span className="text-sm text-muted-foreground self-center">
                {sessionLength === 0 ? S.settings.sessionLengthUnlimited : S.settings.sessionLengthUnit}
              </span>
            </div>
            <div className="flex gap-1 flex-wrap">
              {SESSION_PRESETS.map((n) => (
                <Button
                  key={n}
                  type="button"
                  size="sm"
                  variant={sessionLength === n ? 'default' : 'outline'}
                  onClick={() => setSessionLength(n)}
                >
                  {n}
                </Button>
              ))}
              <Button
                type="button"
                size="sm"
                variant={sessionLength === 0 ? 'default' : 'outline'}
                onClick={() => setSessionLength(0)}
              >
                {S.settings.sessionLengthUnlimited}
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { reset(); onClose(); }}>
              {S.common.cancel}
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              {S.common.create}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
