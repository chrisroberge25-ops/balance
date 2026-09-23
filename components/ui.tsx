import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-ink text-cream hover:bg-ink/90",
        variant === "secondary" && "border border-line bg-paper text-ink hover:bg-sand",
        variant === "ghost" && "text-ink hover:bg-sand",
        variant === "danger" && "text-red-800 hover:bg-red-50",
        className,
      )}
      {...props}
    />
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {eyebrow ? <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">{eyebrow}</p> : null}
        <h1 className="mt-1 font-serif text-3xl tracking-tight text-ink sm:text-4xl">{title}</h1>
        {description ? <p className="mt-2 text-sm leading-6 text-muted">{description}</p> : null}
      </div>
      {actions}
    </div>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-3xl border border-line bg-paper p-5 shadow-sm", className)}>{children}</section>;
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-ink">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs leading-5 text-muted">{hint}</span> : null}
    </label>
  );
}

export const inputClass =
  "w-full rounded-2xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none ring-accent/30 placeholder:text-muted/70 focus:ring-2";

export function Notice({ tone = "neutral", children }: { tone?: "neutral" | "good" | "warn"; children: ReactNode }) {
  return (
    <p
      className={cn(
        "rounded-2xl px-4 py-3 text-sm leading-6",
        tone === "neutral" && "bg-sand text-ink",
        tone === "good" && "bg-work/10 text-work",
        tone === "warn" && "bg-accent/10 text-accent-ink",
      )}
    >
      {children}
    </p>
  );
}

export function DayBar({
  segments,
}: {
  segments: { label: string; hours: number; color: string }[];
}) {
  const positive = segments.reduce((sum, segment) => sum + Math.max(0, segment.hours), 0);
  const scale = Math.max(24, positive);
  return (
    <div className="flex h-3 overflow-hidden rounded-full bg-sand" title="Hours in the day">
      {segments.map((segment) =>
        segment.hours > 0 ? (
          <div
            key={segment.label}
            style={{ width: `${(segment.hours / scale) * 100}%`, background: segment.color }}
            title={`${segment.label} ${segment.hours.toFixed(2)}h`}
          />
        ) : null,
      )}
    </div>
  );
}
