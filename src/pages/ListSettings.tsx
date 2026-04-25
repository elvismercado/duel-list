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
      <h1 className="text-2xl font-bold">{S.settings.titleList}</h1>

      {/* List name (hero row, no group heading) */}
      <div className="space-y-2">
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
              className="text-2xl font-bold h-auto py-2"
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
          <>
            <h2 className="text-3xl font-bold break-words">{list.name}</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingName(true)}
            >
              <Pencil className="h-4 w-4 mr-1" />
              {S.settings.renameButton}
            </Button>
          </>
        )}
      </div>

      <Separator />

      {/* ==================== Ranking & sessions ==================== */}
      <section aria-labelledby="group-ranking" className="space-y-4">
        <h2
          id="group-ranking"
          className="text-sm font-semibold text-muted-foreground uppercase tracking-wide"
        >
          {S.settings.groupRanking}
        </h2>

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

        {/* Session Length */}
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
      </section>

      <Separator />

      {/* ==================== Sync ==================== */}
      <section aria-labelledby="group-sync" className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <h2
              id="group-sync"
              className="text-sm font-semibold text-muted-foreground uppercase tracking-wide"
            >
              {S.settings.groupSync}
            </h2>
            <HelpHint anchor="file-link" term={S.glossary.sectionFileLink} />
          </div>
          <FileLinkStatus status={deriveLinkStatus(supported, isSynced, needsRelink)} />
        </div>
        <p className="text-xs text-muted-foreground">{S.settings.syncIntro}</p>
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
      </section>

      <Separator />

      {/* ==================== Your data ==================== */}
      <section aria-labelledby="group-data" className="space-y-4">
        <h2
          id="group-data"
          className="text-sm font-semibold text-muted-foreground uppercase tracking-wide"
        >
          {S.settings.groupData}
        </h2>

        {/* Export sub-group */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">{S.settings.subheadingExport}</h3>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full h-auto justify-start py-2 text-left"
              onClick={() => exportList(list)}
            >
              <Download className="h-4 w-4 mr-2 shrink-0" />
              <span className="flex flex-col items-start gap-0.5 min-w-0">
                <span className="text-sm font-medium">{S.settings.exportListLabel}</span>
                <span className="text-xs font-normal text-muted-foreground whitespace-normal">
                  {S.settings.exportListDesc}
                </span>
              </span>
            </Button>
            <Button
              variant="outline"
              className="w-full h-auto justify-start py-2 text-left"
              onClick={() => exportHistory(list.id, list.name)}
            >
              <Download className="h-4 w-4 mr-2 shrink-0" />
              <span className="flex flex-col items-start gap-0.5 min-w-0">
                <span className="text-sm font-medium">{S.settings.exportHistoryLabel}</span>
                <span className="text-xs font-normal text-muted-foreground whitespace-normal">
                  {S.settings.exportHistoryDesc}
                </span>
              </span>
            </Button>
          </div>
        </div>

        {/* Recovery sub-group */}
        {removedItems.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">{S.settings.subheadingRecovery}</h3>
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
      </section>

      <Separator />

      {/* ==================== Danger zone ==================== */}
      <section aria-labelledby="group-danger" className="space-y-2">
        <h2
          id="group-danger"
          className="text-sm font-semibold text-destructive uppercase tracking-wide"
        >
          {S.settings.dangerZone}
        </h2>
        <Button
          variant="destructive"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          {S.settings.deleteList}
        </Button>
      </section>

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
