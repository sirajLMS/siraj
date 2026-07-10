import { and, eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { teacherPayments } from "@/backend/db/schema/teachers/teacher-banking";
import {
  addMonths,
  DEFAULT_INVOICE_CURRENCY,
  loadSeedConfig,
  type SeedConfig,
  startOfDay,
} from "@/backend/db/seeds/lib";
import logger from "@/backend/lib/logger";
import type { TeacherBankingDetailsHistorySelectType } from "@/backend/types";

export async function seedOrGet(bankingDetailsList: TeacherBankingDetailsHistorySelectType[], config?: SeedConfig) {
  logger.info("Seeding teacher payments...");
  const now = new Date();
  const seedConfig = config ?? loadSeedConfig();

  if (!seedConfig.enableExtendedScheduling || !bankingDetailsList?.length) {
    return [];
  }

  const anchor = startOfDay(seedConfig.anchorDate);
  const results = [];
  const monthsBack = seedConfig.profile === "standard" ? 3 : 1;

  for (const banking of bankingDetailsList) {
    for (let m = 1; m <= monthsBack; m++) {
      const paymentDate = addMonths(anchor, -m);

      const [existing] = await db
        .select()
        .from(teacherPayments)
        .where(and(eq(teacherPayments.teacherId, banking.teacherId), eq(teacherPayments.paymentDate, paymentDate)))
        .limit(1);

      if (existing) {
        results.push(existing);
        continue;
      }

      const [inserted] = await db
        .insert(teacherPayments)
        .values({
          teacherId: banking.teacherId,
          bankingDetailsHistoryId: banking.id,
          amount: (150 + m * 25).toFixed(2),
          currency: DEFAULT_INVOICE_CURRENCY,
          paymentDate,
          isTestPayment: true,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      results.push(inserted);
    }
  }

  logger.info(`Teacher payments seeded (${results.length} rows).`);
  return results;
}
