import { useState, useCallback } from 'react';
import { getList, saveList as storageSave, deleteList as storageDelete } from '@/lib/storage';
import type { Item, ListConfig } from '@/types';
import { generateShortId } from '@/lib/markdown';
import { formatLocalDate } from '@/lib/datetime';

export function useList(id: string, onSave?: (list: ListConfig) => void) {
  const [list, setList] = useState<ListConfig | null>(() => getList(id));

  const reload = useCallback(() => {
    setList(getList(id));
  }, [id]);

  const save = useCallback(
    (updated: ListConfig) => {
      storageSave(updated);
      setList(updated);
      onSave?.(updated);
    },
    [onSave],
  );

  const addItems = useCallback(
    (names: string[]) => {
      if (!list) return;
      const today = formatLocalDate();
      const existingIds = new Set(list.items.map((i) => i.id));

      const newItems: Item[] = names
        .map((n) => n.trim())
        .filter((n) => n.length > 0)
        .map((name) => {
          let newId = generateShortId();
          while (existingIds.has(newId)) newId = generateShortId();
          existingIds.add(newId);
          return {
            id: newId,
            name,
            eloScore: 1000,
            prevEloScore: 1000,
            prevRank: 0,
            comparisonCount: 0,
            added: today,
          };
        });

      const updated = { ...list, items: [...list.items, ...newItems] };
      save(updated);
    },
    [list, save],
  );

  const renameItem = useCallback(
    (itemId: string, newName: string) => {
      if (!list) return;
      const updated = {
        ...list,
        items: list.items.map((i) =>
          i.id === itemId ? { ...i, name: newName } : i,
        ),
      };
      save(updated);
    },
    [list, save],
  );

  const removeItem = useCallback(
    (itemId: string) => {
      if (!list) return;
      const updated = {
        ...list,
        items: list.items.map((i) =>
          i.id === itemId ? { ...i, removed: true } : i,
        ),
      };
      save(updated);
    },
    [list, save],
  );

  const restoreItem = useCallback(
    (itemId: string) => {
      if (!list) return;
      const today = formatLocalDate();
      const updated = {
        ...list,
        items: list.items.map((i) =>
          i.id === itemId
            ? {
                ...i,
                removed: undefined,
                eloScore: 1000,
                prevEloScore: 1000,
                prevRank: 0,
                comparisonCount: 0,
                added: today,
              }
            : i,
        ),
      };
      save(updated);
    },
    [list, save],
  );

  const remove = useCallback(() => {
    storageDelete(id);
  }, [id]);

  const setItemNotes = useCallback(
    (itemId: string, text: string) => {
      if (!list) return;
      const trimmed = text.trim();
      const updated = {
        ...list,
        items: list.items.map((i) =>
          i.id === itemId
            ? { ...i, notes: trimmed.length > 0 ? trimmed : undefined }
            : i,
        ),
      };
      save(updated);
    },
    [list, save],
  );

  return { list, save, reload, addItems, renameItem, removeItem, restoreItem, setItemNotes, deleteList: remove };
}
