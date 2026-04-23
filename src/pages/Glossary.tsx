import { useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { S } from '@/lib/strings';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Bell,
  FileCheck,
  FileQuestion,
  FileX,
  Hash,
  History,
  Plus,
  Settings,
  Swords,
  Trophy,
  Undo2,
} from 'lucide-react';

type Row = {
  swatch: React.ReactNode;
  label: string;
  desc: string;
};

function GlossaryRow({ swatch, label, desc }: Row) {
  return (
    <li className="flex items-start gap-3 py-2">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center">
        {swatch}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
    </li>
  );
}

function Section({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="space-y-1 scroll-mt-4">
      <h2 className="text-sm font-semibold text-muted-foreground">{title}</h2>
      <ul className="divide-y divide-border/60 rounded-md border bg-card/40 px-3">
        {children}
      </ul>
    </section>
  );
}

function TermRow({ id, label, desc }: { id?: string; label: string; desc: string }) {
  return (
    <li id={id} className="py-2 scroll-mt-4">
      <div className="text-sm font-medium">{label}</div>
      <div className="text-xs text-muted-foreground">{desc}</div>
    </li>
  );
}

function Dot({ className }: { className: string }) {
  return <span className={`h-3 w-3 rounded-full ${className}`} />;
}

export default function GlossaryPage() {
  const G = S.glossary;
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const el = document.getElementById(hash.slice(1));
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [hash]);
  return (
    <div className="p-4 max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" aria-label={G.backAria}>
          <Link to="/settings">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{G.heading}</h1>
      </div>

      <p className="text-sm text-muted-foreground">{G.intro}</p>

      <Separator />

      <Section id="terminology" title={G.sectionTerminology}>
        <TermRow id="list" label={G.termListLabel} desc={G.termListDesc} />
        <TermRow id="item" label={G.termItemLabel} desc={G.termItemDesc} />
        <TermRow id="item-list" label={G.termItemListLabel} desc={G.termItemListDesc} />
        <TermRow id="duel" label={G.termDuelLabel} desc={G.termDuelDesc} />
        <TermRow id="session" label={G.termSessionLabel} desc={G.termSessionDesc} />
        <TermRow id="score" label={G.termScoreLabel} desc={G.termScoreDesc} />
        <TermRow id="rank" label={G.termRankLabel} desc={G.termRankDesc} />
        <TermRow id="brand" label={G.termBrandLabel} desc={G.termBrandDesc} />
      </Section>

      <Section title={G.sectionActivity}>
        <GlossaryRow
          swatch={<Dot className="bg-emerald-500" />}
          label={S.list.activityFresh}
          desc={G.activityFreshDesc}
        />
        <GlossaryRow
          swatch={<Dot className="bg-amber-500" />}
          label={S.list.activityStale}
          desc={G.activityStaleDesc}
        />
        <GlossaryRow
          swatch={<Dot className="bg-muted-foreground/40" />}
          label={S.list.activityCold}
          desc={G.activityColdDesc}
        />
        <GlossaryRow
          swatch={<Dot className="bg-muted-foreground/30" />}
          label={S.list.activityNever}
          desc={G.activityNeverDesc}
        />
      </Section>

      <Section title={G.sectionFileLink}>
        <GlossaryRow
          swatch={<FileCheck className="h-4 w-4 text-emerald-600" />}
          label={G.fileLinkedLabel}
          desc={G.fileLinkedDesc}
        />
        <GlossaryRow
          swatch={<FileX className="h-4 w-4 text-destructive" />}
          label={G.fileBrokenLabel}
          desc={G.fileBrokenDesc}
        />
        <GlossaryRow
          swatch={<FileQuestion className="h-4 w-4 text-muted-foreground" />}
          label={G.fileNotLinkedLabel}
          desc={G.fileNotLinkedDesc}
        />
      </Section>

      <Section title={G.sectionRankingView}>
        <GlossaryRow
          swatch={<Hash className="h-4 w-4" />}
          label={G.rankViewLabel}
          desc={G.rankViewDesc}
        />
        <GlossaryRow
          swatch={<Trophy className="h-4 w-4 text-amber-500" />}
          label={G.scoreViewLabel}
          desc={G.scoreViewDesc}
        />
      </Section>

      <Section title={G.sectionQuickActions}>
        <GlossaryRow
          swatch={<History className="h-4 w-4" />}
          label={G.actionHistoryLabel}
          desc={G.actionHistoryDesc}
        />
        <GlossaryRow
          swatch={<Plus className="h-4 w-4" />}
          label={G.actionAddLabel}
          desc={G.actionAddDesc}
        />
        <GlossaryRow
          swatch={<Settings className="h-4 w-4" />}
          label={G.actionSettingsLabel}
          desc={G.actionSettingsDesc}
        />
      </Section>

      <Section title={G.sectionTrend}>
        <GlossaryRow
          swatch={<ArrowUp className="h-4 w-4 text-emerald-600" />}
          label={G.trendUpLabel}
          desc={G.trendUpDesc}
        />
        <GlossaryRow
          swatch={<ArrowDown className="h-4 w-4 text-destructive" />}
          label={G.trendDownLabel}
          desc={G.trendDownDesc}
        />
      </Section>

      <Section title={G.sectionCardStates}>
        <GlossaryRow
          swatch={<Plus className="h-4 w-4 text-muted-foreground" />}
          label={G.cardCtaAddLabel}
          desc={G.cardCtaAddDesc}
        />
        <GlossaryRow
          swatch={<Swords className="h-4 w-4 text-muted-foreground" />}
          label={G.cardCtaNoDuelsLabel}
          desc={G.cardCtaNoDuelsDesc}
        />
        <GlossaryRow
          swatch={<Trophy className="h-4 w-4 text-amber-500" />}
          label={G.cardPodiumLabel}
          desc={G.cardPodiumDesc}
        />
      </Section>

      <Section title={G.sectionReminder}>
        <GlossaryRow
          swatch={<Bell className="h-4 w-4" />}
          label={G.reminderBellLabel}
          desc={G.reminderBellDesc}
        />
        <GlossaryRow
          swatch={<Swords className="h-4 w-4" />}
          label={G.reminderSwordsLabel}
          desc={G.reminderSwordsDesc}
        />
      </Section>

      <Section title={G.sectionRemoved}>
        <GlossaryRow
          swatch={<Undo2 className="h-4 w-4 text-muted-foreground" />}
          label={G.removedLabel}
          desc={G.removedDesc}
        />
      </Section>
    </div>
  );
}
