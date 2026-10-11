import type { Metadata } from "next";
import { PageHero, PageShell } from "@/components/page-shell";
import { Toolbox } from "@/components/toolbox";

export const metadata: Metadata = { title: "Commands" };

export default function CommandsPage() {
  return (
    <PageShell>
      <main className="pb-24">
        <PageHero
          kicker="Commands"
          title="Every command, grouped by the stage it belongs to."
          text="Ready commands run against the repository you are in. The others are listed so the toolbox stays honest, and they exit without pretending to pass."
        />
        <div className="mx-auto mt-12 max-w-7xl px-6">
          <Toolbox detail />
        </div>
      </main>
    </PageShell>
  );
}
