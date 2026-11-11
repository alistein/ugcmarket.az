# UGCMarket

Marketplace connecting brands with content creators in Azerbaijan. Next.js 16 + Supabase.
Rules for humans and AI agents: [AGENTS.md](./AGENTS.md). Product docs: the UgcMarket Obsidian wiki.

## Setup
```bash
npm install                                  # installs for your OS
npx shadcn@latest init                       # UI kit (keeps src/lib/utils.ts; overwrites globals.css — fine)
npx shadcn@latest add button input label textarea select card badge avatar dialog dropdown-menu sheet tabs skeleton separator sonner form
cp .env.example .env.local                   # fill in keys (see Database below)
npm run dev                                  # http://localhost:3000 → /az
```
Make yourself admin: in Supabase Studio, set `profiles.role = 'admin'` for your user.

## Database (Supabase)
**Option A — Supabase cloud (no Docker):** create a project at supabase.com (region: Frankfurt), copy URL + anon + service_role keys
into `.env.local`, then:
```bash
npx supabase login
npm run db:link -- --project-ref <your-project-ref>
npm run db:push                              # applies supabase/migrations to the cloud DB
npm run db:types:remote                      # regenerate src/types/database.ts
```
**Option B — local Supabase (needs Docker Desktop):** runs the same Supabase stack on your machine, free and offline.
```bash
npm run db:start                             # prints local URL + keys for .env.local
npm run db:reset                             # applies migrations
npm run db:types
```

## Structure
See AGENTS.md → Folder map. API: `src/app/api/*` → `src/server/services/*`. UI: `src/app/[locale]/*` + `src/features/*`.
