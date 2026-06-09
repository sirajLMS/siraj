import { sql } from "drizzle-orm";
import { index, pgTable, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { encryptedText } from "./custom-types";
import { teachers } from "./teachers";

export const teacherBankingDetailsHistory = pgTable(
  "teacher_banking_details_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    teacherId: uuid("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    // NOTE: The following fields should be encrypted at the application level
    beneficiaryName: encryptedText("beneficiary_name"),
    bankName: encryptedText("bank_name"),
    accountNumber: encryptedText("account_number"),
    routingNumber: encryptedText("routing_number"),
    swiftBic: encryptedText("swift_bic"),
    iban: encryptedText("iban"),
    validFrom: timestamp("valid_from", { withTimezone: true, precision: 3 })
      .default(sql`clock_timestamp()`)
      .notNull(),
    validUntil: timestamp("valid_until", { withTimezone: true, precision: 3 }),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull(),
  },
  table => [
    index("teacher_banking_details_history_teacher_id_idx").on(table.teacherId),
    uniqueIndex("teacher_banking_details_history_active_idx")
      .on(table.teacherId)
      .where(sql`${table.validUntil} IS NULL`),
  ]
);

