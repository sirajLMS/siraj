import { sql } from "drizzle-orm";
import { index, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { countryCodeEnum, genderEnum } from "./enums";

export const students = pgTable(
  "student",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }),
    phoneNumber: varchar("phone_number", { length: 255 }),
    dateOfBirth: timestamp("date_of_birth", { precision: 3 }),
    gender: genderEnum("gender"),
    nationality: countryCodeEnum("nationality"),
    createdAt: timestamp("created_at", { precision: 3 }).notNull(),
    updatedAt: timestamp("updated_at", { precision: 3 }).notNull(),
  },
  table => [
    // GIN index for Full-Text Search on 'name' column
    index("idx_students_name_fts").using("gin", sql`to_tsvector('simple', ${table.name})`),

    // GiST index for faster LIKE/ILIKE on name using pg_trgm
    index("idx_students_name_trgm").using("gist", table.name.op("gist_trgm_ops")),
  ]
);
