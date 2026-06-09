import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { teachers } from "./teachers";

export const teacherBankingDetails = pgTable(
  "teacher_banking_details",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    teacherId: uuid("teacher_id")
      .notNull()
      .unique()
      .references(() => teachers.id, { onDelete: "cascade" }),
    // NOTE: The following fields should be encrypted at the application level
    beneficiaryName: text("beneficiary_name"),
    bankName: text("bank_name"),
    accountNumber: text("account_number"),
    routingNumber: text("routing_number"),
    swiftBic: text("swift_bic"),
    iban: text("iban"),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull(),
  },
  table => [index("teacher_banking_details_teacher_id_idx").on(table.teacherId)]
);
