"use client";

import { useState } from "react";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-ghost shrink-0 px-3 py-1 text-xs"
      onClick={() => {
        void navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1600);
        }).catch(() => setCopied(false));
      }}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function CodeBlock({ code, title = "shell" }: { code: string; title?: string }) {
  return (
    <div className="doc-code">
      <div className="doc-code-bar">
        <span className="flex items-center gap-2 font-mono text-xs tracking-wide text-emerald-200/80">
          <span className="term-dot bg-[#fb7185]" />
          <span className="term-dot bg-[#f5c16c]" />
          <span className="term-dot bg-[#86efac]" />
          <span className="ml-1">{title}</span>
        </span>
        <CopyButton text={code} />
      </div>
      <pre>{code}</pre>
    </div>
  );
}
