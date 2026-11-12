// Copy guard (see .agents/skills/ugc-copywriting): no em dashes in any user-facing text.
// Scans messages, email templates and string literals in src/. Run: pnpm copy:check
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const EM_DASH = "—";
const roots = ["messages", "supabase/templates", "src"];
const exts = /\.(json|html|tsx?|mjs)$/;
const problems = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (exts.test(name)) check(path);
  }
}

function check(path) {
  readFileSync(path, "utf8")
    .split("\n")
    .forEach((line, i) => {
      if (!line.includes(EM_DASH)) return;
      // Code comments may use them; user-facing strings may not.
      const code = line
        .replace(/\/\/.*$/, "")
        .replace(/\/\*.*?\*\//g, "")
        .replace(/^\s*\/?\*.*$/, "")
        .replace(/\{\/\*.*?\*\/\}/g, "");
      if (code.includes(EM_DASH)) problems.push(`${path}:${i + 1}: ${line.trim()}`);
    });
}

roots.forEach(walk);
if (problems.length) {
  console.error(`Em dash (${EM_DASH}) found in user-facing text. Use a period, comma or colon instead:\n`);
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log("copy:check ok (no em dashes)");
