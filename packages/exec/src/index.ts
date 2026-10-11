import { spawn } from "node:child_process";

const SAFE_COMMAND = /^[A-Za-z0-9._+/-]+$/;

export type ProcessResult = {
  code: number;
  stdout: string;
  stderr: string;
  timedOut: boolean;
  cancelled: boolean;
};

export function runProcess(
  command: string,
  args: string[],
  options: { cwd: string; timeoutMs: number; signal?: AbortSignal },
): Promise<ProcessResult> {
  if (!SAFE_COMMAND.test(command) || args.some((arg) => arg.includes("\0"))) {
    return Promise.reject(new Error(`Refusing to run ${command}.`));
  }
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd: options.cwd, shell: false, env: process.env });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let cancelled = false;
    const cap = (value: string) => (value.length > 80_000 ? value.slice(-80_000) : value);
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, options.timeoutMs);
    const onAbort = () => {
      cancelled = true;
      child.kill("SIGTERM");
    };
    options.signal?.addEventListener("abort", onAbort);
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout = cap(stdout + chunk);
    });
    child.stderr.on("data", (chunk: string) => {
      stderr = cap(stderr + chunk);
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      options.signal?.removeEventListener("abort", onAbort);
      resolve({ code: 127, stdout, stderr: cap(stderr + error.message), timedOut, cancelled });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      options.signal?.removeEventListener("abort", onAbort);
      resolve({ code: code ?? 1, stdout, stderr, timedOut, cancelled });
    });
  });
}
