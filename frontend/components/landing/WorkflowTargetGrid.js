import Link from 'next/link';

export function WorkflowTargetGrid({ targets }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {targets.map((target) => (
        <Link
          key={target.name}
          href={`/signup?workflow=${target.key}`}
          className="rounded-2xl border border-border/60 bg-card/40 p-4 text-sm transition-colors hover:border-primary/40 hover:bg-card/70"
        >
          <div className="mb-2 font-medium">{target.name}</div>
          <div className="text-muted-foreground">{target.desc}</div>
        </Link>
      ))}
    </div>
  );
}
