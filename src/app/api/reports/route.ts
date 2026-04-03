import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const project_id = searchParams.get("project_id");
  const period = searchParams.get("period");
  const all = searchParams.get("all");

  if (!project_id) {
    return NextResponse.json({ error: "project_id は必須です" }, { status: 400 });
  }

  // 全履歴取得
  if (all === "true") {
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .eq("project_id", project_id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ reports: data ?? [] });
  }

  // 特定 period の最新レポート1件
  if (!period) {
    return NextResponse.json({ error: "period は必須です" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("project_id", project_id)
    .eq("period_type", period)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ report: data ?? null });
}
