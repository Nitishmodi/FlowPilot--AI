import type { Metadata } from "next";
import { Eye, KeyRound, Lock, ScrollText } from "lucide-react";
import { PageHero, PageShell } from "@/components/page-shell";

export const metadata: Metadata = { title: "Privacy" };

const notes = [
  { icon: Lock, title: "Local source", text: "Local checks read the repository on your machine. They do not upload source code." },
  { icon: Eye, title: "Masked secrets", text: "The secret scan stores a masked hint, not the credential." },
  { icon: KeyRound, title: "No sign-in", text: "The checks do not use a website account. Install the command and run it in the cloned repository." },
  { icon: ScrollText, title: "Task notes", text: "Task notes live in .flowpilot/task.json inside the repository. Do not put secrets in the task description." },
];

export default function PrivacyPage() {
  return (
    <PageShell>
      <main className="pb-24">
        <PageHero kicker="Privacy" title="What stays on your machine." text="Repository checks run in the folder you cloned. This site is the guide and does not ask for an account." />
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
