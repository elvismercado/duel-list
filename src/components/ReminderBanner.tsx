import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { S } from '@/lib/strings';
import { Swords, X } from 'lucide-react';
import type { ReminderCandidate } from '@/lib/reminders';

interface ReminderBannerProps {
  candidate: ReminderCandidate;
  onSnooze: () => void;
  onSkip: () => void;
}

export function ReminderBanner({ candidate, onSnooze, onSkip }: ReminderBannerProps) {
  const navigate = useNavigate();
  const days = Math.floor(candidate.daysSinceOpened);

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <Swords className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{S.reminders.bannerTitle}</p>
            <p className="text-xs text-muted-foreground sm:truncate">
              {S.reminders.bannerSubtitle(candidate.entry.name, days)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto">
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
      </CardContent>
    </Card>
  );
}
