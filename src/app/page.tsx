import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Project } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch projects:", error);
    return [];
  }
  return data ?? [];
}

export default async function HomePage() {
  const projects = await getProjects();

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-sis-navy">プロジェクト一覧</h1>
            <p className="text-sm text-slate-500 mt-1">
              {projects.length} 件のプロジェクト
            </p>
          </div>
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-sis-cyan text-sis-navy font-semibold rounded-lg hover:bg-sis-cyan-dark hover:text-white transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新規プロジェクト
          </Link>
        </div>

        {/* Project cards */}
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-slate-700 mb-2">
              プロジェクトがありません
            </h2>
            <p className="text-sm text-slate-400 mb-6">
              最初のプロジェクトを作成して、トレンドを調査しましょう。
            </p>
            <Link
              href="/projects/new"
              className="px-5 py-2.5 bg-sis-cyan text-sis-navy font-semibold rounded-lg hover:bg-sis-cyan-dark hover:text-white transition-colors text-sm"
            >
              プロジェクトを作成
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="group block bg-white rounded-xl border border-slate-200 p-6 hover:border-sis-cyan hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-sis-navy flex items-center justify-center">
                    <svg className="w-5 h-5 text-sis-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <svg className="w-4 h-4 text-slate-300 group-hover:text-sis-cyan transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h2 className="font-bold text-sis-navy text-base mb-2 group-hover:text-sis-cyan-dark transition-colors">
                  {project.name}
                </h2>
                <div className="flex gap-2 flex-wrap mb-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                    {project.category}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-50 text-sis-cyan-dark">
                    {project.brand}
                  </span>
                </div>
                {project.keywords?.length > 0 && (
                  <p className="text-xs text-slate-400 truncate">
                    {project.keywords.join(" · ")}
                  </p>
                )}
                <p className="text-xs text-slate-400 mt-3">
                  {new Date(project.created_at).toLocaleDateString("ja-JP")}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
