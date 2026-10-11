import type { Metadata } from "next";
import { CodeBlock } from "@/components/code-block";
import { DocHeader, Note } from "@/components/docs-frame";

export const metadata: Metadata = { title: "Configuration" };

const sample = `version: 1
project:
  name: your-repo
  defaultBaseBranch: main
execution:
  timeoutSeconds: 300
  maxParallelTasks: 4
checks:
  format: true
  lint: true
  types: true
  tests: true
  secrets: true
workflows:
  pre-pr:
    include:
      - fmt
      - lint
      - types
      - test
      - secrets
      - review
permissions:
  allowSafeFixes: false
  allowGitCommit: false
  allowGitPush: false
  allowPullRequestCreation: false`;

const fields = [
  ["project.defaultBaseBranch", "The branch diff, status, and review compare against. Default main."],
  ["execution.timeoutSeconds", "How long one process may run. Default 300. Allowed range is 5 to 3600."],
  ["checks.format", "Turns flowpilot fmt on or off. Off means skipped."],
  ["checks.lint", "Turns flowpilot lint on or off."],
  ["checks.types", "Turns flowpilot types on or off."],
  ["checks.tests", "Turns flowpilot test on or off."],
  ["checks.secrets", "Turns the secret scan on or off."],
  ["workflows.pre-pr.include", "The ordered list for flowpilot pr-check. Allowed ids are fmt, lint, types, test, secrets, and review."],
  ["permissions.allowPullRequestCreation", "Must be true before flowpilot pr --create will call gh. Default false."],
];

export default function ConfigPage() {
  return (
    <>
      <DocHeader
        kicker="Configuration"
        title="flowpilot.yml"
        text="flowpilot init writes this file. A missing file still uses the same defaults. flowpilot config prints the resolved JSON."
      />
      <CodeBlock title="flowpilot.yml" code={sample} />
      <ul className="mt-6 grid gap-3">
        {fields.map(([name, text]) => (
          <li key={name} className="doc-card">
            <p className="font-mono text-sm text-sky-100">{name}</p>
            <p className="mt-2 text-sm leading-7 text-muted">{text}</p>
          </li>
        ))}
      </ul>
      <Note>
        allowSafeFixes, allowGitCommit, and allowGitPush are stored and default to false. No current command commits or pushes.
      </Note>
    </>
  );
}
