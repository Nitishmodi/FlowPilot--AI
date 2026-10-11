import path from "node:path";
import { runProcess } from "@flowpilot/exec";
import { finish, type ToolResult } from "@flowpilot/types";
import { exists, packageManager, readPackage, type ToolContext } from "./context";

export async function runScript(ctx: ToolContext, toolId: string, scriptNames: string[], missing: string): Promise<ToolResult> {
  const started = Date.now();
  const pkg = await readPackage(ctx.cwd);
  const script = scriptNames.find((name) => pkg?.scripts?.[name]);
  if (!pkg || !script) {
    return finish({
      toolId,
      status: "unavailable",
      summary: missing,
      durationMs: Date.now() - started,
      suggestedActions: ["Add the script to package.json when you want this check."],
    });
  }
  const manager = await packageManager(ctx.cwd);
  const args = manager === "yarn" ? [script] : ["run", script];
  const ran = await runProcess(manager, args, { cwd: ctx.cwd, timeoutMs: ctx.timeoutMs, signal: ctx.signal });
  const logs = [ran.stdout, ran.stderr].filter(Boolean).join("\n").slice(-4000);
  if (ran.cancelled) {
    return finish({ toolId, status: "cancelled", summary: `${script} was cancelled.`, logs, durationMs: Date.now() - started, exitCode: 130 });
  }
  if (ran.timedOut) {
    return finish({
      toolId,
      status: "failed",
      summary: `${script} timed out.`,
      logs,
      durationMs: Date.now() - started,
      exitCode: 124,
      suggestedActions: ["Raise execution.timeoutSeconds or narrow the script."],
    });
  }
  if (ran.code === 127) {
    return finish({
      toolId,
      status: "unavailable",
      summary: `${manager} is not installed, so ${script} did not run.`,
      logs,
      durationMs: Date.now() - started,
      exitCode: 127,
    });
  }
  return finish({
    toolId,
    status: ran.code === 0 ? "passed" : "failed",
    summary: ran.code === 0 ? `${script} passed.` : `${script} failed.`,
    logs,
    evidence: logs ? [`${manager} run ${script}`] : [],
    durationMs: Date.now() - started,
    exitCode: ran.code,
    suggestedActions: ran.code === 0 ? [] : [`Run ${manager} run ${script} in ${path.basename(ctx.cwd)} and fix the output above.`],
  });
}

export async function hasTypeScript(cwd: string): Promise<boolean> {
  return exists(path.join(cwd, "tsconfig.json"));
}
