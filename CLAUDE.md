@AGENTS.md

## Claude Code notes
- Skills are available in `.claude/skills/` (symlinks to `.agents/skills/`). Use them per the Skills section above.
- Before touching auth, `hooks.ts`, guards or anything with `useSearchParams`/`useState` on a routed page, re-read
  "Client state: TanStack Query + Next 16" in AGENTS.md. A change of signed-in user is always a full page load.
- When a decision changes product scope or architecture, note it so the wiki (`~/Documents/Wikis/UgcMarket`) can be updated.
