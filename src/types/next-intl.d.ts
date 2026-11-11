import type { routing } from "@/i18n/routing";
import type messages from "../../messages/az.json";

// Type-safe translation keys; az.json is the source of truth.
declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}
