import type { ReactNode } from "react";
import { SiteFooter, SiteHeader } from "./site-header";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-x-clip">
      <div className="grid-drift pointer-events-none fixed inset-0 opacity-40" />
      <div className="orb left-[-4rem] top-24 h-56 w-56 bg-violet-500/20" />
      <div className="orb right-[-3rem] top-40 h-64 w-64 bg-sky-400/15" style={{ animationDelay: "-7s" }} />
      <SiteHeader />
      <div className="relative flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}

export function PageHero({ kicker, title, text }: { kicker: string; title: string; text: string }) {
  return (
    <header className="rise mx-auto max-w-7xl px-6 pb-4 pt-16 sm:pt-24">
      <p className="kicker">{kicker}</p>
      <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">{title}</h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">{text}</p>
    </header>
  );
}
