import type { ReactNode } from "react";
import { PageShell } from "./page-shell";
import { DocsNav } from "./docs-nav";

export function DocsFrame({ children }: { children: ReactNode }) {
  return (
    <PageShell>
      <div className="mx-auto grid max-w-7xl items-start gap-8 px-6 py-10 lg:grid-cols-[15.5rem_minmax(0,1fr)] lg:gap-12 lg:py-14">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <DocsNav />
        </aside>
        <div className="doc-sheet min-w-0">{children}</div>
      </div>
    </PageShell>
  );
}

export function DocHeader({ kicker, title, text }: { kicker: string; title: string; text: string }) {
  return (
    <header className="rise">
      <p className="kicker">{kicker}</p>
      <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">{title}</h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">{text}</p>
    </header>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return <aside className="doc-note">{children}</aside>;
}
