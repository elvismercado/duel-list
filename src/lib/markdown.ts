import { parse as yamlParse, stringify as yamlStringify } from 'yaml';
import type { Item, ListConfig } from '@/types';
import { formatLocalDate } from '@/lib/datetime';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function parseMarkdown(raw: string): ListConfig {
  const { yaml, content } = extractFrontmatter(raw);

  const frontmatter = yaml ? parseFrontmatter(yaml) : {};
  const heading = resolveImportedName(content);

  const name = frontmatter.name ?? heading ?? 'Untitled List';
  const id = frontmatter.id ?? generateShortId();
  const sessionLength = frontmatter.sessionLength ?? 10;
  const kFactor = frontmatter.kFactor ?? 32;
  const created = frontmatter.created ?? formatLocalDate();

  const { active, removed } = parseItems(content);

  // Tag removed items
  for (const item of removed) {
    item.removed = true;
  }

  return {
    id,
    name,
    sessionLength,
    kFactor,
    created,
    items: [...active, ...removed],
  };
}

export function serializeMarkdown(config: ListConfig): string {
  const fm = stringifyFrontmatter(config);

  const active = config.items
    .filter((i) => !i.removed)
    .sort((a, b) => b.eloScore - a.eloScore);
  const removed = config.items.filter((i) => i.removed);

  const body = serializeItems(active, removed);

  return `---\n${fm}---\n${body}`;
}

export function resolveImportedName(content: string): string | null {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1]!.trim() : null;
}

export function generateShortId(): string {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz';
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  let id = '';
  for (const b of bytes) {
    id += chars[b % 36];
  }
  return id;
}

// ---------------------------------------------------------------------------
// Frontmatter helpers
// ---------------------------------------------------------------------------

function extractFrontmatter(raw: string): { yaml: string | null; content: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { yaml: null, content: raw };
  return {
    yaml: match[1]!,
    content: raw.slice(match[0].length).trimStart(),
  };
}

interface ParsedFrontmatter {
  id?: string;
  name?: string;
  sessionLength?: number;
  kFactor?: number;
  created?: string;
}

function parseFrontmatter(yaml: string): ParsedFrontmatter {
  const obj = yamlParse(yaml) as Record<string, unknown> | null;
  if (!obj || typeof obj !== 'object') return {};
  return {
    id: typeof obj.id === 'string' ? obj.id : undefined,
    name: typeof obj.name === 'string' ? obj.name : undefined,
    sessionLength:
      typeof obj.session_length === 'number'
        ? obj.session_length
        : undefined,
    kFactor:
      typeof obj.k_factor === 'number' ? obj.k_factor : undefined,
    created: typeof obj.created === 'string' ? obj.created : undefined,
  };
}

function stringifyFrontmatter(config: ListConfig): string {
  const obj: Record<string, unknown> = {
    id: config.id,
    name: config.name,
    session_length: config.sessionLength,
    k_factor: config.kFactor,
    created: config.created,
  };
  return yamlStringify(obj, { indent: 2 });
}

// ---------------------------------------------------------------------------
// Item parsing / serialization
// ---------------------------------------------------------------------------

const ITEM_RE = /^- (.+?)(?:\s*<!-- (.*?) -->)?$/gm;

interface ItemJson {
  id?: string;
  elo?: number;
  prevElo?: number;
  prevRank?: number;
  comparisons?: number;
  added?: string;
  removed?: boolean;
}

function parseItems(content: string): { active: Item[]; removed: Item[] } {
  // Split at ## Removed header if present
  const removedIdx = content.indexOf('\n## Removed');
  const activeContent = removedIdx === -1 ? content : content.slice(0, removedIdx);
  const removedContent = removedIdx === -1 ? '' : content.slice(removedIdx);

  const active = parseItemSection(activeContent);
  const removed = parseItemSection(removedContent);

  return { active, removed };
}

function parseItemSection(section: string): Item[] {
  const items: Item[] = [];
  const seenIds = new Set<string>();
  const today = formatLocalDate();

  let match: RegExpExecArray | null;
  const re = new RegExp(ITEM_RE.source, ITEM_RE.flags);

  while ((match = re.exec(section)) !== null) {
    const rawName = match[1]!.trim().replace(/\n/g, ' ');
    const name = rawName.replace(/&lt;!--/g, '<!--').replace(/--&gt;/g, '-->');
    const jsonStr = match[2] ?? null;

    let json: ItemJson = {};
    if (jsonStr) {
      try {
        json = JSON.parse(jsonStr) as ItemJson;
      } catch {
        // Invalid JSON — treat as unranked
      }
    }

    let id = typeof json.id === 'string' ? json.id : generateShortId();
    if (seenIds.has(id)) {
      id = generateShortId();
    }
    seenIds.add(id);

    items.push({
      id,
      name,
      eloScore: json.elo ?? 1000,
      prevEloScore: json.prevElo ?? json.elo ?? 1000,
      prevRank: json.prevRank ?? 0,
      comparisonCount: json.comparisons ?? 0,
      added: json.added ?? today,
      removed: json.removed ?? undefined,
    });
  }

  return items;
}

function escapeItemName(name: string): string {
  return name.replace(/<!--/g, '&lt;!--').replace(/-->/g, '--&gt;');
}

function serializeItemJson(item: Item): string {
  const obj: Record<string, unknown> = {
    id: item.id,
    elo: item.eloScore,
    prevElo: item.prevEloScore,
    prevRank: item.prevRank,
    comparisons: item.comparisonCount,
    added: item.added,
  };
  if (item.removed) {
    obj.removed = true;
  }
  return JSON.stringify(obj);
}

function serializeItems(active: Item[], removed: Item[]): string {
  const lines: string[] = [];

  for (const item of active) {
    lines.push(`- ${escapeItemName(item.name)} <!-- ${serializeItemJson(item)} -->`);
  }

  if (removed.length > 0) {
    lines.push('');
    lines.push('## Removed');
    for (const item of removed) {
      lines.push(`- ${escapeItemName(item.name)} <!-- ${serializeItemJson(item)} -->`);
    }
  }

  lines.push(''); // trailing newline
  return lines.join('\n');
}
