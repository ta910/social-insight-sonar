import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { EmailOtpType } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Handles token_hash based email auth (password recovery / invite)
// We construct this URL ourselves in the admin approval flow using
// data.properties.hashed_token, bypassing the Supabase action_link
// which uses the implicit (hash-fragment) flow that server-side code can't read.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  if (!token_hash || !type) {
    return NextResponse.redirect(
      new URL("/login?error=missing_token", request.url)
    );
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // In a Route Handler, setAll writes directly to the response cookies
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { error } = await supabase.auth.verifyOtp({ token_hash, type });

  if (error) {
    console.error("verifyOtp error:", error.message);
    return NextResponse.redirect(
      new URL("/login?error=link_expired", request.url)
    );
  }

  // Session is now set in cookies — redirect to next page
  return NextResponse.redirect(new URL(next, request.url));
}
