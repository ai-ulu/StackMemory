import Link from 'next/link';
import { LockKeyhole } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function AuthGate() {
  return (
    <Card className="border-border/60 bg-card/60">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
            <LockKeyhole className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Sign in required</CardTitle>
            <CardDescription>
              StackMemory dashboard needs an authenticated Supabase session before it can read or write memory.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row">
        <Button asChild>
          <Link href="/login">Go to login</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Back to landing</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
