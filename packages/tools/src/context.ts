import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import type { FlowConfig } from "@flowpilot/config";
import type { RepoSnapshot } from "@flowpilot/git";

export type ToolContext = {
  cwd: string;
  config: FlowConfig;
  repo: RepoSnapshot | null;
  timeoutMs: number;
  signal?: AbortSignal;
  args?: string[];
};

export type PackageJson = {
  name?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

export async function readPackage(cwd: string): Promise<PackageJson | null> {
  try {
    return JSON.parse(await readFile(path.join(cwd, "package.json"), "utf8")) as PackageJson;
  } catch {
    return null;
  }
}

export async function exists(file: string): Promise<boolean> {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

export async function packageManager(cwd: string): Promise<"pnpm" | "yarn" | "npm"> {
  if (await exists(path.join(cwd, "pnpm-lock.yaml"))) return "pnpm";
  if (await exists(path.join(cwd, "yarn.lock"))) return "yarn";
  return "npm";
}

export async function listTree(cwd: string, depth = 2): Promise<string[]> {
  const found: string[] = [];
  async function walk(dir: string, level: number) {
    if (level > depth) return;
    const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      if (entry.name === "node_modules" || entry.name === ".git" || entry.name === ".next") continue;
      const relative = path.relative(cwd, path.join(dir, entry.name));
      found.push(entry.isDirectory() ? `${relative}/` : relative);
      if (entry.isDirectory()) await walk(path.join(dir, entry.name), level + 1);
    }
  }
  await walk(cwd, 1);
  return found.sort().slice(0, 80);
}
