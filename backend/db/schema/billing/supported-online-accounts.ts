import { createTable, index, jsonbColumn } from "@/backend/db/schema/__shared__/dialectAwareBuilder";
import {
  supportedPaymentMethodBaseHead,
  supportedPaymentMethodBaseTail,
} from "@/backend/db/schema/billing/__shared__/supportedPaymentMethodBase";
import { identifierKindEnum } from "@/backend/db/schema/enums";
import type { LocalizedString } from "@/shared/types";

export const supportedOnlineAccounts = createTable(
  "supported_online_accounts",
  {
    ...supportedPaymentMethodBaseHead(),
    identifierKind: identifierKindEnum("identifier_kind").notNull(),
    identifierLabel: jsonbColumn<LocalizedString>("identifier_label").notNull(),
    ...supportedPaymentMethodBaseTail(),
  },
  table => [
    index("supported_online_accounts_identifier_kind_idx").on(table.identifierKind),
    index("supported_online_accounts_supported_directions_idx").on(table.supportedDirections),
    index("supported_online_accounts_is_active_idx").on(table.isActive),
    index("supported_online_accounts_created_at_idx").on(table.createdAt),
  ]
);
