// ---------------------------------------------------------------------------
// File System Access API wrappers
// Desktop Chrome/Edge only.graceful degradation elsewhere
// ---------------------------------------------------------------------------

export function isFileSystemAccessSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'showSaveFilePicker' in window &&
    'showOpenFilePicker' in window
  );
}

export async function writeToFileHandle(
  handle: FileSystemFileHandle,
  content: string,
): Promise<void> {
  const writable = await handle.createWritable();
  await writable.write(content);
  await writable.close();
}

export async function readFromFileHandle(
  handle: FileSystemFileHandle,
): Promise<string> {
  const file = await handle.getFile();
  return file.text();
}

export async function pickFileForSave(
  suggestedName: string,
): Promise<FileSystemFileHandle | null> {
  try {
    return await window.showSaveFilePicker({
      suggestedName,
      types: [
        {
          description: 'Markdown files',
          accept: { 'text/markdown': ['.md'] },
        },
      ],
    });
  } catch (e) {
    // User cancelled the picker
    if (e instanceof DOMException && e.name === 'AbortError') return null;
    throw e;
  }
}

export async function pickFileForOpen(): Promise<{
  handle: FileSystemFileHandle;
  content: string;
} | null> {
  try {
    const [handle] = await window.showOpenFilePicker({
      types: [
        {
          description: 'Markdown files',
          accept: { 'text/markdown': ['.md', '.markdown', '.txt'] },
        },
      ],
    });
    if (!handle) return null;
    const content = await readFromFileHandle(handle);
    return { handle, content };
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') return null;
    throw e;
  }
}

export async function requestPermission(
  handle: FileSystemFileHandle,
  mode: FileSystemPermissionMode = 'readwrite',
): Promise<boolean> {
  const opts = { mode };
  if ((await handle.queryPermission(opts)) === 'granted') return true;
  if ((await handle.requestPermission(opts)) === 'granted') return true;
  return false;
}

/**
 * Create a companion file handle via save picker.
 * Used to auto-create the `.duellist.md` history file alongside the list file.
 */
export async function createCompanionHandle(
  companionName: string,
): Promise<FileSystemFileHandle | null> {
  try {
    return await window.showSaveFilePicker({
      suggestedName: companionName,
      types: [
        {
          description: 'Markdown files',
          accept: { 'text/markdown': ['.md'] },
        },
      ],
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') return null;
    throw e;
  }
}
