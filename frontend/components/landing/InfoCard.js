import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function InfoCard({ icon: Icon, title, children }) {
  return (
    <Card className="border-border/60 bg-card/60 backdrop-blur">
      <CardHeader>
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm leading-6 text-muted-foreground">
        {children}
      </CardContent>
    </Card>
  );
}
