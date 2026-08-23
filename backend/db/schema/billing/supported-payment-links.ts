import { createTable, index, jsonbColumn, varcharColumn } from "@/backend/db/schema/__shared__/dialectAwareBuilder";
import {
  supportedPaymentMethodBaseHead,
  supportedPaymentMethodBaseTail,
} from "@/backend/db/schema/billing/__shared__/supportedPaymentMethodBase";

export const supportedPaymentLinks = createTable(
  "supported_payment_links",
  {
    ...supportedPaymentMethodBaseHead(),
    urlAllowlist: jsonbColumn<readonly string[]>("url_allowlist").notNull(),
    urlExample: varcharColumn("url_example", { length: 1024 }),
    ...supportedPaymentMethodBaseTail(),
  },
  table => [
    index("supported_payment_links_is_active_idx").on(table.isActive),
    index("supported_payment_links_supported_directions_idx").on(table.supportedDirections),
    index("supported_payment_links_created_at_idx").on(table.createdAt),
  ]
);
