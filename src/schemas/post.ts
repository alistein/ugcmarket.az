import { z } from "zod";

/** Spec §9 — self-reported until social APIs are connected. */
export const PostSubmissionInput = z.object({
  application_id: z.uuid(),
  url: z.url(),
  posted_at: z.iso.date().optional(),
  views: z.coerce.number().int().min(0),
  likes: z.coerce.number().int().min(0).optional(),
  comments: z.coerce.number().int().min(0).optional(),
  shares: z.coerce.number().int().min(0).optional(),
  saves: z.coerce.number().int().min(0).optional(),
  screenshot_path: z.string().optional(), // Supabase Storage path from /api/uploads/sign
});
