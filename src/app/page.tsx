import { redirect } from 'next/navigation';
import DashboardLayout from './dashboard/layout';
import Dashboard from './dashboard/page';

export default function RootPage() {
  // By default, show the dashboard.
  return (
    <DashboardLayout>
      <Dashboard />
    </DashboardLayout>
  )
}
