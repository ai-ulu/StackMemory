import { InfoCard } from '@/components/landing/InfoCard';
import { Braces, GitBranch, Terminal } from 'lucide-react';

export function UsageSection() {
  return (
    <section id="usage" className="border-y border-border/60 bg-muted/30 py-20">
      <div className="container grid gap-6 lg:grid-cols-3">
        <InfoCard icon={Terminal} title="For tool users">
          Claude Code, Claude Desktop, Cursor, VS Code workflows, Bolt, Lovable, Replit, and other AI-heavy coding environments can pull from the same project memory when integration surfaces allow it.
        </InfoCard>
        <InfoCard icon={Braces} title="For builders">
          If you are building your own AI app, internal copilot, or agent workflow, StackMemory can act as the memory backend behind your product from day one.
        </InfoCard>
        <InfoCard icon={GitBranch} title="For teams">
          Teams can use the same foundation for project-scoped context, shared instructions, and reusable developer memory over time.
        </InfoCard>
      </div>
    </section>
  );
}
