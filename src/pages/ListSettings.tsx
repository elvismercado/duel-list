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
import { HelpHint } from '@/components/HelpHint';
import { ButtonGroup } from '@/components/ui/button-group';
import { FileLinkStatus } from '@/components/FileLinkStatus';
import { deriveLinkStatus } from '@/hooks/useFileSync';
import { SESSION_PRESETS } from '@/lib/constants';

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

      {/* Name.read-only display with edit button */}
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
        <div className="flex items-center gap-1">
          <label className="text-sm font-medium">{S.settings.kFactorLabel}</label>
          <HelpHint anchor="ranking-speed" term={S.glossary.termRankingSpeedLabel} />
        </div>
        <Select
          value={String(list.kFactor)}
          onValueChange={handleKFactorChange}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="48" title={S.settings.kFactorTooltipQuick}>{S.settings.kFactorQuick}</SelectItem>
            <SelectItem value="32" title={S.settings.kFactorTooltipGradual}>{S.settings.kFactorGradual}</SelectItem>
            <SelectItem value="16" title={S.settings.kFactorTooltipTight}>{S.settings.kFactorTight}</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">{S.settings.kFactorHelp}</p>
      </div>

      {/* Session Length — ButtonGroup + optional custom input */}
      <div className="space-y-2">
        <div className="flex items-center gap-1">
          <label className="text-sm font-medium">{S.settings.sessionLengthLabel}</label>
          <HelpHint anchor="session" term={S.glossary.termSessionLabel} />
        </div>
        <ButtonGroup<string>
          value={
            list.sessionLength === 0
              ? '0'
              : SESSION_PRESETS.includes(list.sessionLength as typeof SESSION_PRESETS[number])
                ? String(list.sessionLength)
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
        {!SESSION_PRESETS.includes(list.sessionLength as typeof SESSION_PRESETS[number]) && list.sessionLength !== 0 && (
          <div className="flex gap-2">
            <Input
              id="session-length-input"
              type="number"
              min={1}
              max={500}
              value={list.sessionLength}
              onChange={(e) => handleSessionLengthChange(e.target.value)}
              className="w-28"
            />
            <span className="text-sm text-muted-foreground self-center">
              {S.settings.sessionLengthUnit}
            </span>
          </div>
        )}
        <p className="text-xs text-muted-foreground">{S.settings.sessionLengthHelp}</p>
      </div>

      <Separator />

      {/* File Sync */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <h2 className="text-sm font-semibold text-muted-foreground">
              {S.settings.fileSyncHeading}
            </h2>
            <HelpHint anchor="file-link" term={S.glossary.sectionFileLink} />
          </div>
          <FileLinkStatus status={deriveLinkStatus(supported, isSynced, needsRelink)} />
        </div>
        {supported ? (
          isSynced ? (
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
          )
        ) : (
          <p className="text-sm text-muted-foreground">
            {S.settings.fileSyncUnsupported}
          </p>
        )}
      </div>

      <Separator />

      {/* Removed Items.behind a button, opens modal */}
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
