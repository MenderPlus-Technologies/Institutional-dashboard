import { NextResponse, type NextRequest } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

/** Google / LinkedIn / Microsoft sign-in and email links (PKCE code) land here. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));
  const providerError = searchParams.get("error_description");

  if (providerError) {
    return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(providerError)}`);
  }

  if (code) {
    const supabase = getServerSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    return NextResponse.redirect(
      `${origin}/?error=${encodeURIComponent("That link has expired or was opened in a different browser. Please sign in.")}`
    );
  }

  return NextResponse.redirect(`${origin}/`);
}

function safeNext(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}
