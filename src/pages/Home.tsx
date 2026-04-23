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
import { Plus, Settings, FolderOpen, ArrowDownAZ, ArrowUpAZ, ArrowDownNarrowWide, ArrowUpWideNarrow, ArrowUpDown } from 'lucide-react';
import { ListCard } from '@/components/ListCard';
import { ListCreateDialog } from '@/components/ListCreateDialog';
import { ImportConflictDialog } from '@/components/ImportConflictDialog';
import { useListRegistry } from '@/hooks/useListRegistry';
import { useFileSync } from '@/hooks/useFileSync';
import { saveFileHandle } from '@/lib/storage';
import { generateShortId } from '@/lib/markdown';
import type { ListConfig, HomeSortMode, HomeSortField } from '@/types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

function homeSortField(mode: HomeSortMode): HomeSortField {
  if (mode === 'custom') return 'custom';
  return mode.split('-')[0] as HomeSortField;
}

function homeSortDir(mode: HomeSortMode): 'asc' | 'desc' {
  if (mode === 'custom') return 'desc';
  return (mode.split('-')[1] as 'asc' | 'desc') ?? 'desc';
}

function joinHomeSort(field: HomeSortField, dir: 'asc' | 'desc'): HomeSortMode {
  if (field === 'custom') return 'custom';
  // 'name' has no -desc default outside this UI but the union supports both
  return `${field}-${dir}` as HomeSortMode;
}

function homeSortDirAria(mode: HomeSortMode): string {
  switch (mode) {
    case 'recent-desc': return S.home.sortDirAriaRecentDesc;
    case 'recent-asc': return S.home.sortDirAriaRecentAsc;
    case 'name-asc': return S.home.sortDirAriaNameAsc;
    case 'name-desc': return S.home.sortDirAriaNameDesc;
    case 'created-desc': return S.home.sortDirAriaCreatedDesc;
    case 'created-asc': return S.home.sortDirAriaCreatedAsc;
    default: return S.home.sortDirAriaRecentDesc;
  }
}

function HomeDirIcon({ mode, className }: { mode: HomeSortMode; className?: string }) {
  const field = homeSortField(mode);
  const dir = homeSortDir(mode);
  if (field === 'name') {
    return dir === 'asc' ? <ArrowDownAZ className={className} /> : <ArrowUpAZ className={className} />;
  }
  // recent / created — newest = desc
  return dir === 'desc' ? <ArrowDownNarrowWide className={className} /> : <ArrowUpWideNarrow className={className} />;
}

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { supported, openFromFile } = useFileSync(undefined);
  const [conflict, setConflict] = useState<{
    existing: ListConfig;
    parsed: ListConfig;
    handle?: FileSystemFileHandle;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (!settings.firstRunDone) {
    return <Navigate to="/welcome" replace />;
  }

  function handleCreate(
    name: string,
    kFactor: number,
    sessionLength: number,
    templateItems?: string[],
  ) {
    const id = createList(name, kFactor, sessionLength, templateItems);
    navigate(`/list/${id}`);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
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

  /** Unified open button: prefers File System Access API, falls back to <input type="file">. */
  async function handleOpen() {
    if (!supported) {
      fileInputRef.current?.click();
      return;
    }
    const result = await openFromFile();
    if (!result) return;
    const existingId = result.list.id;
    if (existingId) {
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

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = lists.map((l) => l.id);
    const fromIdx = ids.indexOf(active.id as string);
    const toIdx = ids.indexOf(over.id as string);
    if (fromIdx === -1 || toIdx === -1) return;
    updateCustomOrder(arrayMove(ids, fromIdx, toIdx));
  }

  function moveBy(id: string, delta: -1 | 1) {
    const ids = lists.map((l) => l.id);
    const idx = ids.indexOf(id);
    const nextIdx = idx + delta;
    if (idx === -1 || nextIdx < 0 || nextIdx >= ids.length) return;
    updateCustomOrder(arrayMove(ids, idx, nextIdx));
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{S.app.name}</h1>
        <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px]" onClick={() => navigate('/settings')} aria-label={S.app.appSettingsAria}>
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
            <Button variant="outline" onClick={handleOpen}>
              <FolderOpen className="h-4 w-4 mr-2" />
              {S.home.openFile}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                {S.home.new}
              </Button>
              <Button variant="outline" onClick={handleOpen}>
                <FolderOpen className="h-4 w-4 mr-1" />
                {S.home.open}
              </Button>
              {sortOrder === 'custom' && (
                <Button
                  variant={reorderMode ? 'default' : 'outline'}
                  onClick={() => setReorderMode((v) => !v)}
                  aria-pressed={reorderMode}
                >
                  {reorderMode ? S.home.done : S.home.reorder}
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={homeSortField(sortOrder)}
                onValueChange={(v) =>
                  changeSortOrder(joinHomeSort(v as HomeSortField, homeSortDir(sortOrder)))
                }
              >
                <SelectTrigger className="w-auto" aria-label={S.home.sortLabel}>
                  <ArrowUpDown className="h-4 w-4 mr-1 opacity-70" />
                  <SelectValue placeholder={S.home.sortBy} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">{S.home.sortFieldRecent}</SelectItem>
                  <SelectItem value="name">{S.home.sortFieldName}</SelectItem>
                  <SelectItem value="created">{S.home.sortFieldCreated}</SelectItem>
                  <SelectItem value="custom">{S.home.sortFieldCustom}</SelectItem>
                </SelectContent>
              </Select>
              {homeSortField(sortOrder) !== 'custom' && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const field = homeSortField(sortOrder);
                    const dir = homeSortDir(sortOrder);
                    changeSortOrder(joinHomeSort(field, dir === 'desc' ? 'asc' : 'desc'));
                  }}
                  aria-label={homeSortDirAria(sortOrder)}
                  aria-pressed={homeSortDir(sortOrder) === 'asc'}
                  title={homeSortDirAria(sortOrder)}
                >
                  <HomeDirIcon mode={sortOrder} className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={lists.map((l) => l.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {lists.map((entry, idx) => (
                  <ListCard
                    key={entry.id}
                    entry={entry}
                    onClick={() => navigate(`/list/${entry.id}`)}
                    reorderMode={reorderMode && sortOrder === 'custom'}
                    onMoveUp={idx > 0 ? () => moveBy(entry.id, -1) : undefined}
                    onMoveDown={idx < lists.length - 1 ? () => moveBy(entry.id, 1) : undefined}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown,.txt"
        className="hidden"
        onChange={handleFileInput}
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
