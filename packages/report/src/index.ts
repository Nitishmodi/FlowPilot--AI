import type { ToolResult, ToolStatus } from "@flowpilot/types";
import type { WorkflowResult } from "@flowpilot/workflow";

const LABEL: Record<string, string> = {
  fmt: "Formatting",
  lint: "Lint",
  types: "Type checking",
  test: "Unit tests",
  secrets: "Secret scan",
  review: "Review",
  doctor: "Doctor",
  status: "Status",
  map: "Map",
  diff: "Diff",
};

function label(id: string): string {
  return (LABEL[id] ?? id).padEnd(16, " ");
}

function word(status: ToolStatus): string {
  if (status === "passed") return "PASS";
  if (status === "failed") return "FAIL";
  if (status === "skipped") return "SKIP";
  if (status === "cancelled") return "CANCELLED";
  if (status === "inconclusive") return "INCONCLUSIVE";
  return "UNAVAILABLE";
}

export function formatTool(result: ToolResult): string {
  const lines = [`${label(result.toolId)} ${word(result.status)}`, result.summary];
  for (const finding of result.findings) {
    const where = finding.path ? ` ${finding.path}${finding.line ? `:${finding.line}` : ""}` : "";
    lines.push(`- ${finding.message}${where}`);
  }
  return lines.join("\n");
}

export function formatWorkflow(result: WorkflowResult): string {
  const title = result.name === "pre-pr" ? "FlowPilot Pre-PR Report" : `FlowPilot ${result.name}`;
  const rows = result.steps.map((step) => `${label(step.toolId)} ${word(step.status)}`);
  const headline = result.status === "passed" ? "READY" : "NOT READY";
  return [title, "", ...rows, "", `Result: ${headline}`, "", "Next action:", result.nextAction].join("\n");
}
