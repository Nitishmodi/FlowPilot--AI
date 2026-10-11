import { execFile } from "node:child_process";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { defaultConfig } from "@flowpilot/config";
import { inspectRepo } from "@flowpilot/git";
import { pullRequestDraft, summarizeAudit, summarizeRuns } from "./catalog";
import { toolById } from "./registry";
import type { ToolContext } from "./context";

const git = promisify(execFile);

async function repo(): Promise<string> {
  const root = path.join(process.cwd(), ".flowpilot-tests");
  await mkdir(root, { recursive: true });
  const cwd = await mkdtemp(path.join(root, "repo-"));
  await git("git", ["init", "-b", "main"], { cwd });
  await git("git", ["config", "user.email", "dev@example.com"], { cwd });
  await git("git", ["config", "user.name", "FlowPilot"], { cwd });
  await writeFile(path.join(cwd, "package.json"), JSON.stringify({ name: "sample", scripts: { lint: "node lint.js" } }));
  await writeFile(path.join(cwd, "lint.js"), "process.exit(0)\n");
  await mkdir(path.join(cwd, "src"));
  await writeFile(path.join(cwd, "src", "app.ts"), "export const ready = true;\n");
  await git("git", ["add", "."], { cwd });
  await git("git", ["commit", "-m", "init"], { cwd });
  return cwd;
}

async function ctx(cwd: string): Promise<ToolContext> {
  return { cwd, config: defaultConfig("sample"), repo: await inspectRepo(cwd, "main"), timeoutMs: 15_000 };
}

describe("tools", () => {
  it("fails the secret scan when a token is added, and does not print the token", async () => {
    const cwd = await repo();
    await writeFile(path.join(cwd, "src", "app.ts"), "export const key = \"ghp_abcdefghijklmnopqrstuvwxyz123456\";\n");
    const result = await toolById("secrets")!.run(await ctx(cwd));
    expect(result.status).toBe("failed");
    expect(JSON.stringify(result)).not.toContain("ghp_abcdefghijklmnopqrstuvwxyz123456");
    expect(result.findings[0]?.path).toBe("src/app.ts");
  });

  it("runs the repository lint script", async () => {
    const cwd = await repo();
    const result = await toolById("lint")!.run(await ctx(cwd));
    expect(result.status).toBe("passed");
    expect(result.summary).toMatch(/lint passed/);
  });

  it("reports format as unavailable when the repository has no format script", async () => {
    const cwd = await repo();
    const result = await toolById("fmt")!.run(await ctx(cwd));
    expect(result.status).toBe("unavailable");
  });

  it("explains a file from its exports and refuses a path outside the repo", async () => {
    const cwd = await repo();
    const explained = await toolById("explain")!.run({ ...(await ctx(cwd)), args: ["src/app.ts"] });
    expect(explained.status).toBe("passed");
    expect(explained.summary).toMatch(/named export/);
    expect(explained.evidence).toContain("ready");
    const escaped = await toolById("explain")!.run({ ...(await ctx(cwd)), args: ["../secret.ts"] });
    expect(escaped.status).toBe("unavailable");
  });

  it("reports an export that no other file mentions", async () => {
    const cwd = await repo();
    await writeFile(path.join(cwd, "src", "used.ts"), "export function used() { return 1; }\n");
    await writeFile(path.join(cwd, "src", "app.ts"), "import { used } from \"./used\";\nexport const ready = used();\n");
    await writeFile(path.join(cwd, "src", "lonely.ts"), "export function lonely() { return 0; }\n");
    const result = await toolById("deadcode")!.run(await ctx(cwd));
    expect(result.status).toBe("inconclusive");
    expect(result.findings.some((item) => item.evidence === "lonely")).toBe(true);
    expect(result.findings.some((item) => item.evidence === "used")).toBe(false);
  });

  it("drafts a pull request and does not create one", async () => {
    const cwd = await repo();
    await writeFile(path.join(cwd, "src", "app.ts"), "export const ready = false;\n");
    const result = await toolById("pr")!.run(await ctx(cwd));
    expect(result.summary).toMatch(/No pull request was created/);
    expect(result.logs).not.toMatch(/gh pr create/);
    expect(pullRequestDraft("fix-retry", "main", ["src/app.ts"]).body).toContain("Base: main");
  });

  it("reads advisory counts and failed workflow runs", () => {
    const audit = summarizeAudit(JSON.stringify({ metadata: { vulnerabilities: { high: 2, total: 2 } } }));
    expect(audit.total).toBe(2);
    const runs = summarizeRuns([{ name: "CI", conclusion: "failure", url: "https://example.test/run/1", displayTitle: "lint failed" }]);
    expect(runs.status).toBe("failed");
    expect(runs.findings[0]?.message).toBe("lint failed");
  });

  it("names the failed step from the last report", async () => {
    const cwd = await repo();
    await mkdir(path.join(cwd, ".flowpilot"));
    await writeFile(
      path.join(cwd, ".flowpilot", "last-report.json"),
      JSON.stringify({ steps: [{ toolId: "lint", status: "failed", summary: "lint failed." }] }),
    );
    const result = await toolById("debug")!.run(await ctx(cwd));
    expect(result.status).toBe("failed");
    expect(result.summary).toMatch(/lint failed/);
  });

  it("flags a debugger statement added in the diff", async () => {
    const cwd = await repo();
    await writeFile(path.join(cwd, "src", "app.ts"), "export function run() { debugger; }\n");
    const result = await toolById("review")!.run(await ctx(cwd));
    expect(result.status).toBe("failed");
    expect(result.summary).toMatch(/notes on the diff/);
  });
});
