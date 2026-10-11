export type Stage = {
  id: string;
  index: string;
  name: string;
  summary: string;
  tone: "violet" | "sky" | "amber";
  tools: string[];
};

export const STAGES: Stage[] = [
  {
    id: "onboard",
    index: "01",
    name: "Onboard",
    summary: "See the repository, the branch, and which checks can actually run.",
    tone: "violet",
    tools: ["doctor", "status", "map"],
  },
  {
    id: "understand",
    index: "02",
    name: "Understand",
    summary: "Read the change that is already in Git before adding more of it.",
    tone: "sky",
    tools: ["diff", "explain", "deadcode"],
  },
  {
    id: "check",
    index: "03",
    name: "Check",
    summary: "Run the format, lint, type, and test scripts the project already has.",
    tone: "amber",
    tools: ["fmt", "lint", "types", "test"],
  },
  {
    id: "ship",
    index: "04",
    name: "Ship",
    summary: "Scan the diff, then open a pull request only after you confirm it.",
    tone: "violet",
    tools: ["secrets", "review", "deps-audit", "pr"],
  },
  {
    id: "diagnose",
    index: "05",
    name: "Diagnose",
    summary: "Look at a failed check when the log is available to read.",
    tone: "sky",
    tools: ["ci", "debug"],
  },
];
