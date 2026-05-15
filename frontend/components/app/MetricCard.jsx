import { Card, CardContent } from '@/components/ui/card';

export function MetricCard({ label, value, hint }) {
  return (
    <Card className="border-border/60 bg-card/60">
      <CardContent className="p-5">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="mt-2 text-3xl font-semibold tracking-tight">{value}</div>
        {hint && <div className="mt-2 text-xs leading-5 text-muted-foreground">{hint}</div>}
      </CardContent>
    </Card>
  );
}
