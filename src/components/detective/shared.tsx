import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground max-w-2xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SectionCard({
  children, className, title, description, actions,
}: { children: ReactNode; className?: string; title?: string; description?: string; actions?: ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("card-soft p-5 md:p-6", className)}
    >
      {(title || actions) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h3 className="text-base font-semibold">{title}</h3>}
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </motion.section>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    Completed: "bg-success/10 text-success",
    Ready: "bg-success/10 text-success",
    Processing: "bg-info/10 text-info",
    Cleaning: "bg-info/10 text-info",
    Failed: "bg-danger/10 text-danger",
    Error: "bg-danger/10 text-danger",
    Positive: "bg-success/10 text-success",
    High: "bg-danger/10 text-danger",
    Medium: "bg-warning/10 text-warning",
    Low: "bg-muted text-muted-foreground",
    Admin: "bg-primary/10 text-primary",
    Editor: "bg-info/10 text-info",
    Viewer: "bg-muted text-muted-foreground",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium", map[status] ?? "bg-muted text-muted-foreground")}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

export function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">{icon}</div>
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
