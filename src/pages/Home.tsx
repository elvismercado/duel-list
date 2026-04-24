import { useState, useRef, useMemo, useEffect } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router';
import { getSettings, saveList, getList, getHistory, updateSettings } from '@/lib/storage';
import { S } from '@/lib/strings';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Settings, FolderOpen, ArrowDownAZ, ArrowUpAZ, ArrowDownNarrowWide, ArrowUpWideNarrow, ArrowUpDown, Swords } from 'lucide-react';
import { ListCard } from '@/components/ListCard';
import { ListCreateDialog } from '@/components/ListCreateDialog';
import { ImportConflictDialog } from '@/components/ImportConflictDialog';
import { ReminderBanner } from '@/components/ReminderBanner';
import { isReminderDue, pickReminderList, pickRandomDuelList } from '@/lib/reminders';
import { getPermission, showLocal } from '@/lib/notifications';
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

  // Reminders: pick a candidate when due. Recompute when refresh changes.
  const [reminderTick, setReminderTick] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const testReminder = searchParams.get('testReminder') === '1';
  const reminderCandidate = useMemo(() => {
    const s = getSettings();
    if (!testReminder && !isReminderDue(s.reminders)) return null;
    return pickReminderList(lists, getList, getHistory, s.reminders);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lists, reminderTick, testReminder]);

  // Visibility-based channel arbitration: when the tab is hidden and the user
  // has opted into OS notifications, fire one through the SW instead of (and
  // not in addition to) showing the in-app banner. Re-evaluate when the tab
  // returns to the foreground so the banner can appear immediately on focus.
  useEffect(() => {
    if (!reminderCandidate) return;
    if (document.visibilityState !== 'hidden') return;
    const s = getSettings();
    const wantsOs = s.reminders.channel === 'os' || s.reminders.channel === 'both';
    if (!wantsOs) return;
    if (getPermission() !== 'granted') return;
    void showLocal({
      title: S.settings.osNotificationTitle,
      body: S.settings.osNotificationBody(
        reminderCandidate.list.name,
        Math.round(reminderCandidate.daysSinceOpened),
      ),
      url: `/list/${reminderCandidate.entry.id}/duel`,
      listId: reminderCandidate.entry.id,
    });
    // Mark as shown so we don't keep firing on every focus loss.
    updateSettings({
      reminders: { ...s.reminders, lastShownAt: Date.now() },
    });
  }, [reminderCandidate]);

  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState === 'visible') {
        setReminderTick((t) => t + 1);
      }
    }
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // Suppress the in-app banner when the page is hidden — the OS notification
  // (if permitted) is doing the work; otherwise the banner will appear on
  // next focus via the visibilitychange listener above.
  const showBanner =
    reminderCandidate !== null &&
    (typeof document === 'undefined' || document.visibilityState === 'visible');

  function clearTestFlag() {
    if (testReminder) {
      const next = new URLSearchParams(searchParams);
      next.delete('testReminder');
      setSearchParams(next, { replace: true });
    }
  }

  function handleSnoozeReminder() {
    const s = getSettings();
    updateSettings({
      reminders: {
        ...s.reminders,
        snoozedUntil: Date.now() + 24 * 60 * 60 * 1000,
        lastShownAt: Date.now(),
      },
    });
    clearTestFlag();
    setReminderTick((t) => t + 1);
  }

  function handleSkipReminder() {
    const s = getSettings();
    updateSettings({
      reminders: { ...s.reminders, lastShownAt: Date.now() },
    });
    clearTestFlag();
    setReminderTick((t) => t + 1);
  }

  function handleRandomDuel() {
    const pick = pickRandomDuelList(lists, getList, getHistory);
    if (pick) navigate(`/list/${pick.id}/duel`);
  }

  // Eligible only when at least one list has >= 2 active items.
  const hasDuelEligibleList = useMemo(
    () => lists.some((l) => (getList(l.id)?.items.filter((i) => !i.removed).length ?? 0) >= 2),
    [lists],
  );

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{S.app.name}</h1>
        <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px]" onClick={() => navigate('/settings')} aria-label={S.app.appSettingsAria}>
          <Settings className="h-5 w-5" />
        </Button>
      </div>

      {reminderCandidate && showBanner && (
        <ReminderBanner
          candidate={reminderCandidate}
          onSnooze={handleSnoozeReminder}
          onSkip={handleSkipReminder}
        />
      )}

      {hasDuelEligibleList && (
        <button
          type="button"
          onClick={handleRandomDuel}
          className="w-full text-left rounded-lg border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 flex items-center gap-3 hover:from-primary/15 hover:via-primary/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={S.home.heroAction}
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Swords className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-base font-semibold">{S.home.heroTitle}</div>
            <div className="text-xs text-muted-foreground truncate">{S.home.heroSubtitle}</div>
          </div>
          <span className="shrink-0 text-sm font-medium text-primary">{S.home.heroAction}</span>
        </button>
      )}

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
