#!/usr/bin/env node
// Idempotent import-path relocator for the backend/graphql/pothos refactor.
// Usage: node .agents/tmp/relocate-pothos.mjs <mappingName>
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const root = process.cwd();

// Replaces `@/backend/graphql/pothos/X` (any suffix) -> `@/backend/graphql/pothos/<dir>/X`.
// IMPORTANT: order matters for prefix collisions. List more specific paths first.
const MAPPINGS = {
  shared: [
    { from: "@/backend/graphql/pothos/enum.pothos", to: "@/backend/graphql/pothos/shared/enum.pothos" },
    { from: "@/backend/graphql/pothos/pagination.objects", to: "@/backend/graphql/pothos/shared/pagination.objects" },
  ],
  auth: [
    { from: "@/backend/graphql/pothos/auth.pothos", to: "@/backend/graphql/pothos/auth/auth.pothos" },
    { from: "@/backend/graphql/pothos/impersonation.pothos", to: "@/backend/graphql/pothos/auth/impersonation.pothos" },
    { from: "@/backend/graphql/pothos/user.pothos", to: "@/backend/graphql/pothos/auth/user.pothos" },
  ],
  permissions: [
    { from: "@/backend/graphql/pothos/permission-management.pothos", to: "@/backend/graphql/pothos/permissions/permission-management.pothos" },
    { from: "@/backend/graphql/pothos/permission-group-simulation.objects.pothos", to: "@/backend/graphql/pothos/permissions/permission-group-simulation.objects.pothos" },
    { from: "@/backend/graphql/pothos/permission-group-simulation.pothos", to: "@/backend/graphql/pothos/permissions/permission-group-simulation.pothos" },
  ],
  billing: [
    { from: "@/backend/graphql/pothos/billing-alerts.pothos", to: "@/backend/graphql/pothos/billing/billing-alerts.pothos" },
    { from: "@/backend/graphql/pothos/billing-history.pothos", to: "@/backend/graphql/pothos/billing/billing-history.pothos" },
    { from: "@/backend/graphql/pothos/billing-management.pothos", to: "@/backend/graphql/pothos/billing/billing-management.pothos" },
  ],
  classes: [
    { from: "@/backend/graphql/pothos/class-category.pothos", to: "@/backend/graphql/pothos/classes/class-category.pothos" },
    { from: "@/backend/graphql/pothos/class-session.pothos", to: "@/backend/graphql/pothos/classes/class-session.pothos" },
    { from: "@/backend/graphql/pothos/class-subject.pothos", to: "@/backend/graphql/pothos/classes/class-subject.pothos" },
    { from: "@/backend/graphql/pothos/group-class.pothos", to: "@/backend/graphql/pothos/classes/group-class.pothos" },
    { from: "@/backend/graphql/pothos/recurring-class.pothos", to: "@/backend/graphql/pothos/classes/recurring-class.pothos" },
    { from: "@/backend/graphql/pothos/dst-migration.pothos", to: "@/backend/graphql/pothos/classes/dst-migration.pothos" },
  ],
  scheduling: [
    { from: "@/backend/graphql/pothos/schedule.pothos", to: "@/backend/graphql/pothos/scheduling/schedule.pothos" },
    { from: "@/backend/graphql/pothos/weekly-schedule.pothos", to: "@/backend/graphql/pothos/scheduling/weekly-schedule.pothos" },
    { from: "@/backend/graphql/pothos/availability-search.pothos", to: "@/backend/graphql/pothos/scheduling/availability-search.pothos" },
  ],
  teachers: [
    { from: "@/backend/graphql/pothos/teacher.pothos", to: "@/backend/graphql/pothos/teachers/teacher.pothos" },
    { from: "@/backend/graphql/pothos/teacher-dashboard.pothos", to: "@/backend/graphql/pothos/teachers/teacher-dashboard.pothos" },
    { from: "@/backend/graphql/pothos/teacher-onboarding.pothos", to: "@/backend/graphql/pothos/teachers/teacher-onboarding.pothos" },
    { from: "@/backend/graphql/pothos/teacher-portal.pothos", to: "@/backend/graphql/pothos/teachers/teacher-portal.pothos" },
    { from: "@/backend/graphql/pothos/teacher-notes.pothos", to: "@/backend/graphql/pothos/teachers/teacher-notes.pothos" },
    { from: "@/backend/graphql/pothos/manager-onboarding.pothos", to: "@/backend/graphql/pothos/teachers/manager-onboarding.pothos" },
    { from: "@/backend/graphql/pothos/staff-directory.pothos", to: "@/backend/graphql/pothos/teachers/staff-directory.pothos" },
    { from: "@/backend/graphql/pothos/staff-profile.pothos", to: "@/backend/graphql/pothos/teachers/staff-profile.pothos" },
  ],
  parents: [
    { from: "@/backend/graphql/pothos/parent-portal.pothos", to: "@/backend/graphql/pothos/parents/parent-portal.pothos" },
    { from: "@/backend/graphql/pothos/parent-profile.pothos", to: "@/backend/graphql/pothos/parents/parent-profile.pothos" },
    { from: "@/backend/graphql/pothos/parent-dashboard.pothos", to: "@/backend/graphql/pothos/parents/parent-dashboard.pothos" },
    { from: "@/backend/graphql/pothos/parent-directory.pothos", to: "@/backend/graphql/pothos/parents/parent-directory.pothos" },
    { from: "@/backend/graphql/pothos/parent-document.pothos", to: "@/backend/graphql/pothos/parents/parent-document.pothos" },
    { from: "@/backend/graphql/pothos/parent-onboarding.pothos", to: "@/backend/graphql/pothos/parents/parent-onboarding.pothos" },
  ],
  students: [
    { from: "@/backend/graphql/pothos/student.pothos", to: "@/backend/graphql/pothos/students/student.pothos" },
    { from: "@/backend/graphql/pothos/student-directory.pothos", to: "@/backend/graphql/pothos/students/student-directory.pothos" },
    { from: "@/backend/graphql/pothos/student-history.pothos", to: "@/backend/graphql/pothos/students/student-history.pothos" },
    { from: "@/backend/graphql/pothos/student-lifecycle.pothos", to: "@/backend/graphql/pothos/students/student-lifecycle.pothos" },
    { from: "@/backend/graphql/pothos/student-onboarding.pothos", to: "@/backend/graphql/pothos/students/student-onboarding.pothos" },
    { from: "@/backend/graphql/pothos/student-status.pothos", to: "@/backend/graphql/pothos/students/student-status.pothos" },
  ],
  notifications: [
    { from: "@/backend/graphql/pothos/notification-alerts.pothos", to: "@/backend/graphql/pothos/notifications/notification-alerts.pothos" },
    { from: "@/backend/graphql/pothos/notification-preferences.pothos", to: "@/backend/graphql/pothos/notifications/notification-preferences.pothos" },
  ],
  complaints: [
    { from: "@/backend/graphql/pothos/complaint.pothos", to: "@/backend/graphql/pothos/complaints/complaint.pothos" },
    { from: "@/backend/graphql/pothos/complaintResponses.pothos", to: "@/backend/graphql/pothos/complaints/complaintResponses.pothos" },
  ],
  storage: [
    { from: "@/backend/graphql/pothos/storage.pothos", to: "@/backend/graphql/pothos/storage/storage.pothos" },
    { from: "@/backend/graphql/pothos/learning-resource.pothos", to: "@/backend/graphql/pothos/storage/learning-resource.pothos" },
  ],
  books: [
    { from: "@/backend/graphql/pothos/book.pothos", to: "@/backend/graphql/pothos/books/book.pothos" },
    { from: "@/backend/graphql/pothos/report.pothos", to: "@/backend/graphql/pothos/books/report.pothos" },
  ],
  profile: [
    { from: "@/backend/graphql/pothos/profile.pothos", to: "@/backend/graphql/pothos/profile/profile.pothos" },
  ],
  suggestion: [
    { from: "@/backend/graphql/pothos/suggestion.pothos", to: "@/backend/graphql/pothos/parents/suggestion.pothos" },
  ],
};

const mappingKey = process.argv[2];
if (!mappingKey || !MAPPINGS[mappingKey]) {
  console.error("Usage: relocate-pothos.mjs <mappingName> — known:", Object.keys(MAPPINGS).join(", "));
  process.exit(2);
}
const replacements = MAPPINGS[mappingKey];

const skip = (p) =>
  p.includes("/node_modules/") ||
  p.includes("/.git/") ||
  p.includes("/.ai/") ||
  p.includes("/lost-found/");

const files = execSync(`git ls-files`, { cwd: root, encoding: "utf8" })
  .split("\n")
  .filter(Boolean)
  .filter((p) => p.endsWith(".ts") || p.endsWith(".tsx") || p.endsWith(".mjs"))
  .filter((p) => !skip(`/${p}/`))
  // CRITICAL: skip the relocator itself so it doesn't rewrite its own definitions.
  .filter((p) => !p.includes("/relocate-pothos.mjs"));

let touched = 0;
for (const rel of files) {
  let text;
  try {
    text = readFileSync(`${root}/${rel}`, "utf8");
  } catch {
    continue;
  }
  const orig = text;
  for (const { from, to } of replacements) {
    text = text.split(from).join(to);
  }
  if (text !== orig) {
    writeFileSync(`${root}/${rel}`, text);
    console.log(`updated: ${rel}`);
    touched++;
  }
}
console.log(`done; ${touched} file(s) updated.`);
