#!/usr/bin/env node
// Idempotent import-path relocator for the backend/db/repo refactor.
// Usage: node .agents/tmp/relocate-repo.mjs <mappingName>
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const root = process.cwd();
const self = "/.agents/tmp/relocate-repo.mjs";

// Each phase's `from` strings are the PRE-MOVE flat paths.
// Idempotent because post-move paths don't match the `from` patterns.
const MAPPINGS = {
  shared: [
    { from: "@/backend/db/repo/cache.repository", to: "@/backend/db/repo/shared/cache.repository" },
    { from: "@/backend/db/repo/ratelimit.repository", to: "@/backend/db/repo/shared/ratelimit.repository" },
    { from: "@/backend/db/repo/session.repository", to: "@/backend/db/repo/shared/session.repository" },
    { from: "@/backend/db/repo/signedUrl.repository", to: "@/backend/db/repo/shared/signedUrl.repository" },
    { from: "@/backend/db/repo/soft-delete.repository", to: "@/backend/db/repo/shared/soft-delete.repository" },
    { from: "@/backend/db/repo/system-settings.repository", to: "@/backend/db/repo/shared/system-settings.repository" },
  ],
  audit: [{ from: "@/backend/db/repo/audit.repository", to: "@/backend/db/repo/audit/audit.repository" }],
  auth: [{ from: "@/backend/db/repo/impersonation.repository", to: "@/backend/db/repo/auth/impersonation.repository" }],
  users: [{ from: "@/backend/db/repo/user.repository", to: "@/backend/db/repo/users/user.repository" }],
  permissions: [
    {
      from: "@/backend/db/repo/permission-management.repository",
      to: "@/backend/db/repo/permissions/permission-management.repository",
    },
  ],
  billing: [{ from: "@/backend/db/repo/billing.repository", to: "@/backend/db/repo/billing/billing.repository" }],
  books: [
    { from: "@/backend/db/repo/book.repository", to: "@/backend/db/repo/books/book.repository" },
    { from: "@/backend/db/repo/report.repository", to: "@/backend/db/repo/books/report.repository" },
  ],
  classes: [
    { from: "@/backend/db/repo/class-category.repository", to: "@/backend/db/repo/classes/class-category.repository" },
    {
      from: "@/backend/db/repo/class-performance.repository",
      to: "@/backend/db/repo/classes/class-performance.repository",
    },
    { from: "@/backend/db/repo/class-subject.repository", to: "@/backend/db/repo/classes/class-subject.repository" },
    { from: "@/backend/db/repo/group-class.repository", to: "@/backend/db/repo/classes/group-class.repository" },
    { from: "@/backend/db/repo/dst-migration.repository", to: "@/backend/db/repo/classes/dst-migration.repository" },
    {
      from: "@/backend/db/repo/subject-resource.repository",
      to: "@/backend/db/repo/classes/subject-resource.repository",
    },
  ],
  parents: [
    { from: "@/backend/db/repo/parent.repository", to: "@/backend/db/repo/parents/parent.repository" },
    { from: "@/backend/db/repo/suggestion.repository", to: "@/backend/db/repo/parents/suggestion.repository" },
  ],
  students: [
    { from: "@/backend/db/repo/student.repository", to: "@/backend/db/repo/students/student.repository" },
    {
      from: "@/backend/db/repo/student-history.repository",
      to: "@/backend/db/repo/students/student-history.repository",
    },
  ],
  teachers: [
    { from: "@/backend/db/repo/teacher.repository", to: "@/backend/db/repo/teachers/teacher.repository" },
    {
      from: "@/backend/db/repo/teacher-availability.repository",
      to: "@/backend/db/repo/teachers/teacher-availability.repository",
    },
    {
      from: "@/backend/db/repo/teacher-banking.repository",
      to: "@/backend/db/repo/teachers/teacher-banking.repository",
    },
    { from: "@/backend/db/repo/teacher-notes.repository", to: "@/backend/db/repo/teachers/teacher-notes.repository" },
    { from: "@/backend/db/repo/staff-profile.repository", to: "@/backend/db/repo/teachers/staff-profile.repository" },
  ],
  notifications: [
    {
      from: "@/backend/db/repo/notification.repository",
      to: "@/backend/db/repo/notifications/notification.repository",
    },
    {
      from: "@/backend/db/repo/notification-preferences.repository",
      to: "@/backend/db/repo/notifications/notification-preferences.repository",
    },
  ],
  complaints: [
    { from: "@/backend/db/repo/complaint.repository", to: "@/backend/db/repo/complaints/complaint.repository" },
    {
      from: "@/backend/db/repo/complaint-response.repository",
      to: "@/backend/db/repo/complaints/complaint-response.repository",
    },
  ],
  storage: [
    { from: "@/backend/db/repo/storage.repository", to: "@/backend/db/repo/storage/storage.repository" },
    {
      from: "@/backend/db/repo/learning-resource.repository",
      to: "@/backend/db/repo/storage/learning-resource.repository",
    },
  ],
};

const mappingKey = process.argv[2];
if (!mappingKey || !MAPPINGS[mappingKey]) {
  console.error("Usage: relocate-repo.mjs <mappingName> — known:", Object.keys(MAPPINGS).join(", "));
  process.exit(2);
}
const replacements = MAPPINGS[mappingKey];

const skip = p =>
  p.endsWith(self) ||
  p.endsWith("/relocate-enum.mjs") ||
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
