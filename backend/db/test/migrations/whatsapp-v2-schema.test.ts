import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { isSqlite } from "@/backend/db";
import {
  whatsappAccounts,
  whatsappContacts,
  whatsappConversations,
  whatsappMessages,
  whatsappSyncRequests,
  whatsappWebhookEvents,
} from "@/backend/db/schema";
import { runInRollback } from "@/backend/db/test/test-utils";
import {
  WhatsappAccountPurpose,
  WhatsappMessageDirection,
  WhatsappOnboardingMode,
  WhatsappSyncStatus,
  WhatsappSyncType,
} from "@/backend/enum/whatsapp";
import type { DBTransaction } from "@/backend/types";
import { testLogger } from "@/shared/lib/logger/testlogger";

const NEW_ACCOUNT_COLUMNS = [
  "purpose",
  "onboarding_mode",
  "sync_status",
  "sync_phase",
  "sync_progress",
  "sync_deadline_at",
  "sync_failure_reason",
  "offboarded_at",
] as const;

const NEW_ENUM_TYPES: ReadonlyArray<{ typeName: string; labels: readonly string[] }> = [
  { typeName: "whatsapp_account_purpose", labels: ["GENERAL", "ADVERTISING", "STUDENTS"] },
  { typeName: "whatsapp_onboarding_mode", labels: ["CLOUD_API", "COEXISTENCE"] },
  { typeName: "whatsapp_sync_status", labels: ["NOT_STARTED", "REQUESTED", "SYNCING", "COMPLETE", "FAILED"] },
  { typeName: "whatsapp_message_direction", labels: ["INBOUND", "ECHO", "API_OUTBOUND"] },
  { typeName: "whatsapp_webhook_event_status", labels: ["PENDING", "PROCESSING", "PROCESSED", "FAILED"] },
  {
    typeName: "whatsapp_sync_request_status",
    labels: ["PENDING", "REQUESTED", "STREAMING", "COMPLETE", "FAILED"],
  },
  { typeName: "whatsapp_sync_type", labels: ["SMB_APP_STATE_SYNC", "HISTORY"] },
];

const NEW_TABLES = [
  "whatsapp_conversations",
  "whatsapp_messages",
  "whatsapp_contacts",
  "whatsapp_webhook_events",
  "whatsapp_sync_requests",
] as const;

function isRecordArray(value: unknown): value is Record<string, unknown>[] {
  return Array.isArray(value) && value.every(item => typeof item === "object" && item !== null);
}

function getResultRows(result: unknown): Record<string, unknown>[] {
  if (typeof result === "object" && result !== null && "rows" in result && isRecordArray(result.rows)) {
    return result.rows;
  }
  if (isRecordArray(result)) return result;
  return [];
}

async function getEnumLabels(tx: DBTransaction, typeName: string): Promise<string[]> {
  const result = await tx.execute(sql`
    SELECT e.enumlabel AS label
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = ${typeName}
    ORDER BY e.enumsortorder
  `);
  return getResultRows(result).map(row => String(row.label));
}

async function getIndexDefinitions(tx: DBTransaction, tableName: string): Promise<Map<string, string>> {
  const result = await tx.execute(sql`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE tablename = ${tableName}
  `);
  return new Map(getResultRows(result).map(row => [String(row.indexname), String(row.indexdef)]));
}

/** Concatenates an error's message chain (`.cause`) — Drizzle wraps PG errors ("Failed query: ...") with the constraint name only on the inner cause. */
function errorMessageWithCauses(error: unknown): string {
  const parts: string[] = [];
  let current: unknown = error;
  while (current instanceof Error) {
    parts.push(current.message);
    current = current.cause;
  }
  return parts.join("\n");
}

async function expectConstraintViolation(fn: () => Promise<unknown>, constraintName: string): Promise<void> {
  let errorCaught: unknown = null;
  try {
    await fn();
  } catch (error) {
    errorCaught = error;
  }
  expect(errorCaught).not.toBeNull();
  expect(errorMessageWithCauses(errorCaught)).toContain(constraintName);
}

async function insertTestAccount(tx: DBTransaction, overrides: Record<string, unknown> = {}) {
  const [account] = await tx
    .insert(whatsappAccounts)
    .values({
      wabaId: `waba-${randomUUID()}`,
      phoneNumberId: `pn-${randomUUID()}`,
      encryptedAccessToken: `token-${randomUUID()}`,
      encryptedTwoStepPin: "123456",
      ...overrides,
    })
    .returning();
  if (!account) throw new Error("whatsapp account insert returned no row");
  return account;
}

describe("whatsapp v2 schema (multi-number + coexistence)", () => {
  test.skipIf(isSqlite())(
    "adds the multi-number/sync columns to whatsapp_accounts with v1-preserving defaults",
    async () => {
      await runInRollback(async tx => {
        const result = await tx.execute(sql`
        SELECT column_name, data_type, udt_name, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'whatsapp_accounts'
          AND column_name IN (${sql.join(
            NEW_ACCOUNT_COLUMNS.map(name => sql`${name}`),
            sql`, `
          )})
      `);
        const columns = new Map(getResultRows(result).map(row => [String(row.column_name), row]));
        expect(columns.size).toBe(NEW_ACCOUNT_COLUMNS.length);

        expect(columns.get("purpose")?.udt_name).toBe("whatsapp_account_purpose");
        expect(columns.get("purpose")?.column_default).toBe("'GENERAL'::whatsapp_account_purpose");
        expect(columns.get("onboarding_mode")?.udt_name).toBe("whatsapp_onboarding_mode");
        expect(columns.get("onboarding_mode")?.column_default).toBe("'CLOUD_API'::whatsapp_onboarding_mode");
        expect(columns.get("sync_status")?.udt_name).toBe("whatsapp_sync_status");
        expect(columns.get("sync_status")?.column_default).toBe("'NOT_STARTED'::whatsapp_sync_status");
        expect(columns.get("sync_phase")?.data_type).toBe("integer");
        expect(columns.get("sync_progress")?.column_default).toBe("0");
        expect(columns.get("sync_progress")?.is_nullable).toBe("NO");
        for (const name of ["sync_deadline_at", "sync_failure_reason", "offboarded_at", "sync_phase"] as const) {
          expect(columns.get(name)?.is_nullable).toBe("YES");
        }
        testLogger.info("Verified whatsapp_accounts v2 columns.");
      });
    }
  );

  test.skipIf(isSqlite())("creates all seven whatsapp enum types with exact labels", async () => {
    await runInRollback(async tx => {
      const labelSets = await Promise.all(NEW_ENUM_TYPES.map(({ typeName }) => getEnumLabels(tx, typeName)));
      for (const [index, { labels }] of NEW_ENUM_TYPES.entries()) {
        expect(labelSets[index]).toEqual([...labels]);
      }
      testLogger.info("Verified all seven whatsapp enum types.");
    });
  });

  test.skipIf(isSqlite())("creates the five new tables with their unique/index definitions", async () => {
    await runInRollback(async tx => {
      const tableResult = await tx.execute(sql`
        SELECT tablename AS name
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename IN (${sql.join(
            NEW_TABLES.map(name => sql`${name}`),
            sql`, `
          )})
      `);
      const tableNames = new Set(getResultRows(tableResult).map(row => String(row.name)));
      for (const name of NEW_TABLES) {
        expect(tableNames.has(name)).toBe(true);
      }

      const messageIndexes = await getIndexDefinitions(tx, "whatsapp_messages");
      expect(messageIndexes.has("whatsapp_messages_wamid_unique")).toBe(true);
      const wamidDef = messageIndexes.get("whatsapp_messages_wamid_unique");
      expect(wamidDef).toContain("UNIQUE");
      expect(messageIndexes.has("whatsapp_messages_account_phase_chunk_idx")).toBe(true);

      const syncIndexes = await getIndexDefinitions(tx, "whatsapp_sync_requests");
      expect(syncIndexes.has("whatsapp_sync_requests_account_type_unique")).toBe(true);
      expect(syncIndexes.get("whatsapp_sync_requests_account_type_unique")).toContain("UNIQUE");

      const conversationIndexes = await getIndexDefinitions(tx, "whatsapp_conversations");
      expect(conversationIndexes.get("whatsapp_conversations_account_wa_id_unique")).toContain("UNIQUE");
      expect(conversationIndexes.get("whatsapp_conversations_account_wa_id_unique")).toContain("wa_id IS NOT NULL");
      expect(conversationIndexes.get("whatsapp_conversations_account_user_id_unique")).toContain("UNIQUE");
      expect(conversationIndexes.get("whatsapp_conversations_account_user_id_unique")).toContain("user_id IS NOT NULL");
      expect(conversationIndexes.has("whatsapp_conversations_account_last_message_at_idx")).toBe(true);

      const contactIndexes = await getIndexDefinitions(tx, "whatsapp_contacts");
      expect(contactIndexes.get("whatsapp_contacts_account_phone_unique")).toContain("phone_number IS NOT NULL");
      expect(contactIndexes.get("whatsapp_contacts_account_user_id_unique")).toContain("user_id IS NOT NULL");

      const eventIndexes = await getIndexDefinitions(tx, "whatsapp_webhook_events");
      expect(eventIndexes.has("whatsapp_webhook_events_status_received_at_idx")).toBe(true);
      testLogger.info("Verified new whatsapp tables and indexes.");
    });
  });

  test.skipIf(isSqlite())("account insert inherits v1-preserving enum defaults", async () => {
    await runInRollback(async tx => {
      const account = await insertTestAccount(tx);
      expect(account.purpose).toBe(WhatsappAccountPurpose.GENERAL);
      expect(account.onboardingMode).toBe(WhatsappOnboardingMode.CLOUD_API);
      expect(account.syncStatus).toBe(WhatsappSyncStatus.NOT_STARTED);
      expect(account.syncProgress).toBe(0);
      expect(account.offboardedAt).toBeNull();
      testLogger.info("Verified v1-preserving defaults on account insert.");
    });
  });

  test.skipIf(isSqlite())("round-trips inbox entities wired to an account", async () => {
    await runInRollback(async tx => {
      const account = await insertTestAccount(tx);
      const now = new Date();

      const [conversation] = await tx
        .insert(whatsappConversations)
        .values({
          accountId: account.id,
          waId: "966500000001",
          displayName: "Test Contact",
          lastMessageAt: now,
          lastMessagePreview: "hello",
        })
        .returning();
      if (!conversation) throw new Error("conversation insert returned no row");

      const [message] = await tx
        .insert(whatsappMessages)
        .values({
          conversationId: conversation.id,
          accountId: account.id,
          wamid: `wamid.HBgM-${randomUUID()}`,
          direction: WhatsappMessageDirection.INBOUND,
          type: "text",
          content: { body: "hello" },
          sentAt: now,
          phase: 1,
          chunkOrder: 3,
        })
        .returning();
      expect(message?.direction).toBe(WhatsappMessageDirection.INBOUND);
      expect(message?.mediaPlaceholder).toBe(false);

      const [contact] = await tx
        .insert(whatsappContacts)
        .values({ accountId: account.id, phoneNumber: "966500000001", fullName: "Full Name", lastActionAt: now })
        .returning();
      expect(contact?.removedAt).toBeNull();

      const [event] = await tx
        .insert(whatsappWebhookEvents)
        .values({ accountId: account.id, field: "messages", payload: { value: {} }, payloadHash: "a".repeat(64) })
        .returning();
      expect(event?.status).toBe("PENDING");
      expect(event?.attempts).toBe(0);

      const [syncRequest] = await tx
        .insert(whatsappSyncRequests)
        .values({ accountId: account.id, syncType: WhatsappSyncType.HISTORY })
        .returning();
      expect(syncRequest?.status).toBe("PENDING");
      testLogger.info("Round-tripped conversation/message/contact/event/sync-request rows.");
    });
  });

  test.skipIf(isSqlite())("enforces unique wamid across accounts", async () => {
    await runInRollback(async tx => {
      const first = await insertTestAccount(tx);
      const [firstConversation] = await tx
        .insert(whatsappConversations)
        .values({ accountId: first.id, waId: "966500000002" })
        .returning();
      if (!firstConversation) throw new Error("conversation insert returned no row");
      const wamid = `wamid.HBgM-${randomUUID()}`;
      await tx.insert(whatsappMessages).values({
        conversationId: firstConversation.id,
        accountId: first.id,
        wamid,
        direction: WhatsappMessageDirection.INBOUND,
        type: "text",
        content: { body: "one" },
      });

      const second = await insertTestAccount(tx);
      const [secondConversation] = await tx
        .insert(whatsappConversations)
        .values({ accountId: second.id, waId: "966500000003" })
        .returning();
      if (!secondConversation) throw new Error("conversation insert returned no row");
      await expectConstraintViolation(
        () =>
          tx.insert(whatsappMessages).values({
            conversationId: secondConversation.id,
            accountId: second.id,
            wamid,
            direction: WhatsappMessageDirection.ECHO,
            type: "text",
            content: { body: "two" },
          }),
        "whatsapp_messages_wamid_unique"
      );
    });
  });

  test.skipIf(isSqlite())("enforces one-shot unique (accountId, syncType) on sync requests", async () => {
    await runInRollback(async tx => {
      const account = await insertTestAccount(tx);
      await tx.insert(whatsappSyncRequests).values({ accountId: account.id, syncType: WhatsappSyncType.HISTORY });
      await expectConstraintViolation(
        () => tx.insert(whatsappSyncRequests).values({ accountId: account.id, syncType: WhatsappSyncType.HISTORY }),
        "whatsapp_sync_requests_account_type_unique"
      );
    });
  });

  test.skipIf(isSqlite())("rejects sync_progress outside the 0-100 range", async () => {
    await runInRollback(async tx => {
      await expectConstraintViolation(
        () => insertTestAccount(tx, { syncProgress: 101 }),
        "whatsapp_accounts_sync_progress_range_chk"
      );
    });
  });

  test.skipIf(isSqlite())(
    "partial uniques allow matching across null identities and repeat across accounts",
    async () => {
      await runInRollback(async tx => {
        const first = await insertTestAccount(tx);
        const second = await insertTestAccount(tx);
        await tx.insert(whatsappConversations).values({ accountId: first.id, waId: "966500000004" });
        await tx.insert(whatsappConversations).values({ accountId: second.id, waId: "966500000004" });
        await tx.insert(whatsappConversations).values({ accountId: first.id, username: "user.name" });
        await tx.insert(whatsappConversations).values({ accountId: first.id, username: "user.name.2" });
        testLogger.info("Verified partial-unique semantics (same peer across accounts, null-identity rows)");
      });
    }
  );
});
