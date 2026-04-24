import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router';
import Layout from '@/components/Layout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  DefaultSkeleton,
  HomeSkeleton,
  RankingsSkeleton,
} from '@/components/PageSkeleton';

const Home = lazy(() => import('@/pages/Home'));
const Welcome = lazy(() => import('@/pages/Welcome'));
const Rankings = lazy(() => import('@/pages/Rankings'));
const Duel = lazy(() => import('@/pages/Duel'));
const ListSettings = lazy(() => import('@/pages/ListSettings'));
const History = lazy(() => import('@/pages/History'));
const AppSettings = lazy(() => import('@/pages/AppSettings'));
const RemindersSettings = lazy(() => import('@/pages/RemindersSettings'));
const Glossary = lazy(() => import('@/pages/Glossary'));
const Features = lazy(() => import('@/pages/Features'));
const NotFound = lazy(() => import('@/pages/NotFound'));

function withSuspense(node: React.ReactNode, fallback: React.ReactNode = <DefaultSkeleton />) {
  return <Suspense fallback={fallback}>{node}</Suspense>;
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: withSuspense(<Home />, <HomeSkeleton />) },
      { path: '/welcome', element: withSuspense(<Welcome />) },
      { path: '/list/:id', element: withSuspense(<Rankings />, <RankingsSkeleton />) },
      { path: '/list/:id/duel', element: withSuspense(<Duel />, <RankingsSkeleton />) },
      { path: '/list/:id/settings', element: withSuspense(<ListSettings />) },
      { path: '/list/:id/history', element: withSuspense(<History />) },
      { path: '/settings', element: withSuspense(<AppSettings />) },
      { path: '/settings/reminders', element: withSuspense(<RemindersSettings />) },
      { path: '/settings/glossary', element: withSuspense(<Glossary />) },
      { path: '/features', element: withSuspense(<Features />) },
      { path: '*', element: withSuspense(<NotFound />) },
    ],
  },
]);

export default function App() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}
