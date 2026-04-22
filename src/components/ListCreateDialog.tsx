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

interface ListCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, kFactor: number, sessionLength: number) => void;
}

export function ListCreateDialog({
  open,
  onClose,
  onCreate,
}: ListCreateDialogProps) {
  const [name, setName] = useState('');
  const [kFactor, setKFactor] = useState('32');
  const [sessionLength, setSessionLength] = useState('10');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate(trimmed, parseInt(kFactor, 10), parseInt(sessionLength, 10));
    setName('');
    setKFactor('32');
    setSessionLength('10');
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{S.home.createList}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Top Anime"
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
            <label className="text-sm font-medium">
              {S.settings.sessionLengthLabel}
            </label>
            <Select value={sessionLength} onValueChange={setSessionLength}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 duels</SelectItem>
                <SelectItem value="10">10 duels</SelectItem>
                <SelectItem value="20">20 duels</SelectItem>
                <SelectItem value="0">Unlimited</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
