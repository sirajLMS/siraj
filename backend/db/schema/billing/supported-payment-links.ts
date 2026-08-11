import { index, jsonb, pgTable, varchar } from "drizzle-orm/pg-core";
import {
  supportedPaymentMethodBaseHead,
  supportedPaymentMethodBaseTail,
} from "@/backend/db/schema/billing/__shared__/supportedPaymentMethodBase";

export const supportedPaymentLinks = pgTable(
  "supported_payment_links",
  {
    ...supportedPaymentMethodBaseHead(),
    urlAllowlist: jsonb("url_allowlist").$type<readonly string[]>().notNull(),
    urlExample: varchar("url_example", { length: 1024 }),
    ...supportedPaymentMethodBaseTail(),
  },
  table => [
    index("supported_payment_links_is_active_idx").on(table.isActive),
    index("supported_payment_links_supported_directions_idx").on(table.supportedDirections),
    index("supported_payment_links_created_at_idx").on(table.createdAt),
  ]
);
