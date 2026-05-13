import { Check } from 'lucide-react';

export function IconList({ items, className = '', itemClassName = '' }) {
  return (
    <div className={className}>
      {items.map((item) => (
        <div key={item} className={`flex items-start gap-3 text-sm text-muted-foreground ${itemClassName}`}>
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}
