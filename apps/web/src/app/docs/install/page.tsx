import type { Metadata } from "next";
import Link from "next/link";
import { CodeBlock } from "@/components/code-block";
import { DocHeader, Note } from "@/components/docs-frame";

export const metadata: Metadata = { title: "Install" };

export default function InstallPage() {
  return (
    <>
      <DocHeader
        kicker="Install"
        title="Install FlowPilot in two parts."
        text="The terminal command and the VS Code extension are installed separately. Do both. You need Node 20 or newer, Git, and VS Code."
      />

      <section className="doc-card mt-10">
        <p className="font-mono text-xs text-violet-200">01</p>
        <h2 className="mt-2 text-xl font-semibold">Add flowpilot to your PATH</h2>
        <p className="mt-2 text-sm leading-7 text-muted">Open a terminal in the FlowPilot folder. This installs dependencies, then links the command next to Node so every folder on this machine can run it.</p>
        <CodeBlock
          title="shell"
          code={`pnpm install
chmod +x apps/cli/bin/flowpilot.js
ln -sfn "$(pwd)/apps/cli/bin/flowpilot.js" "$(dirname "$(command -v node)")/flowpilot"
flowpilot --version`}
        />
        <Note>You should see 0.1.0. If the terminal says command not found, open a new terminal and run flowpilot --version again.</Note>
      </section>

      <section className="doc-card mt-5">
        <p className="font-mono text-xs text-violet-200">02</p>
        <h2 className="mt-2 text-xl font-semibold">Install the VS Code extension</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-7 text-muted">
          <li>Download the file below.</li>
          <li>Open VS Code.</li>
          <li>Open the Extensions view.</li>
          <li>Open the <span className="font-mono text-sky-100">...</span> menu at the top of that view.</li>
          <li>Choose Install from VSIX and select the downloaded file.</li>
          <li>Reload the window when VS Code asks.</li>
          <li>Open Extensions again and look under Installed for FlowPilot AI.</li>
        </ol>
        <p className="mt-4">
          <a href="/flowpilot-ai-0.1.0.vsix" download className="btn btn-primary">
            Download FlowPilot AI
          </a>
        </p>
        <Note>A Marketplace search will not find it. It only appears under Installed, after the file is installed.</Note>
        <h3 className="mt-6 text-lg font-semibold">Or install that file from the terminal</h3>
        <p className="mt-2 text-sm leading-7 text-muted">Download the file first. Then run this from any folder. Reload VS Code and look under Installed.</p>
        <CodeBlock title="shell" code={"code --install-extension ~/Downloads/flowpilot-ai-0.1.0.vsix"} />
      </section>

      <section className="doc-card mt-5">
        <p className="font-mono text-xs text-violet-200">03</p>
        <h2 className="mt-2 text-xl font-semibold">Use it</h2>
        <p className="mt-2 text-sm leading-7 text-muted">
          Open the project you want to check. In the terminal, start with doctor, then run the checks before a pull request. In VS Code, the{" "}
          <Link href="/docs/editor" className="text-sky-100 underline-offset-4 hover:underline">
            VS Code guide
          </Link>{" "}
          shows the same steps from the activity bar.
        </p>
        <CodeBlock title="shell" code={"cd /path/to/your-repo\nflowpilot doctor\nflowpilot pr-check"} />
      </section>
    </>
  );
}
