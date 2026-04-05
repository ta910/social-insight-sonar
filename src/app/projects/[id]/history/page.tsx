"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ReportDisplay from "@/components/ReportDisplay";
import type { Report } from "@/lib/types";

function formatPeriodMonth(dateStr: string): string {
  const parts = dateStr.split("-");
  if (parts.length >= 2) return `${parseInt(parts[0])}年${parseInt(parts[1])}月`;
  return dateStr;
}

export default function HistoryPage() {
  const params = useParams();
  const id = params.id as string;

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  async function handleDelete(reportId: string) {
    const confirmed = window.confirm("このレポートを削除しますか？");
    if (!confirmed) return;

    setDeletingId(reportId);
    try {
      const res = await fetch(`/api/reports/${reportId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "削除に失敗しました");
        return;
      }
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      if (expanded === reportId) setExpanded(null);
    } finally {
      setDeletingId(null);
    }
  }

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
              const isDeleting = deletingId === report.id;
              return (
                <div
                  key={report.id}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden"
                >
                  {/* Summary row */}
                  <div className="flex items-center justify-between px-6 py-4">
                    <button
                      onClick={() => setExpanded(isOpen ? null : report.id)}
                      className="flex items-center gap-3 flex-1 text-left"
                    >
                      <span className="text-sm font-medium text-slate-700">
                        {formatPeriodMonth(report.period_start)}
                      </span>
                      <span className="text-xs text-slate-400">
                        生成: {new Date(report.created_at).toLocaleDateString("ja-JP")}
                      </span>
                      <svg
                        className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(report.id)}
                      disabled={isDeleting}
                      className="ml-3 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                      title="このレポートを削除"
                    >
                      {isDeleting ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Expanded detail */}
                  {isOpen && (
                    <div className="px-6 pb-6 border-t border-slate-100">
                      <div className="pt-5">
                        <ReportDisplay report={report} periodLabel="月次" />
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
