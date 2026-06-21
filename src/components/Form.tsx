import type { ReactNode, SelectHTMLAttributes, InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface FieldProps {
  label: string;
  children: ReactNode;
  hint?: string;
  className?: string;
}

export function Field({ label, children, hint, className }: FieldProps) {
  return (
    <div className={className}>
      <label className="label-base">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-ink-faint">{hint}</p>}
    </div>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn("input-base", props.className)} />;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  children: ReactNode;
}

export function Select({ children, ...props }: SelectProps) {
  return (
    <select {...props} className={cn("input-base appearance-none pr-8", props.className)}>
      {children}
    </select>
  );
}

interface CheckboxProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}

export function Checkbox({ checked, onChange, label }: CheckboxProps) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-soft">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-cream-300 text-terracotta-400 focus:ring-terracotta-400/30"
      />
      {label}
    </label>
  );
}

export default Field;
