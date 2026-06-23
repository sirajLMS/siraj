### Task C — System Settings Seeder: Communication Category

---

**Objective**
Add 3 new system settings keys in a new `communication` category for complaint file limits and SMS rate limiting. Extend the `createSetting` helper's `category` parameter type union to include `"communication"`.

**Dependencies**
- Task A (schema migration) — no schema changes required; the `systemSettings` table already exists with a `category` column that accepts string values.
- The existing `ON CONFLICT DO UPDATE` idempotency pattern in `backend/db/seeds/system-settings.ts` already handles re-runs safely.

**Layer-Specific Rules**
- Read `backend/db/seeds/AGENTS.md` before writing any seed code.
- The seeder MUST export a function named `seedOrGet`.
- Idempotency: the `seedOrGet` function must be safely runnable multiple times without creating duplicate records (the existing `onConflictDoUpdate` pattern already satisfies this).
- No `console` methods — use `logger` utility from `@/backend/lib/logger`.
- No `any` type overrides.

**Target Files**

| File | Action |
|------|--------|
| `backend/db/seeds/system-settings.ts` | MODIFY — Add 3 new settings + extend category type union |

---

### Detailed Implementation Steps

---

#### Step 1 — Extend the `createSetting` Helper's `category` Type Union

Open `backend/db/seeds/system-settings.ts`.

Locate the `createSetting` function signature. The current `category` parameter type is:

```typescript
category: "security" | "system" | "scheduling",
```

Change it to include the new `"communication"` category:

```typescript
category: "security" | "system" | "scheduling" | "communication",
```

The full `createSetting` function signature after the edit:

```typescript
const createSetting = (
  key: string,
  value: string,
  description: string,
  category: "security" | "system" | "scheduling" | "communication",
  dataType: "integer" | "string" = "integer"
) => ({
  key,
  value,
  dataType,
  description,
  category,
});
```

---

#### Step 2 — Add 3 New Settings to the `SYSTEM_SETTINGS_DATA` Array

Locate the `SYSTEM_SETTINGS_DATA` array. After the last existing entry (`student_max_leaves`), add the 3 new communication settings before the closing `] as const;`:

```typescript
  createSetting(
    "complaint_max_file_size_mb",
    "25",
    "Maximum file size for complaint attachments in MB",
    "communication"
  ),
  createSetting(
    "complaint_max_files_per_complaint",
    "5",
    "Maximum number of files per complaint",
    "communication"
  ),
  createSetting(
    "sms_rate_limit_per_hour",
    "3",
    "Maximum SMS messages per parent per hour",
    "communication"
  ),
```

The full `SYSTEM_SETTINGS_DATA` array after the edit:

```typescript
const SYSTEM_SETTINGS_DATA = [
  createSetting("auth_max_attempts", "5", "Maximum failed login attempts before lockout", "security"),
  createSetting("auth_lockout_minutes", "15", "Duration of account lockout in minutes", "security"),
  createSetting("password_reset_expiry_hours", "24", "Expiration time for password reset tokens in hours", "security"),
  createSetting("cache_default_ttl_seconds", "3600", "Default TTL for cache entries in seconds", "system"),
  createSetting(
    "session_activation_window_before_minutes",
    "5",
    "Minutes before scheduled start time that a session can be activated",
    "scheduling"
  ),
  createSetting("default_timezone", "UTC", "Default fallback timezone for the system", "scheduling", "string"),
  createSetting(
    "session_absent_waiting_minutes",
    "30",
    "Minutes to wait before student can be marked absent",
    "scheduling"
  ),
  createSetting(
    "session_leave_reschedule_offset_days",
    "7",
    "Days offset to reschedule when leave is processed",
    "scheduling"
  ),
  createSetting(
    "teacher_max_leaves",
    "2",
    "Maximum number of leave requests a teacher can make per calendar month",
    "scheduling"
  ),
  createSetting(
    "student_max_leaves",
    "2",
    "Maximum number of leave requests a student can make per calendar month",
    "scheduling"
  ),
  createSetting(
    "complaint_max_file_size_mb",
    "25",
    "Maximum file size for complaint attachments in MB",
    "communication"
  ),
  createSetting(
    "complaint_max_files_per_complaint",
    "5",
    "Maximum number of files per complaint",
    "communication"
  ),
  createSetting(
    "sms_rate_limit_per_hour",
    "3",
    "Maximum SMS messages per parent per hour",
    "communication"
  ),
] as const;
```

---

#### Step 3 — Verify Idempotency

The existing `seedOrGet` function already uses the `onConflictDoUpdate` pattern on the `systemSettings.key` unique constraint:

```typescript
.onConflictDoUpdate({
  target: systemSettings.key,
  set: {
    value: setting.value,
    updatedAt: now,
  },
})
```

This ensures that re-running `bun db seed` will update existing rows rather than creating duplicates. No changes are needed to the `seedOrGet` function body.

Verify that the 3 new settings keys are unique and do not conflict with any existing keys in the array:

| Key | Unique? |
|---|---|
| `complaint_max_file_size_mb` | Yes — no existing key matches |
| `complaint_max_files_per_complaint` | Yes — no existing key matches |
| `sms_rate_limit_per_hour` | Yes — no existing key matches |

---

#### Step 4 — Verify the Complete File After Edits

The complete `backend/db/seeds/system-settings.ts` file after all edits:

```typescript
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { db } from "@/backend/db/drizzleDb";
import { systemSettings } from "@/backend/db/schema";
import logger from "@/backend/lib/logger";
import { SystemSettingsService } from "@/backend/services/system/system-settings.service";
import { createFileSeedingService } from "@/backend/storage/demo/fileInitializationService";

const createSetting = (
  key: string,
  value: string,
  description: string,
  category: "security" | "system" | "scheduling" | "communication",
  dataType: "integer" | "string" = "integer"
) => ({
  key,
  value,
  dataType,
  description,
  category,
});

const SYSTEM_SETTINGS_DATA = [
  createSetting("auth_max_attempts", "5", "Maximum failed login attempts before lockout", "security"),
  createSetting("auth_lockout_minutes", "15", "Duration of account lockout in minutes", "security"),
  createSetting("password_reset_expiry_hours", "24", "Expiration time for password reset tokens in hours", "security"),
  createSetting("cache_default_ttl_seconds", "3600", "Default TTL for cache entries in seconds", "system"),
  createSetting(
    "session_activation_window_before_minutes",
    "5",
    "Minutes before scheduled start time that a session can be activated",
    "scheduling"
  ),
  createSetting("default_timezone", "UTC", "Default fallback timezone for the system", "scheduling", "string"),
  createSetting(
    "session_absent_waiting_minutes",
    "30",
    "Minutes to wait before student can be marked absent",
    "scheduling"
  ),
  createSetting(
    "session_leave_reschedule_offset_days",
    "7",
    "Days offset to reschedule when leave is processed",
    "scheduling"
  ),
  createSetting(
    "teacher_max_leaves",
    "2",
    "Maximum number of leave requests a teacher can make per calendar month",
    "scheduling"
  ),
  createSetting(
    "student_max_leaves",
    "2",
    "Maximum number of leave requests a student can make per calendar month",
    "scheduling"
  ),
  createSetting(
    "complaint_max_file_size_mb",
    "25",
    "Maximum file size for complaint attachments in MB",
    "communication"
  ),
  createSetting(
    "complaint_max_files_per_complaint",
    "5",
    "Maximum number of files per complaint",
    "communication"
  ),
  createSetting(
    "sms_rate_limit_per_hour",
    "3",
    "Maximum SMS messages per parent per hour",
    "communication"
  ),
] as const;

export async function seedOrGet() {
  logger.info("Initializing storage directories...");
  try {
    const fileSeeder = await createFileSeedingService();
    await fileSeeder.ensureDirectory("public", true);
    await fileSeeder.ensureDirectory("public/docs", true);
    logger.info("Storage directories initialized successfully.");
  } catch (error) {
    logger.error("Failed to initialize storage directories:", error);
  }

  logger.info("Seeding teacher handbook...");
  const handbookFileName = "teacher-handbook.pdf";
  const handbookPath = path.join(__dirname, "assets", "teacher_handbook", handbookFileName);
  try {
    const fileBuffer = await fs.readFile(handbookPath);
    await SystemSettingsService.uploadHandbook(null, handbookFileName, fileBuffer);
    logger.info("Teacher handbook seeded successfully.");
  } catch (error) {
    logger.error("Failed to seed teacher handbook:", error);
  }

  logger.info("Seeding system settings...");
  const now = new Date();
  const results = [];

  for (const setting of SYSTEM_SETTINGS_DATA) {
    const [inserted] = await db
      .insert(systemSettings)
      .values({
        ...setting,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: {
          value: setting.value,
          updatedAt: now,
        },
      })
      .returning();

    results.push(inserted);
  }

  logger.info("System settings seeded.");
  return results;
}
```

---

### Test Execution Requirements

After completing the file edit, run the following commands to verify correctness:

```bash
bun db seed
bun tsgo
```

The `bun db seed` command must complete with exit code 0 and log "System settings seeded." without errors. The `bun tsgo` command must pass with zero TypeScript errors.

To verify the new settings were persisted correctly, optionally run:

```sql
SELECT key, value, category, data_type
FROM system_settings
WHERE category = 'communication'
ORDER BY key;
```

Expected output:

| key | value | category | data_type |
|---|---|---|---|
| `complaint_max_file_size_mb` | `25` | `communication` | `integer` |
| `complaint_max_files_per_complaint` | `5` | `communication` | `integer` |
| `sms_rate_limit_per_hour` | `3` | `communication` | `integer` |

To verify idempotency, run `bun db seed` a second time and confirm it completes without errors and without creating duplicate rows.

---

### Success Criteria

- [ ] `createSetting` helper's `category` parameter type extended from `"security" | "system" | "scheduling"` to `"security" | "system" | "scheduling" | "communication"`
- [ ] `complaint_max_file_size_mb` setting added with value `"25"`, category `"communication"`, dataType `"integer"`, description `"Maximum file size for complaint attachments in MB"`
- [ ] `complaint_max_files_per_complaint` setting added with value `"5"`, category `"communication"`, dataType `"integer"`, description `"Maximum number of files per complaint"`
- [ ] `sms_rate_limit_per_hour` setting added with value `"3"`, category `"communication"`, dataType `"integer"`, description `"Maximum SMS messages per parent per hour"`
- [ ] All 3 new entries added to `SYSTEM_SETTINGS_DATA` array after existing entries
- [ ] Idempotency verified — `ON CONFLICT DO UPDATE` pattern already exists, re-running `bun db seed` does not create duplicates
- [ ] `bun db seed` passes with exit code 0
- [ ] `bun tsgo` passes with zero TypeScript errors
- [ ] No `console` methods used — all logging via `logger`
- [ ] No `any` type overrides used
- [ ] `seedOrGet` function signature and export unchanged

---

**Quality Gate — Per-File Validation:**
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after creating/modifying a single file
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after creating/modifying a single file

**Quality Gate — Task Completion Validation:**
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after completing all steps
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after completing all steps
