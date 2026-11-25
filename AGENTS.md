# UGCMarket — Agent Rules

Brand ↔ creator marketplace for Azerbaijan (casting.az-style campaign board). MVP goal: validate demand, not build the full spec.
Product context, decisions and open questions live in the Obsidian wiki (`~/Documents/Wikis/UgcMarket`, start at `wiki/index.md`).
Key pages: `decisions/mvp-scope`, `decisions/mvp-validation-plan`, `decisions/project-structure`, `concepts/off-platform-deal-model`.

## Stack
Next.js 16 (App Router, Turbopack, Cache Components) · TypeScript · Tailwind v4 + shadcn/ui (Base UI primitives, `base-maia` style, Hugeicons) · Supabase (Postgres, Auth, Storage, RLS)
· TanStack Query · zod v4 · react-hook-form · next-intl v4 (az default, ru, en) · PostHog · Resend · Vercel.

## Architecture rules (non-negotiable)
1. **All data goes through `/api` route handlers.** Pages/components are client components that call `/api` via
   `src/lib/api-client.ts` + TanStack Query hooks in `src/features/<domain>/hooks.ts`. No Server Actions, no data fetching in Server Components.
2. **Only `src/app/api/**` and `src/server/**` may import `@/server/*`** (enforced by ESLint).
   Agreed exception: `generateMetadata` in `(public)/creator/[handle]/page.tsx` and `(public)/campaigns/[id]/page.tsx`
   (link previews). It must call the same service function and return only public fields; missing/unpublished → generic title + `noindex`.
3. **Route handler shape:** `handler(async (req, { params }) => { parse (zod) → requireRole() → service → ok(data) })`.
   No business logic or DB queries in `route.ts`.
4. **Services** (`src/server/services/*`) hold all business logic. Use `createUserClient()` (RLS applies) by default;
   `createPublicClient()` for public reads; `createAdminClient()` (bypasses RLS) only for admin actions and contact reveal.
5. **API contract:** snake_case JSON matching DB columns. Success `{ data }`; error `{ error: { code, message, details? } }`
   with correct HTTP status. `message` is an i18n key (`errors.*`), translated on the client.
6. **Schemas** in `src/schemas/*` are shared by forms (react-hook-form + zodResolver) and API validation. Change both together.
7. **Database:** `supabase/migrations/*.sql` is the source of truth. Every table has RLS. After changes: `pnpm db:push && pnpm db:types:remote` (cloud) or `pnpm db:reset && pnpm db:types` (local).
   Contact details (Instagram/phone) live in `creator_contacts` / `brand_contacts` — never select them in public queries.
8. **Analytics:** hypothesis events are fired server-side in services via `track()` (`src/server/analytics.ts`).
9. **i18n:** every user-facing string goes in `messages/az.json` first (source of truth, type-checked), then ru/en.
   Use `Link`/`useRouter` from `@/i18n/navigation`, not `next/link`/`next/navigation` (except `useParams`).
10. **Next 16 + Cache Components:** client components using `useParams`/`useSearchParams` must be inside `<Suspense>`.
    Middleware is `src/proxy.ts`. Route `params` are Promises.
11. Role guards in the UI (`RoleGate`) are UX only — real enforcement is `requireRole()` + RLS.

## Client state: TanStack Query + Next 16 (non-negotiable)
Full text and reasons: wiki `decisions/client-state-rules`; the audit behind it: `decisions/auth-state-bugs`.
- **Where state lives.** Server data (`/api`) → TanStack Query hooks in `src/features/<domain>/hooks.ts`. Values from the
  route (`?email=`, `?next=`, `?role=`, filters, ids) → the URL, derived on every render. Form input → react-hook-form,
  server data enters through `values:`. Short-lived UI → `useState`. No other client store.
- **TanStack Query is only for `/api` reads and writes.** Auth calls to Supabase may use `useMutation` for pending/error,
  but a mutation's `data`/`variables` are not state: pass what the next screen needs through the URL.
- **Never `useState(params.get(...))` or copy query data into state.** With Cache Components Next keeps up to 3 visited
  pages mounted (hidden, state intact), so a page comes back with old state and new URL params. Derive, or `key` the
  subtree by the param.
- **A change of signed-in user is a full page load.** Sign-in, code verify, sign-out, or a different user id seen by
  `AuthSync` end in `window.location.replace()` / `reload()`, never `router.push/replace`. Kept pages and Next's client
  router cache (prefetched pages and proxy redirects, about 5 min) survive `qc.clear()` and client navigation.
- **`AuthSync` compares user ids:** same user (focus, token refresh) → nothing; different user → full reload.
  No `qc.clear()` on mounted screens (it does not notify them); use a reload or `resetQueries()`.
- **No Next caching for user data.** No `use cache`, `cacheLife`, `revalidate` or React `cache()` in anything that reads
  cookies or the user. `use cache` only for anonymous public reads via `createPublicClient()`. API responses are
  `private, no-store`.
- **Query keys** come from the domain's key factory, never string literals. A response that depends on the viewer has
  the viewer (`me.id`, not role) in its key and waits for `me`.
- **Guards** (`RoleGate`, onboarding) act only on a settled `me`. Proxy redirects are hints; the router can replay them.
- **Mutations:** server returned the entity → `setQueryData`; otherwise invalidate every view it touches (mine, own,
  detail, board), no wider. If navigation follows, return/await the invalidation in `onSuccess`.

## Copywriting (must, everywhere)
Follow the `ugc-copywriting` skill (`.agents/skills/ugc-copywriting/SKILL.md`) for every user-facing string:
- **No em dash (—)** in any language. Use a period, comma or colon. `pnpm copy:check` must pass.
- **Azerbaijani is written natively, never translated literally** from English or Russian. Formal **siz** everywhere (landing too); listings are **elan** / **объявление** / **listing** in copy (code stays `campaign`).
- **No closing period** on any text (hints, errors, toasts, labels, buttons). Sentences inside a text are still split by a period. Legal pages keep normal punctuation.

## UI kit
- `src/components/ui/*` came from shadcn but is **our UI kit now** — edit freely; it will diverge from upstream.
  Don't blindly re-run `pnpm dlx shadcn add` over an existing file (it overwrites our changes); diff first.
- Primitives are **Base UI** (`@base-ui/react`), not Radix. Check the Base UI API when composing (e.g. `render` prop, not `asChild`).
- Icons: **Hugeicons** (`@hugeicons/react` + `@hugeicons/core-free-icons`). Don't add another icon library.
- **Motion — strictly Emil Kowalski** (`emil-design-eng`, `animate` + `animate/RECIPES.md`, `review-animations` +
  `STANDARDS.md`, `choreograph`, `animation-performance`). These are the ONLY authority for animation. Do not take motion
  advice from `apple-design` or `stageshow`. Build with `animate`, then self-review with `review-animations` before merge.
  - Gate first: 100+/day or keyboard-triggered → no animation; tens/day → near-imperceptible or none; name the purpose.
  - Tokens (globals.css): `ease-out` = cubic-bezier(0.23,1,0.32,1) enter/exit/press/popovers; `ease-in-out` =
    cubic-bezier(0.77,0,0.175,1) movement on screen; `ease-(--ease-drawer)` sheets; default transition easing `ease` (colors).
  - Durations: press 160ms; popovers/selects 200ms (exit 150ms); modals 250ms; sheets 500ms; UI < 300ms otherwise.
  - Only transform/opacity (and clip-path). Never `transition-all`, never `scale(0)` (start 0.95 + opacity), never `ease-in`.
    Popovers scale from `--transform-origin`; modals stay centered. Transitions/`@starting-style`, not keyframes, for
    anything re-triggerable. Hover motion only behind `(hover: hover) and (pointer: fine)`.
  - Tailwind v4: `scale-*`/`translate-*` set the individual `scale`/`translate` properties — transition those names.
  - Reduced motion: fades stay, movement goes (handled globally in globals.css).
- **Visual language** (`emil-design-eng`, `apple-design` for materials/type, `stageshow` for marketing visuals only):
  - Coral `--primary` is for the one main action on a screen. Joy tints (`brand`, `sun`, `mint`, `sky`, `rose` — Badge
    variants and `bg-*/text-*-ink` utilities) label categories, networks and statuses — never buttons.
  - Depth via `--shadow-soft|raised|float|press`, not borders. Filled fields (`bg-muted`) with a soft coral focus ring.
  - **No tinted background boxes** for notes, statuses, hints or results (founders, 2026-11-12). Use plain text,
    `text-muted-foreground` (or `text-destructive` for problems) with a small icon. Backgrounds are for fields and controls.
  - Buttons press to `scale(0.97)`. Named avatars get a tone from the joy palette; one initial in overlapping groups.
  - Apple type: tighter tracking as size grows (`tracking-[-0.025em]` on titles), body at 0, `tabular-nums` for counts.
  - **Minimum font size is 12px** (`text-xs`) everywhere, landing and mockups included. Never `text-[10px]`/`text-[11px]`.
- Class merging: `cn()` from `@/lib/utils` (re-exports shadcn's `cn` package).
- Design tokens live in `src/app/globals.css` (`:root` / `.dark` CSS variables + `@theme inline`). Change tokens, not one-off colors.
- **Showcase:** `/ui-kit` (`src/app/[locale]/(dev)/ui-kit`) renders every kit component in all variants + product patterns.
  Update it when you add or change a kit component. Dev-only; in production only with `NEXT_PUBLIC_SHOW_UI_KIT=1`.
- Product-level components (e.g. `CampaignCard`, `CreatorBadge`) go in `src/features/<domain>/components`; shared composites in `src/components/shared`.

## Folder map
```
src/app/[locale]/(marketing|auth|public|creator|brand|admin)/  pages (client)
src/app/api/                                                   route handlers
src/features/<domain>/{hooks.ts,components/}                   UI by domain
src/components/{ui,shared}/                                    shadcn primitives, shared UI
src/server/{services,db,auth,http}/                            server-only
src/schemas/  src/lib/  src/i18n/  src/types/  messages/  supabase/
```

## Skills (installed in .agents/skills, symlinked to .claude/skills)
- Building product UI → `emil-design-eng`; any motion → `animate` / `choreograph`; gestures/sheets → `gestures`, `apple-design`.
- Mobile feel (most users are on phones) → `mobile-native`.
- Before merging UI → `break-ui` (long Azerbaijani/Russian strings, empty states) and `review-animations`.
- Landing page / marketing visuals (faux product UI, animated demos) → `stageshow`. Not for real app screens.
- Any user-facing copy (az/ru/en) → `ugc-copywriting` (mandatory).
- Toasts → `ask-sonner`. Library choice → `pick-ui-library` (explicit). UI variants → `prototype` (explicit).

## Commands (pnpm only — never npm/npx/yarn)
`pnpm dev` · `pnpm build` · `pnpm lint` · `pnpm typecheck` · `pnpm format`
`pnpm db:push` · `pnpm db:types:remote` · `pnpm db:start` · `pnpm db:reset` · `pnpm db:types` · `pnpm skills:update`
Add deps: `pnpm add <pkg>` / `pnpm add -D <pkg>`. One-off CLIs: `pnpm dlx <cli>` (e.g. `pnpm dlx shadcn@latest add <component>`).
Local CLIs: `pnpm exec <bin>` (e.g. `pnpm exec supabase`). Commit `pnpm-lock.yaml`; never create `package-lock.json`.
New dependency with an install script → decide it in `pnpm-workspace.yaml` → `allowBuilds` (true only if it needs it).

## Social numbers (src/server/social)
Followers / views / likes are checked by pluggable providers (`SocialStatsProvider`), tried in registry order per
network: official APIs first (Instagram Business Discovery, YouTube Data API), third-party scraping (Apify) only as a
temporary fallback until Meta/TikTok review. Results go to `creator_social_stats` (service role only); UI prefers them
over self-reported numbers when the handle matches. Priority: Instagram, then TikTok, then YouTube.
**Live networks:** `ENABLED_NETWORKS` in `src/schemas/taxonomy.ts` (Instagram only for now). Forms, validation, screens and
providers all read it; launching TikTok/YouTube = add it there (+ `ENABLED_PRICE_FORMATS`).

## Scope guard (MVP)
Not building yet: catalog/search, saved lists, compare, messaging, payments, ratings, disputes, AI assistant.
Ask before adding anything from that list.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
