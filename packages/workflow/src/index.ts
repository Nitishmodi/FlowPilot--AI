import type { ToolResult, ToolStatus } from "@flowpilot/types";

export type WorkflowStep = { id: string; toolId: string; needs?: string[] };

export type WorkflowDefinition = {
  name: string;
  description: string;
  steps: WorkflowStep[];
};

export type WorkflowResult = {
  name: string;
  status: ToolStatus;
  startedAt: string;
  endedAt: string;
  durationMs: number;
  steps: ToolResult[];
  nextAction: string;
};

export const workflows: Record<string, WorkflowDefinition> = {
  check: {
    name: "check",
    description: "Format, lint, and typecheck.",
    steps: [
      { id: "fmt", toolId: "fmt" },
      { id: "lint", toolId: "lint" },
      { id: "types", toolId: "types" },
    ],
  },
  "pre-pr": {
    name: "pre-pr",
    description: "Checks to run before opening a pull request.",
    steps: [
      { id: "fmt", toolId: "fmt" },
      { id: "lint", toolId: "lint" },
      { id: "types", toolId: "types" },
      { id: "test", toolId: "test", needs: ["fmt", "lint", "types"] },
      { id: "secrets", toolId: "secrets", needs: ["test"] },
      { id: "review", toolId: "review", needs: ["test"] },
    ],
  },
};

export function overallStatus(steps: ToolResult[]): ToolStatus {
  if (steps.some((step) => step.status === "failed")) return "failed";
  if (steps.some((step) => step.status === "cancelled")) return "cancelled";
  if (steps.some((step) => step.status === "inconclusive")) return "inconclusive";
  if (steps.some((step) => step.status === "passed")) return "passed";
  return "inconclusive";
}

export function nextAction(steps: ToolResult[]): string {
  const failed = steps.find((step) => step.status === "failed");
  if (failed) return failed.suggestedActions[0] ?? `Resolve ${failed.toolId} before opening a pull request.`;
  if (!steps.some((step) => step.status === "passed")) return "No check ran. Enable a tool or add the missing script.";
  const unavailable = steps.filter((step) => step.status === "unavailable");
  if (unavailable.length) return `${unavailable.map((step) => step.toolId).join(", ")} did not run. The other checks passed.`;
  return "The configured checks passed.";
}

export async function runWorkflow(input: {
  definition: WorkflowDefinition;
  timeoutMs: number;
  runStep: (toolId: string) => Promise<ToolResult>;
}): Promise<WorkflowResult> {
  const started = Date.now();
  const pending = [...input.definition.steps];
  const done = new Map<string, ToolResult>();
  while (pending.length) {
    const ready = pending.filter((step) => (step.needs ?? []).every((need) => done.has(need)));
    if (!ready.length) throw new Error(`Workflow ${input.definition.name} has a step cycle.`);
    const batch = ready.slice(0, 4);
    const results = await Promise.all(batch.map(async (step) => [step.id, await input.runStep(step.toolId)] as const));
    for (const [id, result] of results) done.set(id, result);
    for (const step of batch) {
      const index = pending.findIndex((item) => item.id === step.id);
      if (index >= 0) pending.splice(index, 1);
    }
  }
  const steps = input.definition.steps.map((step) => done.get(step.id)).filter((step): step is ToolResult => Boolean(step));
  const status = overallStatus(steps);
  return {
    name: input.definition.name,
    status,
    startedAt: new Date(started).toISOString(),
    endedAt: new Date().toISOString(),
    durationMs: Date.now() - started,
    steps,
    nextAction: nextAction(steps),
  };
}
