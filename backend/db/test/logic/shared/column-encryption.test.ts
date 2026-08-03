import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { teachers, userMeetingConfigs, users } from "@/backend/db/schema";
import { createTestMeetingConfig, createTestMeetingProvider } from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import type { TeacherInsertType } from "@/backend/types";
import { testLogger } from "@/shared/lib/logger/testlogger";

async function createTestUser(tx: DBTransaction, uniqueSuffix: string, now: Date) {
  const email = `teacher-${uniqueSuffix}@example.com`;
  const [user] = await tx
    .insert(users)
    .values({
      name: "Crypto Teacher",
      email,
      password: randomUUID(),
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

      const rawTeacherResult = await tx.execute(sql`SELECT national_id FROM teachers WHERE id = ${teacher.id}`);
      const teacherRows =
        "rows" in rawTeacherResult ? rawTeacherResult.rows : (rawTeacherResult as unknown as Record<string, unknown>[]);
      verifyCiphertext(teacherRows[0]?.national_id, plainNationalId);

      const rawConfigResult = await tx.execute(
        sql`SELECT encrypted_secret FROM user_meeting_configs WHERE id = ${config.id}`
      );
      const configRows =
        "rows" in rawConfigResult ? rawConfigResult.rows : (rawConfigResult as unknown as Record<string, unknown>[]);
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

      const raw1 = await tx.execute(sql`SELECT national_id FROM teachers WHERE id = ${teacher1.id}`);
      const raw2 = await tx.execute(sql`SELECT national_id FROM teachers WHERE id = ${teacher2.id}`);
      const row1 = "rows" in raw1 ? raw1.rows : (raw1 as unknown as Record<string, unknown>[]);
      const row2 = "rows" in raw2 ? raw2.rows : (raw2 as unknown as Record<string, unknown>[]);

      expect(row1[0]?.national_id).not.toBe(row2[0]?.national_id);
      expect(String(row1[0]?.national_id)).not.toBe(String(row2[0]?.national_id));
    });
  });
});
