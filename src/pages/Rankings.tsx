import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { S } from '@/lib/strings';
import { sortItemsByElo } from '@/lib/ranking';
import { useList } from '@/hooks/useList';
import { useFileSync } from '@/hooks/useFileSync';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AddItemsDialog } from '@/components/AddItemsDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Play,
  Settings,
  MoreVertical,
  Trash2,
  Pencil,
  FileCheck,
  FileX,
  FileQuestion,
  History,
  Hash,
  Trophy,
  Check,
  Swords,
} from 'lucide-react';

export default function Rankings() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { supported, isSynced, needsRelink, syncToFile } = useFileSync(id);
  const onSave = useCallback(
    (list: import('@/types').ListConfig) => { syncToFile(list); },
    [syncToFile],
  );
  const { list, save, addItems, renameItem, removeItem } = useList(id!, onSave);
  const [addOpen, setAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [removeTarget, setRemoveTarget] = useState<{ id: string; name: string } | null>(null);

  if (!list) {
    return (
      <div className="p-4 max-w-lg mx-auto space-y-4 text-center mt-12">
        <h1 className="text-2xl font-bold">{S.common.listNotFound}</h1>
        <Button onClick={() => navigate('/')}>{S.common.goHome}</Button>
      </div>
    );
  }

  const activeItems = sortItemsByElo(list.items.filter((i) => !i.removed));
  const canDuel = activeItems.length >= 2;
  const displayMode: 'rank' | 'elo' = list.displayMode ?? 'rank';

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
        <Button
          className="w-full"
          onClick={() => navigate(`/list/${id}/duel`)}
        >
          <Play className="h-4 w-4 mr-2" />
          {S.ranking.startDuel}
        </Button>
      )}

      {activeItems.length > 0 && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
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
          {activeItems.map((item, idx) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-md border p-3 bg-card"
            >
              <span
                className="text-muted-foreground font-mono text-sm w-12 text-right shrink-0 tabular-nums"
                title={displayMode === 'rank' ? S.ranking.rankTooltip : S.ranking.eloTooltip}
              >
                {displayMode === 'rank' ? `#${idx + 1}` : Math.round(item.eloScore)}
              </span>
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
              {item.comparisonCount > 0 && (
                <span
                  className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums shrink-0"
                  title={S.ranking.duelsPlayed(item.comparisonCount)}
                >
                  <Swords className="h-3.5 w-3.5" aria-hidden="true" />
                  {item.comparisonCount}
                </span>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 min-h-[44px] min-w-[44px]" aria-label={S.ranking.optionsAria(item.name)}>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
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
          ))}
        </ul>
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
    </div>
  );
}
