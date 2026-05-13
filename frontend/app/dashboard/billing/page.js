import { Badge } from '@/components/ui/badge';
import { BillingDashboardClient } from '@/features/billing/components/BillingDashboardClient';

export default function BillingPage() {
  return (
    <>
      <div>
        <Badge variant="outline" className="mb-3">Billing</Badge>
        <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Usage meters and plan cards are connected. Checkout uses the existing Stripe route when Stripe environment variables are configured.
        </p>
      </div>

      <BillingDashboardClient />
    </>
  );
}
