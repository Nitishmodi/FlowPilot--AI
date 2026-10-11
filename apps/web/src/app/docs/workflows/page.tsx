import type { Metadata } from "next";
import { CodeBlock } from "@/components/code-block";
import { DocHeader, Note } from "@/components/docs-frame";

export const metadata: Metadata = { title: "Workflows" };

export default function WorkflowsPage() {
  return (
    <>
      <DocHeader
        kicker="Workflows"
        title="Run several checks as one command."
        text="Both workflows write .flowpilot/last-report.json. flowpilot report prints that file again. flowpilot debug reads the failed steps from it."
      />

      <section className="doc-card mt-10">
        <h2 className="text-xl font-semibold">flowpilot check</h2>
        <p className="mt-2 text-sm leading-7 text-muted">Runs format, lint, and typecheck. Those three have no order dependency, so they run together, up to four at a time. Tests, secrets, and review are not part of this command.</p>
        <CodeBlock code={"flowpilot check\nflowpilot check --json"} />
      </section>

      <section className="doc-card mt-5">
        <h2 className="text-xl font-semibold">flowpilot pr-check</h2>
        <p className="mt-2 text-sm leading-7 text-muted">
          Uses <span className="font-mono text-sky-100">workflows.pre-pr.include</span> from flowpilot.yml. The default list is fmt, lint, types, test, secrets, then review, and each step waits for the one before it. A tool turned off in <span className="font-mono text-sky-100">checks</span> is skipped. A missing script is unavailable. Either one keeps the headline from being a clean pass when nothing else passed.
        </p>
        <CodeBlock code={"flowpilot pr-check --dry-run\nflowpilot pr-check"} />
        <Note>--dry-run prints the step names and does not run them. A failed required check exits 1. The command still does not commit, push, or open a pull request.</Note>
      </section>

      <section className="doc-card mt-5">
        <h2 className="text-xl font-semibold">One tool</h2>
        <p className="mt-2 text-sm leading-7 text-muted">flowpilot run accepts a catalog id, such as lint or secrets. An unknown id exits 2 and tells you to run flowpilot tools.</p>
        <CodeBlock code={"flowpilot run lint"} />
      </section>
    </>
  );
}
