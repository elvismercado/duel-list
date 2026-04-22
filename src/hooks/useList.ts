import { useState, useCallback } from 'react';
import { getList, saveList as storageSave, deleteList as storageDelete } from '@/lib/storage';
import type { Item, ListConfig } from '@/types';
import { generateShortId } from '@/lib/markdown';

export function useList(id: string) {
  const [list, setList] = useState<ListConfig | null>(() => getList(id));

  const reload = useCallback(() => {
    setList(getList(id));
  }, [id]);

  const save = useCallback(
    (updated: ListConfig) => {
      storageSave(updated);
      setList(updated);
    },
    [],
  );

  const addItems = useCallback(
    (names: string[]) => {
      if (!list) return;
      const today = new Date().toISOString().slice(0, 10);
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
      const today = new Date().toISOString().slice(0, 10);
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

  return { list, save, reload, addItems, renameItem, removeItem, restoreItem, deleteList: remove };
}
