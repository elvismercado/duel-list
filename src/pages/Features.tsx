import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Trophy,
  Swords,
  FolderSync,
  ListOrdered,
  WandSparkles,
  Smartphone,
  History,
  Download,
  KeyRound,
  Layers,
  ArrowLeft,
} from 'lucide-react';

interface Feature {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}

const FEATURES: Feature[] = [
  {
    icon: Swords,
    title: 'Pairwise duels',
    body:
      'No need to rank a long list from scratch. Decide between just two items at a time and the algorithm sorts the rest.',
  },
  {
    icon: Trophy,
    title: 'ELO ratings under the hood',
    body:
      'Every choice updates an ELO score. See your list converge with each duel — toggle between rank position and raw ELO from the rankings screen.',
  },
  {
    icon: WandSparkles,
    title: 'Smart pairing',
    body:
      'Pairs are picked to maximize information: similar ratings first, low-confidence items prioritized, recently skipped pairs penalized.',
  },
  {
    icon: ListOrdered,
    title: 'Multiple lists, custom order',
    body:
      'Keep separate lists for movies, snacks, vacation spots — anything. Sort by recent / A–Z / created, or drag to a custom order.',
  },
  {
    icon: FolderSync,
    title: 'Optional file sync',
    body:
      'On supported browsers, link a list to a Markdown file on your device. Edits stream straight to disk so you can keep your data in version control or sync it via your cloud of choice.',
  },
  {
    icon: History,
    title: 'Full duel history',
    body:
      'Every choice is recorded with date and items. Browse the history from the rankings header or export it as Markdown.',
  },
  {
    icon: Download,
    title: 'Markdown import & export',
    body:
      'Lists are plain Markdown — readable, diffable, portable. Export anytime; import to merge or replace.',
  },
  {
    icon: Smartphone,
    title: 'Touch-friendly PWA',
    body:
      'Install to your home screen and use offline. Side-by-side and swipe duel modes are tuned for one-handed phone use.',
  },
  {
    icon: KeyRound,
    title: 'Local-first, private',
    body:
      'No accounts, no servers, no telemetry. Everything is stored in your browser (and optionally your file system). You own your data.',
  },
  {
    icon: Layers,
    title: 'Templates to start fast',
    body:
      'Pick a starter template (Anime, Pizza Toppings, Movies, Vacation, Snacks, Hobbies) when creating a list to skip the empty-state.',
  },
];

export default function Features() {
  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" className="min-h-[44px] min-w-[44px]" aria-label="Back">
          <Link to="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Features</h1>
      </div>

      <p className="text-muted-foreground">
        DuelList turns the painful job of ranking a long list into a stream of
        easy two-way choices. Here's what's in the box.
      </p>

      <Separator />

      <div className="grid gap-4 sm:grid-cols-2">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <article
            key={title}
            className="rounded-lg border bg-card p-4 space-y-2"
          >
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-primary shrink-0" />
              <h2 className="font-semibold">{title}</h2>
            </div>
            <p className="text-sm text-muted-foreground">{body}</p>
          </article>
        ))}
      </div>

      <Separator />

      <div className="text-center space-y-2">
        <Button asChild>
          <Link to="/">Go to your lists</Link>
        </Button>
      </div>
    </div>
  );
}
