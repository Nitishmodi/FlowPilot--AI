export type CommandDoc = {
  id: string;
  command: string;
  summary: string;
  detail: string;
};

export const COMMAND_GROUPS: { title: string; text: string; items: CommandDoc[] }[] = [
  {
    title: "Onboard",
    text: "These commands describe the folder before they run project scripts.",
    items: [
      {
        id: "init",
        command: "flowpilot init",
        summary: "Writes flowpilot.yml.",
        detail: "The file names the project, the base branch, which checks are on, and the pre-PR list. Re-run with --force to replace an existing file. Without --force, an existing file exits 2 and is left unchanged.",
      },
      {
        id: "doctor",
        command: "flowpilot doctor",
        summary: "Prints Node, Git, and package scripts.",
        detail: "Use this first when a later command says a tool is unavailable. Add --json for the raw result.",
      },
      {
        id: "status",
        command: "flowpilot status",
        summary: "Shows the branch, the base, and a dirty worktree.",
        detail: "Outside a Git repository the status is unavailable and the process exits 2.",
      },
      {
        id: "tools",
        command: "flowpilot tools",
        summary: "Lists every catalog tool and whether it is built.",
        detail: "A tool marked ready can still be unavailable in a particular repository, for example when that repository has no lint script.",
      },
      {
        id: "map",
        command: "flowpilot map",
        summary: "Lists paths near the repository root.",
        detail: "This is a local file listing. It does not upload the tree.",
      },
      {
        id: "config",
        command: "flowpilot config",
        summary: "Prints the config after defaults are applied.",
        detail: "A missing flowpilot.yml still prints the defaults. An invalid file prints the validation error and exits 1.",
      },
    ],
  },
  {
    title: "Understand",
    text: "Read the change that is already in Git.",
    items: [
      {
        id: "diff",
        command: "flowpilot diff",
        summary: "Counts files that differ from the base branch.",
        detail: "The base branch comes from project.defaultBaseBranch, which defaults to main.",
      },
      {
        id: "explain",
        command: "flowpilot explain src/app.ts",
        summary: "Reads one file inside the repository.",
        detail: "It prints the line count and named exports. A path outside the repository is rejected.",
      },
      {
        id: "deadcode",
        command: "flowpilot deadcode",
        summary: "Lists exports no other scanned file mentions.",
        detail: "Those names are candidates. A public export can look unused. When candidates exist, the result is inconclusive, not a failure.",
      },
    ],
  },
  {
    title: "Check",
    text: "These commands run scripts the repository already defines.",
    items: [
      {
        id: "fmt",
        command: "flowpilot fmt",
        summary: "Runs the format or fmt script.",
        detail: "pnpm and npm use run. Yarn calls the script directly. No script means unavailable. checks.format: false means skipped.",
      },
      {
        id: "lint",
        command: "flowpilot lint",
        summary: "Runs the lint script.",
        detail: "A missing lint script is unavailable. A failing lint exits 1.",
      },
      {
        id: "types",
        command: "flowpilot types",
        summary: "Runs typecheck, or tsc --noEmit when that is possible.",
        detail: "Without a typecheck script, TypeScript must be a dependency and tsconfig.json must exist. Otherwise the result is unavailable.",
      },
      {
        id: "test",
        command: "flowpilot test",
        summary: "Runs the test script.",
        detail: "A missing test script is unavailable. A failing test exits 1.",
      },
    ],
  },
  {
    title: "Ship",
    text: "These read the diff or the package manager. They do not publish the branch.",
    items: [
      {
        id: "secrets",
        command: "flowpilot secrets",
        summary: "Scans added lines for likely credentials.",
        detail: "It looks for GitHub tokens, AWS access key ids, private-key blocks, and live Stripe keys. The stored evidence is masked. node_modules and files ending in .example are skipped. A hit fails the check.",
      },
      {
        id: "review",
        command: "flowpilot review",
        summary: "Reads added lines for two patterns.",
        detail: "A debugger statement is an error and fails the check. A line that uses any is a warning and does not fail by itself.",
      },
      {
        id: "deps-audit",
        command: "flowpilot deps-audit",
        summary: "Runs the package manager audit and reads the JSON.",
        detail: "pnpm and npm use audit --json. Yarn uses yarn npm audit --json. A total above zero fails the check. A clean audit is not a claim that the project is secure. No package.json means unavailable.",
      },
      {
        id: "pr",
        command: "flowpilot pr",
        summary: "Prints a pull-request draft and does not create it.",
        detail: "The draft uses the branch and the changed files. --create opens a pull request only when permissions.allowPullRequestCreation is true and gh is signed in. The command does not push.",
      },
    ],
  },
  {
    title: "Diagnose and tasks",
    text: "Read the last local report, or save what you were doing.",
    items: [
      {
        id: "ci",
        command: "flowpilot ci",
        summary: "Lists recent GitHub Actions runs through gh.",
        detail: "gh must be installed and signed in, and the folder must be a Git repository. A missing or unauthenticated gh is unavailable. A failed listed run fails this command.",
      },
      {
        id: "debug",
        command: "flowpilot debug",
        summary: "Names the failed steps in the last saved report.",
        detail: "Run flowpilot check or flowpilot pr-check first. With no report, the result is inconclusive.",
      },
      {
        id: "task",
        command: 'flowpilot task start "fix the login form"',
        summary: "Saves a note in .flowpilot/task.json.",
        detail: "task save refreshes the branch and changed files. resume prints the note. handoff prints a short Markdown summary. Do not put secrets in the description.",
      },
      {
        id: "connect",
        command: "flowpilot connect owner/name",
        summary: "Records this clone in .flowpilot/link.json.",
        detail: "The file stays on this machine. The website does not read it. Omit owner/name to record the folder without a GitHub name.",
      },
    ],
  },
];
