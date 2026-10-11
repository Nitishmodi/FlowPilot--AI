import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, FolderGit2, MonitorSmartphone } from "lucide-react";
import { DocHeader } from "@/components/docs-frame";

export const metadata: Metadata = { title: "Docs" };

const paths = [
  {
    href: "/docs/install",
    icon: BookOpen,
    title: "Install",
    text: "Add the terminal command, then install the VS Code extension from the downloaded file.",
  },
  {
    href: "/docs/usage",
    icon: FolderGit2,
    title: "Check a repository",
    text: "Run doctor, then pr-check, in the project you want to look at.",
  },
  {
    href: "/docs/editor",
    icon: MonitorSmartphone,
    title: "Use it in VS Code",
    text: "Install from the file, open a folder, then click Doctor and Pre-PR.",
  },
];

export default function DocsPage() {
  return (
    <>
      <DocHeader
        kicker="Docs"
        title="How FlowPilot is used."
        text="This site is the guide. The checks run in the repository folder on your machine, from the terminal or VS Code."
      />
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {paths.map((item) => (
          <Link key={item.href} href={item.href} className="doc-card block">
            <span className="tool-icon">
              <item.icon className="size-4" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-lg font-semibold">{item.title}</h2>
            <p className="mt-2 text-sm leading-7 text-muted">{item.text}</p>
          </Link>
        ))}
      </div>
      <section className="doc-card mt-8">
        <h2 className="text-xl font-semibold">What a result means</h2>
        <p className="mt-3 text-sm leading-7 text-muted">
          A passed check means that command finished without a failure. It does not mean the project is bug-free, secure, or ready to ship. A tool that cannot run is marked unavailable. A check turned off in <span className="font-mono text-sky-100">flowpilot.yml</span> is skipped, and a skip is not a pass.
        </p>
        <p className="mt-3 text-sm leading-7 text-muted">
          Format, lint, types, and tests use the scripts already in the repository. The review step looks at added lines for a debugger statement and <span className="font-mono text-sky-100">any</span>.
        </p>
      </section>
    </>
  );
}
