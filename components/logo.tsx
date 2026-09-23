import { cn } from "@/lib/utils";

export function Logo({ light = false, className }: { light?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-serif text-xl tracking-tight", className)}>
      <span className="relative inline-flex h-6 w-6" aria-hidden>
        <span className={cn("absolute inset-0 rounded-full border-2", light ? "border-cream/30" : "border-ink/15")} />
        <span
          className="absolute inset-0 rounded-full border-2 border-accent"
          style={{ clipPath: "inset(0 46% 0 0)" }}
        />
      </span>
      Balance
    </span>
  );
}
