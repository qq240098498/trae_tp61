import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function Modal({ open, title, subtitle, onClose, children, footer, className }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        className={cn(
          "card animate-fade-up relative z-10 w-full max-w-lg p-6 shadow-lift",
          className,
        )}
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-xl text-ink">{title}</h3>
            {subtitle && <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-ink-muted transition hover:bg-cream-100 hover:text-ink"
            aria-label="关闭"
          >
            <X size={18} />
          </button>
        </div>
        <div className="scroll-area max-h-[60vh] overflow-y-auto pr-1">{children}</div>
        {footer && <div className="mt-5 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

export default Modal;
