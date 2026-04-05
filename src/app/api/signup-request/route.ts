import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, reason } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "名前とメールアドレスは必須です" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("signup_requests").insert({
      name,
      email,
      reason: reason ?? null,
    });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "このメールアドレスはすでに申請済みです" },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("Signup request error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
