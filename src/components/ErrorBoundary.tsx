import { Component, type ErrorInfo, type ReactNode } from 'react';
import { S } from '@/lib/strings';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Top-level error boundary. Catches render-time exceptions in any lazy-loaded
 * page and shows a friendly fallback with a Reload button. Without this, a
 * single thrown error replaces the whole installed PWA with a blank screen.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surface to console for dev / remote debugging. No telemetry.
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

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
          <Button onClick={this.handleReload} className="w-full">
            {S.app.errorBoundaryReload}
          </Button>
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
}
