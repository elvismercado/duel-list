import { Link } from 'react-router';
import { HelpCircle } from 'lucide-react';
import { S } from '@/lib/strings';
import { cn } from '@/lib/utils';

interface HelpHintProps {
  /** Glossary anchor id, e.g. 'score', 'rank', 'session' */
  anchor: string;
  /** Human-readable term used in the aria-label (e.g. 'Score') */
  term: string;
  className?: string;
}

/**
 * Small inline help icon. Tap navigates to the Glossary page scrolled to
 * the matching term anchor.
 */
export function HelpHint({ anchor, term, className }: HelpHintProps) {
  return (
    <Link
      to={`/settings/glossary#${anchor}`}
      aria-label={S.common.helpAria(term)}
      className={cn(
        'inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      <HelpCircle className="h-3.5 w-3.5" />
    </Link>
  );
}
