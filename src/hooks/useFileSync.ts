import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getFileHandle,
  saveFileHandle,
  deleteFileHandle,
} from '@/lib/storage';
import {
  isFileSystemAccessSupported,
  writeToFileHandle,
  requestPermission,
  pickFileForSave,
  pickFileForOpen,
} from '@/lib/file-sync';
import { serializeMarkdown, parseMarkdown } from '@/lib/markdown';
import { getHistory } from '@/lib/storage';
import { slugify } from '@/lib/download';
import { S } from '@/lib/strings';
import { toast } from 'sonner';
import type { ListConfig } from '@/types';

interface FileSyncState {
  listHandle: FileSystemFileHandle | null;
  historyHandle: FileSystemFileHandle | null;
  isSynced: boolean;
  needsRelink: boolean;
}

export function useFileSync(listId: string | undefined) {
  const [state, setState] = useState<FileSyncState>({
    listHandle: null,
    historyHandle: null,
    isSynced: false,
    needsRelink: false,
  });
  const supported = isFileSystemAccessSupported();
  const initRef = useRef(false);

  // Load persisted handles on mount
  useEffect(() => {
    if (!supported || !listId || initRef.current) return;
    initRef.current = true;

    (async () => {
      const handle = await getFileHandle(listId);
      const histHandle = await getFileHandle(`${listId}:history`);
      if (!handle) return;

      const granted = await requestPermission(handle);
      if (!granted) {
        setState((s) => ({ ...s, needsRelink: true }));
        return;
      }

      let histOk = false;
      if (histHandle) {
        histOk = await requestPermission(histHandle);
      }

      setState({
        listHandle: handle,
        historyHandle: histOk ? histHandle : null,
        isSynced: true,
        needsRelink: false,
      });
    })();
  }, [supported, listId]);

  const linkFile = useCallback(
    async (list: ListConfig) => {
      if (!supported || !listId) return;

      const handle = await pickFileForSave(`${slugify(list.name)}.md`);
      if (!handle) return;

      try {
        // Write list to file
        const content = serializeMarkdown(list);
        await writeToFileHandle(handle, content);
        await saveFileHandle(listId, handle);

        // Auto-create history companion file
        const histName = handle.name.replace(/\.md$/, '.duellist.md');
        let histHandle: FileSystemFileHandle | null = null;
        try {
          histHandle = await pickFileForSave(histName);
          if (histHandle) {
            const history = getHistory(listId);
            if (history) {
              await writeToFileHandle(histHandle, history);
            }
            await saveFileHandle(`${listId}:history`, histHandle);
          }
        } catch {
          // History file is optional.continue without it
        }

        setState({
          listHandle: handle,
          historyHandle: histHandle,
          isSynced: true,
          needsRelink: false,
        });
        toast.success(S.toast.fileLinkSuccess);
      } catch {
        toast.error(S.toast.fileLinkError);
      }
    },
    [supported, listId],
  );

  const unlinkFile = useCallback(async () => {
    if (!listId) return;
    try {
      await deleteFileHandle(listId);
      await deleteFileHandle(`${listId}:history`);
      setState({
        listHandle: null,
        historyHandle: null,
        isSynced: false,
        needsRelink: false,
      });
      toast.success(S.toast.fileUnlinkSuccess);
    } catch {
      toast.error(S.toast.fileLinkError);
    }
  }, [listId]);

  const syncToFile = useCallback(
    async (list: ListConfig) => {
      if (!state.listHandle) return;
      try {
        const content = serializeMarkdown(list);
        await writeToFileHandle(state.listHandle, content);
      } catch {
        // File may have been moved/deleted.mark as needing relink
        setState((s) => ({ ...s, isSynced: false, needsRelink: true }));
      }
    },
    [state.listHandle],
  );

  const syncHistoryToFile = useCallback(async () => {
    if (!state.historyHandle || !listId) return;
    try {
      const history = getHistory(listId);
      if (history) {
        await writeToFileHandle(state.historyHandle, history);
      }
    } catch {
      // History file sync failure is non-critical
    }
  }, [state.historyHandle, listId]);

  const openFromFile = useCallback(async (): Promise<{
    list: ListConfig;
    handle: FileSystemFileHandle;
  } | null> => {
    if (!supported) return null;
    try {
      const result = await pickFileForOpen();
      if (!result) return null;
      const list = parseMarkdown(result.content);
      return { list, handle: result.handle };
    } catch {
      toast.error(S.toast.fileLinkError);
      return null;
    }
  }, [supported]);

  const linkExistingHandle = useCallback(
    async (handle: FileSystemFileHandle) => {
      if (!listId) return;
      await saveFileHandle(listId, handle);
      setState((s) => ({
        ...s,
        listHandle: handle,
        isSynced: true,
        needsRelink: false,
      }));
    },
    [listId],
  );

  return {
    supported,
    ...state,
    linkFile,
    unlinkFile,
    syncToFile,
    syncHistoryToFile,
    openFromFile,
    linkExistingHandle,
  };
}

export type LinkStatus = 'linked' | 'broken' | 'unlinked';

/**
 * Maps `useFileSync` flags to a single discriminated status.
 * Returns `undefined` when File System Access is unsupported, so callers can
 * render nothing on browsers that can't link files at all.
 */
export function deriveLinkStatus(
  supported: boolean,
  isSynced: boolean,
  needsRelink: boolean,
): LinkStatus | undefined {
  if (!supported) return undefined;
  if (isSynced) return 'linked';
  if (needsRelink) return 'broken';
  return 'unlinked';
}
