import { runProcess } from "@flowpilot/exec";
import { addedLines } from "@flowpilot/git";
import { finish, type Finding, type ToolResult } from "@flowpilot/types";
import { listTree, packageManager, readPackage, type ToolContext } from "./context";
import { ciTool, deadcodeTool, debugTool, depsAuditTool, explainTool, prTool } from "./catalog";
import { hasTypeScript, runScript } from "./script";

export type Tool = {
  id: string;
  run: (ctx: ToolContext) => Promise<ToolResult>;
};

const SECRET = [
  { name: "GitHub token", pattern: /\bghp_[A-Za-z0-9]{20,}\b/ },
  { name: "AWS access key", pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: "Private key", pattern: /-----BEGIN (?:RSA |OPENSSH )?PRIVATE KEY-----/ },
  { name: "Stripe live key", pattern: /\bsk_live_[A-Za-z0-9]{8,}\b/ },
];

function mask(value: string): string {
  const match = value.match(/\b(?:ghp_[A-Za-z0-9]+|AKIA[0-9A-Z]+|sk_live_[A-Za-z0-9]+)\b/);
  if (!match) return "a private key block";
  return `${match[0].slice(0, 4)}…`;
}

async function typesTool(ctx: ToolContext): Promise<ToolResult> {
  const started = Date.now();
  if (!(await hasTypeScript(ctx.cwd))) {
    return finish({
      toolId: "types",
      status: "unavailable",
      summary: "No tsconfig.json was found.",
      durationMs: Date.now() - started,
    });
  }
  const pkg = await readPackage(ctx.cwd);
  const declared = Boolean(pkg?.devDependencies?.typescript || pkg?.dependencies?.typescript || pkg?.scripts?.typecheck);
  if (pkg?.scripts?.typecheck) return runScript(ctx, "types", ["typecheck"], "No typecheck script.");
  if (!declared) {
    return finish({
      toolId: "types",
      status: "unavailable",
      summary: "tsconfig.json exists, and TypeScript is not listed as a dependency.",
      durationMs: Date.now() - started,
      suggestedActions: ["Add a typecheck script when you want this check."],
    });
  }
  const pm = await packageManager(ctx.cwd);
  const args = pm === "yarn" ? ["tsc", "--noEmit"] : ["exec", "tsc", "--noEmit"];
  const ran = await runProcess(pm, args, { cwd: ctx.cwd, timeoutMs: ctx.timeoutMs, signal: ctx.signal });
  const logs = [ran.stdout, ran.stderr].filter(Boolean).join("\n").slice(-4000);
  return finish({
    toolId: "types",
    status: ran.code === 0 ? "passed" : "failed",
    summary: ran.code === 0 ? "Typecheck passed." : "Typecheck failed.",
    logs,
    durationMs: Date.now() - started,
    exitCode: ran.code,
    suggestedActions: ran.code === 0 ? [] : ["Fix the TypeScript errors, then run the check again."],
  });
}

function reviewTool(ctx: ToolContext): ToolResult {
  if (!ctx.repo) {
    return finish({ toolId: "review", status: "unavailable", summary: "This folder is not a Git repository." });
  }
  const findings: Finding[] = [];
  for (const line of addedLines(ctx.repo.diff)) {
    if (/\bdebugger\b/.test(line.text)) {
      findings.push({ severity: "error", confidence: "high", message: "A debugger statement was added.", path: line.path, line: line.line, evidence: "debugger" });
    }
    if (/:\s*any\b|as any\b/.test(line.text)) {
      findings.push({ severity: "warning", confidence: "high", message: "This line widens a value to any.", path: line.path, line: line.line, evidence: line.text.trim().slice(0, 120) });
    }
  }
  const errors = findings.filter((item) => item.severity === "error");
  return finish({
    toolId: "review",
    status: errors.length ? "failed" : "passed",
    summary: findings.length
      ? `${findings.length} note${findings.length === 1 ? "" : "s"} on the diff.`
      : "No issues in the changed lines.",
    findings,
    changedFiles: ctx.repo.changedFiles,
    suggestedActions: errors.length ? ["Remove the debugger statement before opening a pull request."] : [],
  });
}

function secretsTool(ctx: ToolContext): ToolResult {
  if (!ctx.repo) {
    return finish({ toolId: "secrets", status: "unavailable", summary: "This folder is not a Git repository." });
  }
  const findings: Finding[] = [];
  for (const line of addedLines(ctx.repo.diff)) {
    if (line.path.includes("node_modules") || line.path.endsWith(".example")) continue;
    for (const rule of SECRET) {
      if (rule.pattern.test(line.text)) {
        findings.push({
          severity: "error",
          confidence: "high",
          message: `Possible ${rule.name} in the change.`,
          path: line.path,
          line: line.line,
          evidence: mask(line.text),
        });
      }
    }
  }
  return finish({
    toolId: "secrets",
    status: findings.length ? "failed" : "passed",
    summary: findings.length ? `${findings.length} possible secret${findings.length === 1 ? "" : "s"} in the diff.` : "No likely secrets in the changed lines.",
    findings,
    changedFiles: ctx.repo.changedFiles,
    suggestedActions: findings.length ? ["Remove the credential from the change and rotate it if it has been shared."] : [],
  });
}

export const tools: Tool[] = [
  {
    id: "doctor",
    run: async (ctx) => {
      const pkg = await readPackage(ctx.cwd);
      const notes = [
        `Node ${process.version}`,
        ctx.repo ? `Git branch ${ctx.repo.branch}` : "Not a Git repository",
        pkg ? `package.json scripts: ${Object.keys(pkg.scripts ?? {}).join(", ") || "none"}` : "No package.json",
      ];
      return finish({ toolId: "doctor", status: "passed", summary: notes[0] ?? "Environment checked.", evidence: notes });
    },
  },
  {
    id: "status",
    run: async (ctx) => {
      if (!ctx.repo) return finish({ toolId: "status", status: "unavailable", summary: "This folder is not a Git repository." });
      return finish({
        toolId: "status",
        status: "passed",
        summary: `${ctx.repo.branch} against ${ctx.repo.base}${ctx.repo.dirty ? ", with uncommitted changes" : ""}`,
        changedFiles: ctx.repo.changedFiles,
        evidence: ctx.repo.changedFiles,
      });
    },
  },
  {
    id: "map",
    run: async (ctx) => {
      const entries = await listTree(ctx.cwd);
      return finish({
        toolId: "map",
        status: "passed",
        summary: `${entries.length} paths near the repository root.`,
        evidence: entries,
      });
    },
  },
  {
    id: "diff",
    run: async (ctx) => {
      if (!ctx.repo) return finish({ toolId: "diff", status: "unavailable", summary: "This folder is not a Git repository." });
      const count = ctx.repo.changedFiles.length;
      return finish({
        toolId: "diff",
        status: "passed",
        summary: count ? `${count} file${count === 1 ? "" : "s"} differ from ${ctx.repo.base}.` : `No changes against ${ctx.repo.base}.`,
        changedFiles: ctx.repo.changedFiles,
        evidence: ctx.repo.changedFiles,
      });
    },
  },
  { id: "fmt", run: (ctx) => runScript(ctx, "fmt", ["format", "fmt"], "No format or fmt script was found.") },
  { id: "lint", run: (ctx) => runScript(ctx, "lint", ["lint"], "No lint script was found.") },
  { id: "types", run: typesTool },
  { id: "test", run: (ctx) => runScript(ctx, "test", ["test"], "No test script was found.") },
  { id: "secrets", run: async (ctx) => secretsTool(ctx) },
  { id: "review", run: async (ctx) => reviewTool(ctx) },
  { id: "explain", run: explainTool },
  { id: "deadcode", run: deadcodeTool },
  { id: "deps-audit", run: depsAuditTool },
  { id: "ci", run: ciTool },
  { id: "pr", run: prTool },
  { id: "debug", run: debugTool },
];

export function toolById(id: string): Tool | undefined {
  return tools.find((tool) => tool.id === id);
}

export function enabled(id: string, checks: ToolContext["config"]["checks"]): boolean {
  if (id === "fmt") return checks.format;
  if (id === "lint") return checks.lint;
  if (id === "types") return checks.types;
  if (id === "test") return checks.tests;
  if (id === "secrets") return checks.secrets;
  return true;
}

export function disabledResult(id: string): ToolResult {
  return finish({ toolId: id, status: "skipped", summary: `${id} is turned off in flowpilot.yml.`, durationMs: 0 });
}
