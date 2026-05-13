import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function AuthIconInput({
  id,
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  icon: Icon,
  required = true,
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />}
        <Input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={Icon ? 'pl-10' : undefined}
          required={required}
        />
      </div>
    </div>
  );
}
