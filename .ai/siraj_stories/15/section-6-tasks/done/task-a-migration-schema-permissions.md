### Task A — Migration, Schema & Permissions

**Objective:** Apply all database schema changes, enum extensions, and new permissions for Story 15. This includes adding the `SuggestionStatus` enum, extending `NotificationChannel` with `ON_APP`, extending `NotificationEventType` with 4 new event types, adding 3 new `AppPermission` values, adding 6 new columns and 4 new indexes to the `suggestions` table, wiring Drizzle relations for suggestion duplicates and review tracking, extending the soft-delete infrastructure to support suggestions, and seeding new permissions with group assignments in the migration SQL.

---

**Dependencies:** None — depends only on current project state (Story 14 executed).

---

**Layer-Specific Rules:**

- **Database Migration:** New permissions are added to `backend/db/migration/3-system_permissions_and_groups.sql`, NOT to a separate seed file. The migration uses `ON CONFLICT (key) DO UPDATE` for idempotent re-runs.
- **Permission Enums:** Values use PascalCase (e.g., `SUGGESTIONS_LIST = "suggestions.list"`) in `shared/lib/enum.ts`.
- **Database Schema:** All schema changes use Drizzle ORM primitives (`pgTable`, `uuid`, `text`, `timestamp`, `index`). Enum columns use `createPgEnumFromEnum` helper from `backend/utils/db.utils`.
- **Drizzle Relations:** Relations use `defineRelations` from `drizzle-orm` with `r.one` / `r.many` syntax. Self-referencing relations (e.g., `duplicateOf` → `suggestions.id`) are supported.
- **Soft-Delete Infrastructure:** New soft-deletable entities must be registered in `backend/types/soft-delete.types.ts` (type maps) AND `backend/db/repo/soft-delete.repository.ts` (runtime config + convenience method). The `AuditEntityType` union in `backend/types/audit.types.ts` must also be extended.
- **Database Migration Task Protocol:** After writing the migration, run in exact order: `bun db cleanGenerate` → `bun db reset` → `bun db seed` → `bun test:db`. All four must pass before the task is complete.
- **No `console` methods** — ESLint will error. Use `logger` utility if logging is needed.
- **Canonical Types Creation:** This task MUST create or update canonical `.types.ts` files for all new/modified tables. Each table gets exactly one canonical file in `backend/types/`. Types use `$inferSelect`/`$inferInsert` from Drizzle as foundation.

---

**Target Files:**

1. `shared/lib/enum.ts` — Add `SuggestionStatus` enum, `ON_APP` to `NotificationChannel`, 4 new `NotificationEventType` values, 3 new `AppPermission` values
2. `backend/db/schema/enums.ts` — Import `SuggestionStatus` and add `suggestionStatusEnum`
3. `backend/db/schema/communications.ts` — Import `suggestionStatusEnum`, add 6 columns to `suggestions` table, add 4 new indexes
4. `backend/db/drizzleRelations.ts` — Add `duplicateOf`, `duplicates`, `reviewedBy` relations on `suggestions`; add `reviewedSuggestions` on `users`
5. `backend/types/audit.types.ts` — Add `"SUGGESTION"` to `AuditEntityType` union
6. `backend/types/soft-delete.types.ts` — Add `suggestions` to `SoftDeletableTableName`, `SoftDeletableEntityMap`, and `SoftDeletableAuditEntityMap`
7. `backend/db/repo/soft-delete.repository.ts` — Add `suggestions` to `SOFT_DELETE_TABLES` config and add `softDeleteSuggestion()` convenience method
8. `backend/db/migration/3-system_permissions_and_groups.sql` — Add `CREATE TYPE`, `ALTER TYPE` statements, `ALTER TABLE` for 6 columns, 4 `CREATE INDEX` statements, 3 new permission INSERTs, and group_permissions assignments for `super_admin` and `academy_admin`
9. `backend/types/suggestions.types.ts` — CREATE — canonical types for suggestions table (SuggestionSelectType, SuggestionInsertType, SuggestionReturnType, SuggestionSubmitInput, SuggestionQueueFilter, SuggestionMetrics, SuggestionQueueResult)

---

**Detailed Implementation Steps:**

#### Step 1: Add `SuggestionStatus` Enum to `shared/lib/enum.ts`

Open `shared/lib/enum.ts` and locate the `ComplaintStatus` enum. After the closing brace of `ComplaintStatus`, insert the new `SuggestionStatus` enum:

```typescript
export enum SuggestionStatus {
  PENDING = "PENDING",
  REVIEWED = "REVIEWED",
  DUPLICATE = "DUPLICATE",
}
```

The surrounding context after the edit must look exactly like this:

```typescript
export enum ComplaintStatus {
  UNANSWERED = "UNANSWERED",
  ANSWERED = "ANSWERED",
}

export enum SuggestionStatus {
  PENDING = "PENDING",
  REVIEWED = "REVIEWED",
  DUPLICATE = "DUPLICATE",
}

export enum LeaveRequestStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  RESCHEDULED = "RESCHEDULED",
  CANCELLED = "CANCELLED",
}
```

---

#### Step 2: Extend `NotificationChannel` Enum in `shared/lib/enum.ts`

Locate the `NotificationChannel` enum. It currently reads:

```typescript
export enum NotificationChannel {
  EMAIL = "EMAIL",
  SMS = "SMS",
  PUSH = "PUSH",
}
```

Add `ON_APP` as the last value:

```typescript
export enum NotificationChannel {
  EMAIL = "EMAIL",
  SMS = "SMS",
  PUSH = "PUSH",
  ON_APP = "ON_APP",
}
```

---

#### Step 3: Extend `NotificationEventType` Enum in `shared/lib/enum.ts`

Locate the `NotificationEventType` enum. It currently reads:

```typescript
export enum NotificationEventType {
  CLASS_REMINDER = "CLASS_REMINDER",
  INVOICE_GENERATED = "INVOICE_GENERATED",
  COMPLAINT_RESPONSE = "COMPLAINT_RESPONSE",
  BANKING_DETAILS_CHANGED = "BANKING_DETAILS_CHANGED",
}
```

Add 4 new event type values:

```typescript
export enum NotificationEventType {
  CLASS_REMINDER = "CLASS_REMINDER",
  INVOICE_GENERATED = "INVOICE_GENERATED",
  COMPLAINT_RESPONSE = "COMPLAINT_RESPONSE",
  BANKING_DETAILS_CHANGED = "BANKING_DETAILS_CHANGED",
  NEW_COMPLAINT = "NEW_COMPLAINT",
  NEW_SUGGESTION = "NEW_SUGGESTION",
  SUGGESTION_ACKNOWLEDGED = "SUGGESTION_ACKNOWLEDGED",
  SUGGESTION_DUPLICATE_MARKED = "SUGGESTION_DUPLICATE_MARKED",
}
```

---

#### Step 4: Add 3 New `AppPermission` Values to `shared/lib/enum.ts`

Locate the `AppPermission` enum. After the existing line:

```typescript
  TEST_SYSTEM_ONLY = "test.system_only",
  TEST_CUSTOM_ONLY = "test.custom_only",
```

Insert the 3 new permission values **before** the `TEST_SYSTEM_ONLY` line:

```typescript
  SUGGESTIONS_LIST = "suggestions.list",
  SUGGESTIONS_REVIEW = "suggestions.review",
  SUGGESTIONS_DELETE = "suggestions.delete",
  TEST_SYSTEM_ONLY = "test.system_only",
  TEST_CUSTOM_ONLY = "test.custom_only",
```

The surrounding context after the edit must look exactly like this:

```typescript
  SYSTEM_RESTRICT_RESOURCE_ACCESS = "system.restrict_resource_access",
  SUGGESTIONS_LIST = "suggestions.list",
  SUGGESTIONS_REVIEW = "suggestions.review",
  SUGGESTIONS_DELETE = "suggestions.delete",
  TEST_SYSTEM_ONLY = "test.system_only",
  TEST_CUSTOM_ONLY = "test.custom_only",
}
```

---

#### Step 5: Add `suggestionStatusEnum` to `backend/db/schema/enums.ts`

Open `backend/db/schema/enums.ts`. First, add `SuggestionStatus` to the import from `@/shared/lib/enum`. The current import block reads:

```typescript
import {
  AccountStatus,
  AppLanguage,
  AppPermission,
  ClassExecutionState,
  ClassOutcome,
  ClassType,
  ComplaintCategory,
  ComplaintStatus,
  CountryCode,
  DayOfWeek,
  DevicePlatform,
  DstMigrationResult,
  Gender,
  InvoiceStatus,
  InvoiceType,
  LeaveRequesterType,
  LeaveRequestStatus,
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationEventType,
  ParentStatus,
  PaymentMethod,
  StudentStatus,
  VacationRequestStatus,
} from "@/shared/lib/enum";
```

Replace with:

```typescript
import {
  AccountStatus,
  AppLanguage,
  AppPermission,
  ClassExecutionState,
  ClassOutcome,
  ClassType,
  ComplaintCategory,
  ComplaintStatus,
  CountryCode,
  DayOfWeek,
  DevicePlatform,
  DstMigrationResult,
  Gender,
  InvoiceStatus,
  InvoiceType,
  LeaveRequesterType,
  LeaveRequestStatus,
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationEventType,
  ParentStatus,
  PaymentMethod,
  StudentStatus,
  SuggestionStatus,
  VacationRequestStatus,
} from "@/shared/lib/enum";
```

Then, after the existing `complaintStatusEnum` line:

```typescript
export const complaintStatusEnum = createPgEnumFromEnum("complaint_status", ComplaintStatus);
```

Add the new enum declaration:

```typescript
export const suggestionStatusEnum = createPgEnumFromEnum("suggestion_status", SuggestionStatus);
```

The surrounding context after the edit must look exactly like this:

```typescript
export const complaintStatusEnum = createPgEnumFromEnum("complaint_status", ComplaintStatus);

export const suggestionStatusEnum = createPgEnumFromEnum("suggestion_status", SuggestionStatus);

export const leaveRequestStatusEnum = createPgEnumFromEnum("leave_request_status", LeaveRequestStatus);
```

---

#### Step 6: Add 6 New Columns and 4 New Indexes to `suggestions` Table in `backend/db/schema/communications.ts`

Open `backend/db/schema/communications.ts`.

**6a.** Update the import statement at the top of the file. The current imports from `./enums` read:

```typescript
import {
  complaintCategoryEnum,
  complaintStatusEnum,
  devicePlatformEnum,
  notificationChannelEnum,
  notificationDeliveryStatusEnum,
  notificationEventTypeEnum,
} from "./enums";
```

Replace with:

```typescript
import {
  complaintCategoryEnum,
  complaintStatusEnum,
  devicePlatformEnum,
  notificationChannelEnum,
  notificationDeliveryStatusEnum,
  notificationEventTypeEnum,
  suggestionStatusEnum,
} from "./enums";
```

**6b.** Replace the entire `suggestions` table definition. The current definition reads:

```typescript
export const suggestions = pgTable(
  "suggestions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    parentId: uuid("parent_id")
      .notNull()
      .references(() => parents.id, { onDelete: "restrict" }),
    submitterName: varchar("submitter_name", { length: 255 }).notNull(),
    body: text("body").notNull(),
    emailSentAt: timestamp("email_sent_at", { withTimezone: true, precision: 3 }),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
  },
  table => [index("suggestions_parent_id_idx").on(table.parentId)]
);
```

Replace with the following expanded definition that adds 6 new columns and 4 new indexes:

```typescript
// NOTE: PostgreSQL Row-Level Security (RLS) policies are active on this table.
// Soft-deleted records (deleted_at IS NOT NULL) are automatically filtered out for SELECT/UPDATE.
export const suggestions = pgTable(
  "suggestions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    parentId: uuid("parent_id")
      .notNull()
      .references(() => parents.id, { onDelete: "restrict" }),
    submitterName: varchar("submitter_name", { length: 255 }).notNull(),
    body: text("body").notNull(),
    status: suggestionStatusEnum("status").notNull().default("PENDING"),
    duplicateOfId: uuid("duplicate_of_id").references(() => suggestions.id, { onDelete: "set null" }),
    adminResponse: text("admin_response"),
    reviewedByUserId: uuid("reviewed_by_user_id").references(() => users.id, { onDelete: "set null" }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true, precision: 3 }),
    emailSentAt: timestamp("email_sent_at", { withTimezone: true, precision: 3 }),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, precision: 3 }),
  },
  table => [
    index("suggestions_parent_id_idx").on(table.parentId),
    index("suggestions_status_idx").on(table.status),
    index("suggestions_duplicate_of_id_idx").on(table.duplicateOfId),
    index("suggestions_reviewed_by_user_id_idx").on(table.reviewedByUserId),
    index("suggestions_deleted_at_idx").on(table.deletedAt),
  ]
);
```

---

#### Step 7: Add Drizzle Relations for Suggestions and Users in `backend/db/drizzleRelations.ts`

Open `backend/db/drizzleRelations.ts`.

**7a.** Locate the `suggestions` relations block. It currently reads:

```typescript
  suggestions: {
    parent: r.one.parents({
      from: r.suggestions.parentId,
      to: r.parents.id,
    }),
  },
```

Replace with the expanded relations block that adds `duplicateOf`, `duplicates`, and `reviewedBy`:

```typescript
  suggestions: {
    parent: r.one.parents({
      from: r.suggestions.parentId,
      to: r.parents.id,
    }),
    duplicateOf: r.one.suggestions({
      from: r.suggestions.duplicateOfId,
      to: r.suggestions.id,
    }),
    duplicates: r.many.suggestions({
      from: r.suggestions.id,
      to: r.suggestions.duplicateOfId,
    }),
    reviewedBy: r.one.users({
      from: r.suggestions.reviewedByUserId,
      to: r.users.id,
    }),
  },
```

**7b.** Locate the `users` relations block. It currently ends with:

```typescript
    uploadedResources: r.many.learningResources({
      from: r.users.id,
      to: r.learningResources.uploadedByUserId,
    }),
  },
```

Add the `reviewedSuggestions` relation before the closing brace of the `users` block:

```typescript
    uploadedResources: r.many.learningResources({
      from: r.users.id,
      to: r.learningResources.uploadedByUserId,
    }),
    reviewedSuggestions: r.many.suggestions({
      from: r.users.id,
      to: r.suggestions.reviewedByUserId,
    }),
  },
```

---

#### Step 8: Add `"SUGGESTION"` to `AuditEntityType` in `backend/types/audit.types.ts`

Open `backend/types/audit.types.ts`. Locate the `AuditEntityType` union. It currently reads:

```typescript
export type AuditEntityType =
  | "SYSTEM"
  | "STUDENT"
  | "INVOICE"
  | "PAYMENT"
  | "PERMISSION"
  | "PERMISSION_GROUP"
  | "USER_PERMISSION"
  | "EXCHANGE_RATE"
  | "SYSTEM_SETTING"
  | "USER"
  | "TEACHER"
  | "PARENT"
  | "CLASS_INSTANCE"
  | "RECURRING_SCHEDULE"
  | "LEAVE_REQUEST"
  | "COMPLAINT"
  | "LEARNING_RESOURCE";
```

Add `"SUGGESTION"` after `"LEARNING_RESOURCE"`:

```typescript
export type AuditEntityType =
  | "SYSTEM"
  | "STUDENT"
  | "INVOICE"
  | "PAYMENT"
  | "PERMISSION"
  | "PERMISSION_GROUP"
  | "USER_PERMISSION"
  | "EXCHANGE_RATE"
  | "SYSTEM_SETTING"
  | "USER"
  | "TEACHER"
  | "PARENT"
  | "CLASS_INSTANCE"
  | "RECURRING_SCHEDULE"
  | "LEAVE_REQUEST"
  | "COMPLAINT"
  | "LEARNING_RESOURCE"
  | "SUGGESTION";
```

---

#### Step 9: Extend Soft-Delete Types in `backend/types/soft-delete.types.ts`

Open `backend/types/soft-delete.types.ts`.

**9a.** Add `suggestions` to the import from `@/backend/db/schema`. The current import reads:

```typescript
import type {
  classInstances,
  complaints,
  invoices,
  learningResources,
  recurringSchedules,
  users,
} from "@/backend/db/schema";
```

Replace with:

```typescript
import type {
  classInstances,
  complaints,
  invoices,
  learningResources,
  recurringSchedules,
  suggestions,
  users,
} from "@/backend/db/schema";
```

**9b.** Add `"suggestions"` to the `SoftDeletableTableName` union. The current type reads:

```typescript
export type SoftDeletableTableName =
  | "users"
  | "recurring_schedules"
  | "class_instances"
  | "complaints"
  | "learning_resources"
  | "invoices";
```

Replace with:

```typescript
export type SoftDeletableTableName =
  | "users"
  | "recurring_schedules"
  | "class_instances"
  | "complaints"
  | "learning_resources"
  | "invoices"
  | "suggestions";
```

**9c.** Add `suggestions` to `SoftDeletableEntityMap`. The current type reads:

```typescript
export type SoftDeletableEntityMap = {
  users: typeof users.$inferSelect;
  recurring_schedules: typeof recurringSchedules.$inferSelect;
  class_instances: typeof classInstances.$inferSelect;
  complaints: typeof complaints.$inferSelect;
  learning_resources: typeof learningResources.$inferSelect;
  invoices: typeof invoices.$inferSelect;
};
```

Replace with:

```typescript
export type SoftDeletableEntityMap = {
  users: typeof users.$inferSelect;
  recurring_schedules: typeof recurringSchedules.$inferSelect;
  class_instances: typeof classInstances.$inferSelect;
  complaints: typeof complaints.$inferSelect;
  learning_resources: typeof learningResources.$inferSelect;
  invoices: typeof invoices.$inferSelect;
  suggestions: typeof suggestions.$inferSelect;
};
```

**9d.** Add `suggestions` to `SoftDeletableAuditEntityMap`. The current type reads:

```typescript
export type SoftDeletableAuditEntityMap = {
  users: Extract<AuditEntityType, "USER">;
  recurring_schedules: Extract<AuditEntityType, "RECURRING_SCHEDULE">;
  class_instances: Extract<AuditEntityType, "CLASS_INSTANCE">;
  complaints: Extract<AuditEntityType, "COMPLAINT">;
  learning_resources: Extract<AuditEntityType, "LEARNING_RESOURCE">;
  invoices: Extract<AuditEntityType, "INVOICE">;
};
```

Replace with:

```typescript
export type SoftDeletableAuditEntityMap = {
  users: Extract<AuditEntityType, "USER">;
  recurring_schedules: Extract<AuditEntityType, "RECURRING_SCHEDULE">;
  class_instances: Extract<AuditEntityType, "CLASS_INSTANCE">;
  complaints: Extract<AuditEntityType, "COMPLAINT">;
  learning_resources: Extract<AuditEntityType, "LEARNING_RESOURCE">;
  invoices: Extract<AuditEntityType, "INVOICE">;
  suggestions: Extract<AuditEntityType, "SUGGESTION">;
};
```

---

#### Step 10: Extend Soft-Delete Repository in `backend/db/repo/soft-delete.repository.ts`

Open `backend/db/repo/soft-delete.repository.ts`.

**10a.** Add `suggestions` to the import from `@/backend/db/schema`. The current import reads:

```typescript
import {
  classInstances,
  complaints,
  invoices,
  learningResources,
  recurringSchedules,
  users,
} from "@/backend/db/schema";
```

Replace with:

```typescript
import {
  classInstances,
  complaints,
  invoices,
  learningResources,
  recurringSchedules,
  suggestions,
  users,
} from "@/backend/db/schema";
```

**10b.** Add `suggestions` entry to the `SOFT_DELETE_TABLES` constant. The current config ends with:

```typescript
  invoices: {
    table: invoices,
    entityType: "INVOICE" as const,
  },
} as const;
```

Replace with:

```typescript
  invoices: {
    table: invoices,
    entityType: "INVOICE" as const,
  },
  suggestions: {
    table: suggestions,
    entityType: "SUGGESTION" as const,
  },
} as const;
```

**10c.** Add the `softDeleteSuggestion()` convenience method. Locate the `softDeleteInvoice` method. It currently reads:

```typescript
  export const softDeleteInvoice = async (
    invoiceId: string,
    actorUserId?: string | null,
    tx?: DBTransaction
  ): Promise<Types.SoftDeleteResult<Types.SoftDeletableEntityMap["invoices"]>> => {
    return softDelete({ tableName: "invoices", entityId: invoiceId, actorUserId }, tx);
  };
```

Add the new method immediately after `softDeleteInvoice`:

```typescript
  export const softDeleteInvoice = async (
    invoiceId: string,
    actorUserId?: string | null,
    tx?: DBTransaction
  ): Promise<Types.SoftDeleteResult<Types.SoftDeletableEntityMap["invoices"]>> => {
    return softDelete({ tableName: "invoices", entityId: invoiceId, actorUserId }, tx);
  };

  export const softDeleteSuggestion = async (
    suggestionId: string,
    actorUserId?: string | null,
    tx?: DBTransaction
  ): Promise<Types.SoftDeleteResult<Types.SoftDeletableEntityMap["suggestions"]>> => {
    return softDelete({ tableName: "suggestions", entityId: suggestionId, actorUserId }, tx);
  };
```

---

#### Step 11: Add Migration SQL to `backend/db/migration/3-system_permissions_and_groups.sql`

Open `backend/db/migration/3-system_permissions_and_groups.sql`.

**11a.** Add `CREATE TYPE` and `ALTER TYPE` statements at the very top of the file, before the first `INSERT INTO permissions`. Insert after the existing comment header:

```sql
-- Migration: Seed System Permissions and Groups
-- Auto-generated

-- Story 15: Suggestion Review Workflow — New enum type
CREATE TYPE suggestion_status AS ENUM ('PENDING', 'REVIEWED', 'DUPLICATE');

-- Story 15: Add ON_APP notification channel
ALTER TYPE notification_channel ADD VALUE IF NOT EXISTS 'ON_APP';

-- Story 15: Add new notification event types for suggestions and complaints
ALTER TYPE notification_event_type ADD VALUE IF NOT EXISTS 'NEW_COMPLAINT';
ALTER TYPE notification_event_type ADD VALUE IF NOT EXISTS 'NEW_SUGGESTION';
ALTER TYPE notification_event_type ADD VALUE IF NOT EXISTS 'SUGGESTION_ACKNOWLEDGED';
ALTER TYPE notification_event_type ADD VALUE IF NOT EXISTS 'SUGGESTION_DUPLICATE_MARKED';

-- Story 15: Add new columns to suggestions table
ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS status suggestion_status NOT NULL DEFAULT 'PENDING';
ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS duplicate_of_id uuid REFERENCES suggestions(id) ON DELETE SET NULL;
ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS admin_response text;
ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS reviewed_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Story 15: Add indexes for new suggestions columns
CREATE INDEX IF NOT EXISTS suggestions_status_idx ON suggestions (status);
CREATE INDEX IF NOT EXISTS suggestions_duplicate_of_id_idx ON suggestions (duplicate_of_id);
CREATE INDEX IF NOT EXISTS suggestions_reviewed_by_user_id_idx ON suggestions (reviewed_by_user_id);
CREATE INDEX IF NOT EXISTS suggestions_deleted_at_idx ON suggestions (deleted_at);
```

**11b.** Add 3 new permission INSERT rows. Locate the last permission INSERT value before the `ON CONFLICT` clause. After the Story 14 permissions block and before the `ON CONFLICT` clause, insert the Story 15 permissions:

```sql
    -- Story 15: Suggestion Review Workflow
    (
        gen_random_uuid (),
        'suggestions.list',
        'suggestions',
        'list',
        'List and filter all parent suggestions with review status and duplicate grouping',
        'Communications',
        true
    ),
    (
        gen_random_uuid (),
        'suggestions.review',
        'suggestions',
        'review',
        'Review a suggestion: mark as reviewed with admin response or mark as duplicate of another suggestion',
        'Communications',
        true
    ),
    (
        gen_random_uuid (),
        'suggestions.delete',
        'suggestions',
        'delete',
        'Soft-delete a suggestion record from the system',
        'Communications',
        true
    ) ON CONFLICT (key) DO
```

**11c.** Update `super_admin` group_permissions. Locate the `super_admin` group_permissions INSERT block. It currently ends with:

```sql
        'report.generate_custom',
        'report.view_financials'
    );
```

Add the 3 new suggestion permission keys to the IN list:

```sql
        'report.generate_custom',
        'report.view_financials',
        'suggestions.list',
        'suggestions.review',
        'suggestions.delete'
    );
```

**11d.** Update `academy_admin` group_permissions. Locate the `academy_admin` group_permissions INSERT block. It currently ends with:

```sql
        'teachers.create',
        'parents.create'
    );
```

Add the 2 suggestion permissions (list + review, but NOT delete) to the IN list:

```sql
        'teachers.create',
        'parents.create',
        'suggestions.list',
        'suggestions.review'
    );
```

---

#### Step 12: Run Database Migration Commands (Must All Pass)

After all file edits are complete and per-file quality gates pass, run the following commands **in exact order**. Each command must succeed before running the next:

```bash
bun db cleanGenerate
```

This regenerates the Drizzle schema from the updated database. Must complete with exit code 0.

```bash
bun db reset
```

This drops and recreates the database with the new migration. Must complete with exit code 0.

```bash
bun db seed
```

This reseeds the database with the updated permission catalog. Must complete with exit code 0.

```bash
bun test:db
```

This runs the full database test suite to verify migration and seed data correctness. Must complete with 0 failures.

---

**Test Execution Requirements:**

Run the full database test suite after completing all migration changes:

```bash
bun db cleanGenerate && bun db reset && bun db seed && bun test:db
```

All four commands must pass with exit code 0. If any command fails, fix the migration and re-run the full sequence from `bun db cleanGenerate`.

---

#### Step 12: Create Canonical Types for Suggestions Table

Create `backend/types/suggestions.types.ts` with canonical types for the suggestions table. These types will be imported by all subsequent layers (Repository, Service, GraphQL, Tests).

```typescript
import type { suggestions } from "@/backend/db/schema";
import type { SuggestionStatus } from "@/shared/lib/enum";

export type SuggestionSelectType = typeof suggestions.$inferSelect;
export type SuggestionInsertType = typeof suggestions.$inferInsert;

export type SuggestionReturnType = Omit<SuggestionSelectType,
  | "deletedAt"
> & {
  status: SuggestionStatus;
  parentName?: string | null;
  reviewedByUserName?: string | null;
  duplicateOfBody?: string | null;
  duplicateOfSubmitterName?: string | null;
  responseCount?: number | null;
};

export type SuggestionSubmitInput = Omit<
  SuggestionInsertType,
  | "status"
  | "createdAt"
  | "updatedAt"
  | "deletedAt"
  | "reviewedAt"
  | "reviewedByUserId"
  | "duplicateOfId"
  | "parentId"
>;

export type SuggestionQueueFilter = {
  search?: string | null;
  status?: SuggestionStatus | null;
  limit: number;
  offset: number;
};

export type SuggestionMetrics = {
  id: string;
  pending: number;
  reviewed: number;
  duplicate: number;
  totalCount: number;
};

export type SuggestionQueueResult = {
  id: string;
  suggestions: ReadonlyArray<SuggestionReturnType>;
  metrics: SuggestionMetrics;
};

export type DuplicateSuggestionInput = {
  readonly suggestionId: string;
  readonly duplicateOfId: string;
};

export type RespondToSuggestionInput = {
  readonly suggestionId: string;
  readonly adminResponse: string;
};

export type ParentSuggestionOptions = {
  readonly limit: number;
  readonly offset: number;
};
```

**Key points:**
- Uses `$inferSelect` and `$inferInsert` from Drizzle as foundation
- `SuggestionReturnType` omits `deletedAt` (forbidden field) and adds resolved properties
- `SuggestionSubmitInput` omits server-managed fields (status, timestamps, parentId)
- All types are in ONE file for the suggestions table — no type mixing
- These types are consumed by Repository (Task B1), Service (Task E1), and GraphQL (Task F) layers

**Verification:**
```bash
bun tsgo backend/types/suggestions.types.ts
```

---

**Success Criteria / Check Progress Points:**

- [ ] `SuggestionStatus` enum added to `shared/lib/enum.ts` with `PENDING`, `REVIEWED`, `DUPLICATE` values
- [ ] `ON_APP` value added to `NotificationChannel` enum in `shared/lib/enum.ts`
- [ ] 4 new event types (`NEW_COMPLAINT`, `NEW_SUGGESTION`, `SUGGESTION_ACKNOWLEDGED`, `SUGGESTION_DUPLICATE_MARKED`) added to `NotificationEventType` enum in `shared/lib/enum.ts`
- [ ] 3 new permissions (`SUGGESTIONS_LIST`, `SUGGESTIONS_REVIEW`, `SUGGESTIONS_DELETE`) added to `AppPermission` enum in `shared/lib/enum.ts`
- [ ] `SuggestionStatus` imported and `suggestionStatusEnum` declared in `backend/db/schema/enums.ts`
- [ ] `suggestionStatusEnum` imported in `backend/db/schema/communications.ts`
- [ ] 6 new columns (`status`, `duplicateOfId`, `adminResponse`, `reviewedByUserId`, `reviewedAt`, `deletedAt`) added to `suggestions` table in `backend/db/schema/communications.ts`
- [ ] 4 new indexes (`suggestions_status_idx`, `suggestions_duplicate_of_id_idx`, `suggestions_reviewed_by_user_id_idx`, `suggestions_deleted_at_idx`) added to `suggestions` table
- [ ] `duplicateOf`, `duplicates`, `reviewedBy` relations added to `suggestions` in `backend/db/drizzleRelations.ts`
- [ ] `reviewedSuggestions` relation added to `users` in `backend/db/drizzleRelations.ts`
- [ ] `"SUGGESTION"` added to `AuditEntityType` union in `backend/types/audit.types.ts`
- [ ] `suggestions` imported and added to `SoftDeletableTableName`, `SoftDeletableEntityMap`, and `SoftDeletableAuditEntityMap` in `backend/types/soft-delete.types.ts`
- [ ] `suggestions` imported and added to `SOFT_DELETE_TABLES` config in `backend/db/repo/soft-delete.repository.ts`
- [ ] `softDeleteSuggestion()` convenience method added to `SoftDeleteRepository` namespace
- [ ] `CREATE TYPE suggestion_status` statement added to migration SQL
- [ ] `ALTER TYPE notification_channel ADD VALUE 'ON_APP'` added to migration SQL
- [ ] 4 `ALTER TYPE notification_event_type ADD VALUE` statements added to migration SQL
- [ ] 6 `ALTER TABLE suggestions ADD COLUMN` statements added to migration SQL
- [ ] 4 `CREATE INDEX` statements added to migration SQL
- [ ] 3 new permission INSERT rows added to migration SQL before `ON CONFLICT`
- [ ] `super_admin` group_permissions IN list includes `suggestions.list`, `suggestions.review`, `suggestions.delete`
- [ ] `academy_admin` group_permissions IN list includes `suggestions.list`, `suggestions.review`
- [ ] `bun db cleanGenerate` passes with exit code 0
- [ ] `bun db reset` passes with exit code 0
- [ ] `bun db seed` passes with exit code 0
- [ ] `bun test:db` passes with 0 failures
- [ ] `backend/types/suggestions.types.ts` created with canonical types using `$inferSelect`/`$inferInsert`
- [ ] Canonical types include `SuggestionSelectType`, `SuggestionInsertType`, `SuggestionReturnType`, `SuggestionSubmitInput`, `SuggestionQueueFilter`, `SuggestionMetrics`, `SuggestionQueueResult`
- [ ] `SuggestionReturnType` omits `deletedAt` and adds resolved properties (`parentName`, `reviewedByUserName`, `duplicateOfBody`, `duplicateOfSubmitterName`)
- [ ] NO local type definitions in any other layer files — all types sourced from canonical file

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
