import type { Metadata } from "next";
import Link from "next/link";
import { CodeBlock } from "@/components/code-block";
import { DocHeader, Note } from "@/components/docs-frame";

export const metadata: Metadata = { title: "VS Code" };

const steps = [
  {
    title: "Download the extension",
    text: "Save the file. You do not need to clone FlowPilot for this step.",
  },
  {
    title: "Install it in VS Code",
    text: "Open the Extensions view. Open the ... menu. Choose Install from VSIX, then select the file you downloaded.",
  },
  {
    title: "Reload and confirm",
    text: "Reload the window. Open Extensions and select Installed. FlowPilot AI should be in that list. A Marketplace search will not show it.",
  },
  {
    title: "Open your project",
    text: "Use File, then Open Folder, and choose the repository you want to check. The command flowpilot must already work in a terminal. If it does not, finish the install guide first.",
  },
  {
    title: "Run a check",
    text: "Click the FlowPilot icon in the activity bar. Click Doctor once, so you can see that the folder is ready. When you want to check the change, click Pre-PR.",
  },
  {
    title: "Read the result",
    text: "Output opens in the FlowPilot panel. The status bar shows a spinner while it runs, a check when it passes, and a warning when it does not. Click the status bar item any time to pick another tool.",
  },
];

export default function EditorPage() {
  return (
    <>
      <DocHeader
        kicker="VS Code"
        title="Use FlowPilot from the editor."
        text="Install the extension from the file, open a folder, then run Doctor and Pre-PR from the FlowPilot icon."
      />

      <p className="mt-8">
        <a href="/flowpilot-ai-0.1.0.vsix" download className="btn btn-primary">
          Download FlowPilot AI
        </a>
      </p>

      <ol className="mt-8 grid gap-5">
        {steps.map((step, index) => (
          <li key={step.title} className="doc-card">
            <p className="font-mono text-xs text-violet-200">{String(index + 1).padStart(2, "0")}</p>
            <h2 className="mt-2 text-xl font-semibold">{step.title}</h2>
            <p className="mt-2 text-sm leading-7 text-muted">{step.text}</p>
          </li>
        ))}
      </ol>

      <section className="doc-card mt-5">
        <h2 className="text-xl font-semibold">Or install with commands</h2>
        <p className="mt-2 text-sm leading-7 text-muted">In the FlowPilot folder, add the command to your PATH:</p>
        <CodeBlock
          title="shell"
          code={`chmod +x apps/cli/bin/flowpilot.js
ln -sfn "$(pwd)/apps/cli/bin/flowpilot.js" "$(dirname "$(command -v node)")/flowpilot"
flowpilot --version`}
        />
        <p className="mt-4 text-sm leading-7 text-muted">After the extension file is downloaded, install it from any folder:</p>
        <CodeBlock title="shell" code={"code --install-extension ~/Downloads/flowpilot-ai-0.1.0.vsix"} />
        <Note>Open a new terminal if flowpilot --version says command not found. Then reload VS Code and look under Installed.</Note>
      </section>

      <section className="doc-card mt-5">
        <h2 className="text-xl font-semibold">The three actions you need</h2>
        <ul className="mt-4 grid gap-3">
          <li className="rounded-2xl border border-line bg-black/20 px-4 py-3">
            <p className="font-medium">Doctor</p>
            <p className="mt-1 text-sm leading-7 text-muted">Run this first in a new folder. It shows whether Git and the project scripts are available.</p>
          </li>
          <li className="rounded-2xl border border-line bg-black/20 px-4 py-3">
            <p className="font-medium">Pre-PR</p>
            <p className="mt-1 text-sm leading-7 text-muted">Run this before you open a pull request. It runs format, lint, types, tests, the secret scan, and the diff review.</p>
          </li>
          <li className="rounded-2xl border border-line bg-black/20 px-4 py-3">
            <p className="font-medium">Explain file</p>
            <p className="mt-1 text-sm leading-7 text-muted">Right-click a file and choose FlowPilot: Explain File. It prints the line count and the named exports.</p>
          </li>
        </ul>
        <p className="mt-4 text-sm leading-7 text-muted">
          The activity bar lists the other tools. The{" "}
          <Link href="/docs/commands" className="text-sky-100 underline-offset-4 hover:underline">
            command list
          </Link>{" "}
          describes each one.
        </p>
      </section>

      <Note>
        If the output says flowpilot is not available, the terminal command is missing. Follow the{" "}
        <Link href="/docs/install" className="text-sky-100 underline-offset-4 hover:underline">
          install guide
        </Link>
        , then run the check again. The extension does not install that command for you.
      </Note>
      <CodeBlock code={"flowpilot --version"} />
    </>
  );
}
