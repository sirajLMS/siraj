import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { testLogger } from "../../../lib/testlogger";
import type { TeacherBankingDetailsHistoryInsertInput, TeacherEntityInput } from "../../types";
import { db } from "../drizzleDb";
import { teacherBankingDetailsHistory, teachers, users } from "../schema";

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function runInRollback(fn: (tx: DbTransaction) => Promise<void>): Promise<void> {
  let assertionError: unknown = null;
  try {
    await db.transaction(async tx => {
      try {
        await fn(tx);
      } catch (error) {
        assertionError = error;
      }
      tx.rollback();
    });
  } catch {
    // Ignore expected Drizzle transaction rollback error
  }
  if (assertionError) {
    throw assertionError;
  }
}

describe("Column-Level Encryption", () => {
  test("Sensitive teacher and banking fields are encrypted in the DB but decrypted on select", async () => {
    testLogger.info("Starting column-level encryption test...");
    await runInRollback(async tx => {
      const now = new Date();
      const uniqueSuffix = randomUUID();

      // 1. Create a user
      const email = `teacher-${uniqueSuffix}@example.com`;
      const [user] = await tx
        .insert(users)
        .values({
          name: "Crypto Teacher",
          email,
          password: "securePassword",
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      // 2. Insert teacher details (zoomPassword and nationalId should be encrypted)
      const plainZoomPassword = "SecretZoomPassword123!";
      const plainNationalId = "NID-999-888-777";

      const teacherInput: TeacherEntityInput = {
        userId: user.id,
        status: "ACTIVATED",
        timezone: "UTC",
        zoomPassword: plainZoomPassword,
        nationalId: plainNationalId,
        createdAt: now,
        updatedAt: now,
      };

      const [teacher] = await tx.insert(teachers).values(teacherInput).returning();
      expect(teacher).toBeDefined();

      // 3. Insert teacher banking details
      const plainBeneficiaryName = "Teacher Beneficiary Name";
      const plainIban = "US12345678901234567890";

      const bankingInput: TeacherBankingDetailsHistoryInsertInput = {
        teacherId: teacher.id,
        beneficiaryName: plainBeneficiaryName,
        iban: plainIban,
        createdAt: now,
        updatedAt: now,
      };

      const [banking] = await tx.insert(teacherBankingDetailsHistory).values(bankingInput).returning();
      expect(banking).toBeDefined();

      // 4. Query raw values directly from database via SQL to verify ciphertext format (iv:ciphertext:tag)
      const rawTeacherResult = await tx.execute(
        sql`SELECT zoom_password, national_id FROM teachers WHERE id = ${teacher.id}`
      );
      const teacherRows =
        "rows" in rawTeacherResult ? rawTeacherResult.rows : (rawTeacherResult as unknown as Record<string, unknown>[]);
      const rawTeacherRow = teacherRows[0];
      expect(rawTeacherRow).toBeDefined();

      const rawZoomPassword = String(rawTeacherRow.zoom_password);
      const rawNationalId = String(rawTeacherRow.national_id);

      // Verify that raw database values are formatted as iv:ciphertext:tag and not equal to plaintext
      expect(rawZoomPassword).not.toBe(plainZoomPassword);
      expect(rawZoomPassword.split(":")).toHaveLength(3);

      expect(rawNationalId).not.toBe(plainNationalId);
      expect(rawNationalId.split(":")).toHaveLength(3);

      const rawBankingResult = await tx.execute(
        sql`SELECT beneficiary_name, iban FROM teacher_banking_details_history WHERE id = ${banking.id}`
      );
      const bankingRows =
        "rows" in rawBankingResult ? rawBankingResult.rows : (rawBankingResult as unknown as Record<string, unknown>[]);
      const rawBankingRow = bankingRows[0];
      expect(rawBankingRow).toBeDefined();

      const rawBeneficiaryName = String(rawBankingRow.beneficiary_name);
      const rawIban = String(rawBankingRow.iban);

      expect(rawBeneficiaryName).not.toBe(plainBeneficiaryName);
      expect(rawBeneficiaryName.split(":")).toHaveLength(3);

      expect(rawIban).not.toBe(plainIban);
      expect(rawIban.split(":")).toHaveLength(3);

      // 5. Query values via Drizzle select to verify automatic decryption
      const [drizzleTeacher] = await tx.select().from(teachers).where(sql`id = ${teacher.id}`);
      expect(drizzleTeacher).toBeDefined();
      expect(drizzleTeacher.zoomPassword).toBe(plainZoomPassword);
      expect(drizzleTeacher.nationalId).toBe(plainNationalId);

      const [drizzleBanking] = await tx.select().from(teacherBankingDetailsHistory).where(sql`id = ${banking.id}`);
      expect(drizzleBanking).toBeDefined();
      expect(drizzleBanking.beneficiaryName).toBe(plainBeneficiaryName);
      expect(drizzleBanking.iban).toBe(plainIban);

      testLogger.info("Successfully verified column-level encryption and decryption.");
    });
  });
});
