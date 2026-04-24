import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { S } from '@/lib/strings';
import { useList } from '@/hooks/useList';
import { useFileSync, deriveLinkStatus } from '@/hooks/useFileSync';
import { sortItemsByElo } from '@/lib/ranking';
import { getHistory, getSettings } from '@/lib/storage';
import { formatTimeOfDay } from '@/lib/datetime';
import {
  computeItemStats,
  computeOpponentStats,
  parseHistoryByItem,
  type ItemDuelRecord,
  type OpponentStats,
} from '@/lib/history';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { HelpHint } from '@/components/HelpHint';
import { RankChip } from '@/components/RankChip';
import { FileLinkStatus } from '@/components/FileLinkStatus';
import {
  Check,
  ChevronRight,
  Pencil,
  Trash2,
  TrendingDown,
  TrendingUp,
  Trophy,
} from 'lucide-react';

export default function ItemDetail() {
  const { id, itemId } = useParams<{ id: string; itemId: string }>();
  const navigate = useNavigate();
  const { supported, isSynced, needsRelink, syncToFile, linkFile } = useFileSync(id);
  const linkStatus = deriveLinkStatus(supported, isSynced, needsRelink);
  const onSave = useCallback(
    (l: import('@/types').ListConfig) => { if (supported) syncToFile(l); },
    [supported, syncToFile],
  );
  const { list, renameItem, removeItem, setItemNotes } = useList(id!, onSave);

  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [notesDraft, setNotesDraft] = useState('');
  const [removeOpen, setRemoveOpen] = useState(false);
  const [linkConfirmOpen, setLinkConfirmOpen] = useState(false);

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
  const opponents = useMemo<OpponentStats[]>(
    () => (item ? computeOpponentStats(historyMd, item.id) : []),
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
      {/* Parent list label */}
      <div className="flex items-center gap-2 min-w-0 text-sm text-muted-foreground">
        <span className="truncate">{list.name}</span>
        {linkStatus && (
          <FileLinkStatus
            status={linkStatus}
            onClick={
              linkStatus === 'linked'
                ? undefined
                : () => setLinkConfirmOpen(true)
            }
          />
        )}
      </div>

      {/* Title + rename */}
      <div className="flex items-start gap-2 min-w-0">
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
            <h1 className="text-2xl font-bold flex-1 min-w-0 break-words">
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
        <RankTile rank={rank} prevRank={item.prevRank} />
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
        <LastDuelTile lastDuelTs={stats?.lastDuelTs ?? null} />
        <RecordTile
          wins={stats?.wins ?? 0}
          losses={stats?.losses ?? 0}
          ties={stats?.ties ?? 0}
        />
      </div>

      {/* Rivalries */}
      <RivalriesSection
        listId={id!}
        opponents={opponents}
      />

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

      <ConfirmDialog
        open={linkConfirmOpen}
        title={S.ranking.linkFileConfirmTitle}
        message={
          needsRelink
            ? S.ranking.relinkFileConfirmMessage
            : S.ranking.linkFileConfirmMessage
        }
        confirmLabel={S.settings.linkFile}
        onConfirm={() => {
          setLinkConfirmOpen(false);
          if (list) void linkFile(list);
        }}
        onCancel={() => setLinkConfirmOpen(false)}
      />
    </div>
  );
}

function RankTile({ rank, prevRank }: { rank: number; prevRank: number }) {
  const delta = rank > 0 && prevRank > 0 ? prevRank - rank : 0;
  return (
    <div className="rounded-lg border bg-card p-2">
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <span>{S.ranking.detailsRank}</span>
        <HelpHint anchor="rank" term={S.ranking.detailsRank} className="h-4 w-4" />
      </div>
      <div className="flex items-center gap-2">
        {rank >= 1 && rank <= 3 ? (
          <RankChip position={rank} />
        ) : (
          <div className="text-base font-semibold">
            {rank > 0 ? `#${rank}` : '–'}
          </div>
        )}
        {delta !== 0 && (
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-medium tabular-nums ${
              delta > 0 ? 'text-outcome-win' : 'text-outcome-loss'
            }`}
            aria-label={
              delta > 0
                ? S.ranking.movedUp(delta)
                : S.ranking.movedDown(Math.abs(delta))
            }
            title={
              delta > 0
                ? S.ranking.movedUp(delta)
                : S.ranking.movedDown(Math.abs(delta))
            }
          >
            {delta > 0 ? (
              <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {Math.abs(delta)}
          </span>
        )}
      </div>
    </div>
  );
}

function LastDuelTile({ lastDuelTs }: { lastDuelTs: number | null }) {
  const dotClass = activityDotClass(lastDuelTs);
  const value = lastDuelTs ? formatRelative(lastDuelTs) : S.ranking.detailsNever;
  return (
    <div className="rounded-lg border bg-card p-2">
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <span>{S.ranking.detailsLastDuel}</span>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`h-2.5 w-2.5 rounded-full shrink-0 ${dotClass}`}
          aria-hidden="true"
        />
        <span className="text-base font-semibold truncate" title={value}>
          {value}
        </span>
      </div>
    </div>
  );
}

function activityDotClass(lastDuelTs: number | null): string {
  if (lastDuelTs === null) return 'bg-muted-foreground/30';
  const days = (Date.now() - lastDuelTs) / 86_400_000;
  if (days < 14) return 'bg-success';
  if (days < 45) return 'bg-warning';
  return 'bg-outcome-loss';
}

function RecordTile({
  wins,
  losses,
  ties,
}: {
  wins: number;
  losses: number;
  ties: number;
}) {
  const total = wins + losses + ties;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
  const winPct = total > 0 ? (wins / total) * 100 : 0;
  const tiePct = total > 0 ? (ties / total) * 100 : 0;
  const lossPct = total > 0 ? (losses / total) * 100 : 0;
  return (
    <div className="rounded-lg border bg-card p-2">
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <span>{S.itemDetail.winRate}</span>
      </div>
      <div className="text-base font-semibold tabular-nums">
        {total > 0 ? `${winRate}%` : '–'}
      </div>
      {total > 0 ? (
        <>
          <div
            className="mt-1 flex h-1.5 w-full overflow-hidden rounded-full bg-muted"
            role="img"
            aria-label={S.itemDetail.opponentRecord(wins, losses, ties)}
          >
            <div
              className="bg-outcome-win"
              style={{ width: `${winPct}%` }}
            />
            <div
              className="bg-foreground/20"
              style={{ width: `${tiePct}%` }}
            />
            <div
              className="bg-outcome-loss"
              style={{ width: `${lossPct}%` }}
            />
          </div>
          <div className="text-[10px] text-muted-foreground tabular-nums mt-0.5">
            {S.itemDetail.opponentRecord(wins, losses, ties)}
          </div>
        </>
      ) : (
        <div className="text-[10px] text-muted-foreground">
          {S.ranking.detailsNoDuelsYet}
        </div>
      )}
    </div>
  );
}

function RivalriesSection({
  listId,
  opponents,
}: {
  listId: string;
  opponents: OpponentStats[];
}) {
  const navigate = useNavigate();
  if (opponents.length === 0) {
    return (
      <div className="space-y-1">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {S.itemDetail.rivalriesHeading}
        </h2>
        <p className="text-sm text-muted-foreground">
          {S.itemDetail.noRivalsYet}
        </p>
      </div>
    );
  }
  const biggestRival = [...opponents].sort((a, b) => b.total - a.total)[0]!;
  const mostWins = [...opponents]
    .filter((o) => o.wins > 0)
    .sort((a, b) => b.wins - a.wins)[0];
  const mostLosses = [...opponents]
    .filter((o) => o.losses > 0)
    .sort((a, b) => b.losses - a.losses)[0];

  function go(opponentId: string) {
    navigate(`/list/${listId}/item/${opponentId}`);
  }

  return (
    <div className="space-y-2">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {S.itemDetail.rivalriesHeading}
      </h2>
      <ul className="space-y-1">
        <RivalRow
          label={S.itemDetail.biggestRival}
          opp={biggestRival}
          onOpen={go}
        />
        {mostWins && (
          <RivalRow
            label={S.itemDetail.mostWinsAgainst}
            opp={mostWins}
            onOpen={go}
            accent="win"
          />
        )}
        {mostLosses && (
          <RivalRow
            label={S.itemDetail.lostMostTo}
            opp={mostLosses}
            onOpen={go}
            accent="loss"
          />
        )}
      </ul>
    </div>
  );
}

function RivalRow({
  label,
  opp,
  onOpen,
  accent,
}: {
  label: string;
  opp: OpponentStats;
  onOpen: (id: string) => void;
  accent?: 'win' | 'loss';
}) {
  const totalCls =
    accent === 'win'
      ? 'text-outcome-win'
      : accent === 'loss'
      ? 'text-outcome-loss'
      : 'text-muted-foreground';
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(opp.opponentId)}
        className="w-full flex items-center gap-2 rounded-md border bg-card hover:bg-accent/40 transition-colors p-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`${label}: ${opp.opponentName}`}
      >
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {label}
          </div>
          <div className="truncate text-sm font-medium">
            {opp.opponentName}
          </div>
        </div>
        <div
          className={`text-xs tabular-nums shrink-0 ${totalCls}`}
          title={S.itemDetail.opponentTotalAria(opp.total)}
        >
          {S.itemDetail.opponentRecord(opp.wins, opp.losses, opp.ties)}
        </div>
        <ChevronRight
          className="h-4 w-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      </button>
    </li>
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
