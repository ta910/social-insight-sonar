import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getServerUser } from "@/lib/supabase-server";
import { sendEmail } from "@/lib/send-email";

export const dynamic = "force-dynamic";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

async function checkAdmin(): Promise<boolean> {
  const user = await getServerUser();
  return user?.email === ADMIN_EMAIL;
}

export async function GET() {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("signup_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ requests: data ?? [] });
}

export async function PATCH(request: NextRequest) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  try {
    const { id, action } = await request.json();

    if (!id || !action) {
      return NextResponse.json({ error: "id と action は必須です" }, { status: 400 });
    }

    if (action === "reject") {
      const { error } = await supabase
        .from("signup_requests")
        .update({ status: "rejected" })
        .eq("id", id);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    if (action === "approve") {
      // Get the request details
      const { data: reqData, error: reqError } = await supabase
        .from("signup_requests")
        .select("*")
        .eq("id", id)
        .single();

      if (reqError || !reqData) {
        return NextResponse.json({ error: "申請が見つかりません" }, { status: 404 });
      }

      const supabaseAdmin = getSupabaseAdmin();

      // Create Supabase Auth user
      const { error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: reqData.email,
        email_confirm: true,
        password: crypto.randomUUID() + "Aa1!", // temporary; user sets via recovery link
      });

      if (createError && createError.message !== "User already registered") {
        return NextResponse.json({ error: createError.message }, { status: 500 });
      }

      // Generate password recovery link
      const { data: linkData, error: linkError } =
        await supabaseAdmin.auth.admin.generateLink({
          type: "recovery",
          email: reqData.email,
        });

      if (linkError || !linkData) {
        return NextResponse.json({ error: "リンク生成に失敗しました" }, { status: 500 });
      }

      const actionLink = linkData.properties.action_link;

      // Send welcome email via Resend
      await sendEmail({
        to: reqData.email,
        subject: "Social Insight Sonar へようこそ — パスワードを設定してください",
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #0C447C;">${reqData.name} さん、ようこそ！</h2>
            <p>Social Insight Sonar のアカウントが承認されました。</p>
            <p>以下のボタンからパスワードを設定してください。</p>
            <p style="margin: 24px 0;">
              <a href="${actionLink}"
                 style="background:#0C447C;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
                パスワードを設定する
              </a>
            </p>
            <p style="color: #888; font-size: 12px;">このリンクは24時間有効です。</p>
          </div>
        `,
      });

      // Update request status
      const { error: updateError } = await supabase
        .from("signup_requests")
        .update({ status: "approved", approved_at: new Date().toISOString() })
        .eq("id", id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "不正な action です" }, { status: 400 });
  } catch (err) {
    console.error("Admin request error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
