import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function MetricCard({ label, value, hint }) {
  return (
    <Card className="border-border/60 bg-card/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}
