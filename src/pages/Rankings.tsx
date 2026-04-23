import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { S } from '@/lib/strings';
import { sortItemsByElo } from '@/lib/ranking';
import { useList } from '@/hooks/useList';
import { useFileSync } from '@/hooks/useFileSync';
import { Button } from '@/components/ui/button';
import { AddItemsDialog } from '@/components/AddItemsDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Play, Settings, MoreVertical, Undo2, Trash2, Pencil, FileCheck, FileX } from 'lucide-react';

export default function Rankings() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { supported, isSynced, needsRelink, syncToFile } = useFileSync(id);
  const onSave = useCallback(
    (list: import('@/types').ListConfig) => { syncToFile(list); },
    [syncToFile],
  );
  const { list, addItems, renameItem, removeItem, restoreItem } = useList(id!, onSave);
  const [addOpen, setAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [removeTarget, setRemoveTarget] = useState<{ id: string; name: string } | null>(null);

  if (!list) {
    return (
      <div className="p-4 max-w-lg mx-auto space-y-4 text-center mt-12">
        <h1 className="text-2xl font-bold">List not found</h1>
        <Button onClick={() => navigate('/')}>Go home</Button>
      </div>
    );
  }

  const activeItems = sortItemsByElo(list.items.filter((i) => !i.removed));
  const canDuel = activeItems.length >= 2;

  function handleRename(itemId: string) {
    const trimmed = editValue.trim();
    if (trimmed) {
      renameItem(itemId, trimmed);
    }
    setEditingId(null);
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold truncate">{list.name}</h1>
          {supported && isSynced && (
            <FileCheck className="h-4 w-4 text-green-500 shrink-0" />
          )}
          {supported && needsRelink && (
            <FileX className="h-4 w-4 text-destructive shrink-0" />
          )}
        </div>
        <div className="flex gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setAddOpen(true)}
            title="Add items"
          >
            <Plus className="h-5 w-5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => navigate(`/list/${id}/settings`)}
            title="Settings"
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

      {activeItems.length === 0 ? (
        <div className="text-center space-y-3 py-8">
          <p className="text-muted-foreground">{S.list.noItems}</p>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add items
          </Button>
        </div>
      ) : (
        <ul className="space-y-1">
          {activeItems.map((item, idx) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-md border p-3 bg-card"
            >
              <span className="text-muted-foreground font-mono text-sm w-6 text-right shrink-0">
                {idx + 1}
              </span>
              {editingId === item.id ? (
                <input
                  className="flex-1 bg-transparent border-b outline-none"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => handleRename(item.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRename(item.id);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  autoFocus
                />
              ) : (
                <span className="flex-1 truncate">{item.name}</span>
              )}
              <span className="text-xs text-muted-foreground tabular-nums">
                {Math.round(item.eloScore)}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
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
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setRemoveTarget({ id: item.id, name: item.name })}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          ))}
        </ul>
      )}

      {/* Removed items section */}
      {list.items.some((i) => i.removed) && (
        <div className="space-y-2 pt-4">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Removed
          </h2>
          {list.items
            .filter((i) => i.removed)
            .map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-md border border-dashed p-2 opacity-60"
              >
                <span className="truncate text-sm">{item.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => restoreItem(item.id)}
                  title="Restore"
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
        </div>
      )}

      <AddItemsDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={(names) => addItems(names)}
      />

      <ConfirmDialog
        open={!!removeTarget}
        title="Remove item"
        message={`Remove "${removeTarget?.name}" from the ranking? You can restore it later.`}
        confirmLabel="Remove"
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
