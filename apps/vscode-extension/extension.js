const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const vscode = require("vscode");

const GROUPS = [
  {
    id: "workflows",
    label: "Workflows",
    items: [
      { command: "flowpilot.check", label: "Check", detail: "Format, lint, and typecheck.", args: ["check"], icon: "checklist" },
      { command: "flowpilot.prCheck", label: "Pre-PR", detail: "The checks in workflows.pre-pr.include.", args: ["pr-check"], icon: "git-pull-request" },
    ],
  },
  {
    id: "onboard",
    label: "Onboard",
    items: [
      { command: "flowpilot.doctor", label: "Doctor", detail: "Node, Git, and which scripts exist.", args: ["doctor"], icon: "pulse" },
      { command: "flowpilot.status", label: "Status", detail: "Branch, base, and working tree.", args: ["status"], icon: "git-branch" },
      { command: "flowpilot.map", label: "Map", detail: "Paths near the repository root.", args: ["map"], icon: "list-tree" },
      { command: "flowpilot.config", label: "Config", detail: "Resolved flowpilot.yml.", args: ["config"], icon: "settings-gear" },
      { command: "flowpilot.tools", label: "Tools", detail: "Every catalog tool and whether it is built.", args: ["tools"], icon: "library" },
      { command: "flowpilot.init", label: "Initialize", detail: "Write flowpilot.yml if it is missing.", args: ["init"], icon: "new-file" },
    ],
  },
  {
    id: "understand",
    label: "Understand",
    items: [
      { command: "flowpilot.diff", label: "Diff", detail: "Files that differ from the base branch.", args: ["diff"], icon: "diff" },
      { command: "flowpilot.explain", label: "Explain file", detail: "Line count and named exports for one file.", args: null, icon: "book" },
      { command: "flowpilot.deadcode", label: "Dead code", detail: "Exports no other scanned file mentions.", args: ["deadcode"], icon: "search" },
    ],
  },
  {
    id: "check",
    label: "Check",
    items: [
      { command: "flowpilot.fmt", label: "Format", detail: "The format or fmt script.", args: ["fmt"], icon: "symbol-color" },
      { command: "flowpilot.lint", label: "Lint", detail: "The lint script.", args: ["lint"], icon: "warning" },
      { command: "flowpilot.types", label: "Types", detail: "typecheck, or tsc --noEmit.", args: ["types"], icon: "symbol-type-parameter" },
      { command: "flowpilot.test", label: "Test", detail: "The test script.", args: ["test"], icon: "beaker" },
    ],
  },
  {
    id: "ship",
    label: "Ship",
    items: [
      { command: "flowpilot.secrets", label: "Secrets", detail: "Scan added lines for likely credentials.", args: ["secrets"], icon: "key" },
      { command: "flowpilot.review", label: "Review", detail: "Debugger statements and widened any.", args: ["review"], icon: "comment-discussion" },
      { command: "flowpilot.depsAudit", label: "Dependency audit", detail: "The package manager audit.", args: ["deps-audit"], icon: "package" },
      { command: "flowpilot.pr", label: "Draft pull request", detail: "Print a draft. Creation stays behind --create.", args: ["pr"], icon: "git-pull-request" },
    ],
  },
  {
    id: "diagnose",
    label: "Diagnose",
    items: [
      { command: "flowpilot.ci", label: "CI", detail: "Recent GitHub Actions runs through gh.", args: ["ci"], icon: "github-action" },
      { command: "flowpilot.debug", label: "Debug last report", detail: "Name the failed step in the saved report.", args: ["debug"], icon: "debug" },
      { command: "flowpilot.report", label: "Last report", detail: "Print .flowpilot/last-report.json.", args: ["report"], icon: "output" },
      { command: "flowpilot.taskStart", label: "Start task", detail: "Save what you are doing.", args: null, icon: "edit" },
      { command: "flowpilot.taskSave", label: "Save task", detail: "Refresh the branch and changed files.", args: ["task", "save"], icon: "save" },
      { command: "flowpilot.resume", label: "Resume", detail: "Print the saved task note.", args: ["resume"], icon: "history" },
      { command: "flowpilot.handoff", label: "Handoff", detail: "Print the task as Markdown.", args: ["handoff"], icon: "markdown" },
    ],
  },
];

const TOOLS = GROUPS.flatMap((group) => group.items);

function workspaceFolder() {
  const root = vscode.workspace.workspaceFolders?.[0];
  if (!root) throw new Error("Open the repository folder first.");
  return root.uri.fsPath;
}

function relativeFile(cwd, target) {
  const relative = path.relative(cwd, target);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) return null;
  return relative;
}

function launch(args) {
  const cwd = workspaceFolder();
  const configured = vscode.workspace.getConfiguration("flowpilot").get("executable");
  const checkoutCli = path.join(cwd, "apps", "cli", "src", "main.ts");
  const tsx = path.join(cwd, "node_modules", "tsx", "dist", "cli.mjs");
  if (!configured && fs.existsSync(checkoutCli) && fs.existsSync(tsx)) {
    return { command: process.execPath, args: [tsx, checkoutCli, ...args], cwd };
  }
  return { command: configured || "flowpilot", args, cwd };
}

class ToolTree {
  constructor() {
    this.results = new Map();
    this.emitter = new vscode.EventEmitter();
    this.onDidChangeTreeData = this.emitter.event;
  }

  refresh() {
    this.emitter.fire(undefined);
  }

  setResult(command, result) {
    this.results.set(command, result);
    this.refresh();
  }

  getTreeItem(element) {
    if (element.kind === "group") {
      const item = new vscode.TreeItem(element.label, vscode.TreeItemCollapsibleState.Expanded);
      item.id = element.id;
      item.contextValue = "flowpilotGroup";
      return item;
    }
    const item = new vscode.TreeItem(element.label, vscode.TreeItemCollapsibleState.None);
    item.id = element.command;
    item.description = this.results.get(element.command) || "";
    item.tooltip = element.detail;
    item.iconPath = new vscode.ThemeIcon(element.icon);
    item.command = { command: element.command, title: element.label };
    item.contextValue = "flowpilotTool";
    return item;
  }

  getChildren(element) {
    if (!element) return GROUPS.map((group) => ({ kind: "group", ...group }));
    if (element.kind === "group") return element.items.map((item) => ({ kind: "tool", ...item }));
    return [];
  }
}

function activate(context) {
  const output = vscode.window.createOutputChannel("FlowPilot");
  const tree = new ToolTree();
  const view = vscode.window.createTreeView("flowpilot.tools", { treeDataProvider: tree, showCollapseAll: true });
  const bar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  let current = null;

  const idleStatus = () => {
    bar.text = "$(tools) FlowPilot";
    bar.tooltip = "Run a FlowPilot tool in this repository";
    bar.command = "flowpilot.pick";
    bar.backgroundColor = undefined;
  };

  const syncStatusBar = () => {
    if (vscode.workspace.getConfiguration("flowpilot").get("statusBar") === false) bar.hide();
    else bar.show();
  };

  const setFolderMessage = () => {
    view.message = vscode.workspace.workspaceFolders?.length ? "" : "Open a repository folder. Commands run in that folder.";
  };

  idleStatus();
  syncStatusBar();
  setFolderMessage();

  function finish(command, code) {
    const label = TOOLS.find((item) => item.command === command)?.label ?? command;
    if (code === 0) {
      tree.setResult(command, "passed");
      bar.text = "$(check) FlowPilot";
      bar.backgroundColor = undefined;
    } else if (code === 1) {
      tree.setResult(command, "failed");
      bar.text = "$(error) FlowPilot";
      bar.backgroundColor = new vscode.ThemeColor("statusBarItem.errorBackground");
    } else {
      tree.setResult(command, "unavailable");
      bar.text = "$(warning) FlowPilot";
      bar.backgroundColor = new vscode.ThemeColor("statusBarItem.warningBackground");
    }
    bar.tooltip = `${label} exited ${code ?? 1}`;
    vscode.window.setStatusBarMessage(`FlowPilot ${label} exited ${code ?? 1}`, 4000);
  }

  function run(command, args) {
    if (current) {
      vscode.window.showWarningMessage("A FlowPilot command is already running.");
      return;
    }
    let spec;
    try {
      spec = launch(args);
    } catch (error) {
      vscode.window.showErrorMessage(error instanceof Error ? error.message : "Open a repository folder first.");
      return;
    }
    tree.setResult(command, "running");
    bar.text = "$(sync~spin) FlowPilot";
    bar.tooltip = `Running ${args.join(" ")}`;
    bar.backgroundColor = undefined;
    output.clear();
    output.appendLine(`$ flowpilot ${args.join(" ")}`);
    output.appendLine("");
    if (vscode.workspace.getConfiguration("flowpilot").get("revealOutput") !== false) output.show(true);
    const child = spawn(spec.command, spec.args, { cwd: spec.cwd, shell: false });
    current = child;
    child.on("error", () => {
      output.appendLine("flowpilot is not available in this folder. Install the CLI, or set flowpilot.executable to the command path.");
    });
    child.stdout.on("data", (chunk) => output.append(String(chunk)));
    child.stderr.on("data", (chunk) => output.append(String(chunk)));
    child.on("close", (code) => {
      current = null;
      output.appendLine("");
      output.appendLine(`exit ${code ?? 1}`);
      finish(command, code);
    });
  }

  async function explain(resource) {
    let cwd;
    try {
      cwd = workspaceFolder();
    } catch (error) {
      vscode.window.showErrorMessage(error instanceof Error ? error.message : "Open a repository folder first.");
      return;
    }
    const candidate = resource instanceof vscode.Uri
      ? resource.fsPath
      : vscode.window.activeTextEditor?.document.uri.scheme === "file"
        ? vscode.window.activeTextEditor.document.uri.fsPath
        : "";
    let relative = candidate ? relativeFile(cwd, candidate) : null;
    if (!relative) {
      relative = await vscode.window.showInputBox({
        title: "FlowPilot: Explain File",
        prompt: "Path inside this repository",
        placeHolder: "src/app.ts",
        ignoreFocusOut: true,
      });
      if (!relative) return;
    }
    run("flowpilot.explain", ["explain", relative]);
  }

  async function taskStart() {
    const description = await vscode.window.showInputBox({
      title: "FlowPilot: Start Task Note",
      prompt: "What are you doing? The note is saved in .flowpilot/task.json.",
      placeHolder: "Fix the login form",
      ignoreFocusOut: true,
    });
    if (description?.trim()) run("flowpilot.taskStart", ["task", "start", description.trim()]);
  }

  async function pickTool() {
    const choice = await vscode.window.showQuickPick(
      TOOLS.map((item) => ({
        label: item.label,
        description: GROUPS.find((group) => group.items.includes(item))?.label ?? "",
        detail: item.detail,
        item,
      })),
      { title: "FlowPilot", placeHolder: "Run a tool in this repository", matchOnDescription: true, matchOnDetail: true },
    );
    if (!choice) return;
    if (choice.item.command === "flowpilot.explain") return explain();
    if (choice.item.command === "flowpilot.taskStart") return taskStart();
    run(choice.item.command, choice.item.args);
  }

  context.subscriptions.push(output, view, bar, tree.emitter);
  context.subscriptions.push(vscode.commands.registerCommand("flowpilot.pick", pickTool));
  context.subscriptions.push(vscode.commands.registerCommand("flowpilot.explain", explain));
  context.subscriptions.push(vscode.commands.registerCommand("flowpilot.taskStart", taskStart));
  context.subscriptions.push(vscode.commands.registerCommand("flowpilot.showOutput", () => output.show(true)));
  for (const item of TOOLS) {
    if (item.command === "flowpilot.explain" || item.command === "flowpilot.taskStart") continue;
    context.subscriptions.push(vscode.commands.registerCommand(item.command, () => run(item.command, item.args)));
  }
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("flowpilot.statusBar")) syncStatusBar();
    }),
    vscode.workspace.onDidChangeWorkspaceFolders(setFolderMessage),
  );
}

function deactivate() {}

module.exports = { activate, deactivate };
