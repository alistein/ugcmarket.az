import { AuthError, isAuthError } from "@supabase/supabase-js";

/** i18n keys under `auth.errors`. */
export type AuthErrorKey =
  | "invalid_credentials"
  | "email_not_confirmed"
  | "code_invalid"
  | "too_many_emails"
  | "too_many_requests"
  | "weak_password"
  | "same_password"
  | "signup_disabled"
  | "email_invalid"
  | "blocked"
  | "network"
  | "oauth_cancelled"
  | "oauth_failed"
  | "link_invalid"
  | "link_expired"
  | "session_missing"
  | "unknown";

const AUTH_ERROR_KEYS = new Set<string>([
  "invalid_credentials", "email_not_confirmed", "code_invalid", "too_many_emails", "too_many_requests",
  "weak_password", "same_password", "signup_disabled", "email_invalid", "blocked", "network",
  "oauth_cancelled", "oauth_failed", "link_invalid", "link_expired", "session_missing", "unknown",
]);

export const isAuthErrorKey = (v: unknown): v is AuthErrorKey => typeof v === "string" && AUTH_ERROR_KEYS.has(v);

/** Carries a translated-on-render key; thrown by the auth hooks. */
export class AuthFlowError extends Error {
  constructor(public key: AuthErrorKey) {
    super(key);
  }
}

/** Supabase Auth error codes → our keys. Unknown codes never leak raw server text to users. */
const BY_CODE: Record<string, AuthErrorKey> = {
  invalid_credentials: "invalid_credentials",
  email_not_confirmed: "email_not_confirmed",
  otp_expired: "code_invalid", // also returned for a wrong code
  otp_disabled: "signup_disabled",
  over_email_send_rate_limit: "too_many_emails",
  over_request_rate_limit: "too_many_requests",
  weak_password: "weak_password",
  same_password: "same_password",
  signup_disabled: "signup_disabled",
  email_provider_disabled: "signup_disabled",
  email_address_invalid: "email_invalid",
  email_address_not_authorized: "email_invalid",
  validation_failed: "email_invalid",
  user_banned: "blocked",
  session_not_found: "session_missing",
  session_expired: "session_missing",
  refresh_token_not_found: "session_missing",
  bad_code_verifier: "link_invalid",
  flow_state_not_found: "link_invalid",
  flow_state_expired: "link_expired",
};

export function toAuthFlowError(e: unknown): AuthFlowError {
  if (e instanceof AuthFlowError) return e;
  if (isAuthError(e)) {
    const err = e as AuthError;
    if (err.code && BY_CODE[err.code]) return new AuthFlowError(BY_CODE[err.code]);
    if (err.status === 429) return new AuthFlowError("too_many_requests");
    if (err.name === "AuthRetryableFetchError" || err.status === 0) return new AuthFlowError("network");
    if (err.name === "AuthSessionMissingError") return new AuthFlowError("session_missing");
  }
  if (e instanceof TypeError) return new AuthFlowError("network"); // fetch failed
  return new AuthFlowError("unknown");
}
