import { Badge } from '@/components/ui/badge';
import { MemorySettingsClient } from '@/features/settings/components/MemorySettingsClient';

export default function SettingsPage() {
  return (
    <>
      <div>
        <Badge variant="outline" className="mb-3">Memory settings</Badge>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Memory preferences, privacy mode, safe mode and decay controls are now connected to Supabase through the app-first settings API.
        </p>
      </div>

      <MemorySettingsClient />
    </>
  );
}
