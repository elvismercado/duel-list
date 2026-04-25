import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { S } from '@/lib/strings';

interface AddItemsDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (names: string[]) => void;
}

export function AddItemsDialog({ open, onClose, onAdd }: AddItemsDialogProps) {
  const [text, setText] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const names = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (names.length === 0) return;
    onAdd(names);
    setText('');
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{S.list.addItemsTitle}</DialogTitle>
          <DialogDescription>{S.list.addItemsHelp}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            className="min-h-[120px]"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={S.list.addItemsPlaceholder}
            autoFocus
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {S.common.cancel}
            </Button>
            <Button type="submit" disabled={!text.trim()}>
              {S.common.add}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
