### Task B2 — Notification Repository Extensions

**Objective:**
Extend the existing `NotificationRepository` namespace in `backend/db/repo/notification.repository.ts` with five new methods to support Sprint 15's notification infrastructure: user preference retrieval, user preference upsert, batch delivery creation for multi-channel dispatch, SMS rate limiting count query, and paginated delivery history per user. These methods enable the communication channel adapters (Email, SMS, Push) to check user opt-in/opt-out preferences before dispatch, create delivery records atomically across multiple channels, enforce SMS rate limits, and provide delivery history for the parent-facing notification center.

**Dependencies:**
- Depends on Task A (Migration/Schema/Enums) — the `NotificationChannel` enum must include `ON_APP`, and the `NotificationEventType` enum must include `NEW_COMPLAINT`, `NEW_SUGGESTION`, `SUGGESTION_ACKNOWLEDGED`, `SUGGESTION_DUPLICATE_MARKED`. The `userNotificationPreferences` and `notificationDeliveries` tables already exist from prior sprints.
- Depends on Story 14 execution — the base `NotificationRepository` namespace with `createDelivery`, `updateDeliveryStatus`, `registerDeviceToken`, and other existing methods must already be in place.

**Layer-Specific Rules (Database Repositories — Flattened from backend/db/repo/AGENTS.md):**
- **Drizzle ORM**: This layer exclusively uses Drizzle ORM for PostgreSQL.
- **Query Guidelines**: Use standard `.select().from().leftJoin()` instead of relational `findMany` to avoid `SQL<unknown>` errors and type resolution issues.
- **Separation of Concerns**: Repositories are strictly for data access. Business logic, permission checking, and complex orchestration must reside in the `backend/services/` layer.
- **No Hardcoded Error Strings**: Use `getBackendTranslations` with optional `locale?: string` parameter for localized error messages.
- **Conditional Aggregation**: Use `sql<number>` template literals with `.mapWith(Number)` for count queries.
- **Transactions**: Mutation methods use the `(args, tx?: DBTransaction) => Promise<T>` pattern. Read-only methods use `tx ?? db`.
- **Advisory Locks**: Use `pg_advisory_xact_lock` where concurrent writes to the same row are possible (preference upserts, batch deliveries).
- **🚫 NO Local Type Definitions**: Repository files MUST NOT define local types like `UserDeliveryHistoryRow`, `UserDeliveryHistoryResult`. All types MUST be imported from `backend/types/` canonical type files.
- **Import canonical types**: Use types from `backend/types/user-notification-preferences.types.ts` and `backend/types/notification-deliveries.types.ts`.

**Target Files:**
| File | Action |
|------|--------|
| `backend/types/user-notification-preferences.types.ts` | CREATE or UPDATE — define canonical types for user_notification_preferences table |
| `backend/types/notification-deliveries.types.ts` | CREATE or UPDATE — define canonical types for notification_deliveries table |
| `backend/db/repo/notification.repository.ts` | MODIFY — add 5 new methods, import canonical types |
| `backend/types/user-notification-preferences.types.ts` | CREATE or UPDATE — define canonical types for user_notification_preferences table |
| `backend/types/notification-deliveries.types.ts` | CREATE or UPDATE — define canonical types for notification_deliveries table |

---

### Detailed Implementation Steps

#### Step 1 — Update Imports in `notification.repository.ts`

Open `backend/db/repo/notification.repository.ts`. Add the missing schema table imports and Drizzle operators needed by the new methods:

```typescript
import { and, count, desc, eq, gt, gte, lte, sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import {
  notificationDeliveries,
  userDeviceTokens,
  userNotificationPreferences,
} from "@/backend/db/schema";
import { getBackendTranslations } from "@/backend/lib/intl";
import type {
  UserNotificationPreferenceSelectType,
  SetNotificationPreferenceInput,
} from "@/backend/types/user-notification-preferences.types";
import type {
  NotificationDeliverySelectType,
  CreateNotificationDeliveryInput,
  UserDeliveryHistoryResult,
} from "@/backend/types/notification-deliveries.types";
import { NotificationChannel, NotificationDeliveryStatus, NotificationEventType } from "@/shared/lib/enum";
```

The existing file already imports `and`, `count`, `eq`, `gte`, `lte`, `sql` from `drizzle-orm` and `notificationDeliveries`, `userDeviceTokens` from schema. Add `desc`, `gt` to the Drizzle import and `userNotificationPreferences` to the schema import. Verify `NotificationChannel` is imported from `@/shared/lib/enum` — if not, add it. Replace the `import type * as Types from "@/backend/types"` barrel import with explicit canonical type imports from `backend/types/user-notification-preferences.types.ts` and `backend/types/notification-deliveries.types.ts`.

---

#### Step 2 — Create/Update Canonical Types

Create or update `backend/types/user-notification-preferences.types.ts` with the following canonical types:

```typescript
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type { userNotificationPreferences } from "@/backend/db/schema";
import type { NotificationChannel, NotificationEventType } from "@/shared/lib/enum";

export type UserNotificationPreferenceSelectType = InferSelectModel<typeof userNotificationPreferences>;
export type UserNotificationPreferenceInsertType = InferInsertModel<typeof userNotificationPreferences>;

export type SetNotificationPreferenceInput = {
  userId: string;
  channel: NotificationChannel;
  eventType: NotificationEventType;
  enabled: boolean;
};
```

Create or update `backend/types/notification-deliveries.types.ts` with the following canonical types:

```typescript
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type { notificationDeliveries } from "@/backend/db/schema";
import type { NotificationChannel, NotificationEventType } from "@/shared/lib/enum";

export type NotificationDeliverySelectType = InferSelectModel<typeof notificationDeliveries>;
export type NotificationDeliveryInsertType = InferInsertModel<typeof notificationDeliveries>;

export type CreateNotificationDeliveryInput = {
  userId: string;
  deviceTokenId?: string;
  channel: NotificationChannel;
  eventType: NotificationEventType;
  title?: string;
  body?: string;
};

export type NotificationDeliveryReturnType = NotificationDeliverySelectType;

export type UserDeliveryHistoryResult = {
  rows: NotificationDeliverySelectType[];
  totalCount: number;
};
```

All types use Drizzle's `$inferSelect` and `$inferInsert` as foundation. Enums are imported from `@/shared/lib/enum`.

---

#### Step 3 — Add `getPreference` Method

Add inside the `NotificationRepository` namespace, after the existing `getDeliveryAnalytics` method:

```typescript
  export const getPreference = async (
    userId: string,
    channel: NotificationChannel,
    eventType: NotificationEventType,
    tx?: DBTransaction
  ): Promise<UserNotificationPreferenceSelectType | null> => {
    const queryDb = tx ?? db;

    const results = await queryDb
      .select()
      .from(userNotificationPreferences)
      .where(
        and(
          eq(userNotificationPreferences.userId, userId),
          eq(userNotificationPreferences.channel, channel),
          eq(userNotificationPreferences.eventType, eventType)
        )
      )
      .limit(1);

    return results[0] ?? null;
  };
```

**Key implementation notes for `getPreference`:**
- Returns the full preference row if it exists, or `null` if no row matches.
- The caller (channel adapter or `CommunicationService`) interprets `null` as "enabled by default" — the opt-out model means absence of a preference row implies the user has not opted out.
- Uses `tx ?? db` pattern — read-only query, no transaction wrapping needed.
- The unique index `user_notification_preferences_unique_idx` on `(userId, channel, eventType)` guarantees at most one row per combination.

---

#### Step 4 — Add `setPreference` Method

Add after `getPreference`:

```typescript
  export const setPreference = async (
    input: SetNotificationPreferenceInput,
    tx?: DBTransaction
  ): Promise<UserNotificationPreferenceSelectType> => {
    const runner = async (t: DBTransaction) => {
      await t.execute(
        sql`SELECT pg_advisory_xact_lock(hashtext('notification_pref_' || ${input.userId}::text || '_' || ${input.channel}::text || '_' || ${input.eventType}::text))`
      );

      const now = new Date();

      const [result] = await t
        .insert(userNotificationPreferences)
        .values({
          userId: input.userId,
          channel: input.channel,
          eventType: input.eventType,
          enabled: input.enabled,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [
            userNotificationPreferences.userId,
            userNotificationPreferences.channel,
            userNotificationPreferences.eventType,
          ],
          set: {
            enabled: input.enabled,
            updatedAt: now,
          },
        })
        .returning();

      return result;
    };

    return tx ? runner(tx) : db.transaction(runner);
  };
```

**Key implementation notes for `setPreference`:**
- Uses `INSERT ... ON CONFLICT DO UPDATE` (upsert) targeting the unique composite index `(userId, channel, eventType)`.
- Acquires an advisory lock keyed on `userId + channel + eventType` to prevent concurrent preference toggles from racing.
- On conflict, only updates `enabled` and `updatedAt` — preserves the original `createdAt`.
- Wraps in a transaction via the `runner` pattern for atomicity.
- Returns the created or updated preference row.

---

#### Step 5 — Add `createDeliveriesBatch` Method

Add after `setPreference`:

```typescript
  export const createDeliveriesBatch = async (
    inputs: CreateNotificationDeliveryInput[],
    tx?: DBTransaction
  ): Promise<NotificationDeliverySelectType[]> => {
    const runner = async (t: DBTransaction) => {
      const now = new Date();

      const values = inputs.map(input => ({
        userId: input.userId,
        deviceTokenId: input.deviceTokenId ?? null,
        channel: input.channel,
        eventType: input.eventType,
        status: NotificationDeliveryStatus.PENDING,
        title: input.title ?? null,
        body: input.body ?? null,
        createdAt: now,
        updatedAt: now,
      }));

      const created = await t
        .insert(notificationDeliveries)
        .values(values)
        .returning();

      return created;
    };

    return tx ? runner(tx) : db.transaction(runner);
  };
```

**Key implementation notes for `createDeliveriesBatch`:**
- Accepts an array of `CreateNotificationDeliveryInput` objects and inserts them all in a single `INSERT` statement.
- Each delivery is created with `status = PENDING` — the channel adapters update status to `SENT` or `FAILED` after calling the provider API.
- All deliveries share the same `createdAt` and `updatedAt` timestamps for consistency.
- Wraps in a transaction to ensure atomicity — either all deliveries are created or none are.
- Returns the array of created delivery rows with their generated IDs.
- Used by `CommunicationService.dispatchMulti()` when sending a notification across multiple channels (e.g., EMAIL + PUSH + ON_APP simultaneously).
- For an empty `inputs` array, Drizzle's `.values([])` will produce a no-op insert returning an empty array.

---

#### Step 6 — Add `getSmsCountInLastHour` Method

Add after `createDeliveriesBatch`:

```typescript
  export const getSmsCountInLastHour = async (
    userId: string,
    tx?: DBTransaction
  ): Promise<number> => {
    const queryDb = tx ?? db;

    const [result] = await queryDb
      .select({
        count: sql<number>`COUNT(*)`.mapWith(Number),
      })
      .from(notificationDeliveries)
      .where(
        and(
          eq(notificationDeliveries.userId, userId),
          eq(notificationDeliveries.channel, NotificationChannel.SMS),
          gt(notificationDeliveries.createdAt, sql`NOW() - INTERVAL '1 hour'`)
        )
      );

    return result?.count ?? 0;
  };
```

**Key implementation notes for `getSmsCountInLastHour`:**
- Counts SMS deliveries for a specific user within the last hour using `NOW() - INTERVAL '1 hour'`.
- Uses `sql<number>` with `.mapWith(Number)` per the AGENTS.md rule for aggregation queries.
- Filters by `channel = 'SMS'` — only SMS deliveries count toward the rate limit.
- Does NOT filter by delivery status — all SMS delivery attempts (PENDING, SENT, FAILED) count toward the limit to prevent abuse via repeated failures.
- Returns `0` if no matching rows exist.
- Used by `SmsChannel` before calling the Twilio API — if the count meets or exceeds the `sms_rate_limit_per_hour` system setting, the SMS delivery is skipped.
- Read-only query, uses `tx ?? db` pattern.

---

#### Step 7 — Add `getDeliveriesByUser` Method

Add after `getSmsCountInLastHour`:

```typescript
  export const getDeliveriesByUser = async (
    userId: string,
    options: { limit: number; offset: number; channel?: NotificationChannel; eventType?: NotificationEventType },
    tx?: DBTransaction
  ): Promise<UserDeliveryHistoryResult> => {
    const queryDb = tx ?? db;

    const conditions = [eq(notificationDeliveries.userId, userId)];

    if (options.channel) {
      conditions.push(eq(notificationDeliveries.channel, options.channel));
    }

    if (options.eventType) {
      conditions.push(eq(notificationDeliveries.eventType, options.eventType));
    }

    const whereClause = and(...conditions);

    const rows = await queryDb
      .select()
      .from(notificationDeliveries)
      .where(whereClause)
      .orderBy(desc(notificationDeliveries.createdAt))
      .limit(options.limit)
      .offset(options.offset);

    const [totalCount] = await queryDb
      .select({ count: count() })
      .from(notificationDeliveries)
      .where(whereClause);

    return {
      rows,
      totalCount: totalCount?.count ?? 0,
    };
  };
```

**Key implementation notes for `getDeliveriesByUser`:**
- Returns full delivery rows (`select()` without column projection) for the parent-facing notification center.
- Supports optional `channel` and `eventType` filters for filtering the delivery history (e.g., "show only SMS deliveries" or "show only complaint response notifications").
- Orders by `createdAt DESC` — newest deliveries first.
- Returns paginated results with a separate count query for `totalCount`.
- The `UserDeliveryHistoryResult` type is imported from `backend/types/notification-deliveries.types.ts` — no local type definitions in the repository file.
- Read-only query, uses `tx ?? db` pattern.
- Used by the parent-facing notification history GraphQL query and the corresponding frontend view.

---

#### Step 8 — Verify Namespace Exports

After adding all five methods, verify the `NotificationRepository` namespace contains the complete method list:

```typescript
export namespace NotificationRepository {
  // Existing methods (kept):
  //   registerDeviceToken
  //   deactivateDeviceToken
  //   getActiveDeviceTokensForUser
  //   createDelivery
  //   updateDeliveryStatus
  //   recordDeliveryOpened
  //   getDeliveryByProviderMessageId
  //   handleDeliveryWebhook
  //   getDeliveryAnalytics

  // Story 15 (new):
  //   getPreference
  //   setPreference
  //   createDeliveriesBatch
  //   getSmsCountInLastHour
  //   getDeliveriesByUser

  // Story 15 (imported canonical types — NOT defined locally):
  //   UserNotificationPreferenceSelectType  (from backend/types/user-notification-preferences.types.ts)
  //   SetNotificationPreferenceInput         (from backend/types/user-notification-preferences.types.ts)
  //   NotificationDeliverySelectType         (from backend/types/notification-deliveries.types.ts)
  //   CreateNotificationDeliveryInput         (from backend/types/notification-deliveries.types.ts)
  //   UserDeliveryHistoryResult              (from backend/types/notification-deliveries.types.ts)

  // Existing internal helpers (kept):
  //   acquireDeviceTokenLock
  //   acquireDeliveryLock
  //   assertValidStatusTransition
  //   buildStatusTimestamps
  //   DeliveryWebhookInput
}
```

All new methods and types are declared with `export` inside the namespace. The `NotificationRepository` is already exported from `backend/db/repo/index.ts` — no barrel export update needed.

---

#### Step 9 — TypeScript Compilation Check

After adding all methods, run:

```bash
bun tsgo
```

Expected: 0 TypeScript errors. Pay attention to:
- `userNotificationPreferences` import — must be exported from `backend/db/schema/index.ts` (it is, via `export * from "./communications"`).
- Canonical type files (`user-notification-preferences.types.ts`, `notification-deliveries.types.ts`) must exist and export all required types.
- `SetNotificationPreferenceInput` type — must be exported from `backend/types/user-notification-preferences.types.ts` and imported explicitly.
- `sql`NOW() - INTERVAL '1 hour'`` — Drizzle's `sql` template literal must correctly embed the PostgreSQL interval expression.
- `onConflictDoUpdate` target array — the composite target `[userId, channel, eventType]` must match the unique index definition.

---

### Test Execution Requirements

Run the database test suite after completing all method implementations:

```bash
bun run test:db
```

**Expected output:** 0 failures. All existing tests still pass. New method tests will be added in Task B4 (Repository Tests).

Also verify TypeScript compilation and linting:

```bash
bun tsgo
bun biome:check
bun lint
```

---

### Success Criteria / Check Progress Points

- [ ] `SetNotificationPreferenceInput` type is defined in `backend/types/user-notification-preferences.types.ts` with `userId`, `channel`, `eventType`, `enabled` fields
- [ ] `getPreference()` returns the preference row or `null` when no row exists for the given `(userId, channel, eventType)` combination
- [ ] `getPreference()` uses `tx ?? db` pattern for read-only access
- [ ] `setPreference()` performs an upsert via `INSERT ... ON CONFLICT DO UPDATE` targeting the `(userId, channel, eventType)` composite unique index
- [ ] `setPreference()` acquires an advisory lock to prevent concurrent preference toggles
- [ ] `setPreference()` only updates `enabled` and `updatedAt` on conflict — preserves original `createdAt`
- [ ] `createDeliveriesBatch()` inserts multiple delivery rows in a single `INSERT` statement within a transaction
- [ ] `createDeliveriesBatch()` sets `status = PENDING` for all created deliveries
- [ ] `createDeliveriesBatch()` returns the array of created delivery rows with generated IDs
- [ ] `getSmsCountInLastHour()` counts SMS deliveries for a user within the last hour using `NOW() - INTERVAL '1 hour'`
- [ ] `getSmsCountInLastHour()` uses `sql<number>` with `.mapWith(Number)` for the count aggregation
- [ ] `getSmsCountInLastHour()` returns `0` when no matching rows exist
- [ ] `getDeliveriesByUser()` returns paginated delivery history with optional `channel` and `eventType` filters
- [ ] `getDeliveriesByUser()` orders by `createdAt DESC` and returns `{ rows, totalCount }`
- [ ] All new methods are declared with `export` inside the `NotificationRepository` namespace
- [ ] No new hardcoded error strings introduced — all methods remain pure data access
- [ ] `bun run test:db` passes with zero failures
- [ ] `bun tsgo` reports zero type errors
- [ ] Canonical types defined in `backend/types/user-notification-preferences.types.ts` and `backend/types/notification-deliveries.types.ts`
- [ ] NO local type definitions in repository file — all types imported from canonical files
- [ ] `SetNotificationPreferenceInput` moved from `communications.types.ts` to `user-notification-preferences.types.ts`

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
