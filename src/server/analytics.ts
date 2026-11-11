import "server-only";
import { PostHog } from "posthog-node";
import { env } from "@/lib/env";

let client: PostHog | null = null;

/**
 * Server-side events for the MVP hypotheses (H1–H6). Fire from services, not the UI,
 * so the numbers can't be skipped by ad blockers.
 */
export type AnalyticsEvent =
  | "signup_completed"
  | "role_selected"
  | "creator_profile_completed"
  | "brand_profile_completed"
  | "campaign_created"
  | "campaign_published"
  | "application_created"
  | "contact_revealed"
  | "post_submitted"
  | "post_confirmed";

export async function track(userId: string, event: AnalyticsEvent, props?: Record<string, unknown>) {
  if (!env.posthogKey) return;
  client ??= new PostHog(env.posthogKey, { host: env.posthogHost, flushAt: 1, flushInterval: 0 });
  client.capture({ distinctId: userId, event, properties: props });
  await client.flush();
}
