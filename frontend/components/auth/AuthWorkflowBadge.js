export function AuthWorkflowBadge({ label }) {
  return (
    <div className="mb-3 inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
      Selected workflow: {label}
    </div>
  );
}
