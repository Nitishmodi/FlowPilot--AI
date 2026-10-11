export type ToolStatus = "passed" | "failed" | "skipped" | "unavailable" | "inconclusive" | "cancelled";

export type Severity = "info" | "warning" | "error";

export type Finding = {
  severity: Severity;
  confidence: "low" | "medium" | "high";
  message: string;
  path?: string;
  line?: number;
  evidence?: string;
};

export type ToolResult = {
  toolId: string;
  status: ToolStatus;
  summary: string;
  findings: Finding[];
  evidence: string[];
  changedFiles: string[];
  durationMs: number;
  exitCode: number;
  logs: string;
  suggestedActions: string[];
};

export type CatalogEntry = {
  id: string;
  name: string;
  category: string;
  description: string;
  implemented: boolean;
};

export const CATALOG: CatalogEntry[] = [
  { id: "doctor", name: "Doctor", category: "Diagnostics", description: "Check the local environment and which tools can run.", implemented: true },
  { id: "status", name: "Status", category: "Repository", description: "Show the branch, base, and working tree.", implemented: true },
  { id: "map", name: "Map", category: "Repository", description: "List the repository shape from the files that are actually there.", implemented: true },
  { id: "diff", name: "Diff", category: "Git", description: "Summarize the current change against the base branch.", implemented: true },
  { id: "fmt", name: "Format", category: "Quality", description: "Run the project's format check when one is configured.", implemented: true },
  { id: "lint", name: "Lint", category: "Quality", description: "Run the project's lint script when one exists.", implemented: true },
  { id: "types", name: "Types", category: "Quality", description: "Run the TypeScript compiler when a tsconfig is present.", implemented: true },
  { id: "test", name: "Test", category: "Quality", description: "Run the project's test script when one exists.", implemented: true },
  { id: "secrets", name: "Secrets", category: "Pull request", description: "Scan changed lines for likely credentials.", implemented: true },
  { id: "review", name: "Review", category: "Pull request", description: "Notes on added lines in the diff.", implemented: true },
  { id: "explain", name: "Explain", category: "Repository", description: "Describe a file from its exports.", implemented: true },
  { id: "deadcode", name: "Dead code", category: "Repository", description: "Find named exports no other scanned file mentions.", implemented: true },
  { id: "deps-audit", name: "Dependency audit", category: "Pull request", description: "Run the package manager's own audit.", implemented: true },
  { id: "pr", name: "Pull request", category: "Git", description: "Draft a pull request. Creation waits for --create.", implemented: true },
  { id: "ci", name: "CI", category: "Diagnostics", description: "List recent GitHub workflow runs when gh is signed in.", implemented: true },
  { id: "debug", name: "Debug", category: "Diagnostics", description: "Read the last saved report and name the failed step.", implemented: true },
];

export function finish(input: Omit<ToolResult, "findings" | "evidence" | "changedFiles" | "logs" | "suggestedActions" | "exitCode" | "durationMs"> & Partial<ToolResult>): ToolResult {
  const status = input.status;
  const exitCode = input.exitCode ?? (status === "failed" ? 1 : 0);
  return {
    findings: [],
    evidence: [],
    changedFiles: [],
    logs: "",
    suggestedActions: [],
    durationMs: 0,
    ...input,
    exitCode,
  };
}
