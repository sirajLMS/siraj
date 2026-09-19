import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { teachers, userMeetingConfigs, users } from "@/backend/db/schema";
import { createTestMeetingConfig, createTestMeetingProvider } from "@/backend/db/test/entity-setup";
import { executeTxSql, generateTestPassword, runInRollback } from "@/backend/db/test/test-utils";
import type { DBTransaction, TeacherInsertType } from "@/backend/types";
import { testLogger } from "@/shared/lib/logger/testlogger";

async function createTestUser(tx: DBTransaction, uniqueSuffix: string, now: Date) {
  const email = `teacher-${uniqueSuffix}@example.com`;
  const [user] = await tx
    .insert(users)
    .values({
      name: "Crypto Teacher",
      email,
      password: generateTestPassword(),
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  return user;
}

async function insertTeacherDetails(args: { tx: DBTransaction; userId: string; plainNationalId: string; now: Date }) {
  const { tx, userId, plainNationalId, now } = args;
  const teacherInput: TeacherInsertType = {
    userId,
    nationalId: plainNationalId,
    createdAt: now,
    updatedAt: now,
  };

  const [teacher] = await tx.insert(teachers).values(teacherInput).returning();
  expect(teacher).toBeDefined();
  return teacher;
}

function verifyCiphertext(value: unknown, plaintext: string) {
  const valStr = String(value);
  expect(valStr).not.toBe(plaintext);
  expect(valStr.split(":")).toHaveLength(3);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractRows(result: unknown): Record<string, unknown>[] {
  if (!isRecord(result)) {
    return [];
  }
  const rows = "rows" in result ? result.rows : result;
  if (!Array.isArray(rows)) {
    return [];
  }
  return rows.filter(isRecord);
}

describe("Column-Level Encryption", () => {
  test("Sensitive teacher national ID and meeting config secrets are encrypted in the DB but decrypted on select", async () => {
    testLogger.info("Starting column-level encryption test...");
    await runInRollback(async tx => {
      const now = new Date();
      const uniqueSuffix = randomUUID();
      const plainNationalId = "NID-999-888-777";
      const plainPassword = `zoom-secret-${randomUUID()}`;

      const user = await createTestUser(tx, uniqueSuffix, now);
      const teacher = await insertTeacherDetails({ tx, userId: user.id, plainNationalId, now });
      const provider = await createTestMeetingProvider(tx);
      const config = await createTestMeetingConfig(tx, user.id, provider.id, {
        encryptedSecret: plainPassword,
      });

      const rawTeacherResult = await executeTxSql(tx, sql`SELECT national_id FROM teachers WHERE id = ${teacher.id}`);
      const teacherRows = extractRows(rawTeacherResult);
      verifyCiphertext(teacherRows[0]?.national_id, plainNationalId);

      const rawConfigResult = await executeTxSql(
        tx,
        sql`SELECT encrypted_secret FROM user_meeting_configs WHERE id = ${config.id}`
      );
      const configRows = extractRows(rawConfigResult);
      verifyCiphertext(configRows[0]?.encrypted_secret, plainPassword);

      const [drizzleTeacher] = await tx.select().from(teachers).where(sql`id = ${teacher.id}`);
      expect(drizzleTeacher?.nationalId).toBe(plainNationalId);

      const [drizzleConfig] = await tx.select().from(userMeetingConfigs).where(sql`id = ${config.id}`);
      expect(drizzleConfig?.encryptedSecret).toBe(plainPassword);

      testLogger.info("Successfully verified column-level encryption and decryption.");
    });
  });

  test("verifies encryption produces different ciphertexts for same plaintext", async () => {
    await runInRollback(async tx => {
      const now = new Date();
      const uniqueSuffix1 = randomUUID();
      const uniqueSuffix2 = randomUUID();
      const plainNationalId = "NID-SAME-111-222";

      const user1 = await createTestUser(tx, uniqueSuffix1, now);
      const teacher1 = await insertTeacherDetails({ tx, userId: user1.id, plainNationalId, now });

      const user2 = await createTestUser(tx, uniqueSuffix2, now);
      const teacher2 = await insertTeacherDetails({ tx, userId: user2.id, plainNationalId, now });

      const raw1 = await executeTxSql(tx, sql`SELECT national_id FROM teachers WHERE id = ${teacher1.id}`);
      const raw2 = await executeTxSql(tx, sql`SELECT national_id FROM teachers WHERE id = ${teacher2.id}`);
      const row1 = extractRows(raw1);
      const row2 = extractRows(raw2);

      expect(row1[0]?.national_id).not.toBe(row2[0]?.national_id);
      expect(String(row1[0]?.national_id)).not.toBe(String(row2[0]?.national_id));
    });
  });
});
