# M1 — Schema Analysis: Suggestion Management

## Current State

### `suggestions` table (`backend/db/schema/communications.ts:150-163`)

```
id              uuid PK
parentId        uuid FK→parents (onDelete: restrict)
submitterName   varchar(255) NOT NULL
body            text NOT NULL
emailSentAt     timestamp (nullable)
createdAt       timestamp NOT NULL
```

**Indexes:** `suggestions_parent_id_idx` on `parentId`

### Existing enums (`shared/lib/enum.ts`)

- **No `SuggestionStatus` enum exists.** The frontend mock store defines a local type `SuggestionStatus = "pending" | "reviewed"` but this is not a real enum.
- **`NotificationEventType`** has: `CLASS_REMINDER`, `INVOICE_GENERATED`, `COMPLAINT_RESPONSE`, `BANKING_DETAILS_CHANGED`
- **`NotificationChannel`** has: `EMAIL`, `SMS`, `PUSH`
- **No `ON_APP` channel** exists in the enum yet (Story 14 plan references it but it hasn't been added)

### Existing relations (`backend/db/drizzleRelations.ts:413-418`)

```typescript
suggestions: {
  parent: r.one.parents({
    from: r.suggestions.parentId,
    to: r.parents.id,
  }),
},
```

Also at `parents` side (line 160-163):
```typescript
suggestions: r.many.suggestions({
  from: r.parents.id,
  to: r.suggestions.parentId,
}),
```

---

## Required Schema Changes

### 1. New Enum: `SuggestionStatus`

**File:** `shared/lib/enum.ts`

```typescript
export enum SuggestionStatus {
  PENDING = "PENDING",
  REVIEWED = "REVIEWED",
  DUPLICATE = "DUPLICATE",
}
```

**File:** `backend/db/schema/enums.ts`

```typescript
import { SuggestionStatus } from "@/shared/lib/enum";
export const suggestionStatusEnum = createPgEnumFromEnum("suggestion_status", SuggestionStatus);
```

### 2. New Columns on `suggestions` Table

| Column | Type | Nullable | Default | FK | Notes |
|--------|------|----------|---------|-----|-------|
| `status` | `suggestion_status` enum | NO | `"PENDING"` | — | New enum column |
| `duplicateOfId` | `uuid` | YES | `null` | `suggestions.id` (self-FK, onDelete: set null) | Links to original suggestion |
| `adminResponse` | `text` | YES | `null` | — | Admin response visible to parent |
| `reviewedByUserId` | `uuid` | YES | `null` | `users.id` (onDelete: set null) | Who reviewed it |
| `reviewedAt` | `timestamp(tz, precision 3)` | YES | `null` | — | When reviewed |

**Schema definition additions:**

```typescript
status: suggestionStatusEnum("status").notNull().default("PENDING"),
duplicateOfId: uuid("duplicate_of_id").references(() => suggestions.id, { onDelete: "set null" }),
adminResponse: text("admin_response"),
reviewedByUserId: uuid("reviewed_by_user_id").references(() => users.id, { onDelete: "set null" }),
reviewedAt: timestamp("reviewed_at", { withTimezone: true, precision: 3 }),
```

### 3. Self-Referencing FK Pattern for `duplicateOfId`

- The `duplicateOfId` column references `suggestions.id` (same table)
- `onDelete: "set null"` — if the original suggestion is deleted, the duplicate link is severed
- This creates a unidirectional tree (no cycles enforced at DB level; application must validate)
- **Circular reference guard:** When marking as duplicate, the service must verify `duplicateOfId !== self.id` and that the target is not itself a duplicate
- The `suggestions` table reference in the `references()` callback requires the table variable to be declared first — Drizzle supports self-references via the callback pattern already used

### 4. New Indexes

| Index Name | Column(s) | Rationale |
|------------|-----------|-----------|
| `suggestions_status_idx` | `status` | Filter by status in admin queue (PENDING/REVIEWED/DUPLICATE tabs) |
| `suggestions_duplicate_of_id_idx` | `duplicateOfId` | Find all duplicates of a given suggestion |
| `suggestions_reviewed_by_user_id_idx` | `reviewedByUserId` | Audit trail queries |

### 5. New `NotificationEventType` Values

**File:** `shared/lib/enum.ts`

Add to `NotificationEventType`:

```typescript
SUGGESTION_ACKNOWLEDGED = "SUGGESTION_ACKNOWLEDGED",
SUGGESTION_DUPLICATE_MARKED = "SUGGESTION_DUPLICATE_MARKED",
```

These fire when:
- `SUGGESTION_ACKNOWLEDGED` — Admin marks suggestion as REVIEWED or responds; parent gets notified
- `SUGGESTION_DUPLICATE_MARKED` — Admin marks as DUPLICATE; parent gets notified with link to original

**Note:** Story 14 plan also references `NEW_COMPLAINT` and `NEW_SUGGESTION` event types that don't exist yet. These should also be added:

```typescript
NEW_COMPLAINT = "NEW_COMPLAINT",
NEW_SUGGESTION = "NEW_SUGGESTION",
```

### 6. Drizzle Relation Updates

**File:** `backend/db/drizzleRelations.ts`

Add to `suggestions` relations block:

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

Also add to `users` relations block:

```typescript
reviewedSuggestions: r.many.suggestions({
  from: r.users.id,
  to: r.suggestions.reviewedByUserId,
}),
```

### 7. Migration SQL Required

A new migration file must:

1. Create the `suggestion_status` PostgreSQL enum: `CREATE TYPE suggestion_status AS ENUM ('PENDING', 'REVIEWED', 'DUPLICATE');`
2. Add 5 columns to `suggestions` table (with defaults for existing rows)
3. Create 3 new indexes
4. Backfill: All existing suggestions get `status = 'PENDING'` (default)
5. Add `NEW_COMPLAINT`, `NEW_SUGGESTION`, `SUGGESTION_ACKNOWLEDGED`, `SUGGESTION_DUPLICATE_MARKED` to the `notification_event_type` enum via `ALTER TYPE`
6. If `ON_APP` channel is needed, add it to `notification_channel` enum via `ALTER TYPE`

### 8. RLS Considerations

The `suggestions` table does NOT currently have RLS policies noted (unlike `complaints` which has soft-delete RLS). If soft-delete is added in Story 15 (Feature 5 mentions "Delete inappropriate suggestions"), then:
- Add `deletedAt` column to `suggestions`
- Add RLS policy to filter soft-deleted records
- Add `deleted_at_idx` index

**However**, the story spec says "Delete" not "Soft-delete" explicitly. The `complaints` table uses soft-delete with `deletedAt`. For consistency, suggestions should follow the same pattern.

### 9. Soft-Delete Addition (Recommended)

Add to `suggestions`:
```typescript
deletedAt: timestamp("deleted_at", { withTimezone: true, precision: 3 }),
```

Add index: `suggestions_deleted_at_idx`

This aligns with the existing `complaints` table pattern and the `SoftDeleteRepository` pattern already in use.

---

## Summary of All Changes

| Change Type | Target | Details |
|-------------|--------|---------|
| New enum (TS) | `shared/lib/enum.ts` | `SuggestionStatus` (PENDING, REVIEWED, DUPLICATE) |
| New enum (PG) | `backend/db/schema/enums.ts` | `suggestionStatusEnum` |
| New enum values (TS) | `shared/lib/enum.ts` | `NotificationEventType`: +4 values |
| New columns | `suggestions` table | `status`, `duplicateOfId`, `adminResponse`, `reviewedByUserId`, `reviewedAt` |
| Optional column | `suggestions` table | `deletedAt` (if soft-delete adopted) |
| New indexes | `suggestions` table | 3-4 new indexes |
| Relation updates | `drizzleRelations.ts` | `duplicateOf`, `duplicates`, `reviewedBy` on suggestions; `reviewedSuggestions` on users |
| Migration SQL | New migration file | Enum creation, ALTER TABLE, ALTER TYPE, indexes |
