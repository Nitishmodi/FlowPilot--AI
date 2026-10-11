import type { Metadata } from "next";
import { CodeBlock } from "@/components/code-block";
import { DocHeader } from "@/components/docs-frame";
import { COMMAND_GROUPS } from "@/lib/command-docs";

export const metadata: Metadata = { title: "Commands" };

export default function CommandsDocsPage() {
  return (
    <>
      <DocHeader
        kicker="Commands"
        title="Every command, and what it actually does."
        text="Run these in the cloned repository. Add --json on doctor, status, the check tools, explain, pr, check, and pr-check when you want the result object."
      />
      <div className="mt-10 space-y-12">
        {COMMAND_GROUPS.map((group) => (
          <section key={group.title}>
            <h2 className="text-2xl font-semibold tracking-tight">{group.title}</h2>
            <p className="mt-2 text-sm leading-7 text-muted">{group.text}</p>
            <div className="mt-4 grid gap-4">
              {group.items.map((item) => (
                <article key={item.id} id={item.id} className="doc-card scroll-mt-24">
                  <h3 className="text-lg font-semibold">{item.summary}</h3>
                  <p className="mt-2 text-sm leading-7 text-muted">{item.detail}</p>
                  <CodeBlock code={item.command} />
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
