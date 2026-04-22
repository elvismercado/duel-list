import { S } from '@/lib/strings';

export default function AppSettingsPage() {
  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <h1 className="text-2xl font-bold">{S.settings.title}</h1>
      <div className="space-y-3 text-muted-foreground">
        <p>{S.export.exportAll}</p>
        <p>App settings UI coming in Phase D</p>
      </div>
    </div>
  );
}
