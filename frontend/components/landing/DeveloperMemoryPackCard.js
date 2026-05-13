import { Card, CardContent } from '@/components/ui/card';

export function DeveloperMemoryPackCard({ items }) {
  return (
    <Card className="border-border/60 bg-card/60 p-2 shadow-2xl">
      <CardContent className="space-y-4 p-6">
        <div className="mb-2 text-sm font-medium text-muted-foreground">
          Example developer memory pack
        </div>
        {items.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-border/50 bg-background/70 p-4">
            <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
            <div className="text-sm">{value}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
