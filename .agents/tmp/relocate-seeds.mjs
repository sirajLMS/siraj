#!/usr/bin/env node
// Idempotent import-path relocator for the backend/db/seeds refactor.
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const root = process.cwd();
const self = "/.agents/tmp/relocate-seeds.mjs";

const MAPPINGS = {
  all: [
    { from: "@/backend/db/seeds/system-settings", to: "@/backend/db/seeds/shared/system-settings" },
    { from: "@/backend/db/seeds/timezones", to: "@/backend/db/seeds/shared/timezones" },
    { from: "@/backend/db/seeds/verify-coverage", to: "@/backend/db/seeds/shared/verify-coverage" },
    {
      from: "@/backend/db/seeds/seed-user-permission-overrides",
      to: "@/backend/db/seeds/auth/seed-user-permission-overrides",
    },
    { from: "@/backend/db/seeds/seed-users", to: "@/backend/db/seeds/users/seed-users" },
    { from: "@/backend/db/seeds/seed-user-device-tokens", to: "@/backend/db/seeds/users/seed-user-device-tokens" },
    { from: "@/backend/db/seeds/seed-admin-audit-logs", to: "@/backend/db/seeds/audit/seed-admin-audit-logs" },
    { from: "@/backend/db/seeds/seed-audit-logs", to: "@/backend/db/seeds/audit/seed-audit-logs" },
    { from: "@/backend/db/seeds/seed-teachers", to: "@/backend/db/seeds/teachers/seed-teachers" },
    {
      from: "@/backend/db/seeds/seed-teacher-availability-windows",
      to: "@/backend/db/seeds/teachers/seed-teacher-availability-windows",
    },
    {
      from: "@/backend/db/seeds/seed-teacher-recurring-unavailability",
      to: "@/backend/db/seeds/teachers/seed-teacher-recurring-unavailability",
    },
    {
      from: "@/backend/db/seeds/seed-teacher-vacation-requests",
      to: "@/backend/db/seeds/teachers/seed-teacher-vacation-requests",
    },
    {
      from: "@/backend/db/seeds/seed-teacher-banking-details-history",
      to: "@/backend/db/seeds/teachers/seed-teacher-banking-details-history",
    },
    { from: "@/backend/db/seeds/seed-teacher-payments", to: "@/backend/db/seeds/teachers/seed-teacher-payments" },
    { from: "@/backend/db/seeds/seed-leave-requests", to: "@/backend/db/seeds/teachers/seed-leave-requests" },
    { from: "@/backend/db/seeds/seed-leave-quota-usage", to: "@/backend/db/seeds/teachers/seed-leave-quota-usage" },
    { from: "@/backend/db/seeds/seed-parents", to: "@/backend/db/seeds/parents/seed-parents" },
    { from: "@/backend/db/seeds/seed-suggestions", to: "@/backend/db/seeds/parents/seed-suggestions" },
    { from: "@/backend/db/seeds/seed-students", to: "@/backend/db/seeds/students/seed-students" },
    { from: "@/backend/db/seeds/seed-student-progress", to: "@/backend/db/seeds/students/seed-student-progress" },
    {
      from: "@/backend/db/seeds/seed-student-status-history",
      to: "@/backend/db/seeds/students/seed-student-status-history",
    },
    { from: "@/backend/db/seeds/seed-classes", to: "@/backend/db/seeds/classes/seed-classes" },
    { from: "@/backend/db/seeds/seed-class-instances", to: "@/backend/db/seeds/classes/seed-class-instances" },
    { from: "@/backend/db/seeds/seed-class-performance", to: "@/backend/db/seeds/classes/seed-class-performance" },
    { from: "@/backend/db/seeds/seed-class-status-events", to: "@/backend/db/seeds/classes/seed-class-status-events" },
    { from: "@/backend/db/seeds/seed-group-classes", to: "@/backend/db/seeds/classes/seed-group-classes" },
    {
      from: "@/backend/db/seeds/seed-group-class-enrollments",
      to: "@/backend/db/seeds/classes/seed-group-class-enrollments",
    },
    {
      from: "@/backend/db/seeds/seed-class-communications",
      to: "@/backend/db/seeds/classes/seed-class-communications",
    },
    { from: "@/backend/db/seeds/seed-dst-migration-runs", to: "@/backend/db/seeds/classes/seed-dst-migration-runs" },
    {
      from: "@/backend/db/seeds/seed-dst-migration-entries",
      to: "@/backend/db/seeds/classes/seed-dst-migration-entries",
    },
    {
      from: "@/backend/db/seeds/seed-recurring-schedule-days",
      to: "@/backend/db/seeds/classes/seed-recurring-schedule-days",
    },
    {
      from: "@/backend/db/seeds/seed-currency-exchange-rates",
      to: "@/backend/db/seeds/billing/seed-currency-exchange-rates",
    },
    {
      from: "@/backend/db/seeds/seed-currency-exchange-audit-logs",
      to: "@/backend/db/seeds/billing/seed-currency-exchange-audit-logs",
    },
    { from: "@/backend/db/seeds/seed-currency-hedges", to: "@/backend/db/seeds/billing/seed-currency-hedges" },
    { from: "@/backend/db/seeds/seed-invoices", to: "@/backend/db/seeds/billing/seed-invoices" },
    {
      from: "@/backend/db/seeds/seed-invoice-coverage-months",
      to: "@/backend/db/seeds/billing/seed-invoice-coverage-months",
    },
    { from: "@/backend/db/seeds/seed-payments", to: "@/backend/db/seeds/billing/seed-payments" },
    {
      from: "@/backend/db/seeds/seed-user-notification-preferences",
      to: "@/backend/db/seeds/notifications/seed-user-notification-preferences",
    },
    {
      from: "@/backend/db/seeds/seed-notification-deliveries",
      to: "@/backend/db/seeds/notifications/seed-notification-deliveries",
    },
    { from: "@/backend/db/seeds/seed-complaints", to: "@/backend/db/seeds/complaints/seed-complaints" },
    {
      from: "@/backend/db/seeds/seed-complaint-responses",
      to: "@/backend/db/seeds/complaints/seed-complaint-responses",
    },
    { from: "@/backend/db/seeds/seed-learning-resources", to: "@/backend/db/seeds/storage/seed-learning-resources" },
    { from: "@/backend/db/seeds/seed-site-content", to: "@/backend/db/seeds/storage/seed-site-content" },
  ],
};

const mappingKey = process.argv[2];
if (!mappingKey || !MAPPINGS[mappingKey]) {
  console.error("Usage: relocate-seeds.mjs <mappingName>");
  process.exit(2);
}
const replacements = MAPPINGS[mappingKey];

const skip = p =>
  p.endsWith(self) ||
  p.endsWith("/relocate-enum.mjs") ||
  p.endsWith("/relocate-pothos.mjs") ||
  p.endsWith("/relocate-repo.mjs") ||
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
