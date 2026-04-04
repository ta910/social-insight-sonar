"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ReportDisplay from "@/components/ReportDisplay";
import type { Project, Report, PeriodType } from "@/lib/types";

const PERIOD_LABELS: Record<PeriodType, string> = {
  weekly: "週次",
  monthly: "月次",
  yearly: "年次",
};

const PERIODS: PeriodType[] = ["weekly", "monthly", "yearly"];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function ProjectDashboard() {
  const params = useParams();
  const id = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [periodReports, setPeriodReports] = useState<Report[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [activePeriod, setActivePeriod] = useState<PeriodType>("weekly");
  const [generating, setGenerating] = useState(false);
  const [generatingStep, setGeneratingStep] = useState<string | null>(null);
  const [loadingReports, setLoadingReports] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportDate, setReportDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );

  const selectedReport = periodReports.find((r) => r.id === selectedReportId) ?? null;

  const fetchPeriodReports = useCallback(
    async (period: PeriodType) => {
      setLoadingReports(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/reports?project_id=${id}&period=${period}&all=true`
        );
        if (!res.ok) throw new Error("レポートの取得に失敗しました");
        const data = await res.json();
        const reports: Report[] = data.reports ?? [];
        setPeriodReports(reports);
        setSelectedReportId(reports.length > 0 ? reports[0].id : null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "エラーが発生しました");
      } finally {
        setLoadingReports(false);
      }
    },
    [id]
  );

  useEffect(() => {
    async function fetchProject() {
      try {
        const res = await fetch(`/api/projects?id=${id}`);
        if (!res.ok) return;
        const data = await res.json();
        setProject(data.project ?? null);
      } catch {
        // ignore
      }
    }
    fetchProject();
  }, [id]);

  useEffect(() => {
    fetchPeriodReports(activePeriod);
  }, [activePeriod, fetchPeriodReports]);

  async function handleGenerate() {
    setGenerating(true);
    setGeneratingStep("カテゴリトレンドを調査中...");
    setError(null);

    const hasCompetitors =
      project?.competitor_brands && project.competitor_brands.length > 0;

    const timers = [
      setTimeout(() => setGeneratingStep("ブランドトレンドを調査中..."), 10000),
      setTimeout(
        () =>
          setGeneratingStep(
            hasCompetitors ? "競合ブランドを調査中..." : "インサイトを生成中..."
          ),
        22000
      ),
      setTimeout(() => setGeneratingStep("インサイトを生成中..."), 38000),
      setTimeout(() => setGeneratingStep("前回との比較を分析中..."), 55000),
    ];

    try {
      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: id,
          period_type: activePeriod,
          period_start: reportDate,
        }),
      });
      timers.forEach(clearTimeout);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "レポート生成に失敗しました");
      }
      setGeneratingStep("保存中...");
      const { report } = await res.json();
      await fetchPeriodReports(activePeriod);
      setSelectedReportId(report.id);
    } catch (err) {
      timers.forEach(clearTimeout);
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setGenerating(false);
      setGeneratingStep(null);
    }
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-6">
          <div>
            {project ? (
              <>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-medium text-sis-cyan-dark bg-cyan-50 px-2.5 py-0.5 rounded-full">
                    {project.category}
                  </span>
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                    {project.brand}
                  </span>
                  {project.competitor_brands?.map((c) => (
                    <span
                      key={c}
                      className="text-xs font-medium text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full"
                    >
                      競合: {c}
                    </span>
                  ))}
                </div>
                <h1 className="text-2xl font-bold text-sis-navy">{project.name}</h1>
              </>
            ) : (
              <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
            )}
          </div>

          {/* Generate controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 self-start">
            <Link
              href={`/projects/${id}/history`}
              className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              過去レポート
            </Link>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                disabled={generating}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sis-cyan focus:border-transparent disabled:opacity-50 bg-white"
              />
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="inline-flex items-center gap-2 px-5 py-2 bg-sis-navy text-white text-sm font-semibold rounded-lg hover:bg-sis-navy-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {generating ? (
                  <>
                    <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span className="truncate max-w-[160px]">{generatingStep ?? "調査中..."}</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    レポート生成
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Period Tabs */}
        <div className="flex border-b border-slate-200 mb-4">
          {PERIODS.map((period) => (
            <button
              key={period}
              onClick={() => setActivePeriod(period)}
              className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                activePeriod === period
                  ? "border-sis-cyan text-sis-cyan-dark"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {PERIOD_LABELS[period]}
            </button>
          ))}
        </div>

        {/* Report selector dropdown */}
        {!loadingReports && periodReports.length > 0 && (
          <div className="flex items-center gap-3 mb-5">
            <span className="text-xs text-slate-500 shrink-0">閲覧中のレポート:</span>
            <select
              value={selectedReportId ?? ""}
              onChange={(e) => setSelectedReportId(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-sis-cyan bg-white text-slate-700"
            >
              {periodReports.map((r) => (
                <option key={r.id} value={r.id}>
                  {formatDate(r.period_start)} 生成
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-4 mb-5 bg-red-50 border border-red-200 rounded-lg">
            <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Report Content */}
        {loadingReports ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="h-4 w-32 bg-slate-200 rounded animate-pulse mb-4" />
                <div className="space-y-2">
                  <div className="h-3 bg-slate-100 rounded animate-pulse" />
                  <div className="h-3 bg-slate-100 rounded animate-pulse w-5/6" />
                  <div className="h-3 bg-slate-100 rounded animate-pulse w-4/6" />
                </div>
              </div>
            ))}
          </div>
        ) : selectedReport ? (
          <ReportDisplay report={selectedReport} periodLabel={PERIOD_LABELS[activePeriod]} />
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-dashed border-slate-300">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-slate-600 font-medium mb-2">
              {PERIOD_LABELS[activePeriod]}レポートがありません
            </p>
            <p className="text-sm text-slate-400 mb-5">
              日付を選択して「レポート生成」ボタンで調査します
            </p>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-5 py-2 bg-sis-navy text-white text-sm font-semibold rounded-lg hover:bg-sis-navy-muted transition-colors disabled:opacity-50"
            >
              {generating ? generatingStep ?? "調査中..." : "今すぐ生成"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
