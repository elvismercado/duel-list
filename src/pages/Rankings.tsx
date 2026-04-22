import { useParams, useNavigate } from 'react-router';
import { getList } from '@/lib/storage';
import { S } from '@/lib/strings';

export default function Rankings() {
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

  const activeItems = list.items.filter((i) => !i.removed);

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <h1 className="text-2xl font-bold">{list.name}</h1>
      {activeItems.length === 0 ? (
        <p className="text-muted-foreground">{S.list.noItems}</p>
      ) : (
        <ul className="space-y-2">
          {activeItems
            .sort((a, b) => b.eloScore - a.eloScore)
            .map((item, idx) => (
              <li key={item.id} className="flex items-center gap-3 rounded-md border p-3">
                <span className="text-muted-foreground font-mono text-sm w-6 text-right">
                  {idx + 1}
                </span>
                <span>{item.name}</span>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
