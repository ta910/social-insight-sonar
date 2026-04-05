"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Report, RawSource, PeriodComparison, CompetitorSummary } from "@/lib/types";

type Props = {
  report: Report;
  periodLabel: string;
};

// --- Insight tag classification ---

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

// --- Markdown preprocessing: ensure blank line before bullet lists ---
function prepareMarkdown(text: string): string {
  return text
    .replace(/([^\n])\n(- )/g, "$1\n\n$2")
    .replace(/([^\n])\n(\d+\. )/g, "$1\n\n$2");
}

// --- Period display helper ---
function formatPeriodMonth(dateStr: string): string {
  // dateStr is like "2026-03-01"
  const parts = dateStr.split("-");
  if (parts.length >= 2) {
    return `${parseInt(parts[0])}年${parseInt(parts[1])}月`;
  }
  return dateStr;
}

// --- Insight list ---

function InsightList({
  insights,
  color,
}: {
  insights: string[];
  color: "cyan" | "navy";
}) {
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

// --- Accordion for summaries ---

function SummaryAccordion({
  title,
  content,
  icon,
}: {
  title: string;
  content: string;
  icon: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const preview =
    content
      .slice(0, 200)
      .replace(/#+\s*/g, "")
      .replace(/\*\*/g, "")
      .replace(/^- /gm, "")
      .trim() + (content.length > 200 ? "…" : "");

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden transition-shadow hover:shadow-md">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-6 py-4 text-left gap-3"
      >
        <div className="flex items-center gap-2 min-w-0">
          {icon}
          <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
        </div>
        <svg
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className="px-6 pb-5">
        {open ? (
          <div className="text-sm text-slate-600 leading-relaxed prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1 [&_p]:mb-2 [&_strong]:font-semibold [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1 [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1 [&_li]:leading-relaxed">
            <ReactMarkdown>{prepareMarkdown(content)}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm text-slate-500 leading-relaxed">{preview}</p>
        )}
      </div>
    </div>
  );
}

// --- Period comparison ---

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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
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

// --- Competitor card ---

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
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
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
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-sis-cyan-dark hover:underline flex items-center gap-1 truncate"
                    >
                      <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
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

// --- Main ---

export default function ReportDisplay({ report, periodLabel }: Props) {
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
    <div className="space-y-5">
      {/* Period */}
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
          {/* Category */}
          <div
            className="bg-white rounded-xl border border-slate-200 border-l-4 p-5 space-y-3"
            style={{ borderLeftColor: "#1D9E75" }}
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#1D9E75]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
              <h3 className="font-semibold text-slate-800 text-sm">カテゴリインサイト</h3>
            </div>
            <InsightList insights={categoryInsights} color="cyan" />
          </div>

          {/* Brand */}
          <div
            className="bg-white rounded-xl border border-slate-200 border-l-4 p-5 space-y-3"
            style={{ borderLeftColor: "#0C447C" }}
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#0C447C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h3 className="font-semibold text-slate-800 text-sm">ブランドインサイト</h3>
            </div>
            <InsightList insights={brandInsights} color="navy" />
          </div>
        </div>
      )}

      {/* 3. Category summary accordion */}
      <SummaryAccordion
        title="カテゴリトレンド詳細"
        content={report.category_summary ?? ""}
        icon={
          <div className="w-6 h-6 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
            <svg className="w-3.5 h-3.5 text-[#1D9E75]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          </div>
        }
      />

      {/* 4. Brand summary accordion */}
      <SummaryAccordion
        title="ブランドトレンド詳細"
        content={report.brand_summary ?? ""}
        icon={
          <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <svg className="w-3.5 h-3.5 text-[#0C447C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        }
      />

      {/* 5. Competitor section */}
      {competitorEntries.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <h3 className="font-semibold text-slate-700 text-sm">参照ソース</h3>
          </div>
          <ul className="space-y-1.5 columns-1 md:columns-2">
            {sources.map((src, i) => (
              <li key={i} className="break-inside-avoid">
                {src.url ? (
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-sis-cyan-dark hover:underline"
                  >
                    <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
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
