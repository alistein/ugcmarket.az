# UGCMarket

Marketplace connecting brands with content creators in Azerbaijan. Next.js 16 + Supabase.
Rules for humans and AI agents: [AGENTS.md](./AGENTS.md). Product docs: the UgcMarket Obsidian wiki.

## Setup
```bash
npm install                                  # installs for your OS
npx shadcn@latest init                       # UI kit (keeps src/lib/utils.ts; overwrites globals.css — fine)
npx shadcn@latest add button input label textarea select card badge avatar dialog dropdown-menu sheet tabs skeleton separator sonner form
cp .env.example .env.local                   # fill in keys
npm run db:start                             # local Supabase (needs Docker); prints URL + keys for .env.local
npm run db:reset                             # applies supabase/migrations
npm run db:types                             # regenerate src/types/database.ts
npm run dev                                  # http://localhost:3000 → /az
```
Make yourself admin: in Supabase Studio, set `profiles.role = 'admin'` for your user.

## Structure
See AGENTS.md → Folder map. API: `src/app/api/*` → `src/server/services/*`. UI: `src/app/[locale]/*` + `src/features/*`.
