import { FileCheck, FileQuestion, FileX, type LucideIcon } from 'lucide-react';
import { S } from '@/lib/strings';
import type { LinkStatus } from '@/hooks/useFileSync';

interface FileLinkStatusProps {
  /**
   * Discriminated link status. Pass `undefined` to render nothing (e.g. on
   * browsers without File System Access support).
   */
  status: LinkStatus | undefined;
  /**
   * When provided, the chip becomes a button. Typically wired only for
   * `unlinked` / `broken` to open a link/relink confirm dialog.
   */
  onClick?: () => void;
  className?: string;
}

interface ChipStyle {
  Icon: LucideIcon;
  label: string;
  tooltip: string;
  /** Tailwind classes for border + background + text color. */
  tone: string;
  /** Aria-label override for actionable buttons (overrides label). */
  actionAria?: string;
}

const STYLE: Record<LinkStatus, ChipStyle> = {
  linked: {
    Icon: FileCheck,
    label: S.ranking.fileLinked,
    tooltip: S.ranking.fileLinkedTooltip,
    tone: 'border-success/30 bg-success/10 text-success',
  },
  broken: {
    Icon: FileX,
    label: S.ranking.fileLinkBroken,
    tooltip: S.ranking.fileLinkBrokenTooltip,
    tone: 'border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/15',
    actionAria: S.ranking.fileLinkBroken,
  },
  unlinked: {
    Icon: FileQuestion,
    label: S.list.notLinkedShort,
    tooltip: S.ranking.fileNotLinkedTooltip,
    tone: 'border-border bg-muted text-muted-foreground hover:bg-accent hover:text-foreground',
    actionAria: S.settings.linkFile,
  },
};

const BASE =
  'shrink-0 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium';

/**
 * Canonical file-link status chip. Used wherever a list's link state needs to
 * be surfaced (Home cards, list header, item detail). Callers compute the
 * `status` from their own `useFileSync` state via `deriveLinkStatus`.
 */
export function FileLinkStatus({ status, onClick, className }: FileLinkStatusProps) {
  if (!status) return null;
  const { Icon, label, tooltip, tone, actionAria } = STYLE[status];
  const cls = `${BASE} ${tone}${className ? ` ${className}` : ''}`;
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cls}
        title={tooltip}
        aria-label={actionAria ?? label}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{label}</span>
      </button>
    );
  }
  return (
    <span className={cls} title={tooltip}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
