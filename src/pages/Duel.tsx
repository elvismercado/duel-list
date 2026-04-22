import { useParams, useNavigate } from 'react-router';
import { getList } from '@/lib/storage';
import { S } from '@/lib/strings';

export default function Duel() {
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

  if (activeItems.length < 2) {
    return (
      <div className="p-4 max-w-lg mx-auto space-y-4 text-center mt-12">
        <p className="text-muted-foreground">{S.duel.needTwoItems}</p>
        <button
          onClick={() => navigate(`/list/${id}`)}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground"
        >
          Back to list
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 text-center mt-12">
      <h1 className="text-2xl font-bold">Duel — {list.name}</h1>
      <p className="text-muted-foreground">Duel UI coming in Phase D</p>
    </div>
  );
}
