import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", ".agents/**", ".claude/**"]),

  // Architecture rule: all data goes through /api. Only API routes and the server layer
  // may import src/server/*. Agreed exception: generateMetadata on the two public pages.
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: [
      "src/server/**",
      "src/app/api/**",
      "src/app/[[]locale]/(public)/creator/[[]handle]/page.tsx",
      "src/app/[[]locale]/(public)/campaigns/[[]id]/page.tsx",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/server/*"],
              message: "Pages/components must call /api (src/lib/api-client). Only API routes import src/server.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
