import { CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function BillingPage() {
  return (
    <>
      <div>
        <Badge variant="outline" className="mb-3">Coming next</Badge>
        <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Usage meters, plans, API limits and Stripe billing actions will be connected after the main product shell is stable.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/60 bg-card/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Plan</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">Free</CardContent>
        </Card>
        <Card className="border-border/60 bg-card/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Memory usage</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">MVP</CardContent>
        </Card>
        <Card className="border-border/60 bg-card/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">API calls</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">Soon</CardContent>
        </Card>
      </div>

      <Card className="border-border/60 bg-card/60">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Billing backlog</CardTitle>
              <CardDescription>Prepared for Stripe and usage metering integration.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
          <div className="rounded-2xl border border-border/60 bg-background/60 p-4">Plan cards</div>
          <div className="rounded-2xl border border-border/60 bg-background/60 p-4">Usage meter</div>
          <div className="rounded-2xl border border-border/60 bg-background/60 p-4">Checkout action</div>
          <div className="rounded-2xl border border-border/60 bg-background/60 p-4">Billing portal action</div>
        </CardContent>
      </Card>
    </>
  );
}
