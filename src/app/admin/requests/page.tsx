"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

type SignupRequest = {
  id: string;
  name: string;
  email: string;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  approved_at: string | null;
};

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  pending: { label: "審査中", cls: "bg-amber-100 text-amber-700" },
  approved: { label: "承認済", cls: "bg-green-100 text-green-700" },
  rejected: { label: "却下", cls: "bg-red-100 text-red-700" },
};

export default function AdminRequestsPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [requests, setRequests] = useState<SignupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.email !== ADMIN_EMAIL) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setIsAdmin(true);
      await fetchRequests();
    }
    init();
  }, []); // fetchRequests is defined inside the effect scope intentionally

  async function fetchRequests() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/requests");
      if (!res.ok) return;
      const data = await res.json();
      setRequests(data.requests ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(id: string, action: "approve" | "reject") {
    const label = action === "approve" ? "承認" : "却下";
    if (!window.confirm(`この申請を${label}しますか？`)) return;

    setProcessingId(id);
    try {
      const res = await fetch("/api/admin/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "操作に失敗しました");
        return;
      }
      await fetchRequests();
    } finally {
      setProcessingId(null);
    }
  }

  if (isAdmin === false) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-slate-600 font-medium mb-2">アクセス権限がありません</p>
          <Link href="/" className="text-sm text-sis-cyan-dark hover:underline">
            ホームに戻る
          </Link>
        </div>
      </div>
    );
  }

  const pending = requests.filter((r) => r.status === "pending");
  const others = requests.filter((r) => r.status !== "pending");

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-sis-navy">申請管理</h1>
          <p className="text-sm text-slate-500 mt-1">
            審査中 {pending.length} 件 / 合計 {requests.length} 件
          </p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-white rounded-xl border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
            <p className="text-slate-500">申請がまだありません</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Pending */}
            {pending.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  審査待ち
                </h2>
                <div className="space-y-3">
                  {pending.map((req) => (
                    <RequestCard
                      key={req.id}
                      req={req}
                      processing={processingId === req.id}
                      onAction={handleAction}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Others */}
            {others.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  処理済み
                </h2>
                <div className="space-y-3">
                  {others.map((req) => (
                    <RequestCard
                      key={req.id}
                      req={req}
                      processing={processingId === req.id}
                      onAction={handleAction}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function RequestCard({
  req,
  processing,
  onAction,
}: {
  req: SignupRequest;
  processing: boolean;
  onAction: (id: string, action: "approve" | "reject") => void;
}) {
  const statusInfo = STATUS_LABELS[req.status] ?? STATUS_LABELS.pending;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-800">{req.name}</span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusInfo.cls}`}
            >
              {statusInfo.label}
            </span>
          </div>
          <p className="text-sm text-slate-500">{req.email}</p>
          {req.reason && (
            <p className="text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2 mt-2">
              {req.reason}
            </p>
          )}
          <p className="text-xs text-slate-400">
            {new Date(req.created_at).toLocaleDateString("ja-JP")}
          </p>
        </div>

        {req.status === "pending" && (
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => onAction(req.id, "approve")}
              disabled={processing}
              className="px-4 py-1.5 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {processing ? "処理中..." : "承認"}
            </button>
            <button
              onClick={() => onAction(req.id, "reject")}
              disabled={processing}
              className="px-4 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              却下
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
