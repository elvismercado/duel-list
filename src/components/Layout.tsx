import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router';
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

function getBackTarget(pathname: string, id?: string): string | null {
  if (pathname === '/') return null;
  if (pathname === '/welcome') return '/';
  if (pathname === '/settings') return '/';
  if (id) {
    if (pathname.endsWith('/duel')) return `/list/${id}`;
    if (pathname.endsWith('/settings')) return `/list/${id}`;
    // /list/:id itself
    return '/';
  }
  return '/';
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
          <span>Storage is almost full. Export your lists to free up space.</span>
          <button
            onClick={() => navigate('/settings')}
            className="underline font-medium ml-auto shrink-0"
          >
            Export
          </button>
        </div>
      )}
      <header className="sticky top-0 z-10 border-b bg-background px-4 py-3 flex items-center gap-3">
        {backTarget && (
          <button
            onClick={() => navigate(backTarget)}
            className="p-1 rounded-md hover:bg-accent min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Go back"
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
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
