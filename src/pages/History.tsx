import { useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { S } from '@/lib/strings';
import { getList, getHistory, getSettings } from '@/lib/storage';
import { sortItemsByElo } from '@/lib/ranking';
import { formatLocalDate, formatTimeOfDay, parseTimestampSuffix } from '@/lib/datetime';
import { useExport } from '@/hooks/useExport';
import { useHeaderActions } from '@/components/HeaderActions';
import { useFilterShortcut } from '@/hooks/useFilterShortcut';
import emptyHistoryImg from '@/assets/illustrations/empty-history.png';
import {
  Download,
  Trophy,
  Search,
  X,
} from 'lucide-react';

type ParsedEntry = {
  raw: string;
  a: string;
  b: string;
  idA: string | null;   // item UUID from [id] bracket, null for legacy entries
  idB: string | null;
  winner: string | null; // null => tie
  tsIso: string | null;  // full ISO-8601 UTC when present (preferred for sort)
  time: string | null;   // HH:MM (local) for display
};

type Section = {
  date: string; // YYYY-MM-DD
  entries: ParsedEntry[];
};

export default function History() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { exportHistory } = useExport();
  const list = id ? getList(id) : null;
  const [content] = useState(() => (id ? getHistory(id) : ''));
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQueryRaw] = useState(() => searchParams.get('q') ?? '');
  const filterInputRef = useRef<HTMLInputElement>(null);
  useFilterShortcut(filterInputRef);

  const setQuery = (next: string) => {
    setQueryRaw(next);
    const params = new URLSearchParams(searchParams);
    if (next) params.set('q', next);
    else params.delete('q');
    setSearchParams(params, { replace: true });
  };

  const sections = useMemo(() => parseHistorySections(content), [content]);
  const total = useMemo(
    () => sections.reduce((sum, s) => sum + s.entries.length, 0),
    [sections],
  );
  const stats = useMemo(
    () => computeStats(sections, list?.items.filter((i) => !i.removed).length ?? 0),
    [sections, list],
  );
  const daily = useMemo(() => computeDailyCounts(sections, 30), [sections]);

  // Build lookup maps: item ID/name → current rank
  const rankMap = useMemo(() => {
    if (!list) return { byId: new Map<string, number>(), byName: new Map<string, number>() };
    const active = list.items.filter((i) => !i.removed);
    const sorted = sortItemsByElo(active);
    const byId = new Map<string, number>();
    const byName = new Map<string, number>();
    sorted.forEach((item, i) => {
      byId.set(item.id, i + 1);
      byName.set(item.name, i + 1);
    });
    return { byId, byName };
  }, [list]);

  const filteredSections = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sections;
    return sections
      .map((s) => ({
        date: s.date,
        entries: s.entries.filter(
          (e) =>
            e.a.toLowerCase().includes(q) || e.b.toLowerCase().includes(q),
        ),
      }))
      .filter((s) => s.entries.length > 0);
  }, [sections, query]);

  useHeaderActions(
    list && total > 0 ? (
      <Button
        variant="outline"
        size="sm"
        onClick={() => exportHistory(list.id, list.name)}
        aria-label={S.history.exportHistoryAria}
      >
        <Download className="h-4 w-4 mr-1" />
        {S.common.export}
      </Button>
    ) : null,
  );

  if (!list || !id) {
    return (
      <div className="p-4 max-w-lg mx-auto space-y-4 text-center mt-12">
        <h1 className="text-2xl font-bold">{S.common.listNotFound}</h1>
        <Button onClick={() => navigate('/')}>{S.common.goHome}</Button>
      </div>
    );
  }

  const filteredCount = filteredSections.reduce(
    (sum, s) => sum + s.entries.length,
    0,
  );

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold truncate">{list.name}</h1>
        <p className="text-xs text-muted-foreground">{S.history.title}</p>
      </div>

      {sections.length === 0 ? (
        <div className="text-center py-12 space-y-2">
          <img
            src={emptyHistoryImg}
            alt=""
            aria-hidden="true"
            className="max-w-[200px] mx-auto opacity-90"
          />
          <p className="text-muted-foreground">
            {S.history.emptyDescription}
          </p>
          <Button onClick={() => navigate(`/list/${id}/duel`)}>
            {S.history.startDuel}
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            <StatTile label={S.history.statTotal} value={String(stats.total)} />
            <StatTile label={S.history.statTies} value={String(stats.ties)} />
            <StatTile
              label={S.history.statTopWinner}
              value={stats.topWinner ? stats.topWinner.name : '—'}
              subtitle={
                stats.topWinner
                  ? S.history.winsCount(stats.topWinner.wins)
                  : undefined
              }
            />
            <StatTile
              label={S.history.statBiggestRivalry}
              value={
                stats.biggestRivalry
                  ? `${stats.biggestRivalry.a} · ${stats.biggestRivalry.b}`
                  : '—'
              }
              subtitle={
                stats.biggestRivalry
                  ? S.history.meetingsCount(stats.biggestRivalry.count)
                  : undefined
              }
            />
            {stats.mostOneSided && (
              <StatTile
                label={S.history.statMostOneSided}
                value={`${stats.mostOneSided.a} · ${stats.mostOneSided.b}`}
                subtitle={S.history.oneSidedRecord(
                  stats.mostOneSided.winsA,
                  stats.mostOneSided.winsB,
                )}
              />
            )}
            {stats.longestStreak && (
              <StatTile
                label={S.history.statLongestStreak}
                value={stats.longestStreak.name}
                subtitle={S.history.streakWins(stats.longestStreak.count)}
              />
            )}
            {stats.matchupCoverage && (
              <StatTile
                label={S.history.statMatchupCoverage}
                value={S.history.coverageValue(
                  stats.matchupCoverage.seen,
                  stats.matchupCoverage.total,
                )}
              />
            )}
            {stats.mostActiveDay && (
              <StatTile
                label={S.history.statMostActiveDay}
                value={stats.mostActiveDay.date}
                subtitle={S.history.duelsOnDay(stats.mostActiveDay.count)}
              />
            )}
          </div>

          {daily.some((d) => d.count > 0) && (
            <div className="rounded-lg border bg-card p-3 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{S.history.sparklineRangeLabel}</span>
                <span>
                  {S.history.totalDuels(daily.reduce((s, d) => s + d.count, 0))}
                </span>
              </div>
              <Sparkline data={daily} />
            </div>
          )}

          <div className="relative">
            <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              ref={filterInputRef}
              type="search"
              placeholder={S.history.filterPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8 pr-8"
              aria-label={S.history.filterAria}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={S.common.clearFilter}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {filteredCount === 0 ? (
            <div className="text-center py-8 space-y-2">
              <p className="text-muted-foreground text-sm">
                {S.history.noMatch(query)}
              </p>
              <Button variant="outline" size="sm" onClick={() => setQuery('')}>
                {S.common.clearFilter}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                {S.history.showingOf(filteredCount, total)}
              </p>
              {filteredSections.map((section) => (
                <section key={section.date} className="space-y-1">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground sticky top-0 bg-background py-1 z-10">
                    {section.date}
                  </h2>
                  <ul className="space-y-1">
                    {section.entries.map((entry, idx) => (
                      <li key={idx}>
                        <DuelRow entry={entry} rankMap={rankMap} />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatTile({
  label,
  value,
  subtitle,
}: {
  label: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold truncate" title={value}>
        {value}
      </div>
      {subtitle && (
        <div className="text-xs text-muted-foreground truncate">
          {subtitle}
        </div>
      )}
    </div>
  );
}

function Sparkline({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const w = 100;
  const h = 32;
  const gap = 1;
  const barW = (w - gap * (data.length - 1)) / data.length;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="w-full h-8"
      role="img"
      aria-label={S.history.sparklineAria}
    >
      {data.map((d, i) => {
        const barH = d.count === 0 ? 1 : (d.count / max) * (h - 2);
        const x = i * (barW + gap);
        const y = h - barH;
        const opacity =
          d.count === 0 ? 0.15 : 0.35 + (d.count / max) * 0.65;
        return (
          <rect
            key={d.date}
            x={x}
            y={y}
            width={barW}
            height={barH}
            rx={0.5}
            className="fill-primary"
            opacity={opacity}
          >
            <title>{S.history.sparklineDay(d.date, d.count)}</title>
          </rect>
        );
      })}
    </svg>
  );
}

type RankMap = { byId: Map<string, number>; byName: Map<string, number> };

function lookupRank(rankMap: RankMap, id: string | null, name: string): number | undefined {
  if (id) {
    const r = rankMap.byId.get(id);
    if (r !== undefined) return r;
  }
  return rankMap.byName.get(name);
}

function DuelRow({ entry, rankMap }: { entry: ParsedEntry; rankMap: RankMap }) {
  const tie = entry.winner === null;
  const aWon = !tie && entry.winner === entry.a;
  const bWon = !tie && entry.winner === entry.b;
  const rankA = lookupRank(rankMap, entry.idA, entry.a);
  const rankB = lookupRank(rankMap, entry.idB, entry.b);
  return (
    <div className="space-y-0.5">
      <div className="flex items-stretch gap-2 text-sm">
        <NameChip name={entry.a} won={aWon} dimmed={!tie && !aWon} rank={rankA} />
        <div
          className={`shrink-0 self-center text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded ${
            tie
              ? 'bg-muted text-muted-foreground'
              : 'bg-foreground/10 text-foreground/70'
          }`}
          aria-label={tie ? S.history.tieAria : S.history.versusAria}
        >
          {tie ? S.history.tieBadge : S.history.vsBadge}
        </div>
        <NameChip name={entry.b} won={bWon} dimmed={!tie && !bWon} alignRight rank={rankB} />
      </div>
      {entry.time && (
        <div className="text-[10px] text-muted-foreground text-right pr-1 tabular-nums">
          {entry.tsIso
            ? formatTimeOfDay(new Date(entry.tsIso), getSettings().timeFormat ?? '24h')
            : entry.time}
        </div>
      )}
    </div>
  );
}

function NameChip({
  name,
  won,
  dimmed,
  alignRight,
  rank,
}: {
  name: string;
  won: boolean;
  dimmed: boolean;
  alignRight?: boolean;
  rank?: number;
}) {
  return (
    <div
      className={`flex-1 min-w-0 rounded-md border px-2 py-1 flex items-center gap-1.5 ${
        alignRight ? 'flex-row-reverse text-right' : ''
      } ${
        won
          ? 'border-warning bg-warning/10 text-foreground font-semibold'
          : dimmed
            ? 'border-border bg-card text-muted-foreground'
            : 'border-border bg-card text-foreground'
      }`}
      title={name}
    >
      {won && (
        <Trophy
          className="h-4 w-4 shrink-0 text-warning"
          aria-label={S.history.winnerAria}
        />
      )}
      <span className="truncate min-w-0 flex-1">{name}</span>
      {rank !== undefined && (
        <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
          #{rank}
        </span>
      )}
    </div>
  );
}

function parseHistorySections(md: string): Section[] {
  if (!md.trim()) return [];
  const lines = md.split('\n');
  const sections: Section[] = [];
  let current: Section | null = null;
  for (const line of lines) {
    const m = /^##\s+(.+)$/.exec(line);
    if (m) {
      current = { date: m[1]!.trim(), entries: [] };
      sections.push(current);
      continue;
    }
    if (current && line.startsWith('- ')) {
      const parsed = parseEntry(line.slice(2));
      if (parsed) current.entries.push(parsed);
    }
  }
  // Newest date first, and within each date newest entry first.
  // Prefer ms-precise ISO; fall back to HH:MM string compare; finally to
  // file-order reverse for legacy entries with no timestamp at all.
  for (const s of sections) {
    const allTimed =
      s.entries.length > 0 &&
      s.entries.every((e) => e.tsIso !== null || e.time !== null);
    if (allTimed) {
      s.entries.sort((x, y) => {
        const xKey = x.tsIso ?? x.time ?? '';
        const yKey = y.tsIso ?? y.time ?? '';
        return yKey.localeCompare(xKey);
      });
    } else {
      s.entries.reverse();
    }
  }
  return sections.reverse();
}

function parseEntry(raw: string): ParsedEntry | null {
  const { body, tsIso, localTime } = parseTimestampSuffix(raw);
  // Extract IDs from [id] brackets before stripping them
  const ids = [...body.matchAll(/\[([a-z0-9]{2,8})\]/gi)].map((m) => m[1]!);
  const idA = ids[0] ?? null;
  const idB = ids[1] ?? null;
  const stripped = body.replace(/\s*\[[a-z0-9]{2,8}\]/gi, '').trim();
  // Left won: "A > B"
  const left = /^(.+?)\s*>\s*(.+)$/.exec(stripped);
  if (left) {
    const a = left[1]!.trim();
    const b = left[2]!.trim();
    return { raw, a, b, idA, idB, winner: a, tsIso, time: localTime };
  }
  // Right won: "A < B"
  const right = /^(.+?)\s*<\s*(.+)$/.exec(stripped);
  if (right) {
    const a = right[1]!.trim();
    const b = right[2]!.trim();
    return { raw, a, b, idA, idB, winner: b, tsIso, time: localTime };
  }
  // Tie: "A = B"
  const tie = /^(.+?)\s*=\s*(.+)$/.exec(stripped);
  if (tie) {
    const a = tie[1]!.trim();
    const b = tie[2]!.trim();
    return { raw, a, b, idA, idB, winner: null, tsIso, time: localTime };
  }
  return null;
}

type Stats = {
  total: number;
  ties: number;
  topWinner: { name: string; wins: number } | null;
  biggestRivalry: { a: string; b: string; count: number } | null;
  mostOneSided: { a: string; b: string; winsA: number; winsB: number } | null;
  longestStreak: { name: string; count: number } | null;
  mostActiveDay: { date: string; count: number } | null;
  matchupCoverage: { seen: number; total: number } | null;
};

function computeStats(sections: Section[], itemCount: number): Stats {
  let total = 0;
  let ties = 0;
  const wins = new Map<string, number>();
  const rivalries = new Map<
    string,
    { a: string; b: string; count: number; winsA: number; winsB: number }
  >();
  for (const s of sections) {
    for (const e of s.entries) {
      total++;
      if (e.winner === null) {
        ties++;
      } else {
        wins.set(e.winner, (wins.get(e.winner) ?? 0) + 1);
      }
      const sorted = [e.a, e.b].sort();
      const x = sorted[0]!;
      const y = sorted[1]!;
      const key = `${x}\u0000${y}`;
      const r = rivalries.get(key);
      if (r) {
        r.count++;
        if (e.winner === x) r.winsA++;
        else if (e.winner === y) r.winsB++;
      } else {
        rivalries.set(key, {
          a: x,
          b: y,
          count: 1,
          winsA: e.winner === x ? 1 : 0,
          winsB: e.winner === y ? 1 : 0,
        });
      }
    }
  }
  let topWinner: Stats['topWinner'] = null;
  for (const [name, w] of wins) {
    if (!topWinner || w > topWinner.wins) topWinner = { name, wins: w };
  }
  let biggestRivalry: Stats['biggestRivalry'] = null;
  for (const r of rivalries.values()) {
    if (!biggestRivalry || r.count > biggestRivalry.count)
      biggestRivalry = { a: r.a, b: r.b, count: r.count };
  }
  if (biggestRivalry && biggestRivalry.count < 2) biggestRivalry = null;

  // Most one-sided matchup (min 2 meetings)
  let mostOneSided: Stats['mostOneSided'] = null;
  for (const r of rivalries.values()) {
    if (r.count < 2) continue;
    const diff = Math.abs(r.winsA - r.winsB);
    if (!mostOneSided || diff > Math.abs(mostOneSided.winsA - mostOneSided.winsB)) {
      mostOneSided = { a: r.a, b: r.b, winsA: r.winsA, winsB: r.winsB };
    }
  }

  // Longest win streak (walk chronologically, min 3)
  let longestStreak: Stats['longestStreak'] = null;
  {
    const streaks = new Map<string, number>();
    // sections are newest-first; entries within each are newest-first
    // walk in reverse (oldest first) for chronological order
    for (let si = sections.length - 1; si >= 0; si--) {
      const s = sections[si]!;
      for (let ei = s.entries.length - 1; ei >= 0; ei--) {
        const e = s.entries[ei]!;
        if (e.winner) {
          const cur = (streaks.get(e.winner) ?? 0) + 1;
          streaks.set(e.winner, cur);
          if (cur >= 3 && (!longestStreak || cur > longestStreak.count)) {
            longestStreak = { name: e.winner, count: cur };
          }
          // Reset opponent streaks for this duel's participants
          const loser = e.winner === e.a ? e.b : e.a;
          streaks.set(loser, 0);
        } else {
          // Tie resets both
          streaks.set(e.a, 0);
          streaks.set(e.b, 0);
        }
      }
    }
  }

  // Most active day
  let mostActiveDay: Stats['mostActiveDay'] = null;
  for (const s of sections) {
    if (
      s.entries.length > 0 &&
      (!mostActiveDay || s.entries.length > mostActiveDay.count)
    ) {
      mostActiveDay = { date: s.date, count: s.entries.length };
    }
  }

  // Matchup coverage
  let matchupCoverage: Stats['matchupCoverage'] = null;
  if (itemCount >= 2) {
    const totalPossible = (itemCount * (itemCount - 1)) / 2;
    matchupCoverage = { seen: rivalries.size, total: totalPossible };
  }

  return {
    total,
    ties,
    topWinner,
    biggestRivalry,
    mostOneSided,
    longestStreak,
    mostActiveDay,
    matchupCoverage,
  };
}

function computeDailyCounts(
  sections: Section[],
  days: number,
): { date: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const s of sections) counts.set(s.date, s.entries.length);
  const out: { date: string; count: number }[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = formatLocalDate(d);
    out.push({ date: key, count: counts.get(key) ?? 0 });
  }
  return out;
}
