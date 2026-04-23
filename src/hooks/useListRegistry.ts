import { useState, useCallback } from 'react';
import {
  getAllLists,
  saveList,
  deleteList as storageDelete,
  getSettings,
  updateSettings,
  getList,
  type ListEntry,
} from '@/lib/storage';
import { generateShortId, parseMarkdown } from '@/lib/markdown';
import type { ListConfig } from '@/types';

export type ImportResult =
  | { status: 'ok'; id: string }
  | { status: 'conflict'; existing: ListConfig; parsed: ListConfig };

function sortEntries(
  entries: ListEntry[],
  order: string,
  customOrder: string[],
): ListEntry[] {
  switch (order) {
    case 'a-z':
      return [...entries].sort((a, b) => a.name.localeCompare(b.name));
    case 'created': {
      return [...entries].sort((a, b) => {
        const aList = getList(a.id);
        const bList = getList(b.id);
        return (bList?.created ?? '').localeCompare(aList?.created ?? '');
      });
    }
    case 'custom': {
      const idxMap = new Map(customOrder.map((id, idx) => [id, idx]));
      return [...entries].sort((a, b) => {
        const ai = idxMap.get(a.id) ?? Infinity;
        const bi = idxMap.get(b.id) ?? Infinity;
        return ai - bi;
      });
    }
    default: // 'recent'
      return [...entries].sort(
        (a, b) => (b.lastOpened ?? 0) - (a.lastOpened ?? 0),
      );
  }
}

export function useListRegistry() {
  const settings = getSettings();
  const [lists, setLists] = useState<ListEntry[]>(() =>
    sortEntries(getAllLists(), settings.homeSortOrder, settings.customListOrder),
  );
  const [sortOrder, setSortOrder] = useState(settings.homeSortOrder);

  const refresh = useCallback(() => {
    const s = getSettings();
    setLists(sortEntries(getAllLists(), s.homeSortOrder, s.customListOrder));
  }, []);

  const changeSortOrder = useCallback(
    (order: 'recent' | 'a-z' | 'created' | 'custom') => {
      updateSettings({ homeSortOrder: order });
      setSortOrder(order);
      const s = getSettings();
      setLists(sortEntries(getAllLists(), order, s.customListOrder));
    },
    [],
  );

  const updateCustomOrder = useCallback((ids: string[]) => {
    updateSettings({ customListOrder: ids });
    setLists(sortEntries(getAllLists(), 'custom', ids));
  }, []);

  const createList = useCallback(
    (
      name: string,
      kFactor: number,
      sessionLength: number,
      templateItems?: string[],
    ): string => {
      const id = generateShortId();
      const today = new Date().toISOString().slice(0, 10);
      const items = (templateItems ?? []).map((itemName) => ({
        id: generateShortId(),
        name: itemName,
        eloScore: 1000,
        prevEloScore: 1000,
        prevRank: 0,
        comparisonCount: 0,
        added: today,
      }));
      const config: ListConfig = {
        id,
        name,
        kFactor,
        sessionLength,
        created: today,
        items,
      };
      saveList(config);
      refresh();
      return id;
    },
    [refresh],
  );

  const importList = useCallback(
    (markdown: string): ImportResult => {
      const parsed = parseMarkdown(markdown);
      const existing = parsed.id ? getList(parsed.id) : null;
      if (existing) {
        return { status: 'conflict', existing, parsed };
      }
      if (!parsed.id) parsed.id = generateShortId();
      saveList(parsed);
      refresh();
      return { status: 'ok', id: parsed.id };
    },
    [refresh],
  );

  const importListWithChoice = useCallback(
    (parsed: ListConfig, choice: 'replace' | 'new'): string => {
      if (choice === 'new') {
        parsed.id = generateShortId();
      }
      saveList(parsed);
      refresh();
      return parsed.id;
    },
    [refresh],
  );

  const deleteList = useCallback(
    (id: string) => {
      storageDelete(id);
      refresh();
    },
    [refresh],
  );

  return {
    lists,
    sortOrder,
    changeSortOrder,
    updateCustomOrder,
    createList,
    importList,
    importListWithChoice,
    deleteList,
    refresh,
  };
}
