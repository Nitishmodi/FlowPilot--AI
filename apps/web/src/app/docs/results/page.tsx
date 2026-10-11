import type { Metadata } from "next";
import { DocHeader, Note } from "@/components/docs-frame";

export const metadata: Metadata = { title: "Results" };

const statuses = [
  ["passed", "The command finished and its own rule succeeded."],
  ["failed", "The command ran and found a problem, such as a failing test or a likely secret."],
  ["skipped", "The check is turned off in flowpilot.yml. This is not a pass."],
  ["unavailable", "The tool could not run. A missing script, a missing binary, or a folder that is not a Git repository."],
  ["inconclusive", "There is not enough evidence. Examples: no saved report for debug, or dead-code candidates."],
  ["cancelled", "The process was cancelled."],
];

const codes = [
  ["0", "The command finished. For a workflow, no required step failed."],
  ["1", "A required check failed, or flowpilot.yml could not be parsed."],
  ["2", "Usage problem, missing report, unknown tool, or a tool that was unavailable where the command treats that as a usage error."],
];

const files = [
  ["flowpilot.yml", "Project config. Created by flowpilot init."],
  [".flowpilot/last-report.json", "The last check or pr-check result."],
  [".flowpilot/task.json", "The note from flowpilot task start."],
  [".flowpilot/link.json", "The local clone record from flowpilot connect."],
];

export default function ResultsPage() {
  return (
    <>
      <DocHeader
        kicker="Results"
        title="How to read the output."
        text="Each tool has a status. A workflow uses the strongest problem it saw: failed, then cancelled, then inconclusive. It is passed only when at least one step passed and none of those problems are present."
      />
      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Statuses</h2>
        <ul className="mt-4 grid gap-3">
          {statuses.map(([name, text]) => (
            <li key={name} className="doc-card flex flex-col gap-2 sm:flex-row sm:items-baseline sm:gap-6">
              <p className="w-36 shrink-0 font-mono text-sm text-sky-100">{name}</p>
              <p className="text-sm leading-7 text-muted">{text}</p>
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Exit codes</h2>
        <ul className="mt-4 grid gap-3">
          {codes.map(([name, text]) => (
            <li key={name} className="doc-card flex flex-col gap-2 sm:flex-row sm:items-baseline sm:gap-6">
              <p className="w-36 shrink-0 font-mono text-sm text-sky-100">{name}</p>
              <p className="text-sm leading-7 text-muted">{text}</p>
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Files on disk</h2>
        <ul className="mt-4 grid gap-3">
          {files.map(([name, text]) => (
            <li key={name} className="doc-card">
              <p className="font-mono text-sm text-sky-100">{name}</p>
              <p className="mt-2 text-sm leading-7 text-muted">{text}</p>
            </li>
          ))}
        </ul>
      </section>
      <Note>A workflow whose steps are only skipped or unavailable is inconclusive. The headline is not a pass, and it is not a claim that the project is production-ready.</Note>
    </>
  );
}
