import ReactMarkdown from "react-markdown";
import type { Report, RawSource } from "@/lib/types";

type Props = {
  report: Report;
};

function InsightCard({
  insights,
  title,
  color,
}: {
  insights: string[];
  title: string;
  color: "green" | "blue";
}) {
  const palette = {
    green: {
      card: "bg-emerald-950",
      badge: "bg-emerald-400 text-emerald-950",
      text: "text-emerald-100",
      header: "text-emerald-300",
      icon: "text-emerald-400",
    },
    blue: {
      card: "bg-sky-950",
      badge: "bg-sky-400 text-sky-950",
      text: "text-sky-100",
      header: "text-sky-300",
      icon: "text-sky-400",
    },
  }[color];

  return (
    <div className={`${palette.card} rounded-xl p-5 flex flex-col gap-3`}>
      <div className="flex items-center gap-2">
        {color === "green" ? (
          <svg className={`w-4 h-4 ${palette.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
        ) : (
          <svg className={`w-4 h-4 ${palette.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )}
        <h3 className={`font-semibold text-sm ${palette.header}`}>{title}</h3>
      </div>
      {insights.length === 0 ? (
        <p className="text-xs text-slate-500">インサイトがありません</p>
      ) : (
        <ul className="space-y-2.5">
          {insights.map((insight, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className={`mt-0.5 w-5 h-5 rounded-full ${palette.badge} text-xs font-bold flex items-center justify-center shrink-0`}>
                {i + 1}
              </span>
              <span className={`text-sm ${palette.text} leading-relaxed`}>{insight}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ReportDisplay({ report }: Props) {
  const sources: RawSource[] = Array.isArray(report.raw_sources) ? report.raw_sources : [];
  const categoryInsights: string[] = Array.isArray(report.category_insights) ? report.category_insights : [];
  const brandInsights: string[] = Array.isArray(report.brand_insights) ? report.brand_insights : [];

  return (
    <div className="space-y-5">
      {/* Period */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span>調査期間開始: {new Date(report.period_start).toLocaleDateString("ja-JP")}</span>
        <span className="mx-1">·</span>
        <span>生成日: {new Date(report.created_at).toLocaleDateString("ja-JP")}</span>
      </div>

      {/* 1. Key Insights (top, 2-column) */}
      {(categoryInsights.length > 0 || brandInsights.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InsightCard insights={categoryInsights} title="カテゴリインサイト" color="green" />
          <InsightCard insights={brandInsights} title="ブランドインサイト" color="blue" />
        </div>
      )}

      {/* 2. Category Summary */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          <h3 className="font-semibold text-slate-800 text-sm">カテゴリトレンド詳細</h3>
        </div>
        <div className="text-sm text-slate-600 leading-relaxed [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1 [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_p]:mb-2 [&_strong]:font-semibold">
          <ReactMarkdown>{report.category_summary}</ReactMarkdown>
        </div>
      </div>

      {/* 3. Brand Summary */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-sky-50 flex items-center justify-center">
            <svg className="w-4 h-4 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="font-semibold text-slate-800 text-sm">ブランドトレンド詳細</h3>
        </div>
        <div className="text-sm text-slate-600 leading-relaxed [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1 [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_p]:mb-2 [&_strong]:font-semibold">
          <ReactMarkdown>{report.brand_summary}</ReactMarkdown>
        </div>
      </div>

      {/* Sources */}
      {sources.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <h3 className="font-semibold text-slate-800 text-sm">参照ソース</h3>
          </div>
          <ul className="space-y-2">
            {sources.map((src, i) => (
              <li key={i}>
                {src.url ? (
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-sis-cyan-dark hover:underline"
                  >
                    <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    {src.title || src.url}
                  </a>
                ) : (
                  <span className="text-sm text-slate-500">{src.title}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
