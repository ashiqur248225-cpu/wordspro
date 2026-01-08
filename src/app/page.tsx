import { redirect } from 'next/navigation';

export default function RootPage() {
  // By default, redirect to the dashboard.
  redirect('/dashboard');
}
