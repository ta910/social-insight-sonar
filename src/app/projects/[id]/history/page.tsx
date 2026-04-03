"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ReportDisplay from "@/components/ReportDisplay";
import type { Report, PeriodType } from "@/lib/types";

const PERIOD_LABELS: Record<PeriodType, string> = {
  weekly: "週次",
  monthly: "月次",
  yearly: "年次",
};

const PERIOD_COLORS: Record<PeriodType, string> = {
  weekly: "bg-cyan-50 text-sis-cyan-dark",
  monthly: "bg-purple-50 text-purple-600",
  yearly: "bg-amber-50 text-amber-600",
};

export default function HistoryPage() {
  const params = useParams();
  const id = params.id as string;

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAll() {
      try {
        const res = await fetch(`/api/reports?project_id=${id}&all=true`);
        if (!res.ok) return;
        const data = await res.json();
        setReports(data.reports ?? []);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [id]);

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href={`/projects/${id}`}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
          >
            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-sis-navy">過去レポート一覧</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {reports.length} 件のレポート
            </p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="h-4 w-48 bg-slate-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-slate-300 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-slate-600 font-medium">レポートがまだありません</p>
            <Link
              href={`/projects/${id}`}
              className="mt-4 text-sm text-sis-cyan-dark hover:underline"
            >
              ダッシュボードに戻る
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => {
              const isOpen = expanded === report.id;
              return (
                <div
                  key={report.id}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden"
                >
                  {/* Summary row */}
                  <button
                    onClick={() => setExpanded(isOpen ? null : report.id)}
                    className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          PERIOD_COLORS[report.period_type]
                        }`}
                      >
                        {PERIOD_LABELS[report.period_type]}
                      </span>
                      <span className="text-sm font-medium text-slate-700">
                        {new Date(report.period_start).toLocaleDateString("ja-JP")} 〜
                      </span>
                      <span className="text-xs text-slate-400">
                        生成: {new Date(report.created_at).toLocaleDateString("ja-JP")}
                      </span>
                    </div>
                    <svg
                      className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Expanded detail */}
                  {isOpen && (
                    <div className="px-6 pb-6 border-t border-slate-100">
                      <div className="pt-5">
                        <ReportDisplay report={report} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
