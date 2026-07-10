#!/usr/bin/env node
// Idempotent import-path relocator for the backend/db/schema refactor.
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const root = process.cwd();
const self = "/.agents/tmp/relocate-schema.mjs";

const MAPPINGS = {
  all: [
    { from: "@/backend/db/schema/cache", to: "@/backend/db/schema/shared/cache" },
    { from: "@/backend/db/schema/settings", to: "@/backend/db/schema/shared/settings" },
    { from: "@/backend/db/schema/timezones", to: "@/backend/db/schema/shared/timezones" },
    { from: "@/backend/db/schema/impersonation", to: "@/backend/db/schema/auth/impersonation" },
    { from: "@/backend/db/schema/users", to: "@/backend/db/schema/users/users" },
    { from: "@/backend/db/schema/permissions", to: "@/backend/db/schema/permissions/permissions" },
    { from: "@/backend/db/schema/audit", to: "@/backend/db/schema/audit/audit" },
    { from: "@/backend/db/schema/teachers", to: "@/backend/db/schema/teachers/teachers" },
    { from: "@/backend/db/schema/teacher-availability", to: "@/backend/db/schema/teachers/teacher-availability" },
    { from: "@/backend/db/schema/teacher-banking", to: "@/backend/db/schema/teachers/teacher-banking" },
    { from: "@/backend/db/schema/teacher-notes", to: "@/backend/db/schema/teachers/teacher-notes" },
    { from: "@/backend/db/schema/staff", to: "@/backend/db/schema/teachers/staff" },
    { from: "@/backend/db/schema/parents", to: "@/backend/db/schema/parents/parents" },
    { from: "@/backend/db/schema/students", to: "@/backend/db/schema/students/students" },
    { from: "@/backend/db/schema/class-category", to: "@/backend/db/schema/classes/class-category" },
    { from: "@/backend/db/schema/class-subject", to: "@/backend/db/schema/classes/class-subject" },
    { from: "@/backend/db/schema/group-class", to: "@/backend/db/schema/classes/group-class" },
    { from: "@/backend/db/schema/subject-resource", to: "@/backend/db/schema/classes/subject-resource" },
    { from: "@/backend/db/schema/scheduling", to: "@/backend/db/schema/classes/scheduling" },
    { from: "@/backend/db/schema/books", to: "@/backend/db/schema/books/books" },
    { from: "@/backend/db/schema/billing", to: "@/backend/db/schema/billing/billing" },
    { from: "@/backend/db/schema/fx-sync", to: "@/backend/db/schema/billing/fx-sync" },
    { from: "@/backend/db/schema/communications", to: "@/backend/db/schema/communications/communications" },
    { from: "@/backend/db/schema/storage", to: "@/backend/db/schema/storage/storage" },
    { from: "@/backend/db/schema/site-content", to: "@/backend/db/schema/storage/site-content" },
  ],
};

const mappingKey = process.argv[2];
if (!mappingKey || !MAPPINGS[mappingKey]) {
  console.error("Usage: relocate-schema.mjs <mappingName>");
  process.exit(2);
}
const replacements = MAPPINGS[mappingKey];

const skip = p =>
  p.endsWith(self) ||
  p.endsWith("/relocate-enum.mjs") ||
  p.endsWith("/relocate-pothos.mjs") ||
  p.endsWith("/relocate-repo.mjs") ||
  p.endsWith("/relocate-seeds.mjs") ||
  p.includes("/node_modules/") ||
  p.includes("/.git/") ||
  p.includes("/.ai/") ||
  p.includes("/lost-found/");

const files = execSync(`git ls-files`, { cwd: root, encoding: "utf8" })
  .split("\n")
  .filter(Boolean)
  .filter(p => p.endsWith(".ts") || p.endsWith(".tsx") || p.endsWith(".mjs"))
  .map(p => `/${p}`)
  .filter(p => !skip(p));

let touched = 0;
for (const abs of files) {
  let text;
  try {
    text = readFileSync(`${root}${abs}`, "utf8");
  } catch {
    continue;
  }
  const orig = text;
  for (const { from, to } of replacements) {
    text = text.split(from).join(to);
  }
  if (text !== orig) {
    writeFileSync(`${root}${abs}`, text);
    console.log(`updated: ${abs.slice(1)}`);
    touched++;
  }
}
console.log(`done; ${touched} file(s) updated.`);
