import type { Metadata } from "next";
import Link from "next/link";
import { CodeBlock } from "@/components/code-block";
import { DocHeader, Note } from "@/components/docs-frame";

export const metadata: Metadata = { title: "First run" };

const steps = [
  {
    title: "Go to the project",
    text: "Open a terminal in the repository you want to check. It needs to be a Git clone.",
    code: "cd /path/to/your-repo",
  },
  {
    title: "Create the config",
    text: "This writes flowpilot.yml. Skip it if that file is already there.",
    code: "flowpilot init",
  },
  {
    title: "See that the folder is ready",
    text: "Doctor tells you whether Node, Git, and the project scripts are available.",
    code: "flowpilot doctor",
  },
  {
    title: "Run the checks",
    text: "This is the command to use before a pull request. It runs format, lint, types, tests, the secret scan, and the diff review, then saves a report.",
    code: "flowpilot pr-check",
  },
];

export default function UsagePage() {
  return (
    <>
      <DocHeader
        kicker="First run"
        title="Check a repository."
        text="Four commands cover a normal session. The same Doctor and Pre-PR actions are in VS Code if you installed the extension."
      />
      <ol className="mt-10 grid gap-5">
        {steps.map((step, index) => (
          <li key={step.title} className="doc-card">
            <p className="font-mono text-xs text-violet-200">{String(index + 1).padStart(2, "0")}</p>
            <h2 className="mt-2 text-xl font-semibold">{step.title}</h2>
            <p className="mt-2 text-sm leading-7 text-muted">{step.text}</p>
            <CodeBlock code={step.code} />
          </li>
        ))}
      </ol>
      <Note>
        pr-check does not commit, push, or open a pull request. In VS Code, click the FlowPilot icon and choose Doctor, then Pre-PR. The{" "}
        <Link href="/docs/editor" className="text-sky-100 underline-offset-4 hover:underline">
          VS Code guide
        </Link>{" "}
        shows that path.
      </Note>
    </>
  );
}
