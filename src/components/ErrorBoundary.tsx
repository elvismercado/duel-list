import { Component, useEffect, useState, type ErrorInfo, type ReactNode } from 'react';
import { useRouteError } from 'react-router';
import { S } from '@/lib/strings';
import { Button } from '@/components/ui/button';
import {
  appendError,
  formatErrorForCopy,
  getLastError,
  type ErrorLogEntry,
} from '@/lib/errorLog';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Top-level error boundary. Catches render-time exceptions outside of React
 * Router's per-route handling. Router-level errors are caught by
 * `RouteErrorElement` (wired via `errorElement` on the Layout route).
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
    appendError(error, 'boundary');
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return <ErrorBoundaryFallback error={error} />;
  }
}

/**
 * Route-level error element. Wire via `errorElement: <RouteErrorElement />` on
 * the parent Layout route so every page inherits it. Without this, React
 * Router shows its own default fallback ("Hey developer...") and our
 * boundary above `<RouterProvider>` never sees the error.
 */
export function RouteErrorElement() {
  const raw = useRouteError();
  const error =
    raw instanceof Error
      ? raw
      : new Error(typeof raw === 'string' ? raw : JSON.stringify(raw));
  useEffect(() => {
    console.error('[RouteError]', error);
    appendError(error, 'route');
  }, [error]);
  return <ErrorBoundaryFallback error={error} />;
}

function ErrorBoundaryFallback({ error }: { error: Error }) {
  const handleReload = () => window.location.reload();
  return (
    <div
      role="alert"
      className="min-h-screen p-6 flex items-center justify-center bg-background"
    >
      <div className="max-w-md w-full space-y-4 rounded-lg border bg-card p-6 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">{S.app.errorBoundaryTitle}</h1>
          <p className="text-sm text-muted-foreground">
            {S.app.errorBoundaryDescription}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleReload} className="flex-1">
            {S.app.errorBoundaryReload}
          </Button>
          <CopyLastErrorButton variant="outline" className="flex-1" />
        </div>
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer select-none">
            {S.app.errorBoundaryDetails}
          </summary>
          <pre className="mt-2 max-h-48 overflow-auto rounded bg-muted/50 p-2 font-mono text-[11px] whitespace-pre-wrap break-words">
            {error.message}
            {error.stack ? `\n\n${error.stack}` : ''}
          </pre>
        </details>
      </div>
    </div>
  );
}

/**
 * Reusable Copy button for the most recent persisted error. Used by both the
 * fallback UI and the Developer zone in /settings.
 */
export function CopyLastErrorButton({
  className,
  variant = 'default',
}: {
  className?: string;
  variant?: 'default' | 'outline' | 'secondary';
}) {
  const [copied, setCopied] = useState(false);
  const [entry, setEntry] = useState<ErrorLogEntry | null>(() => getLastError());

  useEffect(() => {
    setEntry(getLastError());
  }, []);

  const handleCopy = async () => {
    const current = entry ?? getLastError();
    if (!current) return;
    try {
      await navigator.clipboard.writeText(formatErrorForCopy(current));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: nothing graceful we can do here.
    }
  };

  const hasError = entry !== null;
  const label = copied ? S.app.errorBoundaryCopied : S.app.errorBoundaryCopy;

  return (
    <Button
      type="button"
      variant={variant}
      onClick={handleCopy}
      disabled={!hasError}
      className={className}
    >
      {label}
    </Button>
  );
}
