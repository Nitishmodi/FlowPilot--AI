"use client";

import { useEffect, useState } from "react";

const rows = [
  ["Formatting", "PASS"],
  ["Lint", "PASS"],
  ["Type checking", "PASS"],
  ["Unit tests", "PASS"],
  ["Secret scan", "PASS"],
];

export function HeroDemo() {
  const [play, setPlay] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => setPlay((value) => value + 1), 6400);
    return () => window.clearInterval(timer);
  }, [paused]);

  return (
    <div
      className="panel rise relative overflow-hidden shadow-2xl shadow-violet-950/40"
      style={{ animationDelay: "80ms" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <span className="scan" aria-hidden="true" />
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <span className="flex items-center gap-2">
          <span className="term-dot bg-[#fb7185]" />
          <span className="term-dot bg-[#f5c16c]" />
          <span className="term-dot bg-[#86efac]" />
          <span className="ml-2 font-mono text-xs text-muted">example · not a live run</span>
        </span>
        <button type="button" className="btn btn-ghost px-3 py-1 text-xs" onClick={() => setPlay((value) => value + 1)}>
          Replay
        </button>
      </div>
      <div key={play} className="space-y-2.5 p-5 font-mono text-sm">
        <p className="text-violet-200">
          $ flowpilot pr-check
          <span className="caret" aria-hidden="true" />
        </p>
        {rows.map((row, index) => (
          <p key={row[0]} className="check-row flex items-center justify-between" style={{ animationDelay: `${180 + index * 120}ms` }}>
            <span className="text-foreground/90">{row[0]}</span>
            <span className="pass-pill text-xs">{row[1]}</span>
          </p>
        ))}
        <p className="check-row border-t border-line pt-3 text-foreground" style={{ animationDelay: "860ms" }}>
          Result: All configured checks passed.
        </p>
      </div>
    </div>
  );
}
