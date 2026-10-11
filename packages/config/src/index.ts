import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parse, stringify } from "yaml";
import { z } from "zod";

const checkIds = ["fmt", "lint", "types", "test", "secrets", "review"] as const;

export const configSchema = z.object({
  version: z.literal(1).default(1),
  project: z
    .object({
      name: z.string().default(""),
      defaultBaseBranch: z.string().min(1).default("main"),
    })
    .default({}),
  execution: z
    .object({
      timeoutSeconds: z.number().int().min(5).max(3600).default(300),
      maxParallelTasks: z.number().int().min(1).max(8).default(4),
    })
    .default({}),
  checks: z
    .object({
      format: z.boolean().default(true),
      lint: z.boolean().default(true),
      types: z.boolean().default(true),
      tests: z.boolean().default(true),
      secrets: z.boolean().default(true),
    })
    .default({}),
  workflows: z
    .object({
      "pre-pr": z.object({ include: z.array(z.enum(checkIds)).min(1) }).optional(),
    })
    .default({}),
  permissions: z
    .object({
      allowSafeFixes: z.boolean().default(false),
      allowGitCommit: z.boolean().default(false),
      allowGitPush: z.boolean().default(false),
      allowPullRequestCreation: z.boolean().default(false),
    })
    .default({}),
});

export type FlowConfig = z.infer<typeof configSchema>;

export const CONFIG_FILE = "flowpilot.yml";

export function defaultConfig(name = ""): FlowConfig {
  return configSchema.parse({
    version: 1,
    project: { name, defaultBaseBranch: "main" },
    workflows: { "pre-pr": { include: ["fmt", "lint", "types", "test", "secrets", "review"] } },
  });
}

export function configDocument(config: FlowConfig): string {
  return stringify(config);
}

export async function readConfig(cwd: string): Promise<FlowConfig> {
  const file = path.join(cwd, CONFIG_FILE);
  let raw: string;
  try {
    raw = await readFile(file, "utf8");
  } catch {
    return defaultConfig(path.basename(cwd));
  }
  let parsed: unknown;
  try {
    parsed = parse(raw);
  } catch (error) {
    throw new Error(error instanceof Error ? `flowpilot.yml: ${error.message}` : "flowpilot.yml could not be parsed.");
  }
  const result = configSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(result.error.issues.map((issue) => `${issue.path.join(".") || "config"}: ${issue.message}`).join("\n"));
  }
  return result.data;
}

export async function writeConfig(cwd: string, config: FlowConfig): Promise<void> {
  await writeFile(path.join(cwd, CONFIG_FILE), configDocument(config));
}
