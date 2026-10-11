import { describe, expect, it } from "vitest";
import { finish } from "@flowpilot/types";
import { overallStatus, runWorkflow, workflows } from "./index";

describe("workflow", () => {
  it("does not treat a skipped check as a failure or a pass of that check", async () => {
    const result = await runWorkflow({
      definition: workflows.check!,
      timeoutMs: 1000,
      runStep: async (toolId) =>
        finish({
          toolId,
          status: toolId === "lint" ? "skipped" : toolId === "types" ? "failed" : "passed",
          summary: toolId,
        }),
    });
    expect(result.steps.map((step) => step.status)).toEqual(["passed", "skipped", "failed"]);
    expect(result.status).toBe("failed");
    expect(overallStatus([finish({ toolId: "fmt", status: "skipped", summary: "off" })])).toBe("inconclusive");
  });

  it("runs independent steps before a step that needs them", async () => {
    const order: string[] = [];
    await runWorkflow({
      definition: workflows["pre-pr"]!,
      timeoutMs: 1000,
      runStep: async (toolId) => {
        order.push(toolId);
        return finish({ toolId, status: "passed", summary: "ok" });
      },
    });
    expect(order.slice(0, 3).sort()).toEqual(["fmt", "lint", "types"]);
    expect(order.indexOf("test")).toBeGreaterThan(2);
    expect(order.indexOf("secrets")).toBeGreaterThan(order.indexOf("test"));
  });
});
