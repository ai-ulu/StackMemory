'use client';

import { useEffect, useState } from 'react';
import { Check, CreditCard, Loader2, RefreshCw, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrice } from '@/lib/billing';

async function parseResponse(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'Request failed');
  return body;
}

function UsageBar({ value }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Usage</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function BillingDashboardClient() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkoutPlan, setCheckoutPlan] = useState('');
  const [error, setError] = useState('');

  async function loadSummary() {
    setLoading(true);
    setError('');
    try {
      const body = await parseResponse(await fetch('/api/billing/summary'));
      setSummary(body.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load billing summary');
    } finally {
      setLoading(false);
    }
  }

  async function startCheckout(planId) {
    setCheckoutPlan(planId);
    setError('');
    try {
      const body = await parseResponse(await fetch('/api/billing/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: planId }),
      }));

      if (body.url) {
        window.location.href = body.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start checkout');
    } finally {
      setCheckoutPlan('');
    }
  }

  useEffect(() => {
    loadSummary();
  }, []);

  if (loading) {
    return (
      <Card className="border-border/60 bg-card/60">
        <CardContent className="flex items-center justify-center gap-3 p-8 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading billing...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {summary && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-border/60 bg-card/60">
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Current plan</CardTitle></CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{summary.planName}</div>
                <p className="mt-1 text-xs text-muted-foreground">Plan source is environment-backed until subscription table lands.</p>
              </CardContent>
            </Card>
            <Card className="border-border/60 bg-card/60">
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Active memories</CardTitle></CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{summary.memoryCount}</div>
                <p className="mt-1 text-xs text-muted-foreground">Limit: {summary.memoryLimit === -1 ? 'Unlimited' : summary.memoryLimit}</p>
              </CardContent>
            </Card>
            <Card className="border-border/60 bg-card/60">
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Search limit</CardTitle></CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{summary.searchesPerDay === -1 ? '∞' : summary.searchesPerDay}</div>
                <p className="mt-1 text-xs text-muted-foreground">Per day allowance for the selected plan.</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/60 bg-card/60">
            <CardHeader>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Usage</CardTitle>
                    <CardDescription>Counts active memories from Supabase.</CardDescription>
                  </div>
                </div>
                <Button variant="outline" onClick={loadSummary}><RefreshCw className="mr-2 h-4 w-4" /> Refresh</Button>
              </div>
            </CardHeader>
            <CardContent>
              <UsageBar value={summary.usagePercent} />
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-4">
            {Object.values(summary.plans).map((plan) => (
              <Card key={plan.id} className="flex flex-col border-border/60 bg-card/60">
                <CardHeader>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <CardTitle>{plan.name}</CardTitle>
                    {plan.id === summary.planId && <Badge>Current</Badge>}
                  </div>
                  <div className="text-3xl font-bold">
                    {formatPrice(plan.price, plan.currency)}
                    {plan.price !== null && <span className="text-sm font-normal text-muted-foreground">/{plan.interval}</span>}
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                  <div className="space-y-2">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex gap-2 text-sm text-muted-foreground">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-auto">
                    {['pro', 'team'].includes(plan.id) ? (
                      <Button className="w-full" onClick={() => startCheckout(plan.id)} disabled={checkoutPlan === plan.id}>
                        {checkoutPlan === plan.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                        Upgrade
                      </Button>
                    ) : (
                      <Button className="w-full" variant="outline" disabled>{plan.id === 'free' ? 'Included' : 'Contact sales'}</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
