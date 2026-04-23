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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Undo2, Download, Trash2, Link, Unlink, Pencil, Check, Archive } from 'lucide-react';

const SESSION_PRESETS = [5, 10, 20, 50];

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
  const [removedOpen, setRemovedOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);

  if (!list) {
    return (
      <div className="p-4 max-w-lg mx-auto space-y-4 text-center mt-12">
        <h1 className="text-2xl font-bold">{S.common.listNotFound}</h1>
        <Button onClick={() => navigate('/')}>{S.common.goHome}</Button>
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
    setEditingName(false);
  }

  function handleKFactorChange(value: string) {
    save({ ...list!, kFactor: parseInt(value, 10) });
  }

  function handleSessionLengthChange(raw: string) {
    const n = parseInt(raw, 10);
    if (Number.isNaN(n) || n < 0) return;
    save({ ...list!, sessionLength: n });
  }

  function handleDelete() {
    deleteList();
    navigate('/');
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{S.settings.title}</h1>

      {/* Name — read-only display with edit button */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{S.list.name}</label>
        {editingName ? (
          <div className="flex gap-2">
            <Input
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={handleNameBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
                if (e.key === 'Escape') {
                  setNameValue(list.name);
                  setEditingName(false);
                }
              }}
              autoFocus
            />
            <Button
              variant="outline"
              size="icon"
              className="min-h-[44px] min-w-[44px] shrink-0"
              onClick={handleNameBlur}
              aria-label={S.common.saveName}
            >
              <Check className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-2">
            <span className="flex-1 truncate">{list.name}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 min-h-[44px] min-w-[44px] shrink-0"
              onClick={() => setEditingName(true)}
              aria-label={S.common.editName}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        )}
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

      {/* Session Length — number input + preset chips */}
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="session-length-input">
          {S.settings.sessionLengthLabel}
        </label>
        <div className="flex gap-2">
          <Input
            id="session-length-input"
            type="number"
            min={0}
            max={500}
            value={list.sessionLength}
            onChange={(e) => handleSessionLengthChange(e.target.value)}
            className="w-28"
          />
          <span className="text-sm text-muted-foreground self-center">
            {list.sessionLength === 0 ? S.settings.sessionLengthUnlimited : S.settings.sessionLengthUnit}
          </span>
        </div>
        <div className="flex gap-1 flex-wrap">
          {SESSION_PRESETS.map((n) => (
            <Button
              key={n}
              size="sm"
              variant={list.sessionLength === n ? 'default' : 'outline'}
              onClick={() => handleSessionLengthChange(String(n))}
            >
              {n}
            </Button>
          ))}
          <Button
            size="sm"
            variant={list.sessionLength === 0 ? 'default' : 'outline'}
            onClick={() => handleSessionLengthChange('0')}
          >
            {S.settings.sessionLengthUnlimited}
          </Button>
        </div>
      </div>

      <Separator />

      {/* Export */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground">{S.settings.exportHeading}</h2>
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
              {S.settings.fileSyncHeading}
            </h2>
            {isSynced ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {S.settings.fileSyncLinked}
                </p>
                <Button variant="outline" size="sm" onClick={unlinkFile}>
                  <Unlink className="h-4 w-4 mr-1" />
                  {S.settings.unlinkFile}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {needsRelink && (
                  <p className="text-sm text-destructive">
                    {S.settings.fileSyncLost}
                  </p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => list && linkFile(list)}
                >
                  <Link className="h-4 w-4 mr-1" />
                  {S.settings.linkFile}
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      <Separator />

      {/* Removed Items — behind a button, opens modal */}
      {removedItems.length > 0 && (
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => setRemovedOpen(true)}
          >
            <Archive className="h-4 w-4 mr-2" />
            {S.settings.removedItemsButton(removedItems.length)}
          </Button>
        </div>
      )}

      <Separator />

      {/* Danger Zone */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-destructive">{S.settings.dangerZone}</h2>
        <Button
          variant="destructive"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          {S.settings.deleteList}
        </Button>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title={S.settings.deleteList}
        message={S.settings.deleteListConfirm(list.name)}
        confirmLabel={S.common.delete}
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />

      <Dialog open={removedOpen} onOpenChange={setRemovedOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{S.settings.removedItemsTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {removedItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {S.settings.noRemovedItems}
              </p>
            ) : (
              removedItems.map((item) => (
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
                    aria-label={S.settings.restoreAria(item.name)}
                  >
                    <Undo2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
