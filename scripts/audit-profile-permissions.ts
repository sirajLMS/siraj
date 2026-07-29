/**
 * Audits profile fine-grained permissions vs legacy keys on target permission groups.
 *
 * Usage:
 *   bun run scripts/audit-profile-permissions.ts --env-file .env
 *   bun run scripts/audit-profile-permissions.ts --env-file .env --post-migration
 */

import { Pool } from "pg";
import { applyEnvFile, parseDbCliArgs } from "@/scripts/dbActions/envFile";

const TARGET_GROUPS = [
  "super_admin",
  "academy_admin",
  "teacher_default",
  "parent_default",
  "staff_default",
  "supervisor_default",
  "student_default",
] as const;

const LEGACY_PROFILE_KEYS = [
  "auth.view_own_profile",
  "auth.edit_own_profile",
  "user.view_profile",
  "user.edit_profile",
  "teacher.view_own_profile",
  "teacher.edit_own_profile",
  "teacher.view_profile",
  "parent.view_own_profile",
  "parent.edit_own_profile",
  "parent.view_profile",
  "staff.edit_profile",
] as const;

/** Minimum fine-grained grants per group (matches 6a / 6d migration spec). */
const REQUIRED_FINE_GRAINED_BY_GROUP: Record<string, readonly string[]> = {
  super_admin: [
    "profile.core_identity.view_own",
    "profile.core_identity.view_other",
    "profile.core_identity.edit_own",
    "profile.core_identity.edit_other",
    "profile.core_contact.view_own",
    "profile.core_contact.view_other",
    "profile.core_contact.edit_own",
    "profile.core_contact.edit_other",
    "profile.teacher_professional.view_own",
    "profile.teacher_professional.view_other",
    "profile.teacher_professional.edit_own",
    "profile.teacher_professional.edit_other",
    "profile.teacher_identity.view_own",
    "profile.teacher_identity.view_other",
    "profile.teacher_identity.edit_own",
    "profile.teacher_identity.edit_other",
    "profile.parent_social.view_own",
    "profile.parent_social.view_other",
    "profile.parent_social.edit_own",
    "profile.parent_social.edit_other",
    "profile.parent_identity.view_own",
    "profile.parent_identity.view_other",
    "profile.parent_identity.edit_own",
    "profile.parent_identity.edit_other",
    "profile.parent_billing.view_own",
    "profile.parent_billing.view_other",
    "profile.parent_billing.edit_own",
    "profile.parent_billing.edit_other",
    "profile.parent_account.view_own",
    "profile.parent_account.view_other",
    "profile.parent_account.edit_own",
    "profile.parent_account.edit_other",
    "profile.parent_students.view_own",
    "profile.parent_students.view_other",
    "profile.parent_students.edit_own",
    "profile.parent_students.edit_other",
    "profile.teacher_students.view_own",
    "profile.teacher_students.view_other",
    "profile.teacher_students.edit_own",
    "profile.teacher_students.edit_other",
    "profile.staff_role.view_own",
    "profile.staff_role.view_other",
    "profile.staff_role.edit_own",
    "profile.staff_role.edit_other",
    "profile.staff_permissions.view_own",
    "profile.staff_permissions.view_other",
    "profile.staff_permissions.edit_own",
    "profile.staff_permissions.edit_other",
    "profile.payment_methods.view_own",
    "profile.payment_methods.view_other",
    "profile.payment_methods.edit_own",
    "profile.payment_methods.edit_other",
    "profile.meeting_configs.view_own",
    "profile.meeting_configs.view_other",
    "profile.meeting_configs.edit_own",
    "profile.meeting_configs.edit_other",
    "student.student_identity.view_own",
    "student.student_identity.view_other",
    "student.student_identity.edit_own",
    "student.student_identity.edit_other",
    "student.student_academic.view_own",
    "student.student_academic.view_other",
    "student.student_academic.edit_own",
    "student.student_academic.edit_other",
    "student.student_teacher.view_own",
    "student.student_teacher.view_other",
    "student.student_teacher.edit_own",
    "student.student_teacher.edit_other",
    "student.student_parent.view_own",
    "student.student_parent.view_other",
    "student.student_parent.edit_own",
    "student.student_parent.edit_other",
    "student.student_schedule.view_own",
    "student.student_schedule.view_other",
    "student.student_schedule.edit_own",
    "student.student_schedule.edit_other",
    "student.student_history.view_own",
    "student.student_history.view_other",
    "student.student_history.edit_own",
    "student.student_history.edit_other",
    "student.student_quota_edit.view_own",
    "student.student_quota_edit.view_other",
    "student.student_quota_edit.edit_own",
    "student.student_quota_edit.edit_other",
  ],
  academy_admin: [
    "profile.core_identity.view_other",
    "profile.core_contact.view_other",
    "profile.teacher_professional.view_other",
    "profile.teacher_identity.view_other",
    "profile.parent_social.view_other",
    "profile.parent_identity.view_other",
    "profile.parent_billing.view_other",
    "profile.parent_account.view_other",
    "profile.parent_students.view_other",
    "profile.teacher_students.view_other",
    "profile.staff_role.view_other",
    "profile.staff_permissions.view_other",
    "profile.payment_methods.view_other",
    "profile.meeting_configs.view_other",
    "profile.core_identity.edit_other",
    "profile.core_contact.edit_other",
    "profile.teacher_professional.edit_other",
    "profile.teacher_identity.edit_other",
    "profile.parent_social.edit_other",
    "profile.parent_identity.edit_other",
    "profile.parent_billing.edit_other",
    "profile.parent_account.edit_other",
    "profile.parent_students.edit_other",
    "profile.teacher_students.edit_other",
    "profile.staff_role.edit_other",
    "profile.staff_permissions.edit_other",
    "profile.payment_methods.edit_other",
    "profile.meeting_configs.edit_other",
    "student.student_identity.view_other",
    "student.student_academic.view_other",
    "student.student_teacher.view_other",
    "student.student_parent.view_other",
    "student.student_schedule.view_other",
    "student.student_history.view_other",
    "student.student_quota_edit.view_other",
    "student.student_identity.edit_other",
    "student.student_academic.edit_other",
    "student.student_teacher.edit_other",
    "student.student_parent.edit_other",
    "student.student_schedule.edit_other",
    "student.student_history.edit_other",
    "student.student_quota_edit.edit_other",
  ],
  teacher_default: [
    "profile.core_identity.view_own",
    "profile.core_contact.view_own",
    "profile.teacher_professional.view_own",
    "profile.teacher_students.view_own",
    "profile.payment_methods.view_own",
    "profile.meeting_configs.view_own",
    "profile.core_identity.edit_own",
    "profile.core_contact.edit_own",
    "profile.teacher_professional.edit_own",
    "profile.payment_methods.edit_own",
    "profile.meeting_configs.edit_own",
    "profile.core_identity.view_other",
    "profile.core_contact.view_other",
    "profile.teacher_professional.view_other",
    "profile.teacher_identity.view_other",
    "profile.teacher_students.view_other",
    "student.student_identity.view_own",
    "student.student_academic.view_own",
    "student.student_teacher.view_own",
    "student.student_schedule.view_own",
    "student.student_history.view_own",
  ],
  parent_default: [
    "profile.core_identity.view_own",
    "profile.core_contact.view_own",
    "profile.parent_social.view_own",
    "profile.parent_students.view_own",
    "profile.payment_methods.view_own",
    "profile.meeting_configs.view_own",
    "profile.core_identity.edit_own",
    "profile.core_contact.edit_own",
    "profile.parent_social.edit_own",
    "profile.payment_methods.edit_own",
    "profile.meeting_configs.edit_own",
    "profile.core_identity.view_other",
    "profile.core_contact.view_other",
    "profile.parent_social.view_other",
    "profile.parent_identity.view_other",
    "profile.parent_billing.view_other",
    "profile.parent_account.view_other",
    "profile.parent_students.view_other",
    "profile.payment_methods.view_other",
    "profile.meeting_configs.view_other",
    "student.student_identity.view_own",
    "student.student_academic.view_own",
    "student.student_teacher.view_own",
    "student.student_schedule.view_own",
    "student.student_history.view_own",
    "student.student_quota_edit.edit_own",
  ],
  staff_default: [
    "profile.core_identity.view_own",
    "profile.core_contact.view_own",
    "profile.staff_role.view_own",
    "profile.core_identity.view_other",
    "profile.core_contact.view_other",
    "profile.staff_role.view_other",
    "profile.staff_permissions.view_other",
    "profile.staff_role.edit_other",
    "profile.staff_permissions.edit_other",
  ],
  supervisor_default: [
    "profile.core_identity.view_own",
    "profile.core_contact.view_own",
    "profile.staff_role.view_own",
    "profile.core_identity.view_other",
    "profile.core_contact.view_other",
    "profile.teacher_professional.view_other",
    "profile.teacher_identity.view_other",
    "profile.parent_social.view_other",
    "profile.parent_identity.view_other",
    "profile.parent_billing.view_other",
    "profile.parent_account.view_other",
    "profile.parent_students.view_other",
    "profile.teacher_students.view_other",
    "profile.staff_role.view_other",
    "profile.staff_permissions.view_other",
    "profile.payment_methods.view_other",
    "profile.meeting_configs.view_other",
    "student.student_identity.view_other",
    "student.student_academic.view_other",
    "student.student_teacher.view_other",
    "student.student_parent.view_other",
    "student.student_schedule.view_other",
    "student.student_history.view_other",
    "student.student_quota_edit.view_other",
  ],
  student_default: [
    "student.student_identity.view_own",
    "student.student_academic.view_own",
    "student.student_teacher.view_own",
    "student.student_schedule.view_own",
    "student.student_history.view_own",
    "student.student_identity.edit_own",
    "student.student_parent.edit_own",
  ],
};

type GroupGrantRow = { slug: string; key: string };

async function fetchGroupGrants(pool: Pool): Promise<GroupGrantRow[]> {
  const result = await pool.query<GroupGrantRow>(
    `
    SELECT g.slug, p.key
    FROM permission_groups g
    JOIN group_permissions gp ON gp.group_id = g.id
    JOIN permissions p ON p.id = gp.permission_id
    WHERE g.slug = ANY($1::text[])
    ORDER BY g.slug, p.key
    `,
    [TARGET_GROUPS]
  );
  return result.rows;
}

function grantsByGroup(rows: GroupGrantRow[]): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const group of TARGET_GROUPS) {
    map.set(group, new Set());
  }
  for (const row of rows) {
    const set = map.get(row.slug);
    if (set) {
      set.add(row.key);
    }
  }
  return map;
}

function printLegacyReport(grants: Map<string, Set<string>>): boolean {
  globalThis.console.log("\n=== Legacy profile keys on target groups ===");
  let found = false;
  for (const group of TARGET_GROUPS) {
    const groupGrants = grants.get(group) ?? new Set();
    const legacy = LEGACY_PROFILE_KEYS.filter(key => groupGrants.has(key));
    if (legacy.length > 0) {
      found = true;
      globalThis.console.log(`${group}: ${legacy.join(", ")}`);
    }
  }
  if (!found) {
    globalThis.console.log("No legacy profile keys found on target groups.");
  }
  return found;
}

function printFineGrainedReport(grants: Map<string, Set<string>>): void {
  globalThis.console.log("\n=== Fine-grained profile.* / student.* grants ===");
  for (const group of TARGET_GROUPS) {
    const groupGrants = grants.get(group) ?? new Set();
    const fine = [...groupGrants].filter(key => key.startsWith("profile.") || key.startsWith("student.")).sort();
    globalThis.console.log(`\n${group} (${fine.length} keys):`);
    for (const key of fine) {
      globalThis.console.log(`  ${key}`);
    }
  }
}

function printGapTable(grants: Map<string, Set<string>>): boolean {
  globalThis.console.log("\n=== Gap table (required vs actual) ===");
  let hasGap = false;
  for (const group of TARGET_GROUPS) {
    const groupGrants = grants.get(group) ?? new Set();
    const required = REQUIRED_FINE_GRAINED_BY_GROUP[group] ?? [];
    const missing = required.filter(key => !groupGrants.has(key));
    if (missing.length > 0) {
      hasGap = true;
      globalThis.console.log(`${group}: GAP — missing ${missing.length} key(s):`);
      for (const key of missing) {
        globalThis.console.log(`  GAP ${key}`);
      }
    } else {
      globalThis.console.log(`${group}: OK (${required.length} required keys present)`);
    }
  }
  return hasGap;
}

async function main(): Promise<void> {
  const args = parseDbCliArgs(process.argv.slice(2));
  const postMigration = process.argv.includes("--post-migration");
  const envFile = args.envFile ?? ".env";

  applyEnvFile(envFile);
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set after loading env file.");
  }

  const parsed = new URL(databaseUrl);
  const requiresSsl = parsed.searchParams.get("sslmode") === "require" || /\.neon\.tech$/i.test(parsed.hostname);

  globalThis.console.log(`Audit profile permissions — env: ${envFile}, host: ${parsed.hostname}`);

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: requiresSsl ? { rejectUnauthorized: false } : undefined,
    max: 1,
  });

  try {
    const rows = await fetchGroupGrants(pool);
    const grants = grantsByGroup(rows);

    const hasLegacy = printLegacyReport(grants);
    printFineGrainedReport(grants);
    const hasGap = printGapTable(grants);

    if (postMigration && hasLegacy) {
      globalThis.console.error("\nPOST-MIGRATION CHECK FAILED: legacy keys still present on target groups.");
      process.exit(1);
    }

    if (hasGap) {
      globalThis.console.error("\nAUDIT FAILED: missing required fine-grained grants.");
      process.exit(1);
    }

    if (postMigration) {
      globalThis.console.log("\nPOST-MIGRATION CHECK PASSED: no gaps, no legacy keys.");
    } else {
      globalThis.console.log("\nPre-migration audit complete.");
    }
  } finally {
    await pool.end();
  }
}

if (import.meta.main) {
  main().catch((err: unknown) => {
    globalThis.console.error(err);
    process.exit(1);
  });
}
