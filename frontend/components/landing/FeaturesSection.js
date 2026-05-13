import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoCard } from '@/components/landing/InfoCard';
import { Code2, Lock, Network, Search } from 'lucide-react';

const featureCards = [
  {
    icon: Search,
    title: 'Recall project context',
    body: 'Retrieve constraints, past decisions, and active work without re-explaining them in every tool.',
  },
  {
    icon: Code2,
    title: 'Keep coding preferences portable',
    body: 'Store style preferences, stack choices, and recurring instructions once and reuse them across sessions.',
  },
  {
    icon: Network,
    title: 'Connect multiple surfaces',
    body: 'Use MCP, REST, WebSocket, and SDK integrations to expose the same memory to multiple AI environments.',
  },
  {
    icon: Lock,
    title: 'Control what gets remembered',
    body: 'A serious memory product must make stored context inspectable, editable, exportable, and deletable.',
  },
];

const explainerCards = [
  {
    title: 'Why now',
    description: 'AI usage keeps increasing, but context still resets between tools.',
    body: 'The more AI tools your team uses, the more expensive repeated context becomes. Shared memory becomes workflow infrastructure, not a nice-to-have.',
  },
  {
    title: 'Why built-in memory falls short',
    description: 'Most tool memory is isolated to a single product.',
    body: 'Chat history is not shared project memory. StackMemory keeps context inspectable, reusable, and portable across coding tools, agents, and custom apps.',
  },
  {
    title: 'Why StackMemory',
    description: 'One memory system for users and builders.',
    body: 'Use the app to manage memory directly, or use MCP, bridge and APIs to make the same memory available inside your own AI workflows.',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20">
      <div className="container space-y-12">
        <div className="max-w-2xl space-y-4">
          <Badge variant="secondary">Core Product</Badge>
          <h2 className="text-3xl font-bold sm:text-4xl">Built for AI-native development workflows</h2>
          <p className="text-lg text-muted-foreground">
            StackMemory is not a generic chat app. It is a shared memory system for coding tools, agents, and developer workflows that need durable project context.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {featureCards.map((feature) => (
            <InfoCard key={feature.title} icon={feature.icon} title={feature.title}>
              {feature.body}
            </InfoCard>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {explainerCards.map((card) => (
            <Card key={card.title} className="border-border/60 bg-card/50">
              <CardHeader>
                <CardTitle>{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-muted-foreground">
                {card.body}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
