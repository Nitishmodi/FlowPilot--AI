import Link from "next/link";
import { Logo } from "./logo";

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-[#101624]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="transition hover:text-white">
          <Logo />
        </Link>
        <nav className="flex items-center gap-3 text-sm sm:gap-5">
          <Link href="/#toolbox" className="nav-link hidden sm:inline">
            Toolbox
          </Link>
          <Link href="/commands" className="nav-link hidden sm:inline">
            Commands
          </Link>
          <Link href="/docs" className="btn btn-primary px-3 py-1.5 text-sm">
            Docs
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-14 sm:grid-cols-3">
        <div>
          <Logo size={22} />
          <p className="mt-3 max-w-xs text-sm leading-6 text-muted">A toolbox for the repository in front of you. Each stage keeps its own tools.</p>
        </div>
        <div className="text-sm">
          <p className="font-medium">Product</p>
          <div className="mt-3 grid gap-2">
            <Link href="/#toolbox" className="footer-link">Toolbox</Link>
            <Link href="/commands" className="footer-link">Commands</Link>
            <Link href="/docs/usage" className="footer-link">First run</Link>
          </div>
        </div>
        <div className="text-sm">
          <p className="font-medium">Docs</p>
          <div className="mt-3 grid gap-2">
            <Link href="/docs" className="footer-link">Overview</Link>
            <Link href="/docs/install" className="footer-link">Install</Link>
            <Link href="/docs/editor" className="footer-link">VS Code</Link>
            <Link href="/docs/commands" className="footer-link">Commands</Link>
            <Link href="/privacy" className="footer-link">Privacy</Link>
            <Link href="/terms" className="footer-link">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
