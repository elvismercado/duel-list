import { Card, CardContent } from '@/components/ui/card';
import type { ListEntry } from '@/lib/storage';
import { getList } from '@/lib/storage';
import { sortItemsByElo } from '@/lib/ranking';
import { GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { S } from '@/lib/strings';

interface ListCardProps {
  entry: ListEntry;
  onClick: () => void;
  reorderMode?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
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

export function ListCard({
  entry,
  onClick,
  reorderMode = false,
  onMoveUp,
  onMoveDown,
}: ListCardProps) {
  const list = getList(entry.id);
  const activeItems = list?.items.filter((i) => !i.removed) ?? [];
  const sorted = sortItemsByElo(activeItems);
  const topItem = sorted[0];

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
      <CardContent className="p-4 space-y-1">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold truncate">{entry.name}</h3>
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(entry.lastOpened)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{S.ranking.itemsCount(activeItems.length)}</span>
          {topItem && (
            <span className="truncate ml-2">
              {S.ranking.topItemPrefix(topItem.name)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
