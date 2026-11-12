# UGCMarket

Marketplace connecting brands with content creators in Azerbaijan. Next.js 16 + Supabase.
Rules for humans and AI agents: [AGENTS.md](./AGENTS.md). Product docs: the UgcMarket Obsidian wiki.

## Setup
```bash
corepack enable                              # once per machine: uses the pnpm version pinned in package.json
pnpm install
pnpm dlx shadcn@latest init                       # UI kit (keeps src/lib/utils.ts; overwrites globals.css — fine)
pnpm dlx shadcn@latest add button input label textarea select card badge avatar dialog dropdown-menu sheet tabs skeleton separator sonner form
cp .env.example .env.local                   # fill in keys (see Database below)
pnpm dev                                  # http://localhost:3000 → /az
```
Make yourself admin: in Supabase Studio, set `profiles.role = 'admin'` for your user.

**Package manager: pnpm only.** `npm install` is blocked (`devEngines`). Add packages with `pnpm add <pkg>`.
Dependency install scripts must be approved in `pnpm-workspace.yaml` → `allowBuilds`.

## Database (Supabase)
**Option A — Supabase cloud (no Docker):** create a project at supabase.com (region: Frankfurt), copy URL + anon + service_role keys
into `.env.local`, then:
```bash
pnpm exec supabase login
pnpm db:link -- --project-ref <your-project-ref>
pnpm db:push                              # applies supabase/migrations to the cloud DB
pnpm db:types:remote                      # regenerate src/types/database.ts
```
**Option B — local Supabase (needs Docker Desktop):** runs the same Supabase stack on your machine, free and offline.
```bash
pnpm db:start                             # prints local URL + keys for .env.local
pnpm db:reset                             # applies migrations
pnpm db:types
```

## Structure
See AGENTS.md → Folder map. API: `src/app/api/*` → `src/server/services/*`. UI: `src/app/[locale]/*` + `src/features/*`.
