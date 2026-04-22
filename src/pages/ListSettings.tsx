import { useParams, useNavigate } from 'react-router';
import { getList } from '@/lib/storage';
import { S } from '@/lib/strings';

export default function ListSettings() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const list = id ? getList(id) : null;

  if (!list) {
    return (
      <div className="p-4 max-w-lg mx-auto space-y-4 text-center mt-12">
        <h1 className="text-2xl font-bold">List not found</h1>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground"
        >
          Go home
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <h1 className="text-2xl font-bold">{S.settings.title} — {list.name}</h1>
      <div className="space-y-3 text-muted-foreground">
        <p>{S.settings.kFactorLabel}: {list.kFactor}</p>
        <p>{S.settings.sessionLengthLabel}: {list.sessionLength}</p>
      </div>
    </div>
  );
}
