import Link from "next/link";
import { GitBranch, Shield, Terminal } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { CycleControl, HomeHero, StageProvider } from "@/components/stage-live";
import { Toolbox } from "@/components/toolbox";

const surfaces: { icon: typeof Terminal; title: string; text: string; href?: string; link?: string }[] = [
  {
    icon: Terminal,
    title: "CLI",
    text: "Local checks stay on your machine. FlowPilot runs the format, lint, typecheck, and test scripts that already exist.",
  },
  {
    icon: GitBranch,
    title: "VS Code",
    text: "Install FlowPilot as a VS Code extension. It calls the same CLI in the folder you have open.",
    href: "/docs/editor",
    link: "Install the VS Code extension",
  },
  {
    icon: Shield,
    title: "Evidence",
    text: "A missing tool stays unavailable. A secret scan names the file and line, and the value itself stays masked.",
  },
];

export default function HomePage() {
  return (
    <PageShell>
      <StageProvider>
      <main>
        <HomeHero />

        <section id="toolbox" className="mx-auto max-w-7xl px-6 py-24 sm:py-32">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-3xl">
              <p className="kicker">Toolbox</p>
              <h2 className="mt-5 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">Tools for each stage of the cycle.</h2>
              <p className="mt-4 text-lg leading-8 text-muted">
                The highlight walks the cycle on its own. Choose a stage to hold it. Every command on these cards runs locally.
              </p>
            </div>
            <CycleControl />
          </div>
          <div className="mt-12">
            <Toolbox />
          </div>
          <Link href="/commands" className="btn btn-ghost mt-8">
            Open the command list
          </Link>
        </section>

        <section className="mx-auto grid max-w-7xl gap-5 px-6 py-8 md:grid-cols-3 md:py-16">
          {surfaces.map((item) => (
            <article key={item.title} className="surface">
              <span className="tool-icon tool-icon-lg">
                <item.icon className="size-5" aria-hidden="true" />
              </span>
              <h2 className="mt-5 text-xl font-semibold">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-muted">{item.text}</p>
              {item.href ? (
                <Link href={item.href} className="btn btn-ghost mt-5">
                  {item.link}
                </Link>
              ) : null}
            </article>
          ))}
        </section>

        <section id="install" className="mx-auto max-w-7xl px-6 py-24">
          <div className="surface grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="kicker">Install</p>
              <h2 className="mt-5 text-4xl font-semibold tracking-tight">Run it on a repository.</h2>
              <p className="mt-4 text-lg leading-8 text-muted">Initialize the folder you already have. The install guide shows how to put the command on your PATH.</p>
              <Link href="/docs/install" className="btn btn-ghost mt-6">
                Read the install guide
              </Link>
            </div>
            <pre className="code-well">{`cd your-repo
flowpilot init
flowpilot doctor
flowpilot pr-check`}</pre>
          </div>
        </section>

        <section id="security" className="mx-auto max-w-7xl px-6 pb-28">
          <div className="surface">
            <p className="kicker">Privacy</p>
            <h2 className="mt-5 text-4xl font-semibold tracking-tight">Source stays on your machine.</h2>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-muted">
              Checks run in the cloned repository, from the terminal or VS Code. This site does not receive that source code.
            </p>
            <Link href="/privacy" className="btn btn-ghost mt-6">
              Read the privacy notes
            </Link>
          </div>
        </section>
      </main>
      </StageProvider>
    </PageShell>
  );
}
