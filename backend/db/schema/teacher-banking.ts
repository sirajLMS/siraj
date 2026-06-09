import { index, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { teachers } from "./teachers";

export const teacherBankingDetails = pgTable(
  "teacher_banking_details",
  {
    id: serial("id").primaryKey(),
    teacherId: integer("teacher_id")
      .notNull()
      .unique()
      .references(() => teachers.id, { onDelete: "cascade" }),
    // NOTE: The following fields should be encrypted at the application level
    beneficiaryName: varchar("beneficiary_name", { length: 255 }),
    bankName: varchar("bank_name", { length: 255 }),
    accountNumber: varchar("account_number", { length: 255 }),
    routingNumber: varchar("routing_number", { length: 255 }),
    swiftBic: varchar("swift_bic", { length: 255 }),
    iban: varchar("iban", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull(),
  },
  table => [index("teacher_banking_details_teacher_id_idx").on(table.teacherId)]
);
