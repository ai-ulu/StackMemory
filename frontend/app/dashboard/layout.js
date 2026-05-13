import { AuthGate } from '@/features/dashboard/components/AuthGate';
import { DashboardShell } from '@/features/dashboard/components/DashboardShell';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function DashboardLayout({ children }) {
  let user = null;

  try {
    const supabase = createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    user = null;
  }

  return <DashboardShell>{user ? children : <AuthGate />}</DashboardShell>;
}
