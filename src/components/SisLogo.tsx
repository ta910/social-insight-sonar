"use client";

/**
 * Shared logo component used in both Sidebar (dark bg) and Login page (light bg).
 * Pass dark=true (default) for dark background, dark=false for light background.
 */
export function SisLogo({ dark = true }: { dark?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-sis-cyan flex items-center justify-center shrink-0">
        <svg className="w-5 h-5 text-sis-navy" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
          <circle cx="12" cy="12" r="3" opacity="0.4" />
        </svg>
      </div>
      <div>
        <div
          className={`text-base font-bold tracking-wide leading-tight ${
            dark ? "text-white" : "text-sis-navy"
          }`}
        >
          Social Insight
        </div>
        <div className="text-xs font-semibold text-sis-cyan tracking-widest uppercase">
          Sonar
        </div>
      </div>
    </div>
  );
}
