import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function SectionCard({ title, subtitle, action, icon, children, className, bodyClassName }: SectionCardProps) {
  return (
    <section className={cn("card p-5", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {icon && <span className="text-terracotta-400">{icon}</span>}
            <div>
              {title && <h2 className="font-display text-lg text-ink">{title}</h2>}
              {subtitle && <p className="text-xs text-ink-muted">{subtitle}</p>}
            </div>
          </div>
          {action}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

export default SectionCard;
