import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { Command } from "commander";
import { CONFIG_FILE, defaultConfig, readConfig, writeConfig } from "@flowpilot/config";
import { inspectRepo } from "@flowpilot/git";
import { formatTool, formatWorkflow } from "@flowpilot/report";
import { disabledResult, enabled, toolById, type ToolContext } from "@flowpilot/tools";
import { CATALOG, finish } from "@flowpilot/types";
import { runWorkflow, workflows, type WorkflowDefinition, type WorkflowResult } from "@flowpilot/workflow";

const VERSION = "0.1.0";

async function context(cwd: string, args: string[] = []): Promise<ToolContext> {
  const config = await readConfig(cwd);
  const repo = await inspectRepo(cwd, config.project.defaultBaseBranch);
  return { cwd, config, repo, timeoutMs: config.execution.timeoutSeconds * 1000, args };
}

async function execute(cwd: string, toolId: string, args: string[] = []) {
  const ctx = await context(cwd, args);
  if (!enabled(toolId, ctx.config.checks)) return disabledResult(toolId);
  const tool = toolById(toolId);
  if (!tool) return finish({ toolId, status: "unavailable", summary: `${toolId} is not built yet.` });
  return tool.run(ctx);
}

function prePr(include: string[] | undefined): WorkflowDefinition {
  const base = workflows["pre-pr"];
  if (!base) throw new Error("Missing pre-pr workflow.");
  if (!include?.length) return base;
  const steps = include.map((id, index) => ({
    id,
    toolId: id,
    needs: index === 0 ? [] : [include[index - 1] ?? ""],
  }));
  return { ...base, steps };
}

async function runNamed(cwd: string, name: "check" | "pre-pr"): Promise<WorkflowResult> {
  const ctx = await context(cwd);
  const definition = name === "pre-pr" ? prePr(ctx.config.workflows["pre-pr"]?.include) : workflows.check;
  if (!definition) throw new Error(`Unknown workflow ${name}.`);
  const result = await runWorkflow({
    definition,
    timeoutMs: ctx.timeoutMs,
    runStep: async (toolId) => {
      if (!enabled(toolId, ctx.config.checks)) return disabledResult(toolId);
      const tool = toolById(toolId);
      if (!tool) return disabledResult(toolId);
      return tool.run(ctx);
    },
  });
  const dir = path.join(cwd, ".flowpilot");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "last-report.json"), JSON.stringify(result, null, 2));
  return result;
}

async function taskFile(cwd: string): Promise<string> {
  const dir = path.join(cwd, ".flowpilot");
  await mkdir(dir, { recursive: true });
  return path.join(dir, "task.json");
}

const program = new Command();
program.name("flowpilot").description("Your development checks, one command away.").version(VERSION);

program.command("init").option("--force", "Replace an existing flowpilot.yml").action(async (options: { force?: boolean }) => {
  const cwd = process.cwd();
  try {
    await readFile(path.join(cwd, CONFIG_FILE), "utf8");
    if (!options.force) {
      console.log(`${CONFIG_FILE} already exists. Re-run with --force to replace it.`);
      process.exitCode = 2;
      return;
    }
  } catch {
    /* create it */
  }
  await writeConfig(cwd, defaultConfig(path.basename(cwd)));
  console.log(`Wrote ${CONFIG_FILE}.`);
});

program.command("doctor").option("--json").action(async (options: { json?: boolean }) => {
  const result = await execute(process.cwd(), "doctor");
  console.log(options.json ? JSON.stringify(result, null, 2) : formatTool(result));
});

program.command("status").option("--json").action(async (options: { json?: boolean }) => {
  const result = await execute(process.cwd(), "status");
  console.log(options.json ? JSON.stringify(result, null, 2) : formatTool(result));
  if (result.status === "unavailable") process.exitCode = 2;
});

program.command("tools").action(() => {
  for (const entry of CATALOG) {
    console.log(`${entry.id.padEnd(12)} ${entry.implemented ? "ready" : "not built"}  ${entry.description}`);
  }
});

program.command("map").action(async () => {
  console.log(formatTool(await execute(process.cwd(), "map")));
});

program.command("diff").action(async () => {
  console.log(formatTool(await execute(process.cwd(), "diff")));
});

for (const id of ["fmt", "lint", "types", "test", "secrets", "review", "deadcode", "deps-audit", "ci", "debug"] as const) {
  program.command(id).option("--json").action(async (options: { json?: boolean }) => {
    const result = await execute(process.cwd(), id);
    console.log(options.json ? JSON.stringify(result, null, 2) : formatTool(result));
    if (result.status === "failed") process.exitCode = 1;
  });
}

program.command("explain").argument("[file]").option("--json").action(async (file: string | undefined, options: { json?: boolean }) => {
  const result = await execute(process.cwd(), "explain", file ? [file] : []);
  console.log(options.json ? JSON.stringify(result, null, 2) : formatTool(result));
  if (result.status === "failed") process.exitCode = 1;
});

program.command("pr").option("--create", "Create the pull request after the draft. Requires allowPullRequestCreation.").option("--json").action(async (options: { create?: boolean; json?: boolean }) => {
  const result = await execute(process.cwd(), "pr", options.create ? ["--create"] : []);
  console.log(options.json ? JSON.stringify(result, null, 2) : formatTool(result));
  if (result.status === "failed") process.exitCode = 1;
  if (result.status === "unavailable") process.exitCode = 2;
});

program.command("run").argument("<tool>").action(async (tool: string) => {
  const known = CATALOG.find((entry) => entry.id === tool);
  if (!known) {
    console.error(`Unknown tool ${tool}. Run flowpilot tools.`);
    process.exitCode = 2;
    return;
  }
  if (!known.implemented || !toolById(tool)) {
    console.error(`${tool} is not built yet.`);
    process.exitCode = 2;
    return;
  }
  const result = await execute(process.cwd(), tool);
  console.log(formatTool(result));
  if (result.status === "failed") process.exitCode = 1;
});

program.command("check").option("--json").action(async (options: { json?: boolean }) => {
  const result = await runNamed(process.cwd(), "check");
  console.log(options.json ? JSON.stringify(result, null, 2) : formatWorkflow(result));
  if (result.status === "failed") process.exitCode = 1;
});

program
  .command("pr-check")
  .option("--json")
  .option("--dry-run", "List the steps without running them")
  .action(async (options: { json?: boolean; dryRun?: boolean }) => {
    if (options.dryRun) {
      const ctx = await context(process.cwd());
      const definition = prePr(ctx.config.workflows["pre-pr"]?.include);
      console.log(definition.steps.map((step) => step.toolId).join("\n"));
      return;
    }
    const result = await runNamed(process.cwd(), "pre-pr");
    console.log(options.json ? JSON.stringify(result, null, 2) : formatWorkflow(result));
    if (result.status === "failed") process.exitCode = 1;
  });

program.command("report").action(async () => {
  try {
    const raw = await readFile(path.join(process.cwd(), ".flowpilot", "last-report.json"), "utf8");
    console.log(formatWorkflow(JSON.parse(raw) as WorkflowResult));
  } catch {
    console.error("No report yet. Run flowpilot check or flowpilot pr-check.");
    process.exitCode = 2;
  }
});

program.command("config").action(async () => {
  const config = await readConfig(process.cwd());
  console.log(JSON.stringify(config, null, 2));
});

const task = program.command("task").description("Save and restore what you were doing");

task.command("start").argument("<description>").action(async (description: string) => {
  const cwd = process.cwd();
  const ctx = await context(cwd);
  const body = {
    description,
    branch: ctx.repo?.branch ?? "",
    base: ctx.repo?.base ?? ctx.config.project.defaultBaseBranch,
    changedFiles: ctx.repo?.changedFiles ?? [],
    savedAt: new Date().toISOString(),
  };
  await writeFile(await taskFile(cwd), JSON.stringify(body, null, 2));
  console.log(`Saved “${description}” on ${body.branch || "this folder"}.`);
});

task.command("save").action(async () => {
  const cwd = process.cwd();
  const file = await taskFile(cwd);
  const current = JSON.parse(await readFile(file, "utf8").catch(() => "null")) as { description?: string } | null;
  if (!current?.description) {
    console.error("No task yet. Run flowpilot task start \"what you are doing\".");
    process.exitCode = 2;
    return;
  }
  const ctx = await context(cwd);
  const body = {
    description: current.description,
    branch: ctx.repo?.branch ?? "",
    base: ctx.repo?.base ?? "",
    changedFiles: ctx.repo?.changedFiles ?? [],
    savedAt: new Date().toISOString(),
  };
  await writeFile(file, JSON.stringify(body, null, 2));
  console.log(`Updated “${body.description}”. ${body.changedFiles.length} changed file${body.changedFiles.length === 1 ? "" : "s"}.`);
});

program.command("resume").action(async () => {
  const raw = await readFile(path.join(process.cwd(), ".flowpilot", "task.json"), "utf8").catch(() => "");
  if (!raw) {
    console.error("No saved task.");
    process.exitCode = 2;
    return;
  }
  const task = JSON.parse(raw) as { description: string; branch: string; changedFiles: string[]; savedAt: string };
  console.log([task.description, `Branch ${task.branch || "unknown"}`, `Saved ${task.savedAt}`, ...task.changedFiles].join("\n"));
});

program.command("handoff").action(async () => {
  const raw = await readFile(path.join(process.cwd(), ".flowpilot", "task.json"), "utf8").catch(() => "");
  if (!raw) {
    console.error("No saved task to hand off.");
    process.exitCode = 2;
    return;
  }
  const task = JSON.parse(raw) as { description: string; branch: string; changedFiles: string[] };
  console.log([`# ${task.description}`, "", `Branch: ${task.branch || "unknown"}`, "", "Changed files:", ...(task.changedFiles.length ? task.changedFiles.map((file) => `- ${file}`) : ["- none"])].join("\n"));
});

program.command("connect").argument("[repo]", "owner/name shown on the FlowPilot dashboard").action(async (repo?: string) => {
  const ctx = await context(process.cwd());
  if (!ctx.repo) {
    console.error("Run this inside the local clone, not on the website.");
    process.exitCode = 2;
    return;
  }
  const parts = repo?.split("/") ?? [];
  if (repo && parts.length !== 2) {
    console.error("Use owner/name, for example flowpilot connect octocat/hello.");
    process.exitCode = 2;
    return;
  }
  const [owner, name] = parts;
  const dir = path.join(ctx.cwd, ".flowpilot");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "link.json"), JSON.stringify({
    root: ctx.repo.root,
    branch: ctx.repo.branch,
    owner: owner ?? "",
    name: name ?? "",
    github: owner && name ? `https://github.com/${owner}/${name}` : "",
    linkedAt: new Date().toISOString(),
  }, null, 2));
  console.log(owner && name ? `Linked this clone to ${owner}/${name}.` : "Recorded this clone locally.");
  console.log("Next, in this same folder:");
  console.log("  flowpilot doctor");
  console.log("  flowpilot pr-check");
  console.log("The website cannot see this folder. Results stay on this machine.");
});

program.parseAsync(process.argv).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "FlowPilot failed.");
  process.exitCode = 1;
});
