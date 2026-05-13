import Link from 'next/link';
import { Brain } from 'lucide-react';
import { appNavigation } from '@/content/appNavigation';

export function AppShell({ title, description, children }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="hidden border-r border-border/60 bg-card/40 lg:block">
          <div className="flex h-16 items-center gap-3 border-b border-border/60 px-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-violet-600 to-cyan-500">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="font-semibold">StackMemory</div>
              <div className="text-xs text-muted-foreground">Memory OS</div>
            </div>
          </div>

          <nav className="space-y-1 p-4">
            {appNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-2xl px-4 py-3 text-sm transition-colors hover:bg-muted"
              >
                <div className="font-medium">{item.label}</div>
                <div className="text-xs text-muted-foreground">{item.description}</div>
              </Link>
            ))}
          </nav>
        </aside>

        <main className="min-w-0">
          <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur">
            <div className="flex min-h-16 items-center justify-between gap-4 px-4 py-4 lg:px-8">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
              </div>
              <Link href="/" className="rounded-xl border border-border/60 px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
                Home
              </Link>
            </div>
          </header>

          <div className="p-4 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
