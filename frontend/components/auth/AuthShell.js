import Link from 'next/link';
import { ArrowLeft, Brain } from 'lucide-react';

export function AuthShell({ children, showLogo = true }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <nav className="border-b">
        <div className="container flex h-16 items-center">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Ana Sayfa</span>
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {showLogo && (
            <div className="text-center mb-8">
              <Link href="/" className="inline-flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center">
                  <Brain className="w-7 h-7 text-white" />
                </div>
                <span className="text-2xl font-bold">StackMemory</span>
              </Link>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
