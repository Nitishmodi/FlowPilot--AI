import type { ReactNode } from "react";
import { DocsFrame } from "@/components/docs-frame";

export default function DocsLayout({ children }: { children: ReactNode }) {
  return <DocsFrame>{children}</DocsFrame>;
}
