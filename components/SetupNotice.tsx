import { Settings2 } from "lucide-react";

/** Shown when the Supabase environment variables have not been added yet. */
export function SetupNotice() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f9fb] p-4">
      <div className="max-w-lg rounded-2xl border border-[#e8eaed] bg-white p-6">
        <Settings2 className="mb-3 h-7 w-7 text-[#009688]" />
        <h2 className="text-section-heading">Connect the database to finish setup</h2>
        <p className="text-caption mt-2">
          This portal needs two environment variables from your Supabase project (Project Settings → API):
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-[#f8f9fb] p-3 text-xs">
          NEXT_PUBLIC_SUPABASE_URL=...{"\n"}NEXT_PUBLIC_SUPABASE_ANON_KEY=...
        </pre>
        <p className="text-caption mt-3">
          Add them in Netlify under Site configuration → Environment variables (or in a local <code>.env.local</code>{" "}
          file), then redeploy. See SETUP.md in the repository for the full steps.
        </p>
      </div>
    </div>
  );
}
