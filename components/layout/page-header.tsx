import { ReactNode } from "react";

/** Mobile-first PageHeader — sticky di HP, normal di md+. */
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 -mx-4 mb-4 bg-base/95 px-4 py-3 backdrop-blur md:static md:z-auto md:mx-0 md:mb-6 md:bg-transparent md:px-0 md:py-0">
      <div className="flex flex-wrap items-center justify-between gap-2 md:gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-extrabold tracking-tight text-slate-100 md:text-2xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-0.5 text-xs text-muted md:mt-1 md:text-sm">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}