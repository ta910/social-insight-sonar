import Link from "next/link";

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-full py-24 text-center">
      <h1 className="text-4xl font-bold text-sis-navy mb-4">404</h1>
      <p className="text-slate-500 mb-6">ページが見つかりません</p>
      <Link
        href="/"
        className="px-5 py-2 bg-sis-navy text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
      >
        トップへ戻る
      </Link>
    </div>
  );
}
