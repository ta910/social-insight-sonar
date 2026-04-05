"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const Sidebar = dynamic(() => import("./Sidebar"), { ssr: false });

// These paths are shown without a sidebar
const NO_SIDEBAR_PREFIXES = ["/login", "/signup-request", "/auth/"];

export default function SidebarWrapper() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const hideSidebar = NO_SIDEBAR_PREFIXES.some((p) => pathname.startsWith(p));
  if (hideSidebar) return null;

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-3 left-3 z-50 p-2 rounded-lg bg-sis-navy text-white shadow-lg"
        aria-label="メニューを開く"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar: slide-in on mobile, static on desktop */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50
          md:relative md:z-auto md:translate-x-0
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <Sidebar onClose={() => setIsOpen(false)} />
      </div>
    </>
  );
}
