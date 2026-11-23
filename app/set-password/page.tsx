"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { KeyRound, Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabase } from "@/lib/supabase/client";

/** Used after a password-reset link and after accepting a team invitation. */
export default function SetPasswordPage() {
  const [ready, setReady] = useState<"checking" | "yes" | "no">("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sb = getSupabase();
    // Team invitation emails sent by the server put the session in the URL hash (#access_token=…).
    // Our browser client uses the PKCE flow, so we read those tokens ourselves.
    const check = async () => {
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const access_token = hash.get("access_token");
      const refresh_token = hash.get("refresh_token");
      if (access_token && refresh_token) {
        const { error } = await sb.auth.setSession({ access_token, refresh_token });
        window.history.replaceState(null, "", window.location.pathname);
        setReady(error ? "no" : "yes");
        return;
      }
      const { data } = await sb.auth.getSession();
      setReady(data.session ? "yes" : "no");
    };
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      if (session) setReady("yes");
    });
    const t = setTimeout(check, 100);
    return () => {
      clearTimeout(t);
      sub.subscription.unsubscribe();
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setLoading(true);
    setError(null);
    const { error } = await getSupabase().auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    window.location.href = "/dashboard";
  };

  return (
    <AuthLayout>
      <Card className="w-full max-w-md shadow-none">
        <CardContent className="p-5">
          {ready === "checking" && <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#009688]" />}
          {ready === "no" && (
            <div className="space-y-3 text-center">
              <h2 className="text-section-heading">This link has expired</h2>
              <p className="text-caption">Request a new password reset link, or ask your admin to re-send the invitation.</p>
              <Link href="/forgot-password" className="text-sm font-medium text-[#009688] hover:underline">
                Request a new link
              </Link>
            </div>
          )}
          {ready === "yes" && (
            <form onSubmit={submit} className="space-y-4">
              <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-[#009688]" />
                <h2 className="text-section-heading">Choose your password</h2>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pw">New password</Label>
                <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pw2">Confirm password</Label>
                <Input id="pw2" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Save and continue
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
