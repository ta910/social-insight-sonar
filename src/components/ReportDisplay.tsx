"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Report, RawSource, PeriodComparison, CompetitorSummary } from "@/lib/types";

type Props = {
  report: Report;
  periodLabel: string;
};

// --- Insight classification helpers ---

type InsightTag = { label: string; bg: string; text: string };

function getInsightTag(insight: string): InsightTag {
  if (/増加|成長|拡大|機会|好機|上昇|改善|強化|好調|ポジティブ/.test(insight))
    return { label: "機会", bg: "bg-emerald-100", text: "text-emerald-700" };
  if (/リスク|脅威|低下|減少|問題|懸念|批判|ネガティブ|悪化|警戒/.test(insight))
    return { label: "脅威", bg: "bg-red-100", text: "text-red-700" };
  if (/トレンド|流行|急増|注目|人気|台頭|拡散|急速|新たな|急騰/.test(insight))
    return { label: "トレンド", bg: "bg-purple-100", text: "text-purple-700" };
  return { label: "要注意", bg: "bg-amber-100", text: "text-amber-700" };
}

type Sentiment = { label: string; bg: string; text: string };

function getSentiment(text: string): Sentiment {
  const pos = (text.match(/増加|成長|好調|人気|支持|好評|強み|機会|向上|改善/g) || []).length;
  const neg = (text.match(/低下|減少|問題|不満|批判|リスク|懸念|脅威|悪化/g) || []).length;
  if (pos > neg) return { label: "ポジティブ", bg: "bg-emerald-50", text: "text-emerald-700" };
  if (neg > pos) return { label: "ネガティブ", bg: "bg-red-50", text: "text-red-700" };
  return { label: "ニュートラル", bg: "bg-slate-100", text: "text-slate-600" };
}

// --- Sub-components ---

function SentimentBadge({ text }: { text: string }) {
  const s = getSentiment(text);
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

function InsightTagBadge({ insight }: { insight: string }) {
  const t = getInsightTag(insight);
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${t.bg} ${t.text} shrink-0`}>
      {t.label}
    </span>
  );
}

function InsightList({
  insights,
  badgeColor,
}: {
  insights: string[];
  badgeColor: { badge: string; badgeText: string; num: string; numText: string };
}) {
  if (insights.length === 0)
    return <p className="text-xs text-slate-400 italic">インサイトがありません</p>;
  return (
    <ul className="space-y-3">
      {insights.map((insight, i) => (
        <li key={i} className="flex items-start gap-2">
          <span
            className={`mt-0.5 w-5 h-5 rounded-full ${badgeColor.badge} ${badgeColor.badgeText} text-xs font-bold flex items-center justify-center shrink-0`}
          >
            {i + 1}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <InsightTagBadge insight={insight} />
            </div>
            <p className={`text-sm ${badgeColor.numText} leading-relaxed`}>{insight}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function SummaryAccordion({
  title,
  content,
  icon,
  sentiment,
}: {
  title: string;
  content: string;
  icon: React.ReactNode;
  sentiment: Sentiment;
}) {
  const [open, setOpen] = useState(false);
  const preview = content.slice(0, 200).replace(/#+\s*/g, "").replace(/\*\*/g, "") + (content.length > 200 ? "…" : "");

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden transition-shadow hover:shadow-md">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-6 py-4 text-left gap-3"
      >
        <div className="flex items-center gap-2 min-w-0">
          {icon}
          <h3 className="font-semibold text-slate-800 text-sm truncate">{title}</h3>
          <SentimentBadge text={content} />
          <span className={`text-xs px-2 py-0.5 rounded-full ${sentiment.bg} ${sentiment.text} hidden sm:block`}>
            {sentiment.label}
          </span>
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
          <div className="text-sm text-slate-600 leading-relaxed [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1 [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_p]:mb-2 [&_strong]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm text-slate-500 leading-relaxed">{preview}</p>
        )}
      </div>
    </div>
  );
}

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
              <p className="text-xs font-semibold text-emerald-600 mb-2 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                新たに登場した動向
              </p>
              <ul className="space-y-1.5">
                {[
                  ...(comparison.new_category_insights ?? []),
                  ...(comparison.new_brand_insights ?? []),
                ].map((item, i) => (
                  <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5 shrink-0">＋</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {hasLost && (
            <div>
              <p className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-300 inline-block" />
                前回から消えた動向
              </p>
              <ul className="space-y-1.5">
                {[
                  ...(comparison.lost_category_insights ?? []),
                  ...(comparison.lost_brand_insights ?? []),
                ].map((item, i) => (
                  <li key={i} className="text-sm text-slate-400 flex items-start gap-2 line-through">
                    <span className="shrink-0 no-underline" style={{ textDecoration: "none" }}>－</span>
                    <span>{item}</span>
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

function CompetitorCard({
  name,
  data,
}: {
  name: string;
  data: CompetitorSummary;
}) {
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
          <SentimentBadge text={data.summary} />
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

// --- Main component ---

export default function ReportDisplay({ report, periodLabel }: Props) {
  const sources: RawSource[] = Array.isArray(report.raw_sources) ? report.raw_sources : [];
  const categoryInsights: string[] = Array.isArray(report.category_insights) ? report.category_insights : [];
  const brandInsights: string[] = Array.isArray(report.brand_insights) ? report.brand_insights : [];
  const competitorSummaries = report.competitor_summaries ?? {};
  const competitorEntries = Object.entries(competitorSummaries);
  const comparison = report.period_comparison ?? null;
  const hasComparison =
    comparison &&
    (comparison.summary ||
      (comparison.new_category_insights?.length ?? 0) > 0 ||
      (comparison.new_brand_insights?.length ?? 0) > 0 ||
      (comparison.lost_category_insights?.length ?? 0) > 0 ||
      (comparison.lost_brand_insights?.length ?? 0) > 0);

  const categorySentiment = getSentiment(report.category_summary ?? "");
  const brandSentiment = getSentiment(report.brand_summary ?? "");

  return (
    <div className="space-y-5">
      {/* Meta */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span>調査基準: {new Date(report.period_start).toLocaleDateString("ja-JP")}</span>
        <span>·</span>
        <span>生成: {new Date(report.created_at).toLocaleDateString("ja-JP")}</span>
      </div>

      {/* 1. Period Comparison (if exists) */}
      {hasComparison && (
        <ComparisonSection comparison={comparison!} periodLabel={periodLabel} />
      )}

      {/* 2. Insights - 2 column grid */}
      {(categoryInsights.length > 0 || brandInsights.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Category Insights */}
          <div className="bg-emerald-950 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
              <h3 className="font-semibold text-emerald-300 text-sm">カテゴリインサイト</h3>
            </div>
            <InsightList
              insights={categoryInsights}
              badgeColor={{
                badge: "bg-emerald-400",
                badgeText: "text-emerald-950",
                num: "emerald",
                numText: "text-emerald-100",
              }}
            />
          </div>

          {/* Brand Insights */}
          <div className="bg-sky-950 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h3 className="font-semibold text-sky-300 text-sm">ブランドインサイト</h3>
            </div>
            <InsightList
              insights={brandInsights}
              badgeColor={{
                badge: "bg-sky-400",
                badgeText: "text-sky-950",
                num: "sky",
                numText: "text-sky-100",
              }}
            />
          </div>
        </div>
      )}

      {/* 3. Category Summary Accordion */}
      <SummaryAccordion
        title="カテゴリトレンド詳細"
        content={report.category_summary ?? ""}
        sentiment={categorySentiment}
        icon={
          <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
            <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          </div>
        }
      />

      {/* 4. Brand Summary Accordion */}
      <SummaryAccordion
        title="ブランドトレンド詳細"
        content={report.brand_summary ?? ""}
        sentiment={brandSentiment}
        icon={
          <div className="w-6 h-6 rounded-lg bg-sky-50 flex items-center justify-center shrink-0">
            <svg className="w-3.5 h-3.5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        }
      />

      {/* 5. Competitor Section */}
      {competitorEntries.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h3 className="font-semibold text-slate-700 text-sm">競合ブランド比較</h3>
          </div>
          <div className="space-y-3">
            {competitorEntries.map(([name, data]) => (
              <CompetitorCard key={name} name={name} data={data} />
            ))}
          </div>
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
                    className="flex items-center gap-1.5 text-xs text-sis-cyan-dark hover:underline truncate"
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
