# FlowPilot AI

Run format, lint, typecheck, tests, and the pull-request checks from VS Code.

## Install

1. Install the `flowpilot` command and confirm `flowpilot --version` prints a version.
2. Download `flowpilot-ai-0.1.0.vsix`.
3. In VS Code, open Extensions, open the `...` menu, and choose **Install from VSIX**.
4. Reload the window.
5. Open Extensions and look under **Installed** for FlowPilot AI.

A Marketplace search does not list this extension.

From the FlowPilot folder, add the command to your PATH:

```bash
chmod +x apps/cli/bin/flowpilot.js
ln -sfn "$(pwd)/apps/cli/bin/flowpilot.js" "$(dirname "$(command -v node)")/flowpilot"
flowpilot --version
```

After the file is downloaded, this installs the extension from any folder:

```bash
code --install-extension ~/Downloads/flowpilot-ai-0.1.0.vsix
```

## Use it

1. Open the repository with **File**, then **Open Folder**.
2. Click the FlowPilot icon in the activity bar.
3. Click **Doctor** the first time you open a folder.
4. Click **Pre-PR** before you open a pull request.
5. Read the result in the **FlowPilot** output panel. The status bar shows a check when it passes.

Right-click a file and choose **FlowPilot: Explain File** to see its line count and named exports.

The activity bar lists the other tools. One command runs at a time. If the output says `flowpilot` is not available, install the terminal command and run the check again.

## Developer

Nitish Modi  
[nitishmodi200@gmail.com](mailto:nitishmodi200@gmail.com)
