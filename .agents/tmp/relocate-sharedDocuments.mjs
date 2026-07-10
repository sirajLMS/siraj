#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const ROOT = "/home/ahmed/Projects/siraj";
const OLD_PREFIX = "@/frontend/graphql/sharedDocuments/";

const DIRMAP = {
  "auth.documents": "auth",
  "schedule.documents": "scheduling",
  "schedule-deletion.documents": "scheduling",
  "weekly-schedule.documents": "scheduling",
  "recurring-class.documents": "scheduling",
  "availability-search.documents": "scheduling",
  "dst-migration.documents": "scheduling",
  "class-session.documents": "scheduling",
  "group-class.documents": "classes",
  "class-category.documents": "classes",
  "class-subject.documents": "classes",
  "student.documents": "students",
  "student-directory.documents": "students",
  "student-history.documents": "students",
  "student-lifecycle.documents": "students",
  "student-status.documents": "students",
  "student-onboarding.documents": "students",
  "teacher.documents": "teachers",
  "teacher-dashboard.documents": "teachers",
  "teacher-notes.documents": "teachers",
  "teacher-onboarding.documents": "teachers",
  "teacher-portal.documents": "teachers",
  "staff-profile.documents": "teachers",
  "staff-directory.documents": "teachers",
  "manager-onboarding.documents": "teachers",
  "parent-directory.documents": "parents",
  "parent-documents.documents": "parents",
  "parent-dashboard.documents": "parents",
  "parent-profile.documents": "parents",
  "parent-billing-history.documents": "parents",
  "parent-onboarding.documents": "parents",
  "parent-portal.documents": "parents",
  "billing-alerts.documents": "billing",
  "billing-management.documents": "billing",
  "user-billing-profile.documents": "billing",
  "fx-ingestion.documents": "billing",
  "notification-alerts.documents": "notifications",
  "notification-preferences.documents": "notifications",
  "permission-management.documents": "permissions",
  "profile.documents": "profile",
  "meeting.documents": "meeting",
  "complaint.documents": "complaints",
  "suggestion.documents": "suggestions",
  "report.documents": "reports",
  "learning-resource.documents": "resources",
  "books-and-bags.documents": "resources",
  "test-helper.documents": "shared",
  "translation.documents": "shared",
};

const skip = (p) => {
  if (p.endsWith(".mjs")) return true;
  if (p.startsWith(`${ROOT}/.git`)) return true;
  if (p.startsWith(`${ROOT}/node_modules`)) return true;
  if (p.startsWith(`${ROOT}/frontend/graphql/sharedDocuments`)) return true;
  return false;
};

const files = execSync(
  "cd /home/ahmed/Projects/siraj && git grep -l -I --full-name -e '@/frontend/graphql/sharedDocuments/' -- ':!/.git' ':!/node_modules' ':!/frontend/graphql/sharedDocuments'",
  { encoding: "utf8", maxBuffer: 50 * 1024 * 1024 },
)
  .split("\n")
  .filter(Boolean);

let totalEdits = 0;
const editedFiles = [];

for (const rel of files) {
  const abs = `${ROOT}/${rel}`;
  if (skip(abs)) continue;
  let src = readFileSync(abs, "utf8");
  const before = src;
  for (const [file, dir] of Object.entries(DIRMAP)) {
    const oldPat = `${OLD_PREFIX}${file}`;
    const newPat = `${OLD_PREFIX}${dir}/${file}`;
    src = src.split(oldPat).join(newPat);
  }
  if (src !== before) {
    writeFileSync(abs, src, "utf8");
    const edits = [...before.matchAll(/@\/frontend\/graphql\/sharedDocuments\/[a-z-]+\.documents/g)]
      .filter((m) => DIRMAP[m[0].split("/").slice(-1)[0]])
      .length;
    totalEdits += edits;
    editedFiles.push(rel);
  }
}

console.log(`Edited ${editedFiles.length} files, ~${totalEdits} import path updates.`);
console.log("First 10 edited files:");
console.log(editedFiles.slice(0, 10).join("\n"));
