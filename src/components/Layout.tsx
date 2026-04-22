import { Outlet, useLocation, useNavigate, useParams } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { S } from '@/lib/strings';

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

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 border-b bg-background px-4 py-3 flex items-center gap-3">
        {backTarget && (
          <button
            onClick={() => navigate(backTarget)}
            className="p-1 rounded-md hover:bg-accent"
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
