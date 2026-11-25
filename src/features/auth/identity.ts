/**
 * Tells AuthSync whether this tab started the auth call that changed the signed-in user.
 * Supabase fires onAuthStateChange inside the call, so "in flight" covers it. The caller then does
 * its own full page load (useAfterAuth / useSignOut); AuthSync only reacts to changes from other tabs.
 */
let inFlight = 0;

export const authCallInFlight = () => inFlight > 0;

export async function trackAuthCall<T>(fn: () => Promise<T>): Promise<T> {
  inFlight++;
  try {
    return await fn();
  } finally {
    inFlight--;
  }
}
