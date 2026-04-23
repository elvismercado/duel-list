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
import { useListRegistry } from '@/hooks/useListRegistry';
import { useFileSync } from '@/hooks/useFileSync';
import { saveFileHandle } from '@/lib/storage';
import { generateShortId } from '@/lib/markdown';

export default function Home() {
  const settings = getSettings();
  const navigate = useNavigate();
  const {
    lists,
    sortOrder,
    changeSortOrder,
    createList,
    importList,
    refresh,
  } = useListRegistry();
  const [createOpen, setCreateOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { supported, openFromFile } = useFileSync(undefined);

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
      const id = importList(text);
      navigate(`/list/${id}`);
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  async function handleOpenFile() {
    const result = await openFromFile();
    if (!result) return;
    // Assign a new ID to avoid collisions
    result.list.id = generateShortId();
    saveList(result.list);
    await saveFileHandle(result.list.id, result.handle);
    refresh();
    navigate(`/list/${result.list.id}`);
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{S.app.name}</h1>
        <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
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
            {lists.map((entry) => (
              <ListCard
                key={entry.id}
                entry={entry}
                onClick={() => navigate(`/list/${entry.id}`)}
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
    </div>
  );
}
