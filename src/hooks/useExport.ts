import { useCallback } from 'react';
import { serializeMarkdown } from '@/lib/markdown';
import { getAllLists, getList, getHistory } from '@/lib/storage';
import { downloadFile, downloadZip, slugify } from '@/lib/download';
import { formatLocalDate } from '@/lib/datetime';
import type { ListConfig } from '@/types';

export function useExport() {
  const exportList = useCallback((list: ListConfig) => {
    const md = serializeMarkdown(list);
    downloadFile(md, `${slugify(list.name)}.md`, 'text/markdown');
  }, []);

  const exportHistory = useCallback((listId: string, listName: string) => {
    const history = getHistory(listId);
    if (!history) return;
    downloadFile(
      history,
      `${slugify(listName)}.duellist.md`,
      'text/markdown',
    );
  }, []);

  const exportAll = useCallback(async () => {
    const entries = getAllLists();
    const files: Array<{ path: string; content: string }> = [];

    for (const entry of entries) {
      const list = getList(entry.id);
      if (!list) continue;

      const slug = slugify(list.name);
      files.push({ path: `${slug}.md`, content: serializeMarkdown(list) });

      const history = getHistory(entry.id);
      if (history) {
        files.push({ path: `${slug}.duellist.md`, content: history });
      }
    }

    const date = formatLocalDate();
    await downloadZip(files, `duellist-export-${date}.zip`);
  }, []);

  const exportAppData = useCallback(() => {
    const data: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('duellist:')) {
        data[key] = localStorage.getItem(key) ?? '';
      }
    }
    const json = JSON.stringify(data, null, 2);
    const date = formatLocalDate();
    downloadFile(json, `duellist-backup-${date}.json`, 'application/json');
  }, []);

  return { exportList, exportHistory, exportAll, exportAppData };
}
