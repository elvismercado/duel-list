import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { S } from '@/lib/strings';
import { Bell, X } from 'lucide-react';
import type { ReminderCandidate } from '@/lib/reminders';

interface ReminderBannerProps {
  candidate: ReminderCandidate;
  onSnooze: () => void;
  onSkip: () => void;
}

export function ReminderBanner({ candidate, onSnooze, onSkip }: ReminderBannerProps) {
  const navigate = useNavigate();
  const days = Math.floor(candidate.daysSinceLastDuel);

  // Mirrors the Home "Random duel" hero: same primary palette + typography,
  // but the gradient flows top-right → bottom-left so the two blocks read as
  // a pair when stacked. The hero is "your choice"; this is "system nudge".
  return (
    <div
      className="w-full rounded-lg border bg-gradient-to-bl from-primary/10 via-primary/5 to-transparent p-4 flex items-center gap-3"
      role="region"
      aria-label={S.reminders.bannerTitle}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Bell className="h-6 w-6" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-base font-semibold">{S.reminders.bannerTitle}</div>
        <div className="text-xs text-muted-foreground truncate">
          {S.reminders.bannerSubtitle(candidate.entry.name, days)}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          size="sm"
          onClick={() => navigate(`/list/${candidate.entry.id}/duel`)}
        >
          {S.reminders.play}
        </Button>
        <Button size="sm" variant="ghost" onClick={onSnooze}>
          {S.reminders.snooze}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={onSkip}
          aria-label={S.reminders.dismissAria}
          title={S.reminders.skip}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
