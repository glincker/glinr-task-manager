import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { RootLayout } from '@/layouts/RootLayout';
import { Dashboard } from '@/features/dashboard/views/Dashboard';
import { TaskList } from '@/features/tasks/views/TaskList';
import { TaskDetail } from '@/features/tasks/views/TaskDetail';
import { SummaryList } from '@/features/summaries/views/SummaryList';
import { SummaryDetail } from '@/features/summaries/views/SummaryDetail';
import { AgentList } from '@/features/agents';
import { Settings } from '@/features/settings';
import { CostsDashboard } from '@/features/costs/views/CostsDashboard';
import { WebhookStatus } from '@/features/webhooks';
import { DLQDashboard } from '@/features/dlq';

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout><Dashboard /></RootLayout>,
  },
  {
    path: '/tasks',
    element: <RootLayout><TaskList /></RootLayout>,
  },
  {
    path: '/tasks/:id',
    element: <RootLayout><TaskDetail /></RootLayout>,
  },
  {
    path: '/summaries',
    element: <RootLayout><SummaryList /></RootLayout>,
  },
  {
    path: '/summaries/:id',
    element: <RootLayout><SummaryDetail /></RootLayout>,
  },
  {
    path: '/agents',
    element: <RootLayout><AgentList /></RootLayout>,
  },
  {
    path: '/costs',
    element: <RootLayout><CostsDashboard /></RootLayout>,
  },
  {
    path: '/settings',
    element: <RootLayout><Settings /></RootLayout>,
  },
  {
    path: '/webhooks',
    element: <RootLayout><WebhookStatus /></RootLayout>,
  },
  {
    path: '/failed',
    element: <RootLayout><DLQDashboard /></RootLayout>,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
