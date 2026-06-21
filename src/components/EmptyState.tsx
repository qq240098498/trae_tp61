import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      {icon && <div className="text-ink-faint">{icon}</div>}
      <p className="font-display text-base text-ink-soft">{title}</p>
      {description && <p className="text-xs text-ink-faint">{description}</p>}
    </div>
  );
}

export default EmptyState;
