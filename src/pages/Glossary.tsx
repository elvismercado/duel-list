import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { S } from '@/lib/strings';
import { Separator } from '@/components/ui/separator';
import {
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
      <h1 className="text-2xl font-bold">{G.heading}</h1>

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
        <TermRow id="reminder" label={G.termReminderLabel} desc={G.termReminderDesc} />
        <TermRow id="cadence" label={G.termCadenceLabel} desc={G.termCadenceDesc} />
        <TermRow id="quiet-hours" label={G.termQuietHoursLabel} desc={G.termQuietHoursDesc} />
        <TermRow id="snooze" label={G.termSnoozeLabel} desc={G.termSnoozeDesc} />
        <TermRow id="tie" label={G.termTieLabel} desc={G.termTieDesc} />
        <TermRow id="skip" label={G.termSkipLabel} desc={G.termSkipDesc} />
        <TermRow id="template" label={G.termTemplateLabel} desc={G.termTemplateDesc} />
        <TermRow id="theme" label={G.termThemeLabel} desc={G.termThemeDesc} />
      </Section>

      <Section id="activity" title={G.sectionActivity}>
        <GlossaryRow
          swatch={<Dot className="bg-success" />}
          label={S.list.activityFresh}
          desc={G.activityFreshDesc}
        />
        <GlossaryRow
          swatch={<Dot className="bg-warning" />}
          label={S.list.activityStale}
          desc={G.activityStaleDesc}
        />
        <GlossaryRow
          swatch={<Dot className="bg-outcome-loss" />}
          label={S.list.activityCold}
          desc={G.activityColdDesc}
        />
        <GlossaryRow
          swatch={<Dot className="bg-muted-foreground/30" />}
          label={S.list.activityNever}
          desc={G.activityNeverDesc}
        />
      </Section>

      <Section id="file-link" title={G.sectionFileLink}>
        <GlossaryRow
          swatch={<FileCheck className="h-4 w-4 text-success" />}
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

      <Section id="ranking-view" title={G.sectionRankingView}>
        <GlossaryRow
          swatch={<Hash className="h-4 w-4" />}
          label={G.rankViewLabel}
          desc={G.rankViewDesc}
        />
        <GlossaryRow
          swatch={<Trophy className="h-4 w-4 text-podium-gold" />}
          label={G.scoreViewLabel}
          desc={G.scoreViewDesc}
        />
      </Section>

      <Section id="quick-actions" title={G.sectionQuickActions}>
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

      <Section id="trend" title={G.sectionTrend}>
        <GlossaryRow
          swatch={<ArrowUp className="h-4 w-4 text-outcome-win" />}
          label={G.trendUpLabel}
          desc={G.trendUpDesc}
        />
        <GlossaryRow
          swatch={<ArrowDown className="h-4 w-4 text-outcome-loss" />}
          label={G.trendDownLabel}
          desc={G.trendDownDesc}
        />
      </Section>

      <Section id="card-states" title={G.sectionCardStates}>
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
          swatch={<Trophy className="h-4 w-4 text-podium-gold" />}
          label={G.cardPodiumLabel}
          desc={G.cardPodiumDesc}
        />
      </Section>

      <Section id="reminder-banner" title={G.sectionReminder}>
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

      <Section id="removed" title={G.sectionRemoved}>
        <GlossaryRow
          swatch={<Undo2 className="h-4 w-4 text-muted-foreground" />}
          label={G.removedLabel}
          desc={G.removedDesc}
        />
      </Section>
    </div>
  );
}
