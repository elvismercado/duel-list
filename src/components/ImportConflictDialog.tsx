import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { S } from '@/lib/strings';

interface ImportConflictDialogProps {
  open: boolean;
  existingName: string;
  incomingName: string;
  onReplace: () => void;
  onImportAsNew: () => void;
  onCancel: () => void;
}

export function ImportConflictDialog({
  open,
  existingName,
  incomingName,
  onReplace,
  onImportAsNew,
  onCancel,
}: ImportConflictDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{S.import.conflict.title}</DialogTitle>
          <DialogDescription>
            {S.import.conflict.message(existingName, incomingName)}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2 flex-col sm:flex-row">
          <Button variant="outline" onClick={onCancel}>
            {S.import.conflict.cancel}
          </Button>
          <Button variant="outline" onClick={onImportAsNew}>
            {S.import.conflict.importAsNew}
          </Button>
          <Button variant="destructive" onClick={onReplace}>
            {S.import.conflict.replace}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
