import { NextResponse, type NextRequest } from "next/server";
import { getServerSupabase, getServiceSupabase } from "@/lib/supabase/server";

/**
 * Invite a team member.
 * 1. Records the invitation as the signed-in user (the database checks they are an owner/admin).
 * 2. Emails an invite link using the service role key, if configured.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const { orgId, email, fullName, role, note } = body ?? {};
  if (!orgId || !email || !role) {
    return NextResponse.json({ error: "Email and role are required." }, { status: 400 });
  }

  const supabase = getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  const { error: inviteError } = await supabase.rpc("invite_member", {
    p_org: orgId,
    p_email: email,
    p_full_name: fullName ?? null,
    p_role: role,
    p_note: note ?? null,
  });
  if (inviteError) return NextResponse.json({ error: inviteError.message }, { status: 400 });

  const origin = request.headers.get("origin") ?? new URL(request.url).origin;
  const admin = getServiceSupabase();
  if (!admin) {
    return NextResponse.json({
      emailSent: false,
      message: "Invitation saved. Email sending isn't set up yet — ask them to sign up at the portal with this email address.",
    });
  }

  const { error: mailError } = await admin.auth.admin.inviteUserByEmail(String(email).trim().toLowerCase(), {
    redirectTo: `${origin}/set-password`,
    data: { full_name: fullName ?? null },
  });

  if (mailError) {
    const exists = /already been registered|already exists/i.test(mailError.message);
    return NextResponse.json({
      emailSent: false,
      message: exists
        ? "This person already has an Indura account. They'll join your organisation the next time they sign in."
        : `Invitation saved, but the email failed to send: ${mailError.message}`,
    });
  }

  return NextResponse.json({ emailSent: true, message: `Invitation emailed to ${email}.` });
}
