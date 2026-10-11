"use client";

import Link from "next/link";
import {
  Activity,
  Braces,
  Bug,
  Compass,
  FileSearch,
  FlaskConical,
  GitCompare,
  GitPullRequest,
  KeyRound,
  Layers,
  ListChecks,
  Map,
  PackageSearch,
  Paintbrush,
  Rocket,
  ScanEye,
  ScanSearch,
  Search,
  ShieldCheck,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import { CATALOG } from "@flowpilot/types";
import { STAGES } from "@/lib/toolbox";
import { useStage } from "./stage-live";

const stageIcons: Record<string, LucideIcon> = {
  onboard: Compass,
  understand: Layers,
  check: ShieldCheck,
  ship: Rocket,
  diagnose: Bug,
};

const toolIcons: Record<string, LucideIcon> = {
  doctor: Stethoscope,
  status: Activity,
  map: Map,
  diff: GitCompare,
  explain: FileSearch,
  deadcode: ScanSearch,
  fmt: Paintbrush,
  lint: ListChecks,
  types: Braces,
  test: FlaskConical,
  secrets: KeyRound,
  review: ScanEye,
  "deps-audit": PackageSearch,
  pr: GitPullRequest,
  ci: Bug,
  debug: Search,
};

export function Toolbox({ detail = false }: { detail?: boolean }) {
  const live = useStage();
  return (
    <ol className="space-y-6" onMouseEnter={() => live?.setPaused(true)} onMouseLeave={() => live?.setPaused(false)}>
      {STAGES.map((stage, stageIndex) => {
        const StageIcon = stageIcons[stage.id] ?? Compass;
        const selected = !detail && live?.active === stage.id;
        const dimmed = !detail && live && live.active !== stage.id;
        return (
          <li
            key={stage.id}
            id={detail ? undefined : stage.id}
            className={`stage rise${selected ? " stage-live" : ""}${dimmed ? " stage-dim" : ""}`}
            data-tone={stage.tone}
            style={{ animationDelay: `${stageIndex * 70}ms` }}
            onClick={() => live?.choose(stage.id)}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <span className="tool-icon tool-icon-lg">
                  <StageIcon className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-mono text-xs tracking-[0.18em] text-violet-200">{stage.index}</p>
                  <h3 className="mt-1 text-2xl font-semibold tracking-tight">{stage.name}</h3>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-muted">{stage.summary}</p>
                </div>
              </div>
            </div>
            <ul className={detail ? "mt-6 grid gap-3" : "mt-6 grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(16rem,1fr))]"}>
              {stage.tools.map((id, toolIndex) => {
                const entry = CATALOG.find((item) => item.id === id);
                if (!entry) return null;
                const Icon = toolIcons[id] ?? Activity;
                const inner = (
                  <>
                    <span className="tool-icon">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{entry.name}</span>
                        <span className={entry.implemented ? "badge badge-ready" : "badge"}>{entry.implemented ? "Ready" : "Not built"}</span>
                      </span>
                      {detail ? <span className="mt-1 block text-sm leading-6 text-muted">{entry.description}</span> : null}
                      <span className="mt-1 block font-mono text-xs text-violet-200/80">flowpilot {entry.id}</span>
                    </span>
                  </>
                );
                return (
                  <li key={id} id={detail ? entry.id : undefined} className="rise scroll-mt-28" style={{ animationDelay: `${stageIndex * 70 + toolIndex * 40}ms` }}>
                    {detail ? (
                      <div className="tool-tile">{inner}</div>
                    ) : (
                      <Link href={`/commands#${entry.id}`} className="tool-tile">
                        {inner}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </li>
        );
      })}
    </ol>
  );
}
