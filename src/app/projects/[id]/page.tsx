"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ReportDisplay from "@/components/ReportDisplay";
import type { Project, Report } from "@/lib/types";

type ActiveTab = "weekly" | "monthly";

function getPrevMonth(): { year: number; month: number } {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

function formatYearMonth(year: number, month: number) {
  return `${year}年${month}月`;
}

function formatPeriodStart(dateStr: string) {
  const parts = dateStr.split("-");
  if (parts.length >= 2) return `${parseInt(parts[0])}年${parseInt(parts[1])}月`;
  return dateStr;
}

// --- Weekly placeholder ---
const MOCK_BARS = [40, 65, 45, 80, 55, 90, 70, 60, 85, 50, 75, 95, 65, 45];
const DAYS = ["月", "火", "水", "木", "金", "土", "日"];

function WeeklyPlaceholder() {
  return (
    <div className="space-y-5">
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="font-semibold text-slate-600 mb-2">近日公開予定</h3>
        <p className="text-sm text-slate-400 leading-relaxed">
          X（旧Twitter）のツイート数・Google検索数のトレンドグラフと<br />
          その週の特徴的な記事・ツイートが表示されます
        </p>
      </div>

      {/* Mock graph */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 opacity-40 pointer-events-none select-none">
        <div className="flex items-center justify-between mb-5">
          <div className="h-3.5 w-32 bg-slate-200 rounded" />
          <div className="h-3 w-20 bg-slate-100 rounded" />
        </div>
        <div className="flex items-end gap-1.5 h-28 mb-3">
          {MOCK_BARS.map((h, i) => (
            <div
              key={i}
              className="flex-1 bg-slate-200 rounded-t"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        <div className="grid grid-cols-7 text-center">
          {DAYS.map((d) => (
            <span key={d} className="text-xs text-slate-300">{d}</span>
          ))}
        </div>
        <div className="mt-5 space-y-2">
          {[80, 65, 50].map((w, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-slate-200 shrink-0" />
              <div className="h-2.5 bg-slate-100 rounded" style={{ width: `${w}%` }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Competitor CTA (shown when project has no competitor_brands) ---
function CompetitorCTA({ projectId }: { projectId: string }) {
  return (
    <div className="bg-white rounded-xl border border-dashed border-slate-300 p-6 text-center">
      <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center mx-auto mb-3">
        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <p className="text-sm font-medium text-slate-600 mb-1">競合ブランドが未設定です</p>
      <p className="text-xs text-slate-400 mb-4">
        競合ブランドを設定すると、レポート生成時に競合との比較分析が自動で追加されます
      </p>
      <Link
        href={`/projects/${projectId}/edit`}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-100 text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        プロジェクト設定で競合を追加
      </Link>
    </div>
  );
}

// --- Main dashboard ---

export default function ProjectDashboard() {
  const params = useParams();
  const id = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [monthlyReports, setMonthlyReports] = useState<Report[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("monthly");
  const [generating, setGenerating] = useState(false);
  const [generatingStep, setGeneratingStep] = useState<string | null>(null);
  const [loadingReports, setLoadingReports] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Year/month picker state (default: previous month)
  const prev = getPrevMonth();
  const [selectedYear, setSelectedYear] = useState(prev.year);
  const [selectedMonth, setSelectedMonth] = useState(prev.month);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-based

  const yearOptions = [currentYear - 1, currentYear];

  // Only allow months strictly before current month for the selected year
  const availableMonths = Array.from({ length: 12 }, (_, i) => i + 1).filter((m) => {
    if (selectedYear < currentYear) return true;
    if (selectedYear === currentYear) return m < currentMonth;
    return false;
  });

  const selectedReport = monthlyReports.find((r) => r.id === selectedReportId) ?? null;

  // When year changes, clamp selectedMonth to an available month
  function handleYearChange(newYear: number) {
    setSelectedYear(newYear);
    if (newYear === currentYear && selectedMonth >= currentMonth) {
      setSelectedMonth(currentMonth - 1 > 0 ? currentMonth - 1 : 12);
    }
  }

  const fetchMonthlyReports = useCallback(async () => {
    setLoadingReports(true);
    setError(null);
    try {
      const res = await fetch(`/api/reports?project_id=${id}&period=monthly&all=true`);
      if (!res.ok) throw new Error("レポートの取得に失敗しました");
      const data = await res.json();
      const reports: Report[] = data.reports ?? [];
      setMonthlyReports(reports);
      setSelectedReportId(reports.length > 0 ? reports[0].id : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoadingReports(false);
    }
  }, [id]);

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
    fetchMonthlyReports();
  }, [fetchMonthlyReports]);

  async function handleGenerate() {
    setGenerating(true);
    setGeneratingStep("カテゴリトレンドを調査中...");
    setError(null);

    const hasCompetitors =
      project?.competitor_brands && project.competitor_brands.length > 0;

    const timers = [
      setTimeout(() => setGeneratingStep("ブランドトレンドを調査中..."), 10000),
      setTimeout(
        () => setGeneratingStep(hasCompetitors ? "競合ブランドを調査中..." : "インサイトを生成中..."),
        22000
      ),
      setTimeout(() => setGeneratingStep("インサイトを生成中..."), 38000),
      setTimeout(() => setGeneratingStep("前月との比較を分析中..."), 55000),
    ];

    try {
      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: id,
          selectedYear,
          selectedMonth,
        }),
      });
      timers.forEach(clearTimeout);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "レポート生成に失敗しました");
      }
      setGeneratingStep("保存中...");
      const { report } = await res.json();
      await fetchMonthlyReports();
      setSelectedReportId(report.id);
    } catch (err) {
      timers.forEach(clearTimeout);
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setGenerating(false);
      setGeneratingStep(null);
    }
  }

  const hasCompetitors = (project?.competitor_brands?.length ?? 0) > 0;

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-5xl mx-auto">

        {/* Project header */}
        <div className="mb-6">
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
                  <span key={c} className="text-xs font-medium text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full">
                    競合: {c}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-sis-navy">{project.name}</h1>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/projects/${id}/edit`}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    プロジェクト設定
                  </Link>
                  <Link
                    href={`/projects/${id}/history`}
                    className="text-sm font-medium text-slate-500 hover:text-slate-700 underline underline-offset-2 transition-colors"
                  >
                    過去レポート一覧
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 mb-6">
          {(["weekly", "monthly"] as ActiveTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-sis-cyan text-sis-cyan-dark"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab === "weekly" ? "週次トレンド" : "月次レポート"}
            </button>
          ))}
        </div>

        {/* Weekly tab */}
        {activeTab === "weekly" && <WeeklyPlaceholder />}

        {/* Monthly tab */}
        {activeTab === "monthly" && (
          <>
            {/* Controls */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 mb-5 space-y-3">
              {/* Year/month selector + generate */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-slate-500">対象月：</span>
                <select
                  value={selectedYear}
                  onChange={(e) => handleYearChange(Number(e.target.value))}
                  disabled={generating}
                  className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-sis-cyan bg-white disabled:opacity-50"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>{y}年</option>
                  ))}
                </select>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  disabled={generating || availableMonths.length === 0}
                  className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-sis-cyan bg-white disabled:opacity-50"
                >
                  {availableMonths.map((m) => (
                    <option key={m} value={m}>{m}月</option>
                  ))}
                </select>
                <button
                  onClick={handleGenerate}
                  disabled={generating || availableMonths.length === 0}
                  className="inline-flex items-center gap-2 px-5 py-1.5 bg-sis-navy text-white text-sm font-semibold rounded-lg hover:bg-sis-navy-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? (
                    <>
                      <svg className="w-3.5 h-3.5 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span className="max-w-[180px] truncate">{generatingStep ?? "調査中..."}</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      {formatYearMonth(selectedYear, selectedMonth)}のレポートを生成
                    </>
                  )}
                </button>
              </div>

              {/* Report selector dropdown */}
              {!loadingReports && monthlyReports.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-500 shrink-0">閲覧中：</span>
                  <select
                    value={selectedReportId ?? ""}
                    onChange={(e) => setSelectedReportId(e.target.value)}
                    className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-sis-cyan bg-white text-slate-700"
                  >
                    {monthlyReports.map((r) => (
                      <option key={r.id} value={r.id}>
                        {formatPeriodStart(r.period_start)} 生成
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-4 mb-5 bg-red-50 border border-red-200 rounded-lg">
                <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Report content */}
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
              <div className="space-y-5">
                <ReportDisplay report={selectedReport} periodLabel="月次" />

                {/* Competitor section */}
                {!hasCompetitors && project && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <h3 className="font-semibold text-slate-700 text-sm">競合比較</h3>
                    </div>
                    <CompetitorCTA projectId={id} />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-dashed border-slate-300">
                  <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-slate-600 font-medium mb-2">月次レポートがありません</p>
                  <p className="text-sm text-slate-400 mb-5">
                    対象月を選択して「レポートを生成」してください
                  </p>
                  <button
                    onClick={handleGenerate}
                    disabled={generating || availableMonths.length === 0}
                    className="px-5 py-2 bg-sis-navy text-white text-sm font-semibold rounded-lg hover:bg-sis-navy-muted transition-colors disabled:opacity-50"
                  >
                    {generating ? generatingStep ?? "調査中..." : "今すぐ生成"}
                  </button>
                </div>

                {/* Competitor CTA even when no report */}
                {!hasCompetitors && project && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <h3 className="font-semibold text-slate-700 text-sm">競合比較</h3>
                    </div>
                    <CompetitorCTA projectId={id} />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
