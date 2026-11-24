import "server-only";
import type { z } from "zod";
import type { ModerationAction } from "@/schemas";
import type { SessionUser } from "@/server/auth";
import { createAdminClient } from "@/server/db/supabase";
import { errors } from "@/server/http/errors";

type Target = "creator" | "brand" | "campaign" | "user";
type Action = z.infer<typeof ModerationAction>;

async function log(admin: SessionUser, target_type: Target, target_id: string, { action, reason }: Action) {
  await createAdminClient().from("admin_actions").insert({ admin_id: admin.id, target_type, target_id, action, reason });
}

/** Approve/reject creators and brands; approve/reject campaigns; block/unblock users. Every action is audited. */
export async function moderate(admin: SessionUser, target: Target, id: string, input: Action) {
  const db = createAdminClient();
  const { action } = input;

  if (target === "creator" || target === "brand") {
    if (action !== "approve" && action !== "reject") throw errors.validation({ action: "approve|reject" });
    const table = target === "creator" ? "creators" : "brands";
    const { error } = await db.from(table).update({ review_status: action === "approve" ? "approved" : "rejected" }).eq("id", id);
    if (error) throw error;
  } else if (target === "campaign") {
    if (action !== "approve" && action !== "reject") throw errors.validation({ action: "approve|reject" });
    const { error } = await db
      .from("campaigns")
      .update(action === "approve" ? { status: "published", published_at: new Date().toISOString() } : { status: "rejected" })
      .eq("id", id);
    if (error) throw error;
  } else {
    if (action !== "block" && action !== "unblock") throw errors.validation({ action: "block|unblock" });
    const { error } = await db.from("profiles").update({ status: action === "block" ? "blocked" : "active" }).eq("id", id);
    if (error) throw error;
  }
  await log(admin, target, id, input);
}

export async function listQueue(kind: "creators" | "brands" | "campaigns") {
  const db = createAdminClient();
  const q =
    kind === "campaigns"
      ? db.from("campaigns").select("*, brand:brands(name)").eq("status", "pending_review")
      : kind === "creators"
        ? // Spec: a creator is reviewed only once they've added at least one portfolio item.
          db.from("creators").select("*, portfolio_items!inner(id)").eq("review_status", "pending")
        : db.from("brands").select("*").eq("review_status", "pending");
  const { data, error } = await q.order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

/** Hypothesis dashboard numbers (H1–H5). PostHog has the funnels; this is the quick view. */
export async function stats() {
  const db = createAdminClient();
  const count = async (table: "creators" | "brands" | "campaigns" | "applications" | "post_submissions", filter?: [string, string]) => {
    let q = db.from(table).select("*", { count: "exact", head: true });
    if (filter) q = q.eq(filter[0], filter[1]);
    const { count: c } = await q;
    return c ?? 0;
  };
  return {
    creators: await count("creators"),
    creators_approved: await count("creators", ["review_status", "approved"]),
    brands: await count("brands"),
    campaigns_published: await count("campaigns", ["status", "published"]),
    applications: await count("applications"),
    posts_submitted: await count("post_submissions"),
  };
}
