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
  const [template, setTemplate] = useState<string | null>(null);

  function reset() {
    setName('');
    setKFactor('32');
    setSessionLength(10);
    setTemplate(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    let items: string[] | undefined;
    if (template) {
      const sample = getSampleList(template);
      items = sample?.items.map((i) => i.name);
    }
    onCreate(trimmed, parseInt(kFactor, 10), sessionLength, items);
    reset();
    onClose();
  }

  function pickTemplate(key: string) {
    if (template === key) {
      setTemplate(null);
      return;
    }
    setTemplate(key);
    if (!name.trim()) {
      const sample = getSampleList(key);
      if (sample) setName(sample.name);
    }
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
              {S.list.startFromTemplate}
            </label>
            <div className="flex gap-1 flex-wrap">
              {SAMPLE_KEYS.map((key) => {
                const sample = getSampleList(key);
                if (!sample) return null;
                return (
                  <Button
                    key={key}
                    type="button"
                    size="sm"
                    variant={template === key ? 'default' : 'outline'}
                    onClick={() => pickTemplate(key)}
                  >
                    {sample.name}
                  </Button>
                );
              })}
            </div>
            {template && (
              <p className="text-xs text-muted-foreground">
                {S.list.templateItemsAdded(getSampleList(template)?.items.length ?? 0)}
              </p>
            )}
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
