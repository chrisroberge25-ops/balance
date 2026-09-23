"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "./logo";

export function MobileNav({ links }: { links: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="relative flex items-center justify-between border-b border-line bg-paper px-4 py-3 lg:hidden">
      <Link href="/app" onClick={() => setOpen(false)}>
        <Logo />
      </Link>
      <button
        type="button"
        className="rounded-full border border-line px-3 py-1 text-sm"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? "Close" : "Menu"}
      </button>
      {open ? (
        <div className="absolute left-3 right-3 top-16 z-20 rounded-2xl border border-line bg-paper p-2 shadow-lg">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-xl px-3 py-2 text-sm hover:bg-sand"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      ) : null}
    </header>
  );
}
