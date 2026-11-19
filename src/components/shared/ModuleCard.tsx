import type { ReactNode } from "react";

export function ModuleCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <article className="flex min-h-36 gap-4 rounded-xl border border-app-border bg-app-surface p-5 shadow-sm">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-app-soft text-app-primary">
        {icon}
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-app-text">{title}</h3>
        <p className="mt-2 text-xs leading-5 text-app-muted">{description}</p>
        <span className="mt-4 inline-flex items-center text-[11px] font-medium text-app-muted">
          Tersedia di menu workspace
        </span>
      </div>
    </article>
  );
}
