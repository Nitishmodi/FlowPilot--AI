"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const DOC_NAV = [
  {
    label: "Start",
    items: [
      { href: "/docs", label: "Overview" },
      { href: "/docs/install", label: "Install" },
      { href: "/docs/usage", label: "First run" },
    ],
  },
  {
    label: "Guides",
    items: [
      { href: "/docs/commands", label: "Commands" },
      { href: "/docs/workflows", label: "Workflows" },
      { href: "/docs/editor", label: "VS Code" },
      { href: "/docs/config", label: "Configuration" },
    ],
  },
  {
    label: "Reference",
    items: [{ href: "/docs/results", label: "Results" }],
  },
];

export function DocsNav() {
  const path = usePathname();
  return (
    <nav aria-label="Documentation" className="flex gap-4 overflow-x-auto pb-1 lg:block lg:overflow-visible lg:pb-0">
      {DOC_NAV.map((group) => (
        <div key={group.label} className="shrink-0 lg:mb-7">
          <p className="hidden px-3 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-muted lg:block">{group.label}</p>
          <div className="mt-2 flex gap-1 lg:grid">
            {group.items.map((item) => (
              <Link key={item.href} href={item.href} data-active={path === item.href} className="doc-link text-sm">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}
