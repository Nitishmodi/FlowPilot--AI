import { describe, expect, it } from "vitest";
import { configSchema } from "./index";

describe("config", () => {
  it("rejects a workflow step that is not a known check", () => {
    const result = configSchema.safeParse({
      version: 1,
      workflows: { "pre-pr": { include: ["fmt", "deploy"] } },
    });
    expect(result.success).toBe(false);
  });

  it("fills defaults when the file only sets the version", () => {
    const config = configSchema.parse({ version: 1 });
    expect(config.project.defaultBaseBranch).toBe("main");
    expect(config.checks.lint).toBe(true);
    expect(config.permissions.allowPullRequestCreation).toBe(false);
  });
});
