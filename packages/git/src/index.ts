import { runProcess } from "@flowpilot/exec";

export type DiffLine = { path: string; line: number; text: string };

export type RepoSnapshot = {
  root: string;
  branch: string;
  base: string;
  dirty: boolean;
  changedFiles: string[];
  diff: string;
};

async function git(cwd: string, args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  const result = await runProcess("git", args, { cwd, timeoutMs: 20_000 });
  return { code: result.code, stdout: result.stdout.trim(), stderr: result.stderr.trim() };
}

export async function repoRoot(cwd: string): Promise<string | null> {
  const result = await git(cwd, ["rev-parse", "--show-toplevel"]);
  return result.code === 0 && result.stdout ? result.stdout : null;
}

export async function inspectRepo(cwd: string, base = "main"): Promise<RepoSnapshot | null> {
  const root = await repoRoot(cwd);
  if (!root) return null;
  const branch = await git(root, ["rev-parse", "--abbrev-ref", "HEAD"]);
  const status = await git(root, ["status", "--porcelain"]);
  let baseRef = base;
  const localBase = await git(root, ["rev-parse", "--verify", "--quiet", base]);
  if (localBase.code !== 0) {
    const origin = await git(root, ["rev-parse", "--verify", "--quiet", `origin/${base}`]);
    baseRef = origin.code === 0 ? `origin/${base}` : "HEAD";
  }
  const mergeBase = await git(root, ["merge-base", baseRef, "HEAD"]);
  const names = await git(root, ["diff", "--name-only", mergeBase.code === 0 ? mergeBase.stdout : "HEAD"]);
  const unstaged = await git(root, ["diff", "--name-only"]);
  const changed = [...new Set(`${names.stdout}\n${unstaged.stdout}`.split("\n").map((item) => item.trim()).filter(Boolean))];
  const diff = await git(root, ["diff", "--unified=1", mergeBase.code === 0 ? mergeBase.stdout : "HEAD"]);
  const unstagedDiff = await git(root, ["diff", "--unified=1"]);
  return {
    root,
    branch: branch.stdout || "HEAD",
    base,
    dirty: status.stdout.length > 0,
    changedFiles: changed,
    diff: [diff.stdout, unstagedDiff.stdout].filter(Boolean).join("\n"),
  };
}

export function addedLines(diff: string): DiffLine[] {
  const lines: DiffLine[] = [];
  let path = "";
  let nextLine = 0;
  for (const line of diff.split("\n")) {
    const file = line.match(/^\+\+\+ b\/(.+)$/);
    if (file?.[1]) {
      path = file[1];
      continue;
    }
    const hunk = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)/);
    if (hunk?.[1]) {
      nextLine = Number(hunk[1]);
      continue;
    }
    if (!path || line.startsWith("+++") || line.startsWith("---") || line.startsWith("diff ")) continue;
    if (line.startsWith("+")) {
      lines.push({ path, line: nextLine, text: line.slice(1) });
      nextLine += 1;
    } else if (!line.startsWith("-")) {
      nextLine += 1;
    }
  }
  return lines;
}
