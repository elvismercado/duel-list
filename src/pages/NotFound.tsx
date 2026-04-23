import { useNavigate } from 'react-router';
import { S } from '@/lib/strings';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 text-center mt-12">
      <h1 className="text-2xl font-bold">{S.common.pageNotFound}</h1>
      <p className="text-muted-foreground">
        {S.common.pageNotFoundDescription}
      </p>
      <button
        onClick={() => navigate('/')}
        className="px-4 py-2 rounded-md bg-primary text-primary-foreground"
      >
        {S.common.goHome}
      </button>
    </div>
  );
}
