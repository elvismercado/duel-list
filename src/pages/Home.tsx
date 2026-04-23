import { useState, useRef } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { getSettings, saveList } from '@/lib/storage';
import { S } from '@/lib/strings';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Upload, Settings, FolderOpen } from 'lucide-react';
import { ListCard } from '@/components/ListCard';
import { ListCreateDialog } from '@/components/ListCreateDialog';
import { ImportConflictDialog } from '@/components/ImportConflictDialog';
import { useListRegistry } from '@/hooks/useListRegistry';
import { useFileSync } from '@/hooks/useFileSync';
import { saveFileHandle } from '@/lib/storage';
import { generateShortId } from '@/lib/markdown';
import type { ListConfig } from '@/types';

export default function Home() {
  const settings = getSettings();
  const navigate = useNavigate();
  const {
    lists,
    sortOrder,
    changeSortOrder,
    createList,
    importList,
    importListWithChoice,
    refresh,
    updateCustomOrder,
  } = useListRegistry();
  const [createOpen, setCreateOpen] = useState(false);
  const [reorderMode, setReorderMode] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragOverIdRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { supported, openFromFile } = useFileSync(undefined);
  const [conflict, setConflict] = useState<{
    existing: ListConfig;
    parsed: ListConfig;
    handle?: FileSystemFileHandle;
  } | null>(null);

  if (!settings.firstRunDone) {
    return <Navigate to="/welcome" replace />;
  }

  function handleCreate(name: string, kFactor: number, sessionLength: number) {
    const id = createList(name, kFactor, sessionLength);
    navigate(`/list/${id}`);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const result = importList(text);
      if (result.status === 'conflict') {
        setConflict({ existing: result.existing, parsed: result.parsed });
      } else {
        navigate(`/list/${result.id}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  async function handleOpenFile() {
    const result = await openFromFile();
    if (!result) return;
    const existingId = result.list.id;
    if (existingId) {
      // Check if a list with this ID already exists
      const { getList } = await import('@/lib/storage');
      const existing = getList(existingId);
      if (existing) {
        setConflict({ existing, parsed: result.list, handle: result.handle });
        return;
      }
    } else {
      result.list.id = generateShortId();
    }
    saveList(result.list);
    await saveFileHandle(result.list.id, result.handle);
    refresh();
    navigate(`/list/${result.list.id}`);
  }

  async function resolveConflict(choice: 'replace' | 'new') {
    if (!conflict) return;
    const id = importListWithChoice(conflict.parsed, choice);
    if (conflict.handle) {
      await saveFileHandle(id, conflict.handle);
    }
    setConflict(null);
    navigate(`/list/${id}`);
  }

  function reorder(fromId: string, toId: string) {
    if (fromId === toId) return;
    const ids = lists.map((l) => l.id);
    const fromIdx = ids.indexOf(fromId);
    const toIdx = ids.indexOf(toId);
    if (fromIdx === -1 || toIdx === -1) return;
    const next = [...ids];
    const [moved] = next.splice(fromIdx, 1);
    if (moved === undefined) return;
    next.splice(toIdx, 0, moved);
    updateCustomOrder(next);
  }

  function moveBy(id: string, delta: -1 | 1) {
    const ids = lists.map((l) => l.id);
    const idx = ids.indexOf(id);
    const nextIdx = idx + delta;
    if (idx === -1 || nextIdx < 0 || nextIdx >= ids.length) return;
    const next = [...ids];
    const a = next[idx]!;
    const b = next[nextIdx]!;
    next[idx] = b;
    next[nextIdx] = a;
    updateCustomOrder(next);
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{S.app.name}</h1>
        <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px]" onClick={() => navigate('/settings')} aria-label="App settings">
          <Settings className="h-5 w-5" />
        </Button>
      </div>

      {lists.length === 0 ? (
        <div className="text-center space-y-4 py-12">
          <h2 className="text-lg font-semibold">{S.home.emptyTitle}</h2>
          <p className="text-muted-foreground">{S.home.emptyDescription}</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {S.home.createList}
            </Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              {S.home.importList}
            </Button>
            {supported && (
              <Button variant="outline" onClick={handleOpenFile}>
                <FolderOpen className="h-4 w-4 mr-2" />
                Open file
              </Button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <Select
              value={sortOrder}
              onValueChange={(v) =>
                changeSortOrder(v as 'recent' | 'a-z' | 'created' | 'custom')
              }
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recent</SelectItem>
                <SelectItem value="a-z">A–Z</SelectItem>
                <SelectItem value="created">Created</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              {sortOrder === 'custom' && (
                <Button
                  size="sm"
                  variant={reorderMode ? 'default' : 'outline'}
                  onClick={() => setReorderMode((v) => !v)}
                  aria-pressed={reorderMode}
                >
                  {reorderMode ? 'Done' : 'Reorder'}
                </Button>
              )}
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                New
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-1" />
                Import
              </Button>
              {supported && (
                <Button size="sm" variant="outline" onClick={handleOpenFile}>
                  <FolderOpen className="h-4 w-4 mr-1" />
                  Open
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {lists.map((entry, idx) => (
              <ListCard
                key={entry.id}
                entry={entry}
                onClick={() => navigate(`/list/${entry.id}`)}
                reorderMode={reorderMode && sortOrder === 'custom'}
                isDragging={draggingId === entry.id}
                onDragStart={() => setDraggingId(entry.id)}
                onDragOver={() => {
                  dragOverIdRef.current = entry.id;
                }}
                onDrop={() => {
                  if (draggingId && dragOverIdRef.current) {
                    reorder(draggingId, dragOverIdRef.current);
                  }
                  setDraggingId(null);
                  dragOverIdRef.current = null;
                }}
                onDragEnd={() => {
                  setDraggingId(null);
                  dragOverIdRef.current = null;
                }}
                onMoveUp={idx > 0 ? () => moveBy(entry.id, -1) : undefined}
                onMoveDown={idx < lists.length - 1 ? () => moveBy(entry.id, 1) : undefined}
              />
            ))}
          </div>
        </>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown,.txt"
        className="hidden"
        onChange={handleImport}
      />

      <ListCreateDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
      />

      {conflict && (
        <ImportConflictDialog
          open={true}
          existingName={conflict.existing.name}
          incomingName={conflict.parsed.name}
          onReplace={() => resolveConflict('replace')}
          onImportAsNew={() => resolveConflict('new')}
          onCancel={() => setConflict(null)}
        />
      )}
    </div>
  );
}
