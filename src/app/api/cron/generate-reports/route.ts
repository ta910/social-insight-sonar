import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendEmail } from "@/lib/send-email";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  // Verify Vercel cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Compute previous month
  const now = new Date();
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const selectedYear = prevDate.getFullYear();
  const selectedMonth = prevDate.getMonth() + 1;
  const periodStart = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`;
  const displayMonth = `${selectedYear}年${selectedMonth}月`;

  // Fetch all auto-generate projects
  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("id, name, owner_email")
    .eq("auto_generate", true);

  if (projectsError) {
    return NextResponse.json({ error: projectsError.message }, { status: 500 });
  }

  if (!projects || projects.length === 0) {
    return NextResponse.json({ message: "対象プロジェクトなし", generated: 0 });
  }

  const host = request.headers.get("host")!;
  const protocol = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  const results: { project_id: string; status: string; error?: string }[] = [];

  for (const project of projects) {
    // Check if report already exists for this period
    const { data: existing } = await supabase
      .from("reports")
      .select("id")
      .eq("project_id", project.id)
      .eq("period_type", "monthly")
      .eq("period_start", periodStart)
      .maybeSingle();

    if (existing) {
      results.push({ project_id: project.id, status: "skipped (already exists)" });
      continue;
    }

    try {
      const genRes = await fetch(`${baseUrl}/api/reports/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: project.id,
          selectedYear,
          selectedMonth,
        }),
      });

      if (!genRes.ok) {
        const errData = await genRes.json();
        results.push({ project_id: project.id, status: "error", error: errData.error });
        continue;
      }

      results.push({ project_id: project.id, status: "generated" });

      // Send notification email if owner_email is set
      if (project.owner_email) {
        const projectUrl = `${baseUrl}/projects/${project.id}`;
        await sendEmail({
          to: project.owner_email,
          subject: `[${project.name}]の月次レポートが生成されました`,
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
              <h2 style="color: #0C447C;">${displayMonth}のレポートが完成しました</h2>
              <p>プロジェクト「${project.name}」の月次インサイトレポートが自動生成されました。</p>
              <ul style="color: #444;">
                <li>対象月：${displayMonth}</li>
                <li>プロジェクト：${project.name}</li>
              </ul>
              <p style="margin: 24px 0;">
                <a href="${projectUrl}"
                   style="background:#0C447C;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
                  レポートを確認する
                </a>
              </p>
            </div>
          `,
        }).catch((err) => {
          console.error(`Email send failed for ${project.owner_email}:`, err);
        });
      }
    } catch (err) {
      results.push({
        project_id: project.id,
        status: "error",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return NextResponse.json({ results, displayMonth });
}
