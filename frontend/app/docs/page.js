import Link from 'next/link';
import { AppShell } from '@/components/app/AppShell';
import { getSetupDoc, quickStartGuides } from '@/content/mockDocs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DocsPage({ searchParams }) {
  const selectedSection = searchParams?.section || 'mcp';
  const setup = getSetupDoc(selectedSection);

  return (
    <AppShell title="Docs" description="Quick start guides for using StackMemory as an app and as infrastructure.">
      <div className="space-y-6">
        <Card className="border-primary/30 bg-card/80">
          <CardHeader>
            <CardTitle>{setup.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>{setup.description}</p>
            <div className="grid gap-3 md:grid-cols-2">
              {setup.steps.map((step, index) => (
                <div key={step} className="rounded-2xl border border-border/60 bg-background/60 p-4">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Step {index + 1}</div>
                  <div className="mt-1 text-foreground">{step}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          {quickStartGuides.map(([title, body, href]) => (
            <Card key={title} className="border-border/60 bg-card/60">
              <CardHeader>
                <CardTitle>{title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p>{body}</p>
                <Button asChild variant="outline" className="w-full">
                  <Link href={href}>Open</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
