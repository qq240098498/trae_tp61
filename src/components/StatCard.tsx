import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: ReactNode;
  unit?: string;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: "ink" | "terracotta" | "olive" | "crimson" | "amber";
  delay?: number;
}

const toneText: Record<string, string> = {
  ink: "text-ink",
  terracotta: "text-terracotta-500",
  olive: "text-olive-500",
  crimson: "text-crimson-500",
  amber: "text-amber2-500",
};

const toneIcon: Record<string, string> = {
  ink: "bg-cream-100 text-ink-muted",
  terracotta: "bg-terracotta-100 text-terracotta-500",
  olive: "bg-olive-100 text-olive-500",
  crimson: "bg-crimson-100 text-crimson-500",
  amber: "bg-amber2-100 text-amber2-500",
};

export function StatCard({ label, value, unit, hint, icon, tone = "ink", delay = 0 }: StatCardProps) {
  return (
    <div
      className="card card-hover animate-fade-up relative overflow-hidden p-5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-medium tracking-wide text-ink-muted">{label}</span>
        {icon && (
          <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", toneIcon[tone])}>
            {icon}
          </span>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className={cn("font-serif text-4xl font-semibold leading-none tnum", toneText[tone])}>
          {value}
        </span>
        {unit && <span className="text-sm text-ink-muted">{unit}</span>}
      </div>
      {hint && <div className="mt-2 text-xs text-ink-faint">{hint}</div>}
    </div>
  );
}

export default StatCard;
