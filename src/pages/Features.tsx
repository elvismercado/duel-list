import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { S } from '@/lib/strings';
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

const FEATURE_ICONS: React.ComponentType<{ className?: string }>[] = [
  Swords,
  Trophy,
  WandSparkles,
  ListOrdered,
  FolderSync,
  History,
  Download,
  Smartphone,
  KeyRound,
  Layers,
];

export default function Features() {
  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" className="min-h-[44px] min-w-[44px]" aria-label={S.common.backAria}>
          <Link to="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{S.features.heading}</h1>
      </div>

      <p className="text-muted-foreground">
        {S.features.intro}
      </p>

      <Separator />

      <div className="grid gap-4 sm:grid-cols-2">
        {S.features.list.map((feature, idx) => {
          const Icon = FEATURE_ICONS[idx]!;
          return (
            <article
              key={feature.title}
              className="rounded-lg border bg-card p-4 space-y-2"
            >
              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-primary shrink-0" />
                <h2 className="font-semibold">{feature.title}</h2>
              </div>
              <p className="text-sm text-muted-foreground">{feature.body}</p>
            </article>
          );
        })}
      </div>

      <Separator />

      <div className="text-center space-y-2">
        <Button asChild>
          <Link to="/">{S.features.goToLists}</Link>
        </Button>
      </div>
    </div>
  );
}
