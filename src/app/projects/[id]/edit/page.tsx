"use client";

import { useState, useEffect, KeyboardEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", category: "", brand: "", keywords: "" });
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [competitorInput, setCompetitorInput] = useState("");

  useEffect(() => {
    async function fetchProject() {
      try {
        const res = await fetch(`/api/projects?id=${id}`);
        if (!res.ok) throw new Error("プロジェクトが見つかりません");
        const data = await res.json();
        const p = data.project;
        setForm({
          name: p.name ?? "",
          category: p.category ?? "",
          brand: p.brand ?? "",
          keywords: (p.keywords ?? []).join(", "),
        });
        setCompetitors(p.competitor_brands ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "エラーが発生しました");
      } finally {
        setLoading(false);
      }
    }
    fetchProject();
  }, [id]);

  function addCompetitor(value: string) {
    const trimmed = value.trim();
    if (trimmed && !competitors.includes(trimmed)) {
      setCompetitors((prev) => [...prev, trimmed]);
    }
    setCompetitorInput("");
  }

  function handleCompetitorKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addCompetitor(competitorInput);
    } else if (e.key === "Backspace" && competitorInput === "" && competitors.length > 0) {
      setCompetitors((prev) => prev.slice(0, -1));
    }
  }

  function removeCompetitor(brand: string) {
    setCompetitors((prev) => prev.filter((c) => c !== brand));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (competitorInput.trim()) addCompetitor(competitorInput);
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/projects?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          category: form.category,
          brand: form.brand,
          keywords: form.keywords.split(",").map((k) => k.trim()).filter(Boolean),
          competitor_brands: competitors,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "保存に失敗しました");
      }

      router.push(`/projects/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      "このプロジェクトと全レポートを削除しますか？\nこの操作は取り消せません。"
    );
    if (!confirmed) return;

    setDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/projects?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "削除に失敗しました");
      }
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
      setDeleting(false);
    }
  }

  const inputClass =
    "w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sis-cyan focus:border-transparent transition";

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
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
            <h1 className="text-2xl font-bold text-sis-navy">プロジェクト設定</h1>
            <p className="text-sm text-slate-500 mt-1">プロジェクトの情報を編集します</p>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-slate-200 p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Project Name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    プロジェクト名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={inputClass}
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    カテゴリ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className={inputClass}
                  />
                </div>

                {/* Brand */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    ブランド名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    className={inputClass}
                  />
                </div>

                {/* Keywords */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    キーワード（任意）
                  </label>
                  <input
                    type="text"
                    placeholder="例: エコ, 泡立ち, 詰め替え"
                    value={form.keywords}
                    onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                    className={inputClass}
                  />
                  <p className="text-xs text-slate-400 mt-1">カンマ区切りで複数のキーワードを入力できます</p>
                </div>

                {/* Competitor Brands */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    競合ブランド（任意・最大3件）
                  </label>
                  <div
                    className="min-h-[44px] w-full px-3 py-2 rounded-lg border border-slate-200 focus-within:ring-2 focus-within:ring-sis-cyan focus-within:border-transparent transition flex flex-wrap gap-2 items-center cursor-text"
                    onClick={() => document.getElementById("competitor-input")?.focus()}
                  >
                    {competitors.map((comp) => (
                      <span
                        key={comp}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-sis-navy text-white text-xs font-medium rounded-full"
                      >
                        {comp}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeCompetitor(comp); }}
                          className="hover:opacity-70 transition-opacity"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                    {competitors.length < 3 && (
                      <input
                        id="competitor-input"
                        type="text"
                        placeholder={competitors.length === 0 ? "例: 花王キュキュット" : "追加..."}
                        value={competitorInput}
                        onChange={(e) => setCompetitorInput(e.target.value)}
                        onKeyDown={handleCompetitorKeyDown}
                        onBlur={() => { if (competitorInput.trim()) addCompetitor(competitorInput); }}
                        className="flex-1 min-w-[140px] text-sm text-slate-800 placeholder-slate-400 outline-none bg-transparent"
                      />
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Enter またはカンマで追加（最大3件）
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Link
                    href={`/projects/${id}`}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors text-center"
                  >
                    キャンセル
                  </Link>
                  <button
                    type="submit"
                    disabled={saving || deleting}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-sis-navy text-white text-sm font-semibold hover:bg-sis-navy-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? "保存中..." : "変更を保存"}
                  </button>
                </div>
              </form>
            </div>

            {/* Danger zone */}
            <div className="mt-6 bg-white rounded-xl border border-red-200 p-6">
              <h2 className="text-sm font-semibold text-red-600 mb-1">危険な操作</h2>
              <p className="text-xs text-slate-500 mb-4">
                プロジェクトを削除すると、関連する全てのレポートも削除されます。この操作は取り消せません。
              </p>
              <button
                onClick={handleDelete}
                disabled={deleting || saving}
                className="px-4 py-2 rounded-lg border border-red-300 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? "削除中..." : "プロジェクトを削除"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
