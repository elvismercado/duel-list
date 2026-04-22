import { Navigate, useNavigate } from 'react-router';
import { getSettings } from '@/lib/storage';
import { S } from '@/lib/strings';

export default function Home() {
  const settings = getSettings();
  const navigate = useNavigate();

  if (!settings.firstRunDone) {
    return <Navigate to="/welcome" replace />;
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{S.app.name}</h1>
      <p className="text-muted-foreground">{S.home.emptyDescription}</p>
      <div className="flex gap-3">
        <button
          onClick={() => navigate('/welcome')}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground"
        >
          {S.home.createList}
        </button>
      </div>
    </div>
  );
}
