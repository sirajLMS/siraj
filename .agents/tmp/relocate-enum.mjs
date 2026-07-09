#!/usr/bin/env node
// Idempotent import-path relocator for the backend/enum refactor.
// Usage: node .agents/tmp/relocate-enum.mjs <mappingName>
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const root = process.cwd();
const self = "/.agents/tmp/relocate-enum.mjs";

// Each phase's `from` strings are the PRE-MOVE paths (flat layout).
// We re-apply a phase even if it's already been done — the script is idempotent
// because post-move paths don't match the `from` patterns.
const MAPPINGS = {
  shared: [
    { from: "@/backend/enum/country.enum", to: "@/backend/enum/shared/country.enum" },
    { from: "@/backend/enum/currency.enum", to: "@/backend/enum/shared/currency.enum" },
    { from: "@/backend/enum/timezone.enum", to: "@/backend/enum/shared/timezone.enum" },
    { from: "@/backend/enum/pagination.enum", to: "@/backend/enum/shared/pagination.enum" },
  ],
  auth: [{ from: "@/backend/enum/auth.enum", to: "@/backend/enum/auth/auth.enum" }],
  impersonation: [{ from: "@/backend/enum/impersonation.enum", to: "@/backend/enum/auth/impersonation.enum" }],
  users: [
    { from: "@/backend/enum/user.enum", to: "@/backend/enum/users/user.enum" },
    { from: "@/backend/enum/userDeviceTokens.enum", to: "@/backend/enum/users/userDeviceTokens.enum" },
  ],
  permissions: [
    { from: "@/backend/enum/permission.enum", to: "@/backend/enum/permissions/permission.enum" },
    { from: "@/backend/enum/permission-group.enum", to: "@/backend/enum/permissions/permission-group.enum" },
    { from: "@/backend/enum/permission-management.enum", to: "@/backend/enum/permissions/permission-management.enum" },
  ],
  billing: [{ from: "@/backend/enum/billing.enum", to: "@/backend/enum/billing/billing.enum" }],
  books: [{ from: "@/backend/enum/book.enum", to: "@/backend/enum/books/book.enum" }],
  classes: [
    { from: "@/backend/enum/class-instance-detail.enum", to: "@/backend/enum/classes/class-instance-detail.enum" },
    { from: "@/backend/enum/group-class.enum", to: "@/backend/enum/classes/group-class.enum" },
    { from: "@/backend/enum/dst-migration.enum", to: "@/backend/enum/classes/dst-migration.enum" },
  ],
  scheduling: [
    { from: "@/backend/enum/scheduling.enum", to: "@/backend/enum/scheduling/scheduling.enum" },
    { from: "@/backend/enum/schedule.enum", to: "@/backend/enum/scheduling/schedule.enum" },
  ],
  parents: [
    { from: "@/backend/enum/parent.enum", to: "@/backend/enum/parents/parent.enum" },
    { from: "@/backend/enum/suggestions.enum", to: "@/backend/enum/parents/suggestions.enum" },
  ],
  students: [{ from: "@/backend/enum/student-lifecycle.enum", to: "@/backend/enum/students/student-lifecycle.enum" }],
  teachers: [
    { from: "@/backend/enum/teacher-availability.enum", to: "@/backend/enum/teachers/teacher-availability.enum" },
  ],
  notifications: [
    {
      from: "@/backend/enum/notificationDeliveries.enum",
      to: "@/backend/enum/notifications/notificationDeliveries.enum",
    },
  ],
  complaints: [{ from: "@/backend/enum/complaint.enum", to: "@/backend/enum/complaints/complaint.enum" }],
};

const mappingKey = process.argv[2];
if (!mappingKey || !MAPPINGS[mappingKey]) {
  console.error("Usage: relocate-enum.mjs <mappingName> — known:", Object.keys(MAPPINGS).join(", "));
  process.exit(2);
}
const replacements = MAPPINGS[mappingKey];

// Never rewrite the script itself or its sibling relocator.
const skip = p =>
  p.endsWith(self) ||
  p.endsWith("/relocate-pothos.mjs") ||
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
