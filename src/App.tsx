import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router';
import Layout from '@/components/Layout';

const Home = lazy(() => import('@/pages/Home'));
const Welcome = lazy(() => import('@/pages/Welcome'));
const Rankings = lazy(() => import('@/pages/Rankings'));
const Duel = lazy(() => import('@/pages/Duel'));
const ListSettings = lazy(() => import('@/pages/ListSettings'));
const History = lazy(() => import('@/pages/History'));
const AppSettings = lazy(() => import('@/pages/AppSettings'));
const RemindersSettings = lazy(() => import('@/pages/RemindersSettings'));
const Features = lazy(() => import('@/pages/Features'));
const NotFound = lazy(() => import('@/pages/NotFound'));

function withSuspense(node: React.ReactNode) {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading…</div>}>
      {node}
    </Suspense>
  );
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: withSuspense(<Home />) },
      { path: '/welcome', element: withSuspense(<Welcome />) },
      { path: '/list/:id', element: withSuspense(<Rankings />) },
      { path: '/list/:id/duel', element: withSuspense(<Duel />) },
      { path: '/list/:id/settings', element: withSuspense(<ListSettings />) },
      { path: '/list/:id/history', element: withSuspense(<History />) },
      { path: '/settings', element: withSuspense(<AppSettings />) },
      { path: '/settings/reminders', element: withSuspense(<RemindersSettings />) },
      { path: '/features', element: withSuspense(<Features />) },
      { path: '*', element: withSuspense(<NotFound />) },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
