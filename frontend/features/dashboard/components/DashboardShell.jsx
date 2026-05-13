'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Brain,
  CreditCard,
  Database,
  GitBranch,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/memories', label: 'Memories', icon: Database },
  { href: '/dashboard/brain', label: 'Brain', icon: Brain },
  { href: '/dashboard/graph', label: 'Graph', icon: GitBranch },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
];

function NavLink({ item }) {
  const pathname = usePathname();
  const Icon = item.icon;
  const isActive = pathname === item.href;

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-2xl px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground',
        isActive && 'bg-primary/10 text-primary'
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{item.label}</span>
    </Link>
  );
}

export function DashboardShell({ children }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-border/60 bg-card/40 p-5 lg:block">
          <div className="flex h-full flex-col">
            <Link href="/dashboard" className="mb-8 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-semibold">StackMemory</div>
                <div className="text-xs text-muted-foreground">Memory OS</div>
              </div>
            </Link>

            <div className="mb-5 rounded-2xl border border-border/60 bg-background/70 p-4">
              <div className="mb-2 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">App-first mode</span>
              </div>
              <p className="text-xs leading-5 text-muted-foreground">
                Supabase is the source of truth. MCP is parked and returns later as an adapter.
              </p>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => <NavLink key={item.href} item={item} />)}
            </nav>

            <div className="mt-auto rounded-2xl border border-border/60 bg-background/70 p-4">
              <Badge variant="outline" className="mb-3">Product shell</Badge>
              <p className="text-xs leading-5 text-muted-foreground">
                Current sprint: reusable dashboard layout, navigation, and app product surface.
              </p>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-border/60 bg-background/90 backdrop-blur">
            <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3 lg:hidden">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div className="font-semibold">StackMemory</div>
              </div>
              <div className="hidden text-sm text-muted-foreground lg:block">
                Agent memory control center
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">MCP parked</Badge>
                <Button asChild variant="outline" size="sm">
                  <Link href="/">Landing</Link>
                </Button>
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto px-4 pb-3 lg:hidden">
              {navItems.map((item) => (
                <Button key={item.href} asChild variant="outline" size="sm" className="shrink-0">
                  <Link href={item.href}>{item.label}</Link>
                </Button>
              ))}
            </div>
          </header>

          <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-7xl space-y-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
