import type { Metadata } from "next";
import { CircleAlert, GitPullRequest } from "lucide-react";
import { PageHero, PageShell } from "@/components/page-shell";

export const metadata: Metadata = { title: "Terms" };

const notes = [
  { icon: CircleAlert, title: "A pass is a pass of the commands that ran", text: "A passing check means those commands exited successfully. It does not mean the software is bug-free, secure, or ready to ship." },
  { icon: GitPullRequest, title: "You confirm visible Git actions", text: "You confirm any git commit, push, or pull request yourself. This build does not perform those actions." },
];

export default function TermsPage() {
  return (
    <PageShell>
      <main className="pb-24">
        <PageHero kicker="Terms" title="Checks report what they ran." text="FlowPilot shows evidence from the tools it could execute. It does not upgrade that evidence into a guarantee." />
        <ul className="mx-auto mt-12 grid max-w-7xl gap-4 px-6 md:grid-cols-2">
          {notes.map((note) => (
            <li key={note.title} className="surface">
              <span className="tool-icon">
                <note.icon className="size-4" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-xl font-semibold">{note.title}</h2>
              <p className="mt-2 text-sm leading-7 text-muted">{note.text}</p>
            </li>
          ))}
        </ul>
      </main>
    </PageShell>
  );
}
