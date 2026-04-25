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
    image: '/welcome/step-0-welcome.svg',
    alt: S.welcome.step0Alt,
  },
  {
    heading: S.welcome.duelStepTitle,
    description: S.welcome.duelStepDescription,
    image: '/welcome/step-1-duel.svg',
    alt: S.welcome.step1Alt,
  },
  {
    heading: S.welcome.sessionsStepTitle,
    description: S.welcome.sessionsStepDescription,
    image: '/welcome/step-2-sessions.svg',
    alt: S.welcome.step2Alt,
  },
  {
    heading: S.welcome.loopStepTitle,
    description: S.welcome.loopStepDescription,
    image: '/welcome/step-3-reminders.svg',
    alt: S.welcome.step3Alt,
  },
  {
    heading: S.welcome.templatesStepTitle,
    description: S.welcome.templatesStepDescription,
    image: '/welcome/step-4-templates.svg',
    alt: S.welcome.step4Alt,
  },
  {
    heading: S.welcome.readyStepTitle,
    description: S.welcome.readyStepDescription,
    image: '/welcome/step-5-ready.svg',
    alt: S.welcome.step5Alt,
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
    <div className="p-4 max-w-md mx-auto text-center space-y-6">
      <div className="aspect-[16/10] w-full overflow-hidden rounded-xl bg-brand-soft dark:bg-accent flex items-center justify-center">
        <img
          src={current.image}
          alt={current.alt}
          className="h-full w-full object-contain"
          loading={step === 0 ? 'eager' : 'lazy'}
        />
      </div>
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
            aria-label={S.welcome.stepAria(i + 1)}
          />
        ))}
      </div>

      <div className="flex flex-col gap-3 items-center">
        {isLast ? (
          <>
            <Button onClick={finish} className="w-48">
              {S.common.goToHome}
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
              {S.welcome.seeAllFeatures}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                updateSettings({ firstRunDone: true });
                navigate('/settings/glossary');
              }}
              className="w-48"
            >
              {S.welcome.seeGlossary}
            </Button>
          </>
        ) : (
          <>
            <Button onClick={() => setStep(step + 1)} className="w-48">
              {step === 0 ? S.welcome.getStarted : S.common.next}
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
              {S.welcome.skipTour}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
