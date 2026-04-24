import { useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate, useParams } from 'react-router';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { S } from '@/lib/strings';
import { getSettings, isQuotaNearLimit } from '@/lib/storage';

function applyTheme(theme: string) {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.add(prefersDark ? 'dark' : 'light');
  } else {
    root.classList.add(theme);
  }
}

// Hard-coded for now — keep in sync with package.json on release.
// A future build-time replacement (vite `define`) can wire this to env automatically.
const APP_VERSION = '1.0.0';

function getBackTarget(pathname: string, id?: string): string | null {
  if (pathname === '/') return null;
  if (pathname === '/welcome') return '/';
  if (pathname === '/settings') return '/';
  if (pathname === '/settings/reminders') return '/settings';
  if (pathname === '/settings/glossary') return '/settings';
  if (pathname === '/features') return '/';
  if (id) {
    if (pathname.endsWith('/duel')) return `/list/${id}`;
    if (pathname.endsWith('/settings')) return `/list/${id}`;
    if (pathname.endsWith('/history')) return `/list/${id}`;
    // /list/:id itself
    return '/';
  }
  return '/';
}

function shouldShowFooter(pathname: string): boolean {
  // Hide on immersive / standalone surfaces:
  //  - /welcome owns its own full-screen layout
  //  - /list/:id/duel is the focus mode (notifications already suppress chrome)
  //  - NotFound (`*`) doesn't have a stable shape
  if (pathname === '/welcome') return false;
  if (pathname.endsWith('/duel')) return false;
  return true;
}

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const backTarget = getBackTarget(location.pathname, id);
  const quotaWarning = isQuotaNearLimit();

  // Apply persisted theme on mount + listen for OS changes
  useEffect(() => {
    const settings = getSettings();
    applyTheme(settings.theme);

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const s = getSettings();
      if (s.theme === 'system') applyTheme('system');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {quotaWarning && (
        <div className="bg-destructive text-destructive-foreground px-4 py-2 text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{S.app.storageAlmostFull}</span>
          <button
            onClick={() => navigate('/settings')}
            className="underline font-medium ml-auto shrink-0"
          >
            {S.common.export}
          </button>
        </div>
      )}
      <header className="sticky top-0 z-10 border-b bg-background px-4 py-3 flex items-center gap-3">
        {backTarget && (
          <button
            onClick={() => navigate(backTarget)}
            className="p-1 rounded-md hover:bg-accent min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={S.app.goBackAria}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <button
          onClick={() => navigate('/')}
          className="font-heading text-lg font-bold tracking-tight"
        >
          {S.app.name}
        </button>
      </header>
      <main className="flex-1 pb-8" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
        <Outlet />
      </main>
      {shouldShowFooter(location.pathname) && (
        <footer className="border-t bg-background/60 px-4 py-3 text-xs text-muted-foreground">
          <div className="max-w-lg mx-auto flex items-center justify-between gap-3 flex-wrap">
            <nav className="flex items-center gap-3" aria-label={S.app.footerNavAria}>
              <Link to="/settings/glossary" className="hover:text-foreground transition-colors">
                {S.app.footerGlossary}
              </Link>
              <span aria-hidden="true" className="text-muted-foreground/40">·</span>
              <Link to="/features" className="hover:text-foreground transition-colors">
                {S.app.footerFeatures}
              </Link>
              <span aria-hidden="true" className="text-muted-foreground/40">·</span>
              <Link to="/settings" className="hover:text-foreground transition-colors">
                {S.app.footerSettings}
              </Link>
            </nav>
            <span className="text-muted-foreground/70">{S.app.footerVersion(APP_VERSION)}</span>
          </div>
        </footer>
      )}
    </div>
  );
}
