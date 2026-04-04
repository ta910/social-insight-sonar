"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    href: "/",
    label: "プロジェクト一覧",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
  },
  {
    href: "/projects/new",
    label: "新規プロジェクト",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
];

type Props = {
  onClose?: () => void;
};

export default function Sidebar({ onClose }: Props) {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-full min-h-screen flex flex-col bg-sis-navy text-white shrink-0">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-sis-navy-muted">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sis-cyan flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-sis-navy" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
                <circle cx="12" cy="12" r="3" opacity="0.4" />
              </svg>
            </div>
            <div>
              <div className="text-base font-bold tracking-wide text-white leading-tight">
                Social Insight
              </div>
              <div className="text-xs font-semibold text-sis-cyan tracking-widest uppercase">
                Sonar
              </div>
            </div>
          </div>
          {/* Mobile close button */}
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden p-1 rounded text-slate-400 hover:text-white"
              aria-label="メニューを閉じる"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sis-cyan text-sis-navy"
                  : "text-slate-300 hover:bg-sis-navy-muted hover:text-white"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-sis-navy-muted">
        <p className="text-xs text-slate-500">SIS v1.0</p>
      </div>
    </aside>
  );
}
