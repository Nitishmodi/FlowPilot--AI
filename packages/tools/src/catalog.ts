import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { runProcess } from "@flowpilot/exec";
import { finish, type Finding, type ToolResult } from "@flowpilot/types";
import { packageManager, readPackage, type ToolContext } from "./context";

const SKIP = new Set(["node_modules", ".git", "dist", "build", ".next", "coverage", ".flowpilot", ".flowpilot-tests"]);
const SOURCE = /\.(?:tsx?|jsx?|mjs|cjs)$/;

function contained(root: string, target: string): string | null {
  const resolved = path.resolve(root, target);
  const relative = path.relative(root, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return null;
  return resolved;
}

function exportsIn(source: string): string[] {
  const names = new Set<string>();
  for (const match of source.matchAll(/export\s+(?:async\s+)?(?:function|class|const|let|var|type|interface|enum)\s+([A-Za-z_$][\w$]*)/g)) {
    if (match[1]) names.add(match[1]);
  }
  for (const match of source.matchAll(/export\s*\{([^}]+)\}/g)) {
    for (const part of (match[1] ?? "").split(",")) {
      const piece = part.trim();
      if (!piece) continue;
      const alias = piece.split(/\s+as\s+/);
      names.add((alias[1] ?? alias[0] ?? "").trim());
    }
  }
  names.delete("");
  return [...names];
}

async function sourceFiles(root: string): Promise<string[]> {
  const found: string[] = [];
  async function walk(dir: string, depth: number) {
    if (depth > 6 || found.length >= 250) return;
    const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      if (found.length >= 250 || SKIP.has(entry.name) || entry.name.endsWith(".d.ts")) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(full, depth + 1);
      else if (SOURCE.test(entry.name)) found.push(full);
    }
  }
  await walk(root, 0);
  return found;
}

export async function explainTool(ctx: ToolContext): Promise<ToolResult> {
  const started = Date.now();
  const root = ctx.repo?.root ?? ctx.cwd;
  const requested = ctx.args?.[0];
  if (!requested) {
    const files = ctx.repo?.changedFiles ?? [];
    return finish({
      toolId: "explain",
      status: files.length ? "passed" : "inconclusive",
      summary: files.length
        ? `${files.length} changed file${files.length === 1 ? "" : "s"}. Pass a path to explain one file.`
        : "Nothing differs from the base branch. Pass a path to explain a file.",
      changedFiles: files,
      evidence: files,
      durationMs: Date.now() - started,
    });
  }
  const file = contained(root, requested);
  if (!file) {
    return finish({ toolId: "explain", status: "unavailable", summary: "That path is outside this repository.", durationMs: Date.now() - started });
  }
  let text = "";
  try {
    const info = await stat(file);
    if (!info.isFile() || info.size > 200_000) {
      return finish({ toolId: "explain", status: "unavailable", summary: "Explain reads a single source file under 200KB.", durationMs: Date.now() - started });
    }
    text = await readFile(file, "utf8");
  } catch {
    return finish({ toolId: "explain", status: "unavailable", summary: `${requested} is not a file in this repository.`, durationMs: Date.now() - started });
  }
  const relative = path.relative(root, file);
  const names = exportsIn(text);
  const lines = text.split("\n").length;
  return finish({
    toolId: "explain",
    status: "passed",
    summary: `${relative}: ${lines} lines, ${names.length} named export${names.length === 1 ? "" : "s"}.`,
    evidence: names.length ? names : ["No named exports."],
    durationMs: Date.now() - started,
    suggestedActions: ["Pass another path to explain a different file."],
  });
}

export async function deadcodeTool(ctx: ToolContext): Promise<ToolResult> {
  const started = Date.now();
  const root = ctx.repo?.root ?? ctx.cwd;
  const files = await sourceFiles(root);
  if (!files.length) {
    return finish({ toolId: "deadcode", status: "unavailable", summary: "No JavaScript or TypeScript files were found to scan.", durationMs: Date.now() - started });
  }
  const texts = new Map<string, string>();
  for (const file of files) {
    const info = await stat(file).catch(() => null);
    if (!info || info.size > 120_000) continue;
    texts.set(file, await readFile(file, "utf8").catch(() => ""));
  }
  const findings: Finding[] = [];
  for (const [file, source] of texts) {
    for (const name of exportsIn(source)) {
      const needle = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const used = [...texts.entries()].some(([other, text]) => other !== file && new RegExp(`\\b${needle}\\b`).test(text));
      if (!used) {
        findings.push({
          severity: "warning",
          confidence: "low",
          message: `${name} is exported and no other scanned file mentions it.`,
          path: path.relative(root, file),
          evidence: name,
        });
      }
    }
  }
  const capped = findings.slice(0, 40);
  return finish({
    toolId: "deadcode",
    status: capped.length ? "inconclusive" : "passed",
    summary: capped.length
      ? `${capped.length} export${capped.length === 1 ? "" : "s"} look unused inside this repository. A public API can look unused.`
      : "Every named export is mentioned by another scanned file.",
    findings: capped,
    durationMs: Date.now() - started,
    suggestedActions: capped.length ? ["Confirm each export is unused before deleting it."] : [],
  });
}

export function summarizeAudit(stdout: string): { total: number | null; summary: string } {
  const start = stdout.indexOf("{");
  const end = stdout.lastIndexOf("}");
  if (start < 0 || end < start) return { total: null, summary: "The audit command did not return JSON." };
  try {
    const body = JSON.parse(stdout.slice(start, end + 1)) as { metadata?: { vulnerabilities?: Record<string, number> } };
    const counts = body.metadata?.vulnerabilities;
    if (!counts) return { total: null, summary: "The audit JSON had no vulnerability counts." };
    const total = typeof counts.total === "number"
      ? counts.total
      : ["info", "low", "moderate", "high", "critical"].reduce((sum, key) => sum + (counts[key] ?? 0), 0);
    return { total, summary: total ? `${total} advisories reported by the package manager.` : "The package manager reported no advisories." };
  } catch {
    return { total: null, summary: "The audit JSON could not be read." };
  }
}

export async function depsAuditTool(ctx: ToolContext): Promise<ToolResult> {
  const started = Date.now();
  const pkg = await readPackage(ctx.cwd);
  if (!pkg) return finish({ toolId: "deps-audit", status: "unavailable", summary: "No package.json was found.", durationMs: Date.now() - started });
  const manager = await packageManager(ctx.cwd);
  const args = manager === "yarn" ? ["npm", "audit", "--json"] : ["audit", "--json"];
  const ran = await runProcess(manager, args, { cwd: ctx.cwd, timeoutMs: ctx.timeoutMs, signal: ctx.signal });
  if (ran.code === 127) {
    return finish({ toolId: "deps-audit", status: "unavailable", summary: `${manager} is not available to audit dependencies.`, durationMs: Date.now() - started });
  }
  const parsed = summarizeAudit(ran.stdout);
  const logs = [ran.stdout, ran.stderr].filter(Boolean).join("\n").slice(-4000);
  if (parsed.total === null) {
    return finish({ toolId: "deps-audit", status: "inconclusive", summary: parsed.summary, logs, durationMs: Date.now() - started, exitCode: ran.code });
  }
  return finish({
    toolId: "deps-audit",
    status: parsed.total > 0 ? "failed" : "passed",
    summary: parsed.summary,
    logs,
    durationMs: Date.now() - started,
    exitCode: parsed.total > 0 ? 1 : 0,
    suggestedActions: parsed.total > 0 ? [`Review the ${manager} audit output before upgrading anything.`] : [],
  });
}

type CiRun = { name?: string; conclusion?: string | null; status?: string; headBranch?: string; url?: string; displayTitle?: string };

export function summarizeRuns(runs: CiRun[]): { status: ToolResult["status"]; summary: string; findings: Finding[]; evidence: string[] } {
  if (!runs.length) {
    return { status: "inconclusive", summary: "GitHub returned no workflow runs for this repository.", findings: [], evidence: [] };
  }
  const failed = runs.filter((run) => run.conclusion === "failure");
  const latest = runs[0];
  if (!failed.length) {
    return {
      status: "passed",
      summary: `The latest listed run ${latest?.conclusion === "success" ? "succeeded" : `is ${latest?.status ?? "listed"}`}.`,
      findings: [],
      evidence: runs.slice(0, 5).map((run) => `${run.name ?? "run"} · ${run.conclusion ?? run.status ?? "unknown"}`),
    };
  }
  return {
    status: "failed",
    summary: `${failed.length} listed workflow run${failed.length === 1 ? "" : "s"} failed.`,
    findings: failed.slice(0, 8).map((run) => ({
      severity: "error" as const,
      confidence: "high" as const,
      message: run.displayTitle || run.name || "A workflow run failed.",
      evidence: [run.headBranch, run.url].filter(Boolean).join(" "),
    })),
    evidence: failed.slice(0, 8).map((run) => run.url || run.name || "failed run"),
  };
}

export async function ciTool(ctx: ToolContext): Promise<ToolResult> {
  const started = Date.now();
  if (!ctx.repo) return finish({ toolId: "ci", status: "unavailable", summary: "This folder is not a Git repository.", durationMs: Date.now() - started });
  const ran = await runProcess(
    "gh",
    ["run", "list", "--limit", "10", "--json", "name,conclusion,status,headBranch,url,displayTitle"],
    { cwd: ctx.cwd, timeoutMs: ctx.timeoutMs, signal: ctx.signal },
  );
  if (ran.code === 127) {
    return finish({ toolId: "ci", status: "unavailable", summary: "The GitHub CLI is not installed, so workflow runs cannot be listed.", durationMs: Date.now() - started });
  }
  if (ran.code !== 0) {
    return finish({
      toolId: "ci",
      status: "unavailable",
      summary: "GitHub did not return workflow runs. Check that gh is signed in and this repo has a GitHub remote.",
      logs: ran.stderr.slice(-1500),
      durationMs: Date.now() - started,
      exitCode: ran.code,
    });
  }
  let runs: CiRun[] = [];
  try {
    const parsed = JSON.parse(ran.stdout) as unknown;
    runs = Array.isArray(parsed) ? parsed as CiRun[] : [];
  } catch {
    return finish({ toolId: "ci", status: "inconclusive", summary: "The GitHub CLI output was not a run list.", durationMs: Date.now() - started });
  }
  const report = summarizeRuns(runs);
  return finish({ toolId: "ci", ...report, durationMs: Date.now() - started, suggestedActions: report.status === "failed" ? ["Open the failed run URL and compare it with the local check."] : [] });
}

export function pullRequestDraft(branch: string, base: string, files: string[]): { title: string; body: string } {
  const title = branch && branch !== "HEAD" ? branch.replaceAll("-", " ") : "Update";
  const lines = files.length ? files.map((file) => `- ${file}`) : ["- No files differ from the base branch."];
  const body = [`## Summary`, ...lines, "", `Base: ${base}`, `Head: ${branch || "HEAD"}`, "", "## Test checklist", "- [ ] flowpilot pr-check"].join("\n");
  return { title, body };
}

export async function prTool(ctx: ToolContext): Promise<ToolResult> {
  const started = Date.now();
  if (!ctx.repo) return finish({ toolId: "pr", status: "unavailable", summary: "This folder is not a Git repository.", durationMs: Date.now() - started });
  const draft = pullRequestDraft(ctx.repo.branch, ctx.repo.base, ctx.repo.changedFiles);
  if (ctx.args?.includes("--create")) {
    if (!ctx.config.permissions.allowPullRequestCreation) {
      return finish({
        toolId: "pr",
        status: "unavailable",
        summary: "Draft is ready. Set allowPullRequestCreation before --create. Nothing was opened.",
        evidence: [draft.title, draft.body],
        logs: draft.body,
        changedFiles: ctx.repo.changedFiles,
        durationMs: Date.now() - started,
      });
    }
    const ran = await runProcess(
      "gh",
      ["pr", "create", "--base", ctx.repo.base, "--head", ctx.repo.branch, "--title", draft.title, "--body", draft.body],
      { cwd: ctx.cwd, timeoutMs: ctx.timeoutMs, signal: ctx.signal },
    );
    const logs = [draft.body, ran.stdout, ran.stderr].filter(Boolean).join("\n").slice(-4000);
    if (ran.code !== 0) {
      return finish({
        toolId: "pr",
        status: "failed",
        summary: "GitHub did not create the pull request. The draft was not pushed.",
        logs,
        durationMs: Date.now() - started,
        exitCode: ran.code,
        suggestedActions: ["Push the branch yourself, then run flowpilot pr --create again."],
      });
    }
    return finish({
      toolId: "pr",
      status: "passed",
      summary: ran.stdout.trim() || "Pull request created.",
      logs,
      durationMs: Date.now() - started,
    });
  }
  return finish({
    toolId: "pr",
    status: ctx.repo.changedFiles.length ? "passed" : "inconclusive",
    summary: `Draft only. No pull request was created. Title: ${draft.title}`,
    evidence: [draft.title, draft.body],
    changedFiles: ctx.repo.changedFiles,
    logs: draft.body,
    durationMs: Date.now() - started,
    suggestedActions: ctx.config.permissions.allowPullRequestCreation
      ? ["Run flowpilot pr --create after you have read the draft."]
      : ["Pull request creation stays off until allowPullRequestCreation is true and you pass --create."],
  });
}

export async function debugTool(ctx: ToolContext): Promise<ToolResult> {
  const started = Date.now();
  const file = path.join(ctx.cwd, ".flowpilot", "last-report.json");
  let raw = "";
  try {
    raw = await readFile(file, "utf8");
  } catch {
    return finish({
      toolId: "debug",
      status: "inconclusive",
      summary: "No local report yet. Run flowpilot check or flowpilot pr-check first.",
      durationMs: Date.now() - started,
    });
  }
  let steps: { toolId?: string; status?: string; summary?: string }[] = [];
  try {
    const body = JSON.parse(raw) as { steps?: { toolId?: string; status?: string; summary?: string }[] };
    steps = Array.isArray(body.steps) ? body.steps : [];
  } catch {
    return finish({ toolId: "debug", status: "inconclusive", summary: "The last report could not be read.", durationMs: Date.now() - started });
  }
  const failed = steps.filter((step) => step.status === "failed");
  if (!failed.length) {
    return finish({
      toolId: "debug",
      status: "passed",
      summary: "The last saved report has no failed step.",
      evidence: steps.map((step) => `${step.toolId ?? "step"} ${step.status ?? ""}`.trim()),
      durationMs: Date.now() - started,
    });
  }
  return finish({
    toolId: "debug",
    status: "failed",
    summary: failed.map((step) => `${step.toolId}: ${step.summary ?? "failed"}`).join(" "),
    findings: failed.map((step) => ({ severity: "error", confidence: "high", message: step.summary || `${step.toolId ?? "step"} failed.` })),
    evidence: failed.map((step) => step.toolId ?? "step"),
    durationMs: Date.now() - started,
    suggestedActions: ["Re-run the failed command and read its log before changing unrelated files."],
  });
}
