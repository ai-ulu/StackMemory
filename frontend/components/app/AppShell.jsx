import { DashboardShell } from '@/features/dashboard/components/DashboardShell';

export function AppShell({ title, description, children }) {
  return (
    <DashboardShell>
      <div className="space-y-8">
        <div className="rounded-3xl border border-border/60 bg-card/60 p-6 shadow-sm">
          <div className="text-sm font-medium uppercase tracking-wide text-muted-foreground">StackMemory</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
          {description && <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">{description}</p>}
        </div>
        {children}
      </div>
    </DashboardShell>
  );
}
