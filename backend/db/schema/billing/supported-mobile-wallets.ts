import { createTable, index, varcharColumn } from "@/backend/db/schema/__shared__/dialectAwareBuilder";
import {
  supportedPaymentMethodBaseHead,
  supportedPaymentMethodBaseTail,
} from "@/backend/db/schema/billing/__shared__/supportedPaymentMethodBase";
import { countryCodeEnum, currencyCodeEnum } from "@/backend/db/schema/enums";

export const supportedMobileWallets = createTable(
  "supported_mobile_wallets",
  {
    ...supportedPaymentMethodBaseHead(),
    countryCode: countryCodeEnum("country_code"),
    currencyCode: currencyCodeEnum("currency_code"),
    phoneRegion: varcharColumn("phone_region", { length: 10 }),
    ...supportedPaymentMethodBaseTail(),
  },
  table => [
    index("supported_mobile_wallets_country_code_idx").on(table.countryCode),
    index("supported_mobile_wallets_is_active_idx").on(table.isActive),
    index("supported_mobile_wallets_currency_code_idx").on(table.currencyCode),
    index("supported_mobile_wallets_phone_region_idx").on(table.phoneRegion),
    index("supported_mobile_wallets_supported_directions_idx").on(table.supportedDirections),
    index("supported_mobile_wallets_created_at_idx").on(table.createdAt),
  ]
);
