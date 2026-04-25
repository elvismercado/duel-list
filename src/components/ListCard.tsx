import { Card, CardContent } from '@/components/ui/card';
import type { ListEntry } from '@/lib/storage';
import { getList, getHistory } from '@/lib/storage';
import { sortItemsByElo } from '@/lib/ranking';
import { getDuelCountFromHistory } from '@/lib/history';
import { GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { S } from '@/lib/strings';
import { RankChip } from '@/components/RankChip';
import { FileLinkStatus } from '@/components/FileLinkStatus';
import type { LinkStatus } from '@/hooks/useFileSync';

interface ListCardProps {
  entry: ListEntry;
  onClick: () => void;
  reorderMode?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  linkStatus?: LinkStatus;
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
    // Opened but never duelled.surface as 'stale' to nudge first duels.
    return 'stale';
  }
  const days = (Date.now() - lastDuelAt) / 86_400_000;
  if (days < 14) return 'fresh';
  if (days < 45) return 'stale';
  return 'cold';
}

const ACTIVITY_DOT_CLASS: Record<ActivityBucket, string> = {
  fresh: 'bg-success',
  stale: 'bg-warning',
  cold: 'bg-outcome-loss',
  never: 'bg-muted-foreground/30',
};

const ACTIVITY_ARIA: Record<ActivityBucket, string> = {
  fresh: S.list.activityFresh,
  stale: S.list.activityStale,
  cold: S.list.activityCold,
  never: S.list.activityNever,
};

/**
 * Builds the searchable text for a list card: name + counts + activity label +
 * link status + last-opened relative phrase. Excludes the names of items inside
 * the list (filtering on Home is for list-level data only).
 */
export function buildListCardHaystack(
  entry: ListEntry,
  opts: { linkStatus?: LinkStatus },
): string {
  const list = getList(entry.id);
  const activeCount = list?.items.filter((i) => !i.removed).length ?? 0;
  const duels = getDuelCountFromHistory(getHistory(entry.id));
  const activity = getActivityBucket(entry.lastDuelAt ?? null, entry.lastOpened);
  const linkLabel = opts.linkStatus === 'linked'
    ? S.ranking.fileLinked
    : opts.linkStatus === 'broken'
      ? S.ranking.fileLinkBroken
      : opts.linkStatus === 'unlinked'
        ? S.list.notLinkedShort
        : '';
  return [
    entry.name,
    S.ranking.itemsCount(activeCount),
    S.list.duelsCount(duels),
    formatRelativeTime(entry.lastOpened),
    ACTIVITY_ARIA[activity],
    linkLabel,
  ]
    .join(' ')
    .toLowerCase();
}

export function ListCard({
  entry,
  onClick,
  reorderMode = false,
  onMoveUp,
  onMoveDown,
  linkStatus,
}: ListCardProps) {
  const list = getList(entry.id);
  const activeItems = list?.items.filter((i) => !i.removed) ?? [];
  const sorted = sortItemsByElo(activeItems);
  const topThree = sorted.slice(0, 3);
  const duelCount = getDuelCountFromHistory(getHistory(entry.id));
  const activity = getActivityBucket(entry.lastDuelAt ?? null, entry.lastOpened);

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
            {linkStatus && (
              <FileLinkStatus status={linkStatus} />
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(entry.lastOpened)}
            </span>
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
