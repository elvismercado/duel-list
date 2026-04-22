import { createBrowserRouter, RouterProvider } from 'react-router';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import Welcome from '@/pages/Welcome';
import Rankings from '@/pages/Rankings';
import Duel from '@/pages/Duel';
import ListSettings from '@/pages/ListSettings';
import AppSettings from '@/pages/AppSettings';
import NotFound from '@/pages/NotFound';

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/welcome', element: <Welcome /> },
      { path: '/list/:id', element: <Rankings /> },
      { path: '/list/:id/duel', element: <Duel /> },
      { path: '/list/:id/settings', element: <ListSettings /> },
      { path: '/settings', element: <AppSettings /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
