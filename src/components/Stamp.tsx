import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type StampVariant = "olive" | "crimson" | "amber" | "terracotta" | "ink" | "amber2";

const variants: Record<StampVariant, string> = {
  olive: "border-olive-400 text-olive-500 bg-olive-50",
  crimson: "border-crimson-400 text-crimson-500 bg-crimson-50",
  amber: "border-amber2-400 text-amber2-500 bg-amber2-50",
  terracotta: "border-terracotta-400 text-terracotta-500 bg-terracotta-50",
  ink: "border-ink-muted text-ink-soft bg-cream-100",
  amber2: "border-amber2-400 text-amber2-500 bg-amber2-50",
};

interface StampProps {
  variant?: StampVariant;
  children: ReactNode;
  rotate?: number;
  className?: string;
}

export function Stamp({ variant = "ink", children, rotate = -3, className }: StampProps) {
  return (
    <span
      className={cn("stamp", variants[variant], className)}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {children}
    </span>
  );
}

export default Stamp;
