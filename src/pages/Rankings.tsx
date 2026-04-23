import { useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import { S } from '@/lib/strings';
import {
  sortItemsByElo,
  applyDisplaySort,
  splitSortMode,
  joinSortMode,
  type SortField,
  type SortDir,
} from '@/lib/ranking';
import { useList } from '@/hooks/useList';
import { useFileSync } from '@/hooks/useFileSync';
import { RankChip } from '@/components/RankChip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AddItemsDialog } from '@/components/AddItemsDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ItemDetailsDialog } from '@/components/ItemDetailsDialog';
import { getHistory } from '@/lib/storage';
import type { SortMode } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Settings,
  MoreVertical,
  Trash2,
  Pencil,
  Info,
  FileCheck,
  FileX,
  FileQuestion,
  History,
  Hash,
  Trophy,
  Check,
  Swords,
  ArrowDown01,
  ArrowUp10,
  ArrowDownAZ,
  ArrowUpAZ,
  ArrowDownNarrowWide,
  ArrowUpWideNarrow,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Undo2,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

const SORT_FIELDS: SortField[] = ['rank', 'elo', 'added', 'name'];

const FIELD_LABELS: Record<SortField, string> = {
  rank: S.ranking.sortFieldRank,
  elo: S.ranking.sortFieldElo,
  added: S.ranking.sortFieldAdded,
  name: S.ranking.sortFieldName,
};

const DIR_ARIA: Record<SortField, Record<SortDir, string>> = {
  rank: { desc: S.ranking.sortDirAriaRankDesc, asc: S.ranking.sortDirAriaRankAsc },
  elo: { desc: S.ranking.sortDirAriaEloDesc, asc: S.ranking.sortDirAriaEloAsc },
  added: { desc: S.ranking.sortDirAriaAddedDesc, asc: S.ranking.sortDirAriaAddedAsc },
  name: { desc: S.ranking.sortDirAriaNameDesc, asc: S.ranking.sortDirAriaNameAsc },
};

function DirectionIcon({ field, dir, className }: { field: SortField; dir: SortDir; className?: string }) {
  if (field === 'name') {
    return dir === 'asc' ? <ArrowDownAZ className={className} /> : <ArrowUpAZ className={className} />;
  }
  if (field === 'added') {
    return dir === 'desc' ? <ArrowDownNarrowWide className={className} /> : <ArrowUpWideNarrow className={className} />;
  }
  // rank / elo — numeric
  return dir === 'desc' ? <ArrowDown01 className={className} /> : <ArrowUp10 className={className} />;
}

export default function Rankings() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { supported, isSynced, needsRelink, syncToFile } = useFileSync(id);
  const onSave = useCallback(
    (list: import('@/types').ListConfig) => { syncToFile(list); },
    [syncToFile],
  );
  const { list, save, addItems, renameItem, removeItem, restoreItem, setItemNotes } = useList(id!, onSave);
  const [addOpen, setAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [removeTarget, setRemoveTarget] = useState<{ id: string; name: string } | null>(null);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [removedExpanded, setRemovedExpanded] = useState(false);
  const historyMd = useMemo(() => (id ? getHistory(id) : ''), [id, detailsId]);

  if (!list) {
    return (
      <div className="p-4 max-w-lg mx-auto space-y-4 text-center mt-12">
        <h1 className="text-2xl font-bold">{S.common.listNotFound}</h1>
        <Button onClick={() => navigate('/')}>{S.common.goHome}</Button>
      </div>
    );
  }

  const rankedByElo = sortItemsByElo(list.items.filter((i) => !i.removed));
  const rankById = new Map(rankedByElo.map((it, idx) => [it.id, idx + 1]));
  const removedItems = sortItemsByElo(list.items.filter((i) => i.removed));
  const urlSort = searchParams.get('sort');
  const validSortModes: SortMode[] = [
    'rank-desc', 'rank-asc', 'elo-desc', 'elo-asc',
    'added-desc', 'added-asc', 'name-asc', 'name-desc',
  ];
  const sortMode: SortMode =
    (validSortModes as string[]).includes(urlSort ?? '')
      ? (urlSort as SortMode)
      : list.sortMode ?? 'rank-desc';
  const { field: sortField, dir: sortDir } = splitSortMode(sortMode);
  const activeItems = applyDisplaySort(rankedByElo, sortMode);
  const canDuel = rankedByElo.length >= 2;
  const displayMode: 'rank' | 'elo' = list.displayMode ?? 'rank';
  const detailsItem = detailsId ? list.items.find((i) => i.id === detailsId) ?? null : null;

  function handleRename(itemId: string) {
    const trimmed = editValue.trim();
    if (trimmed) {
      renameItem(itemId, trimmed);
    }
    setEditingId(null);
  }

  function toggleDisplayMode() {
    save({ ...list!, displayMode: displayMode === 'rank' ? 'elo' : 'rank' });
  }

  function handleSortChange(next: SortMode) {
    const params = new URLSearchParams(searchParams);
    if (next === 'rank-desc') params.delete('sort');
    else params.set('sort', next);
    setSearchParams(params, { replace: true });
    if ((list?.sortMode ?? 'rank-desc') !== next) {
      save({ ...list!, sortMode: next });
    }
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-2xl font-bold truncate">{list.name}</h1>
          {supported && isSynced && (
            <span title={S.ranking.fileLinkedTooltip}>
              <FileCheck className="h-4 w-4 text-green-600 shrink-0" aria-label={S.ranking.fileLinked} />
            </span>
          )}
          {supported && needsRelink && (
            <span title={S.ranking.fileLinkBrokenTooltip}>
              <FileX className="h-4 w-4 text-destructive shrink-0" aria-label={S.ranking.fileLinkBroken} />
            </span>
          )}
          {supported && !isSynced && !needsRelink && (
            <span title={S.ranking.fileNotLinkedTooltip}>
              <FileQuestion className="h-4 w-4 text-muted-foreground shrink-0" aria-label={S.ranking.fileNotLinked} />
            </span>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          <Button
            size="icon"
            variant="ghost"
            className="min-h-[44px] min-w-[44px]"
            onClick={() => navigate(`/list/${id}/history`)}
            aria-label={S.ranking.historyAria}
          >
            <History className="h-5 w-5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="min-h-[44px] min-w-[44px]"
            onClick={() => setAddOpen(true)}
            aria-label={S.ranking.addItemsAria}
          >
            <Plus className="h-5 w-5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="min-h-[44px] min-w-[44px]"
            onClick={() => navigate(`/list/${id}/settings`)}
            aria-label={S.ranking.settingsAria}
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {canDuel && (
        <button
          type="button"
          onClick={() => navigate(`/list/${id}/duel`)}
          className="w-full text-left rounded-lg border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 flex items-center gap-3 hover:from-primary/15 hover:via-primary/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={S.ranking.startDuel}
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Swords className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-base font-semibold">{S.ranking.startDuel}</div>
            <div className="text-xs text-muted-foreground truncate">{S.ranking.heroSubtitle}</div>
          </div>
        </button>
      )}

      {activeItems.length > 0 && (
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={toggleDisplayMode}
              aria-label={displayMode === 'rank' ? S.ranking.switchToElo : S.ranking.switchToRank}
            >
              {displayMode === 'rank' ? (
                <>
                  <Hash className="h-4 w-4 mr-1" />
                  {S.ranking.rank}
                </>
              ) : (
                <>
                  <Trophy className="h-4 w-4 mr-1" />
                  {S.ranking.elo}
                </>
              )}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={sortField}
              onValueChange={(v) => handleSortChange(joinSortMode(v as SortField, sortDir))}
            >
              <SelectTrigger className="w-auto" aria-label={S.ranking.sortLabel}>
                <ArrowUpDown className="h-4 w-4 mr-1 opacity-70" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_FIELDS.map((f) => (
                  <SelectItem key={f} value={f}>
                    {FIELD_LABELS[f]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                handleSortChange(joinSortMode(sortField, sortDir === 'desc' ? 'asc' : 'desc'))
              }
              aria-label={DIR_ARIA[sortField][sortDir]}
              aria-pressed={sortDir === 'asc'}
              title={DIR_ARIA[sortField][sortDir]}
            >
              <DirectionIcon field={sortField} dir={sortDir} className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {activeItems.length === 0 ? (
        <div className="text-center space-y-3 py-8">
          <p className="text-muted-foreground">{S.list.noItems}</p>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {S.ranking.addItems}
          </Button>
        </div>
      ) : (
        <ul className="space-y-1">
          {activeItems.map((item) => {
            const currentRank = rankById.get(item.id) ?? 0;
            const showChip = displayMode === 'rank' && currentRank >= 1 && currentRank <= 3;
            return (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-md border p-3 bg-card"
            >
              {showChip ? (
                <span className="w-12 flex justify-end shrink-0">
                  <RankChip position={currentRank} />
                </span>
              ) : (
                <span
                  className="text-muted-foreground font-mono text-sm w-12 text-right shrink-0 tabular-nums"
                  title={displayMode === 'rank' ? S.ranking.rankTooltip : S.ranking.eloTooltip}
                >
                  {displayMode === 'rank' ? `#${currentRank || '?'}` : Math.round(item.eloScore)}
                </span>
              )}
              {editingId === item.id ? (
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  <Input
                    className="flex-1 h-9 bg-background"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => handleRename(item.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRename(item.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    aria-label={S.ranking.renameAria(item.name)}
                    autoFocus
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 shrink-0"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleRename(item.id)}
                    aria-label={S.common.confirmRename}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <span className="flex-1 truncate">{item.name}</span>
              )}
              {item.comparisonCount > 0 ? (
                <span
                  className="inline-flex items-center justify-end gap-1 w-10 text-xs text-muted-foreground tabular-nums shrink-0"
                  title={S.ranking.duelsPlayed(item.comparisonCount)}
                >
                  <Swords className="h-3.5 w-3.5" aria-hidden="true" />
                  {item.comparisonCount}
                </span>
              ) : (
                <span className="w-10 shrink-0" aria-hidden="true" />
              )}
              <TrendBadge
                delta={
                  item.prevRank > 0
                    ? item.prevRank - (currentRank || item.prevRank)
                    : null
                }
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 min-h-[44px] min-w-[44px]" aria-label={S.ranking.optionsAria(item.name)}>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setDetailsId(item.id)}>
                    <Info className="h-4 w-4 mr-2" />
                    {S.ranking.detailsAction}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setEditingId(item.id);
                      setEditValue(item.name);
                    }}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    {S.ranking.renameAction}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setRemoveTarget({ id: item.id, name: item.name })}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {S.ranking.removeAction}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
            );
          })}
        </ul>
      )}

      {removedItems.length > 0 && (
        <div className="space-y-2 pt-2">
          <Button
            variant="ghost"
            className="w-full justify-between text-muted-foreground"
            onClick={() => setRemovedExpanded((v) => !v)}
            aria-expanded={removedExpanded}
            aria-label={
              removedExpanded
                ? S.ranking.removedCollapseAria
                : S.ranking.removedExpandAria
            }
          >
            <span>{S.ranking.removedHeading(removedItems.length)}</span>
            {removedExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
          {removedExpanded && (
            <ScrollArea className="max-h-72 pr-2">
              <ul className="space-y-1">
                {removedItems.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/30"
                    title={S.ranking.restoreKeepsStatsHint}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-sm text-muted-foreground line-through">
                        {item.name}
                      </div>
                      <div className="text-xs text-muted-foreground/80">
                        {S.ranking.removedItemMeta(item.eloScore, item.comparisonCount)}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => restoreItem(item.id)}
                      aria-label={S.ranking.restoreItemAria(item.name)}
                    >
                      <Undo2 className="h-4 w-4 mr-1" />
                      {S.ranking.restoreAction}
                    </Button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </div>
      )}

      <AddItemsDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={(names) => addItems(names)}
      />

      <ConfirmDialog
        open={!!removeTarget}
        title={S.ranking.removeItemTitle}
        message={removeTarget ? S.ranking.removeItemMessage(removeTarget.name) : ''}
        confirmLabel={S.common.remove}
        danger
        onConfirm={() => {
          if (removeTarget) removeItem(removeTarget.id);
          setRemoveTarget(null);
        }}
        onCancel={() => setRemoveTarget(null)}
      />

      <ItemDetailsDialog
        open={!!detailsItem}
        onClose={() => setDetailsId(null)}
        listId={id!}
        item={detailsItem}
        rank={detailsItem ? rankById.get(detailsItem.id) ?? 0 : 0}
        historyMd={historyMd}
        onSaveNotes={(text) => {
          if (detailsItem) setItemNotes(detailsItem.id, text);
        }}
      />
    </div>
  );
}

function TrendBadge({ delta }: { delta: number | null }) {
  // Always reserve the same width so the duel-count column and dropdown
  // stay aligned across rows whether or not a trend is shown.
  const wrapper =
    'inline-flex items-center justify-end gap-0.5 shrink-0 w-10 text-xs tabular-nums';
  if (delta === null) {
    return <span className={wrapper} aria-hidden="true" />;
  }
  if (delta === 0) {
    return (
      <span
        className={`${wrapper} text-muted-foreground`}
        title={S.ranking.noChange}
        aria-label={S.ranking.noChange}
      >
        –
      </span>
    );
  }
  if (delta > 0) {
    return (
      <span
        className={`${wrapper} text-emerald-600 dark:text-emerald-400`}
        title={S.ranking.movedUp(delta)}
        aria-label={S.ranking.movedUp(delta)}
      >
        <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
        {delta}
      </span>
    );
  }
  const down = Math.abs(delta);
  return (
    <span
      className={`${wrapper} text-destructive`}
      title={S.ranking.movedDown(down)}
      aria-label={S.ranking.movedDown(down)}
    >
      <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
      {down}
    </span>
  );
}
