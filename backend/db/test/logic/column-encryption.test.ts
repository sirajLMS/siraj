import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { teacherBankingDetailsHistory, teachers, users } from "@/backend/db/schema";
import type { TeacherBankingDetailsHistoryInsertInput, TeacherEntityInput } from "@/backend/types";
import { testLogger } from "@/shared/lib/logger/testlogger";
import { runInRollback } from "../test-utils";

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

async function insertTeacherDetails(args: {
  tx: DBTransaction;
  userId: string;
  plainZoomPassword: string;
  plainNationalId: string;
  now: Date;
}) {
  const { tx, userId, plainZoomPassword, plainNationalId, now } = args;
  const teacherInput: TeacherEntityInput = {
    userId,
    status: "ACTIVATED",
    zoomPassword: plainZoomPassword,
    nationalId: plainNationalId,
    createdAt: now,
    updatedAt: now,
  };

  const [teacher] = await tx.insert(teachers).values(teacherInput).returning();
  expect(teacher).toBeDefined();
  return teacher;
}

async function insertBankingDetails(args: {
  tx: DBTransaction;
  teacherId: string;
  plainBeneficiaryName: string;
  plainIban: string;
  now: Date;
}) {
  const { tx, teacherId, plainBeneficiaryName, plainIban, now } = args;
  const bankingInput: TeacherBankingDetailsHistoryInsertInput = {
    teacherId,
    beneficiaryName: plainBeneficiaryName,
    iban: plainIban,
    createdAt: now,
    updatedAt: now,
  };

  const [banking] = await tx.insert(teacherBankingDetailsHistory).values(bankingInput).returning();
  expect(banking).toBeDefined();
  return banking;
}

function verifyCiphertext(value: unknown, plaintext: string) {
  const valStr = String(value);
  expect(valStr).not.toBe(plaintext);
  expect(valStr.split(":")).toHaveLength(3);
}

async function verifyRawEncryption(
  tx: DBTransaction,
  teacherId: string,
  bankingId: string,
  plainValues: { zoomPassword: string; nationalId: string; beneficiaryName: string; iban: string }
) {
  // Verify teacher encryption
  const rawTeacherResult = await tx.execute(
    sql`SELECT zoom_password, national_id FROM teachers WHERE id = ${teacherId}`
  );
  const teacherRows =
    "rows" in rawTeacherResult ? rawTeacherResult.rows : (rawTeacherResult as unknown as Record<string, unknown>[]);
  const rawTeacherRow = teacherRows[0];
  expect(rawTeacherRow).toBeDefined();

  verifyCiphertext(rawTeacherRow.zoom_password, plainValues.zoomPassword);
  verifyCiphertext(rawTeacherRow.national_id, plainValues.nationalId);

  // Verify banking encryption
  const rawBankingResult = await tx.execute(
    sql`SELECT beneficiary_name, iban FROM teacher_banking_details_history WHERE id = ${bankingId}`
  );
  const bankingRows =
    "rows" in rawBankingResult ? rawBankingResult.rows : (rawBankingResult as unknown as Record<string, unknown>[]);
  const rawBankingRow = bankingRows[0];
  expect(rawBankingRow).toBeDefined();

  verifyCiphertext(rawBankingRow.beneficiary_name, plainValues.beneficiaryName);
  verifyCiphertext(rawBankingRow.iban, plainValues.iban);
}

async function verifyDrizzleDecryption(
  tx: DBTransaction,
  teacherId: string,
  bankingId: string,
  plainValues: { zoomPassword: string; nationalId: string; beneficiaryName: string; iban: string }
) {
  const [drizzleTeacher] = await tx.select().from(teachers).where(sql`id = ${teacherId}`);
  expect(drizzleTeacher).toBeDefined();
  expect(drizzleTeacher.zoomPassword).toBe(plainValues.zoomPassword);
  expect(drizzleTeacher.nationalId).toBe(plainValues.nationalId);

  const [drizzleBanking] = await tx.select().from(teacherBankingDetailsHistory).where(sql`id = ${bankingId}`);
  expect(drizzleBanking).toBeDefined();
  expect(drizzleBanking.beneficiaryName).toBe(plainValues.beneficiaryName);
  expect(drizzleBanking.iban).toBe(plainValues.iban);
}

describe("Column-Level Encryption", () => {
  test("Sensitive teacher and banking fields are encrypted in the DB but decrypted on select", async () => {
    testLogger.info("Starting column-level encryption test...");
    await runInRollback(async tx => {
      const now = new Date();
      const uniqueSuffix = randomUUID();

      const plainValues = {
        zoomPassword: randomUUID(),
        nationalId: "NID-999-888-777",
        beneficiaryName: "Teacher Beneficiary Name",
        iban: "US12345678901234567890",
      };

      // 1. Create a user
      const user = await createTestUser(tx, uniqueSuffix, now);

      // 2. Insert teacher details
      const teacher = await insertTeacherDetails({
        tx,
        userId: user.id,
        plainZoomPassword: plainValues.zoomPassword,
        plainNationalId: plainValues.nationalId,
        now,
      });

      // 3. Insert teacher banking details
      const banking = await insertBankingDetails({
        tx,
        teacherId: teacher.id,
        plainBeneficiaryName: plainValues.beneficiaryName,
        plainIban: plainValues.iban,
        now,
      });

      // 4. Query raw values directly from database via SQL to verify ciphertext format (iv:ciphertext:tag)
      await verifyRawEncryption(tx, teacher.id, banking.id, plainValues);

      // 5. Query values via Drizzle select to verify automatic decryption
      await verifyDrizzleDecryption(tx, teacher.id, banking.id, plainValues);

      testLogger.info("Successfully verified column-level encryption and decryption.");
    });
  });
});
