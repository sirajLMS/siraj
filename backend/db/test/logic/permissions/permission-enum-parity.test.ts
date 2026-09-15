import { describe, expect, test } from "bun:test";
import { isSqlite } from "@/backend/db";
import { permissions } from "@/backend/db/schema";
import { runInRollback } from "@/backend/db/test/test-utils";
import { AppPermission } from "@/backend/enum";

// Enum values that intentionally have no `permissions` table row:
// - test.* fixtures exist only to exercise the system-permission trigger in
//   permission-management tests and must never be seeded.
// - Legacy coarse profile keys were deleted from the table by the fine-grained
//   profile migration (grants replaced by profile.* section keys) while the
//   enum values remain for permission-override compatibility.
// - profile.core_status.* field-ACL keys have no seed migration yet.
const intentionallyUnseededKeys = new Set([
  "test.system_only",
  "test.custom_only",
  "test.custom_alt",
  "auth.view_own_profile",
  "auth.edit_own_profile",
  "user.view_profile",
  "user.edit_profile",
  "teacher.view_own_profile",
  "teacher.edit_own_profile",
  "parent.view_own_profile",
  "parent.edit_own_profile",
  "parent.view_profile",
  "staff.edit_profile",
  "profile.core_status.view_own",
  "profile.core_status.view_other",
  "profile.core_status.edit_own",
  "profile.core_status.edit_other",
]);

describe.skipIf(isSqlite())("AppPermission Enum ↔ Permissions Table Parity", () => {
  // Read-only drift check: every AppPermission enum value must have a seeded
  // `permissions` row. A missing row means an admin-facing permission is inert
  // (fail-closed) and group assignment of it would silently no-op.
  test("seeds every AppPermission value except documented unseeded keys", async () => {
    await runInRollback(async tx => {
      const rows = await tx.select({ key: permissions.key }).from(permissions);
      const seededKeys = new Set(rows.map(row => row.key));
      const missing = Object.values(AppPermission).filter(
        key => !seededKeys.has(key) && !intentionallyUnseededKeys.has(key)
      );
      expect(missing).toEqual([]);
    });
  });
});
