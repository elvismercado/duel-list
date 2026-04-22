import { useNavigate } from 'react-router';
import { updateSettings } from '@/lib/storage';
import { S } from '@/lib/strings';

export default function Welcome() {
  const navigate = useNavigate();

  function handleGetStarted() {
    updateSettings({ firstRunDone: true });
    navigate('/');
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6 text-center mt-12">
      <h1 className="text-3xl font-bold">{S.welcome.heading}</h1>
      <p className="text-muted-foreground">{S.welcome.description}</p>
      <div className="flex flex-col gap-3 items-center">
        <button
          onClick={handleGetStarted}
          className="px-6 py-3 rounded-md bg-primary text-primary-foreground font-medium"
        >
          {S.welcome.getStarted}
        </button>
        <button
          onClick={handleGetStarted}
          className="px-6 py-3 rounded-md border text-foreground"
        >
          {S.welcome.trySample}
        </button>
      </div>
    </div>
  );
}
