import { Card, CardContent } from '@/components/ui/card';
import type { ListEntry } from '@/lib/storage';
import { getList, getHistory } from '@/lib/storage';
import { sortItemsByElo } from '@/lib/ranking';
import { getDuelCountFromHistory } from '@/lib/history';
import { GripVertical, ArrowUp, ArrowDown, Swords, FileCheck, FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useNavigate } from 'react-router';
import { S } from '@/lib/strings';
import { RankChip } from '@/components/RankChip';

interface ListCardProps {
  entry: ListEntry;
  onClick: () => void;
  reorderMode?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isLinked?: boolean;
  /** When true, render a status chip (linked / not linked) in the title row. */
  showLinkStatus?: boolean;
}

function formatRelativeTime(ts: number | null): string {
  if (!ts) return S.list.neverOpened;
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return S.list.justNow;
  if (mins < 60) return S.list.minutesAgo(mins);
  const hours = Math.floor(mins / 60);
  if (hours < 24) return S.list.hoursAgo(hours);
  const days = Math.floor(hours / 24);
  if (days === 1) return S.list.yesterday;
  return S.list.daysAgo(days);
}

type ActivityBucket = 'fresh' | 'stale' | 'cold' | 'never';

/**
 * Activity dot reflects *duel freshness*, not visit freshness:
 *  - fresh   = duelled in the last 14 days
 *  - stale   = duelled 14–45d ago, OR opened but never duelled
 *  - cold    = duelled 45+ days ago
 *  - never   = list has never been opened
 *
 * `lastDuelAt` is null when the list has no duels. `lastOpened` is null only
 * for lists that have not been opened since the new field landed. Glossary
 * copy in `S.glossary.activity*Desc` mirrors these definitions.
 */
function getActivityBucket(
  lastDuelAt: number | null | undefined,
  lastOpened: number | null,
): ActivityBucket {
  if (!lastOpened && (lastDuelAt === null || lastDuelAt === undefined)) {
    return 'never';
  }
  if (lastDuelAt === null || lastDuelAt === undefined) {
    // Opened but never duelled — surface as 'stale' to nudge first duels.
    return 'stale';
  }
  const days = (Date.now() - lastDuelAt) / 86_400_000;
  if (days < 14) return 'fresh';
  if (days < 45) return 'stale';
  return 'cold';
}

const ACTIVITY_DOT_CLASS: Record<ActivityBucket, string> = {
  fresh: 'bg-emerald-500',
  stale: 'bg-amber-500',
  cold: 'bg-orange-500',
  never: 'bg-muted-foreground/30',
};

const ACTIVITY_ARIA: Record<ActivityBucket, string> = {
  fresh: S.list.activityFresh,
  stale: S.list.activityStale,
  cold: S.list.activityCold,
  never: S.list.activityNever,
};

export function ListCard({
  entry,
  onClick,
  reorderMode = false,
  onMoveUp,
  onMoveDown,
  isLinked = false,
  showLinkStatus = false,
}: ListCardProps) {
  const list = getList(entry.id);
  const activeItems = list?.items.filter((i) => !i.removed) ?? [];
  const sorted = sortItemsByElo(activeItems);
  const topThree = sorted.slice(0, 3);
  const duelCount = getDuelCountFromHistory(getHistory(entry.id));
  const activity = getActivityBucket(entry.lastDuelAt ?? null, entry.lastOpened);
  const canDuel = activeItems.length >= 2;
  const navigate = useNavigate();

  const sortable = useSortable({ id: entry.id, disabled: !reorderMode });
  const style = reorderMode
    ? {
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition,
        opacity: sortable.isDragging ? 0.4 : 1,
      }
    : undefined;

  if (reorderMode) {
    return (
      <div ref={sortable.setNodeRef} style={style}>
        <Card aria-label={S.list.draggableAria(entry.name)}>
          <CardContent className="p-2 flex items-center gap-2">
            <button
              type="button"
              {...sortable.attributes}
              {...sortable.listeners}
              className="touch-none cursor-grab active:cursor-grabbing p-2 -m-2 text-muted-foreground"
              aria-label={S.list.dragAria(entry.name)}
            >
              <GripVertical className="h-5 w-5" />
            </button>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{entry.name}</h3>
              <p className="text-xs text-muted-foreground">
                {S.ranking.itemsCount(activeItems.length)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="min-h-[44px] min-w-[44px]"
              onClick={onMoveUp}
              aria-label={S.list.moveUpAria(entry.name)}
              disabled={!onMoveUp}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="min-h-[44px] min-w-[44px]"
              onClick={onMoveDown}
              aria-label={S.list.moveDownAria(entry.name)}
              disabled={!onMoveDown}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card
      role="button"
      tabIndex={0}
      aria-label={entry.name}
      className="cursor-pointer hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring transition-colors"
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
    >
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`h-2.5 w-2.5 rounded-full shrink-0 ${ACTIVITY_DOT_CLASS[activity]}`}
              aria-label={ACTIVITY_ARIA[activity]}
              title={ACTIVITY_ARIA[activity]}
            />
            <h3 className="text-lg font-bold truncate">{entry.name}</h3>
            {showLinkStatus && isLinked && (
              <span
                className="shrink-0 inline-flex items-center gap-1 rounded-full border border-green-600/30 bg-green-600/10 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:text-green-400"
                title={S.ranking.fileLinkedTooltip}
              >
                <FileCheck className="h-3 w-3" aria-hidden="true" />
                <span>{S.ranking.fileLinked}</span>
              </span>
            )}
            {showLinkStatus && !isLinked && (
              <span
                className="shrink-0 inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                title={S.ranking.fileNotLinkedTooltip}
              >
                <FileQuestion className="h-3 w-3" aria-hidden="true" />
                <span>{S.list.notLinkedShort}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(entry.lastOpened)}
            </span>
            {canDuel && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label={S.list.quickDuelAria(entry.name)}
                title={S.ranking.startDuel}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/list/${entry.id}/duel`);
                }}
              >
                <Swords className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{S.ranking.itemsCount(activeItems.length)}</span>
          <span aria-hidden="true">·</span>
          <span>{S.list.duelsCount(duelCount)}</span>
        </div>
        {activeItems.length < 2 ? (
          <p className="text-xs text-muted-foreground">
            {S.list.addMoreItemsCta(2 - activeItems.length)}
          </p>
        ) : duelCount === 0 ? (
          <p className="text-xs text-muted-foreground">{S.list.noDuelsYet}</p>
        ) : (
          <div className="flex items-center gap-2 text-xs flex-wrap">
            {topThree.map((item, i) => (
              <span
                key={item.id}
                className="inline-flex items-center gap-1.5 min-w-0"
                aria-label={S.list.podiumPositionAria(i + 1, item.name)}
              >
                <RankChip position={i + 1} />
                <span className="truncate">{item.name}</span>
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
