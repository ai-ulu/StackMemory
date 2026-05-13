import { AuthGate } from '@/features/dashboard/components/AuthGate';
import { DashboardShell } from '@/features/dashboard/components/DashboardShell';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardLayout({ children }) {
  let user = null;

  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    user = null;
  }

  return <DashboardShell>{user ? children : <AuthGate />}</DashboardShell>;
}
