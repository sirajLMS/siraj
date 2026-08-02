import { index, jsonb, pgTable, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { encryptedText } from "@/backend/db/schema/custom-types";
import { users } from "@/backend/db/schema/users/users";

export const meetingProviderTokens = pgTable(
  "meeting_provider_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerSlug: varchar("provider_slug", { length: 50 }).notNull(),
    accessToken: encryptedText("access_token").notNull(),
    refreshToken: encryptedText("refresh_token"),
    expiresAt: timestamp("expires_at", { withTimezone: true, precision: 3 }),
    scopes: jsonb("scopes").$type<readonly string[]>().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull(),
  },
  table => [
    uniqueIndex("meeting_provider_tokens_user_provider_idx").on(table.userId, table.providerSlug),
    index("meeting_provider_tokens_user_id_idx").on(table.userId),
    index("meeting_provider_tokens_provider_slug_idx").on(table.providerSlug),
    index("meeting_provider_tokens_expires_at_idx").on(table.expiresAt),
  ]
);
