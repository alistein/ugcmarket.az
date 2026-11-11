import "server-only";
import type { SessionUser } from "@/server/auth";
import { createAdminClient } from "@/server/db/supabase";

export type UploadKind = "avatar" | "logo" | "post-screenshot";
const BUCKET: Record<UploadKind, string> = { avatar: "avatars", logo: "logos", "post-screenshot": "post-screenshots" };

/** Signed upload URL scoped to the user's folder. The browser uploads the file directly to Storage. */
export async function signUpload(user: SessionUser, kind: UploadKind, ext: string) {
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
  const { data, error } = await createAdminClient().storage.from(BUCKET[kind]).createSignedUploadUrl(path);
  if (error) throw error;
  return { bucket: BUCKET[kind], path, token: data.token, signed_url: data.signedUrl };
}
