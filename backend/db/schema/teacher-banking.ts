import { index, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { encryptedText } from "./custom-types";
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
    beneficiaryName: encryptedText("beneficiary_name"),
    bankName: encryptedText("bank_name"),
    accountNumber: encryptedText("account_number"),
    routingNumber: encryptedText("routing_number"),
    swiftBic: encryptedText("swift_bic"),
    iban: encryptedText("iban"),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull(),
  },
  table => [index("teacher_banking_details_teacher_id_idx").on(table.teacherId)]
);
