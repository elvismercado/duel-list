import { S } from '@/lib/strings';
import { getSettings, updateSettings, getStorageUsage } from '@/lib/storage';
import { useExport } from '@/hooks/useExport';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Download } from 'lucide-react';
import { useState } from 'react';

export default function AppSettingsPage() {
  const [settings, setSettings] = useState(getSettings);
  const { exportAll, exportAppData } = useExport();
  const storage = getStorageUsage();

  function handleThemeChange(theme: string) {
    updateSettings({ theme: theme as 'system' | 'light' | 'dark' });
    setSettings(getSettings());
    // Apply theme to document
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(prefersDark ? 'dark' : 'light');
    } else {
      root.classList.add(theme);
    }
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{S.settings.title}</h1>

      {/* Theme */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Theme</label>
        <Select
          value={settings.theme ?? 'system'}
          onValueChange={handleThemeChange}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="system">System</SelectItem>
            <SelectItem value="light">Light</SelectItem>
            <SelectItem value="dark">Dark</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Export */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Export</h2>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={exportAll}>
            <Download className="h-4 w-4 mr-1" />
            {S.export.exportAll}
          </Button>
          <Button variant="outline" size="sm" onClick={exportAppData}>
            <Download className="h-4 w-4 mr-1" />
            {S.export.exportAppData}
          </Button>
        </div>
      </div>

      <Separator />

      {/* Storage */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Storage
        </h2>
        <Progress value={storage.percentage} className="h-2" />
        <p className="text-xs text-muted-foreground">
          {(storage.current / 1024).toFixed(1)} KB used of ~
          {(storage.limit / 1024 / 1024).toFixed(0)} MB
        </p>
      </div>
    </div>
  );
}
