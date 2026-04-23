import { Card, CardContent } from '@/components/ui/card';
import type { ListEntry } from '@/lib/storage';
import { getList } from '@/lib/storage';
import { sortItemsByElo } from '@/lib/ranking';
import { GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ListCardProps {
  entry: ListEntry;
  onClick: () => void;
  reorderMode?: boolean;
  onDragStart?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: () => void;
  onDragEnd?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isDragging?: boolean;
}

function formatRelativeTime(ts: number | null): string {
  if (!ts) return 'Never opened';
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

export function ListCard({
  entry,
  onClick,
  reorderMode = false,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onMoveUp,
  onMoveDown,
  isDragging,
}: ListCardProps) {
  const list = getList(entry.id);
  const activeItems = list?.items.filter((i) => !i.removed) ?? [];
  const sorted = sortItemsByElo(activeItems);
  const topItem = sorted[0];

  if (reorderMode) {
    return (
      <Card
        draggable
        onDragStart={onDragStart}
        onDragOver={(e) => {
          e.preventDefault();
          onDragOver?.(e);
        }}
        onDrop={(e) => {
          e.preventDefault();
          onDrop?.();
        }}
        onDragEnd={onDragEnd}
        className={`transition-opacity ${isDragging ? 'opacity-40' : ''}`}
        aria-label={`${entry.name}, draggable`}
      >
        <CardContent className="p-2 flex items-center gap-2">
          <GripVertical className="h-5 w-5 text-muted-foreground shrink-0 cursor-grab" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{entry.name}</h3>
            <p className="text-xs text-muted-foreground">
              {activeItems.length} items
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="min-h-[44px] min-w-[44px]"
            onClick={onMoveUp}
            aria-label={`Move ${entry.name} up`}
            disabled={!onMoveUp}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="min-h-[44px] min-w-[44px]"
            onClick={onMoveDown}
            aria-label={`Move ${entry.name} down`}
            disabled={!onMoveDown}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
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
          <span>{activeItems.length} items</span>
          {topItem && (
            <span className="truncate ml-2">
              #1 {topItem.name}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
