#!/usr/bin/env node
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const tsx = require.resolve("tsx/cli");
const main = path.join(path.dirname(fileURLToPath(import.meta.url)), "../src/main.ts");
const child = spawn(process.execPath, [tsx, main, ...process.argv.slice(2)], { stdio: "inherit" });
child.on("exit", (code) => process.exit(code ?? 1));
