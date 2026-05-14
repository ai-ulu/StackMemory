import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function SelectedTargetCard({ label, title, description, href }) {
  if (!title) return null;

  return (
    <Card className="border-primary/30 bg-card/80">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
          <CardTitle className="mt-1">{title}</CardTitle>
        </div>
        {href && (
          <Button asChild variant="outline" size="sm">
            <Link href={href}>Open source</Link>
          </Button>
        )}
      </CardHeader>
      {description && (
        <CardContent className="text-sm text-muted-foreground">
          {description}
        </CardContent>
      )}
    </Card>
  );
}
