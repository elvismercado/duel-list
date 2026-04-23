import { useState } from 'react';
import { useNavigate } from 'react-router';
import { updateSettings, saveList } from '@/lib/storage';
import { getSampleList, SAMPLE_KEYS } from '@/lib/samples';
import { S } from '@/lib/strings';
import { Button } from '@/components/ui/button';

const TOUR_STEPS = [
  {
    heading: S.welcome.heading,
    description: S.welcome.description,
  },
  {
    heading: 'The Duel',
    description:
      'Two items appear side by side. Pick the winner, declare a tie, or skip.',
  },
  {
    heading: 'Your Ranking Builds Itself',
    description:
      'After each duel, your list re-ranks automatically. The more duels you do, the more accurate it gets.',
  },
  {
    heading: 'Quick Sessions',
    description: "Do 5–10 duels a day. It's a habit, not a chore.",
  },
  {
    heading: 'Ready!',
    description: 'Create a list or try a sample to get started.',
  },
];

export default function Welcome() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  function finish() {
    updateSettings({ firstRunDone: true });
    navigate('/');
  }

  function handleTrySample() {
    const key = SAMPLE_KEYS[Math.floor(Math.random() * SAMPLE_KEYS.length)]!;
    const sample = getSampleList(key);
    if (!sample) return;
    saveList(sample);
    updateSettings({ firstRunDone: true });
    navigate(`/list/${sample.id}`);
  }

  const current = TOUR_STEPS[step]!;
  const isLast = step === TOUR_STEPS.length - 1;

  return (
    <div className="p-4 max-w-md mx-auto text-center mt-12 space-y-6">
      <h1 className="text-3xl font-bold">{current.heading}</h1>
      <p className="text-muted-foreground">{current.description}</p>

      {/* Step dots */}
      <div className="flex justify-center gap-2">
        {TOUR_STEPS.map((_, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            className={`h-2 w-2 rounded-full transition-colors ${
              i === step ? 'bg-primary' : 'bg-muted'
            }`}
            aria-label={`Step ${i + 1}`}
          />
        ))}
      </div>

      <div className="flex flex-col gap-3 items-center">
        {isLast ? (
          <>
            <Button onClick={finish} className="w-48">
              Go to home
            </Button>
            <Button variant="outline" onClick={handleTrySample} className="w-48">
              {S.welcome.trySample}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                updateSettings({ firstRunDone: true });
                navigate('/features');
              }}
              className="w-48"
            >
              See all features
            </Button>
          </>
        ) : (
          <>
            <Button onClick={() => setStep(step + 1)} className="w-48">
              {step === 0 ? S.welcome.getStarted : 'Next'}
            </Button>
            {step === 0 && (
              <Button
                variant="outline"
                onClick={handleTrySample}
                className="w-48"
              >
                {S.welcome.trySample}
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => setStep(TOUR_STEPS.length - 1)}
              className="text-xs"
            >
              Skip tour
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
