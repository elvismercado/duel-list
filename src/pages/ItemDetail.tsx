import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { S } from '@/lib/strings';
import { useList } from '@/hooks/useList';
import { useFileSync } from '@/hooks/useFileSync';
import { sortItemsByElo } from '@/lib/ranking';
import { getHistory, getSettings } from '@/lib/storage';
import { formatTimeOfDay } from '@/lib/datetime';
import {
  computeItemStats,
  parseHistoryByItem,
  type ItemDuelRecord,
} from '@/lib/history';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { HelpHint } from '@/components/HelpHint';
import { Check, ChevronLeft, Pencil, Trash2, Trophy } from 'lucide-react';

export default function ItemDetail() {
  const { id, itemId } = useParams<{ id: string; itemId: string }>();
  const navigate = useNavigate();
  const { supported, syncToFile } = useFileSync(id);
  const onSave = useCallback(
    (l: import('@/types').ListConfig) => { if (supported) syncToFile(l); },
    [supported, syncToFile],
  );
  const { list, renameItem, removeItem, setItemNotes } = useList(id!, onSave);

  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [notesDraft, setNotesDraft] = useState('');
  const [removeOpen, setRemoveOpen] = useState(false);

  const item = useMemo(
    () => list?.items.find((i) => i.id === itemId) ?? null,
    [list, itemId],
  );
  const rank = useMemo(() => {
    if (!list || !item || item.removed) return 0;
    const ranked = sortItemsByElo(list.items.filter((i) => !i.removed));
    return ranked.findIndex((i) => i.id === item.id) + 1;
  }, [list, item]);

  const historyMd = useMemo(() => (id ? getHistory(id) : ''), [id]);
  const stats = useMemo(
    () => (item ? computeItemStats(historyMd, item.id) : null),
    [item, historyMd],
  );
  const lastDuels = useMemo<ItemDuelRecord[]>(
    () => (item ? parseHistoryByItem(historyMd, item.id, 10) : []),
    [item, historyMd],
  );

  useEffect(() => {
    if (item) setNotesDraft(item.notes ?? '');
  }, [item]);

  if (!list) {
    return (
      <div className="p-4 max-w-lg mx-auto space-y-4 text-center mt-12">
        <h1 className="text-2xl font-bold">{S.common.listNotFound}</h1>
        <Button onClick={() => navigate('/')}>{S.common.goHome}</Button>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="p-4 max-w-lg mx-auto space-y-4 text-center mt-12">
        <h1 className="text-2xl font-bold">{S.itemDetail.notFound}</h1>
        <Button onClick={() => navigate(`/list/${id}`)}>
          {S.itemDetail.backToList}
        </Button>
      </div>
    );
  }

  function startRename() {
    setNameDraft(item!.name);
    setRenaming(true);
  }

  function commitRename() {
    const trimmed = nameDraft.trim();
    if (trimmed && trimmed !== item!.name) {
      renameItem(item!.id, trimmed);
    }
    setRenaming(false);
  }

  function commitNotes() {
    if ((item!.notes ?? '') !== notesDraft.trim()) {
      setItemNotes(item!.id, notesDraft);
    }
  }

  function handleRemove() {
    removeItem(item!.id);
    setRemoveOpen(false);
    navigate(-1);
  }

  function handleViewAllDuels() {
    navigate(`/list/${id}/history?q=${encodeURIComponent(item!.name)}`);
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6">
      {/* Parent list breadcrumb */}
      <button
        type="button"
        onClick={() => navigate(`/list/${id}`)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded -mx-1 px-1 -my-0.5 py-0.5"
        aria-label={S.itemDetail.inListAria(list.name)}
      >
        <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="truncate">{list.name}</span>
      </button>

      {/* Title + rename */}
      <div className="flex items-center gap-2 min-w-0">
        {renaming ? (
          <>
            <Input
              className="flex-1 h-10 text-xl font-bold"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') setRenaming(false);
              }}
              aria-label={S.itemDetail.renameAria(item.name)}
              autoFocus
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-10 w-10 shrink-0"
              onMouseDown={(e) => e.preventDefault()}
              onClick={commitRename}
              aria-label={S.common.confirmRename}
            >
              <Check className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold truncate flex-1 min-w-0">
              {item.name}
            </h1>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-10 w-10 shrink-0"
              onClick={startRename}
              aria-label={S.itemDetail.renameAria(item.name)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <StatTile
          label={S.ranking.detailsRank}
          value={rank > 0 ? `#${rank}` : '–'}
          helpAnchor="rank"
          helpTerm={S.ranking.detailsRank}
        />
        <StatTile
          label={S.ranking.detailsScore}
          value={String(Math.round(item.eloScore))}
          helpAnchor="score"
          helpTerm={S.ranking.detailsScore}
        />
        <StatTile
          label={S.ranking.detailsTotal}
          value={String(stats?.total ?? 0)}
        />
        <StatTile label={S.ranking.detailsAdded} value={item.added} />
        <StatTile
          label={S.ranking.detailsLastDuel}
          value={
            stats?.lastDuelTs
              ? formatRelative(stats.lastDuelTs)
              : S.ranking.detailsNever
          }
        />
        <StatTile
          label={S.ranking.detailsWins}
          value={`${stats?.wins ?? 0} / ${stats?.losses ?? 0} / ${stats?.ties ?? 0}`}
          subtitle={`${S.ranking.detailsWins} / ${S.ranking.detailsLosses} / ${S.ranking.detailsTies}`}
        />
      </div>

      {/* Notes */}
      <div className="space-y-1">
        <label
          htmlFor="item-notes"
          className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
        >
          {S.ranking.detailsNotesLabel}
        </label>
        <textarea
          id="item-notes"
          className="w-full min-h-[100px] rounded-md border bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          value={notesDraft}
          onChange={(e) => setNotesDraft(e.target.value)}
          onBlur={commitNotes}
          placeholder={S.ranking.detailsNotesPlaceholder}
        />
      </div>

      {/* Last duels */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {S.ranking.detailsLastDuels}
          </h2>
          {(stats?.total ?? 0) > 0 && (
            <Button variant="ghost" size="sm" onClick={handleViewAllDuels}>
              {S.ranking.detailsViewAllDuels}
            </Button>
          )}
        </div>
        {lastDuels.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {S.ranking.detailsNoDuelsYet}
          </p>
        ) : (
          <ScrollArea className="max-h-72 pr-2">
            <ul className="space-y-1">
              {lastDuels.map((d, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 rounded-md border bg-card px-2 py-1.5 text-sm"
                >
                  <OutcomeBadge outcome={d.outcome} />
                  <span className="text-muted-foreground shrink-0">
                    {outcomeLabel(d.outcome)}
                  </span>
                  <span className="truncate flex-1 min-w-0">
                    {d.opponentName}
                  </span>
                  {d.tsIso && (
                    <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                      {formatShort(d.tsIso)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </div>

      {/* Remove */}
      <div className="pt-4 border-t">
        <Button
          variant="destructive"
          className="w-full"
          onClick={() => setRemoveOpen(true)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          {S.itemDetail.removeButton}
        </Button>
      </div>

      <ConfirmDialog
        open={removeOpen}
        title={S.ranking.removeItemTitle}
        message={S.ranking.removeItemMessage(item.name)}
        confirmLabel={S.common.remove}
        danger
        onConfirm={handleRemove}
        onCancel={() => setRemoveOpen(false)}
      />
    </div>
  );
}

function outcomeLabel(o: ItemDuelRecord['outcome']): string {
  if (o === 'win') return S.ranking.detailsOutcomeWin;
  if (o === 'loss') return S.ranking.detailsOutcomeLoss;
  return S.ranking.detailsOutcomeTie;
}

function OutcomeBadge({ outcome }: { outcome: ItemDuelRecord['outcome'] }) {
  if (outcome === 'win') {
    return (
      <Trophy className="h-4 w-4 text-warning shrink-0" aria-hidden="true" />
    );
  }
  const color =
    outcome === 'loss'
      ? 'bg-muted text-muted-foreground'
      : 'bg-foreground/10 text-foreground/70';
  return (
    <span
      className={`shrink-0 text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded ${color}`}
      aria-hidden="true"
    >
      {outcome === 'loss' ? 'L' : 'T'}
    </span>
  );
}

function StatTile({
  label,
  value,
  subtitle,
  helpAnchor,
  helpTerm,
}: {
  label: string;
  value: string;
  subtitle?: string;
  helpAnchor?: string;
  helpTerm?: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-2">
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <span>{label}</span>
        {helpAnchor && helpTerm && (
          <HelpHint anchor={helpAnchor} term={helpTerm} className="h-4 w-4" />
        )}
      </div>
      <div className="text-base font-semibold truncate" title={value}>
        {value}
      </div>
      {subtitle && (
        <div className="text-[10px] text-muted-foreground truncate">
          {subtitle}
        </div>
      )}
    </div>
  );
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  return `${days}d ago`;
}

function formatShort(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const time = formatTimeOfDay(d, getSettings().timeFormat ?? '24h');
  return `${m}-${day} ${time}`;
}
