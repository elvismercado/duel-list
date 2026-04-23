import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { S } from '@/lib/strings';
import { useList } from '@/hooks/useList';
import { useExport } from '@/hooks/useExport';
import { useFileSync } from '@/hooks/useFileSync';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Undo2, Download, Trash2, Link, Unlink } from 'lucide-react';

export default function ListSettings() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { supported, isSynced, needsRelink, linkFile, unlinkFile, syncToFile } = useFileSync(id);
  const onSave = useCallback(
    (l: import('@/types').ListConfig) => { syncToFile(l); },
    [syncToFile],
  );
  const { list, save, restoreItem, deleteList } = useList(id!, onSave);
  const { exportList, exportHistory } = useExport();
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!list) {
    return (
      <div className="p-4 max-w-lg mx-auto space-y-4 text-center mt-12">
        <h1 className="text-2xl font-bold">List not found</h1>
        <Button onClick={() => navigate('/')}>Go home</Button>
      </div>
    );
  }

  const removedItems = list.items.filter((i) => i.removed);

  // Debounced name save
  const [nameValue, setNameValue] = useState(list.name);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const saveName = useCallback(
    (name: string) => {
      save({ ...list!, name });
    },
    [list, save],
  );

  useEffect(() => {
    if (nameValue === list.name) return;
    debounceRef.current = setTimeout(() => saveName(nameValue), 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [nameValue, list.name, saveName]);

  function handleNameBlur() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (nameValue !== list!.name) saveName(nameValue);
  }

  function handleKFactorChange(value: string) {
    save({ ...list!, kFactor: parseInt(value, 10) });
  }

  function handleSessionLengthChange(value: string) {
    save({ ...list!, sessionLength: parseInt(value, 10) });
  }

  function handleDelete() {
    deleteList();
    navigate('/');
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{S.settings.title}</h1>

      {/* Name */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Name</label>
        <Input
          value={nameValue}
          onChange={(e) => setNameValue(e.target.value)}
          onBlur={handleNameBlur}
        />
      </div>

      {/* K-Factor */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{S.settings.kFactorLabel}</label>
        <Select
          value={String(list.kFactor)}
          onValueChange={handleKFactorChange}
        >
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

      {/* Session Length */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          {S.settings.sessionLengthLabel}
        </label>
        <Select
          value={String(list.sessionLength)}
          onValueChange={handleSessionLengthChange}
        >
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

      <Separator />

      {/* Removed Items */}
      {removedItems.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Removed items
          </h2>
          {removedItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-md border border-dashed p-2"
            >
              <span className="truncate text-sm">{item.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 min-h-[44px] min-w-[44px]"
                onClick={() => restoreItem(item.id)}
                aria-label={`Restore ${item.name}`}
              >
                <Undo2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Separator />
        </div>
      )}

      {/* Export */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground">Export</h2>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportList(list)}
          >
            <Download className="h-4 w-4 mr-1" />
            {S.export.listButton}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportHistory(list.id, list.name)}
          >
            <Download className="h-4 w-4 mr-1" />
            {S.export.historyButton}
          </Button>
        </div>
      </div>

      {/* File Sync */}
      {supported && (
        <>
          <Separator />
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground">
              File sync
            </h2>
            {isSynced ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Linked — changes sync to file automatically.
                </p>
                <Button variant="outline" size="sm" onClick={unlinkFile}>
                  <Unlink className="h-4 w-4 mr-1" />
                  Unlink file
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {needsRelink && (
                  <p className="text-sm text-destructive">
                    File sync lost — permission denied. Re-link to restore.
                  </p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => list && linkFile(list)}
                >
                  <Link className="h-4 w-4 mr-1" />
                  Link to file
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      <Separator />

      {/* Danger Zone */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-destructive">Danger zone</h2>
        <Button
          variant="destructive"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete list
        </Button>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete list"
        message={`Permanently delete "${list.name}" and all its history? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
