import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { S } from '@/lib/strings';
import { getSettings } from '@/lib/storage';
import { formatTimeOfDay } from '@/lib/datetime';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HelpHint } from '@/components/HelpHint';
import type { Item } from '@/types';
import {
  computeItemStats,
  parseHistoryByItem,
  type ItemDuelRecord,
} from '@/lib/history';
import { Trophy } from 'lucide-react';

interface ItemDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  listId: string;
  item: Item | null;
  rank: number; // 1-based; 0 if unknown
  historyMd: string;
  onSaveNotes: (text: string) => void;
}

export function ItemDetailsDialog({
  open,
  onClose,
  listId,
  item,
  rank,
  historyMd,
  onSaveNotes,
}: ItemDetailsDialogProps) {
  const navigate = useNavigate();
  const [notesDraft, setNotesDraft] = useState('');

  useEffect(() => {
    if (open && item) setNotesDraft(item.notes ?? '');
  }, [open, item]);

  const stats = useMemo(
    () => (item ? computeItemStats(historyMd, item.id) : null),
    [item, historyMd],
  );
  const lastDuels = useMemo<ItemDuelRecord[]>(
    () => (item ? parseHistoryByItem(historyMd, item.id, 10) : []),
    [item, historyMd],
  );

  if (!item) return null;

  function commitNotes() {
    if (!item) return;
    if ((item.notes ?? '') !== notesDraft.trim()) {
      onSaveNotes(notesDraft);
    }
  }

  function handleViewAllDuels() {
    if (!item) return;
    onClose();
    navigate(`/list/${listId}/history?q=${encodeURIComponent(item.name)}`);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          commitNotes();
          onClose();
        }
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="truncate">{item.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Stat grid */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <StatTile
              label={S.ranking.detailsRank}
              value={rank > 0 ? `#${rank}` : '—'}
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
            <StatTile
              label={S.ranking.detailsAdded}
              value={item.added}
            />
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
              className="w-full min-h-[80px] rounded-md border bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              onBlur={commitNotes}
              placeholder={S.ranking.detailsNotesPlaceholder}
            />
          </div>

          {/* Last duels */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {S.ranking.detailsLastDuels}
              </h3>
              {(stats?.total ?? 0) > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleViewAllDuels}
                >
                  {S.ranking.detailsViewAllDuels}
                </Button>
              )}
            </div>
            {lastDuels.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {S.ranking.detailsNoDuelsYet}
              </p>
            ) : (
              <ScrollArea className="max-h-64 pr-2">
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
        </div>
      </DialogContent>
    </Dialog>
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
      <Trophy
        className="h-4 w-4 text-warning shrink-0"
        aria-hidden="true"
      />
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
