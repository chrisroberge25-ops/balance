"use client";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg px-6 py-24">
      <p className="text-xs uppercase tracking-[0.16em] text-muted">Something slipped</p>
      <h1 className="mt-2 font-serif text-4xl">That page did not load.</h1>
      <p className="mt-3 text-sm text-muted">{error.message}</p>
      <button onClick={reset} className="mt-6 rounded-full bg-ink px-4 py-2 text-sm text-cream">
        Try again
      </button>
    </div>
  );
}
