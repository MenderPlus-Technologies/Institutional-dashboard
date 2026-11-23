import { getSupabase } from "@/lib/supabase/client";

const ALLOWED = ["application/pdf", "image/jpeg", "image/png"];

/** Upload a document to the organisation's private folder. Returns the storage path. */
export async function uploadOrgDocument(orgId: string, file: File, prefix: string) {
  if (!ALLOWED.includes(file.type)) throw new Error("Upload a PDF, JPG or PNG file.");
  if (file.size > 10 * 1024 * 1024) throw new Error("File must be 10MB or smaller.");
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
  const path = `${orgId}/${prefix}-${Date.now()}-${safe}`;
  const { error } = await getSupabase().storage.from("org-documents").upload(path, file, { upsert: false });
  if (error) throw new Error(error.message);
  return path;
}

export async function documentUrl(path: string) {
  const { data, error } = await getSupabase().storage.from("org-documents").createSignedUrl(path, 60 * 10);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}
