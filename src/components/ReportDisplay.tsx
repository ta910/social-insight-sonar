"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Report, RawSource, PeriodComparison, CompetitorSummary } from "@/lib/types";

// ─── Insight tag ──────────────────────────────────────────────────────────────

type InsightTag = { label: string; bg: string; text: string };

function getInsightTag(insight: string): InsightTag {
  if (/増加|成長|拡大|機会|好機|上昇|改善|強化|好調/.test(insight))
    return { label: "機会", bg: "bg-green-100", text: "text-green-700" };
  if (/リスク|脅威|低下|減少|問題|懸念|批判|悪化|警戒/.test(insight))
    return { label: "脅威", bg: "bg-red-100", text: "text-red-700" };
  if (/トレンド|流行|急増|注目|人気|台頭|拡散|急速|新たな|急騰/.test(insight))
    return { label: "トレンド", bg: "bg-blue-100", text: "text-blue-700" };
  return { label: "要注意", bg: "bg-orange-100", text: "text-orange-700" };
}

function InsightTagBadge({ insight }: { insight: string }) {
  const t = getInsightTag(insight);
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${t.bg} ${t.text} shrink-0`}>
      {t.label}
    </span>
  );
}

// ─── Markdown preprocessing ───────────────────────────────────────────────────

function prepareMarkdown(text: string): string {
  return text
    .replace(/^・\s*/gm, "- ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/([^\n])\n(- )/g, "$1\n\n$2")
    .replace(/([^\n])\n(\d+\. )/g, "$1\n\n$2");
}

function cleanMarkdown(text: string): string {
  return text
    .replace(/^(以下、|以下に、|以下は|以上の|上記の|まとめると|以上が|なお、).+(\n|$)/gm, "")
    .replace(/^[・•]\s*/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ─── Period display ───────────────────────────────────────────────────────────

function formatPeriodMonth(dateStr: string): string {
  const parts = dateStr.split("-");
  if (parts.length >= 2) return `${parseInt(parts[0])}年${parseInt(parts[1])}月`;
  return dateStr;
}

// ─── Section parser ───────────────────────────────────────────────────────────

type ParsedSection = { title: string; bullets: string[] };

function parseSections(text: string): ParsedSection[] | null {
  const normalized = text.replace(/\r\n/g, "\n");
  const headerRe = /^(?:\d+[.．]\s*|#{1,3}\s*)(.+)$/gm;
  const matches = [...normalized.matchAll(headerRe)];

  if (matches.length < 2) return null;

  const sections: ParsedSection[] = [];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const nextMatch = matches[i + 1];

    const title = match[1]
      .replace(/[（(][^）)]*[）)]/g, "")
      .replace(/\*+/g, "")
      .trim();

    const startIdx = match.index! + match[0].length;
    const endIdx = nextMatch?.index ?? normalized.length;
    const body = normalized.slice(startIdx, endIdx);

    const bullets = body
      .split("\n")
      .map((l) => l.replace(/^[-•・*\s]+/, "").trim())
      .filter((l) => l.length > 8);

    if (bullets.length > 0) sections.push({ title, bullets });
  }

  return sections.length >= 2 ? sections : null;
}

// ─── Palette types ────────────────────────────────────────────────────────────

type PaletteItem = {
  color: string;
  lightBgColor: string;
  textColor: string;
};

// ─── Category section palette & icons ─────────────────────────────────────────

const SECTION_PALETTE: PaletteItem[] = [
  { color: "#1D9E75", lightBgColor: "#f0fdf4", textColor: "text-emerald-700" },
  { color: "#0C447C", lightBgColor: "#eff6ff", textColor: "text-blue-800"   },
  { color: "#7C3AED", lightBgColor: "#f5f3ff", textColor: "text-violet-700" },
  { color: "#D97706", lightBgColor: "#fffbeb", textColor: "text-amber-700"  },
];

const SECTION_ICONS: React.ReactNode[] = [
  <svg key="trend" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
  </svg>,
  <svg key="consumer" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>,
  <svg key="competitor" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>,
  <svg key="risk" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>,
];

// ─── Brand section palette & icons ────────────────────────────────────────────

const BRAND_SECTION_PALETTE: PaletteItem[] = [
  { color: "#1D9E75", lightBgColor: "#f0fdfa", textColor: "text-teal-700"   },
  { color: "#3b82f6", lightBgColor: "#eff6ff", textColor: "text-blue-700"   },
  { color: "#f97316", lightBgColor: "#fff7ed", textColor: "text-orange-700" },
  { color: "#a855f7", lightBgColor: "#faf5ff", textColor: "text-purple-700" },
];

const BRAND_SECTION_ICONS: React.ReactNode[] = [
  // ブランドの最新動向 (megaphone)
  <svg key="megaphone" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
  </svg>,
  // 消費者の評判・口コミ (chat bubble)
  <svg key="chat" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>,
  // 競合との比較 (arrows/compare)
  <svg key="compare" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>,
  // 機会・リスク (target)
  <svg key="target" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>,
];

// ─── Section cards component ──────────────────────────────────────────────────

function SectionCards({
  content,
  palette = SECTION_PALETTE,
  icons = SECTION_ICONS,
}: {
  content: string;
  palette?: PaletteItem[];
  icons?: React.ReactNode[];
}) {
  const sections = parseSections(content);

  if (!sections) {
    return (
      <div className="text-sm text-slate-600 leading-relaxed">
        <ReactMarkdown
          components={{
            ul: ({ children }) => <ul className="list-disc pl-5 space-y-1.5 my-2">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1.5 my-2">{children}</ol>,
            li: ({ children }) => <li className="leading-relaxed">{children}</li>,
            p:  ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            strong: ({ children }) => <strong className="font-semibold text-slate-800">{children}</strong>,
            h2: ({ children }) => <h2 className="font-semibold text-slate-800 mt-3 mb-1">{children}</h2>,
            h3: ({ children }) => <h3 className="font-semibold text-slate-700 mt-2 mb-1">{children}</h3>,
          }}
        >
          {prepareMarkdown(content)}
        </ReactMarkdown>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {sections.map(({ title, bullets }, i) => {
        const p = palette[i % palette.length];
        const icon = icons[i % icons.length];

        return (
          <div
            key={i}
            className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm"
          >
            {/* Card header */}
            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{
                backgroundColor: p.lightBgColor,
                borderBottom: `2px solid ${p.color}30`,
              }}
            >
              <span style={{ color: p.color }}>{icon}</span>
              <span className={`text-xs font-bold tracking-wide ${p.textColor}`}>
                {title}
              </span>
            </div>

            {/* Bullets */}
            <div className="px-4 py-3 space-y-2">
              {bullets.map((bullet, j) => (
                <div key={j} className="flex items-start gap-2.5">
                  <div
                    className="w-0.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: p.color,
                      alignSelf: "stretch",
                      minHeight: "14px",
                    }}
                  />
                  <p className="text-sm text-slate-600 leading-relaxed">{bullet}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Summary block (collapsible header + section cards) ───────────────────────

function SummaryBlock({
  title,
  content,
  accentColor,
  icon,
  sectionPalette,
  sectionIcons,
}: {
  title: string;
  content: string;
  accentColor: string;
  icon: React.ReactNode;
  sectionPalette?: PaletteItem[];
  sectionIcons?: React.ReactNode[];
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="space-y-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 w-full text-left group"
      >
        <span
          className="flex items-center justify-center w-6 h-6 rounded-md shrink-0"
          style={{ backgroundColor: accentColor + "18", color: accentColor }}
        >
          {icon}
        </span>
        <span className="text-sm font-semibold text-slate-700 flex-1">{title}</span>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <SectionCards
          content={content}
          palette={sectionPalette}
          icons={sectionIcons}
        />
      )}
    </div>
  );
}

// ─── Insight list ─────────────────────────────────────────────────────────────

function InsightList({ insights, color }: { insights: string[]; color: "cyan" | "navy" }) {
  if (insights.length === 0)
    return <p className="text-xs text-slate-400 italic">インサイトがありません</p>;

  const numBg = color === "cyan" ? "bg-[#1D9E75]" : "bg-[#0C447C]";

  return (
    <ul className="space-y-3.5">
      {insights.map((insight, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <span
            className={`mt-0.5 w-5 h-5 rounded-full ${numBg} text-white text-xs font-bold flex items-center justify-center shrink-0`}
          >
            {i + 1}
          </span>
          <div className="flex-1 min-w-0">
            <InsightTagBadge insight={insight} />
            <p className="text-sm text-slate-700 leading-relaxed mt-1">{insight}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

// ─── Period comparison ────────────────────────────────────────────────────────

function ComparisonSection({
  comparison,
  periodLabel,
}: {
  comparison: PeriodComparison;
  periodLabel: string;
}) {
  const hasNew =
    (comparison.new_category_insights?.length ?? 0) > 0 ||
    (comparison.new_brand_insights?.length ?? 0) > 0;
  const hasLost =
    (comparison.lost_category_insights?.length ?? 0) > 0 ||
    (comparison.lost_brand_insights?.length ?? 0) > 0;

  if (!hasNew && !hasLost && !comparison.summary) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
        <svg className="w-4 h-4 text-sis-cyan-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
        <h3 className="font-semibold text-slate-800 text-sm">前{periodLabel}との変化</h3>
      </div>
      <div className="p-6 space-y-4">
        {comparison.summary && (
          <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 rounded-lg px-4 py-3">
            {comparison.summary}
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hasNew && (
            <div>
              <p className="text-xs font-semibold text-emerald-600 mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                新たに登場した動向
              </p>
              <ul className="space-y-1.5">
                {[
                  ...(comparison.new_category_insights ?? []),
                  ...(comparison.new_brand_insights ?? []),
                ].map((item, i) => (
                  <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5 shrink-0 font-bold">＋</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {hasLost && (
            <div>
              <p className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-300 inline-block" />
                前回から消えた動向
              </p>
              <ul className="space-y-1.5">
                {[
                  ...(comparison.lost_category_insights ?? []),
                  ...(comparison.lost_brand_insights ?? []),
                ].map((item, i) => (
                  <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                    <span className="shrink-0 font-bold">－</span>
                    <span className="line-through">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Competitor card ──────────────────────────────────────────────────────────

function CompetitorCard({ name, data }: { name: string; data: CompetitorSummary }) {
  const [open, setOpen] = useState(false);
  const preview = data.summary.slice(0, 120) + (data.summary.length > 120 ? "…" : "");

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden transition-shadow hover:shadow-md">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left gap-2"
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
          <span className="font-semibold text-slate-800 text-sm">{name}</span>
        </div>
        <svg
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className="px-5 pb-4">
        {open ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{data.summary}</p>
            {data.sources?.length > 0 && (
              <ul className="space-y-1 pt-2 border-t border-slate-100">
                {data.sources.slice(0, 3).map((src, i) => (
                  <li key={i}>
                    <a href={src.url} target="_blank" rel="noopener noreferrer"
                       className="text-xs text-sis-cyan-dark hover:underline flex items-center gap-1 truncate">
                      <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      {src.title || src.url}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500">{preview}</p>
        )}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ReportDisplay({ report, periodLabel }: { report: Report; periodLabel: string }) {
  const sources: RawSource[] = Array.isArray(report.raw_sources) ? report.raw_sources : [];
  const categoryInsights: string[] = Array.isArray(report.category_insights) ? report.category_insights : [];
  const brandInsights: string[] = Array.isArray(report.brand_insights) ? report.brand_insights : [];
  const competitorEntries = Object.entries(report.competitor_summaries ?? {});
  const comparison = report.period_comparison ?? null;
  const hasComparison =
    comparison &&
    (comparison.summary ||
      (comparison.new_category_insights?.length ?? 0) > 0 ||
      (comparison.new_brand_insights?.length ?? 0) > 0 ||
      (comparison.lost_category_insights?.length ?? 0) > 0 ||
      (comparison.lost_brand_insights?.length ?? 0) > 0);

  return (
    <div className="space-y-6">
      {/* Period label */}
      <div className="text-xs text-slate-500 font-medium">
        対象期間：{formatPeriodMonth(report.period_start)}
      </div>

      {/* 1. Period comparison */}
      {hasComparison && (
        <ComparisonSection comparison={comparison!} periodLabel={periodLabel} />
      )}

      {/* 2. Insights — 2-column */}
      {(categoryInsights.length > 0 || brandInsights.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            className="bg-white rounded-xl border border-slate-200 border-l-4 p-5 space-y-3"
            style={{ borderLeftColor: "#1D9E75" }}
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#1D9E75]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
              <h3 className="font-semibold text-slate-800 text-sm">カテゴリインサイト</h3>
            </div>
            <InsightList insights={categoryInsights} color="cyan" />
          </div>

          <div
            className="bg-white rounded-xl border border-slate-200 border-l-4 p-5 space-y-3"
            style={{ borderLeftColor: "#0C447C" }}
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#0C447C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h3 className="font-semibold text-slate-800 text-sm">ブランドインサイト</h3>
            </div>
            <InsightList insights={brandInsights} color="navy" />
          </div>
        </div>
      )}

      {/* 3. Category detail — section cards */}
      {report.category_summary && (
        <SummaryBlock
          title="カテゴリトレンド詳細"
          content={report.category_summary}
          accentColor="#1D9E75"
          icon={
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          }
          sectionPalette={SECTION_PALETTE}
          sectionIcons={SECTION_ICONS}
        />
      )}

      {/* 4. Brand detail — brand-specific 4-card layout */}
      {report.brand_summary && (
        <SummaryBlock
          title="ブランドトレンド詳細"
          content={cleanMarkdown(report.brand_summary)}
          accentColor="#0C447C"
          icon={
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          }
          sectionPalette={BRAND_SECTION_PALETTE}
          sectionIcons={BRAND_SECTION_ICONS}
        />
      )}

      {/* 5. Competitor section */}
      {competitorEntries.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h3 className="font-semibold text-slate-700 text-sm">競合ブランド比較</h3>
          </div>
          {competitorEntries.map(([name, data]) => (
            <CompetitorCard key={name} name={name} data={data} />
          ))}
        </div>
      )}

      {/* 6. Sources */}
      {sources.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <h3 className="font-semibold text-slate-700 text-sm">参照ソース</h3>
          </div>
          <ul className="space-y-1.5 columns-1 md:columns-2">
            {sources.map((src, i) => (
              <li key={i} className="break-inside-avoid">
                {src.url ? (
                  <a href={src.url} target="_blank" rel="noopener noreferrer"
                     className="flex items-center gap-1.5 text-xs text-sis-cyan-dark hover:underline">
                    <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    <span className="truncate">{src.title || src.url}</span>
                  </a>
                ) : (
                  <span className="text-xs text-slate-400">{src.title}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
