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
          <DialogTitle>Add items</DialogTitle>
          <DialogDescription>One item per line</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            className="w-full min-h-[120px] rounded-md border bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"Naruto\nOne Piece\nAttack on Titan"}
            autoFocus
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!text.trim()}>
              Add
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
