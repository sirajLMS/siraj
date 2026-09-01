import { AccountBalanceWalletOutlined, VideocamOutlined } from "@mui/icons-material";
import type { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { PAGE_PERMISSIONS } from "@/frontend/common/types/page-permissions.types";
import type {
  PaymentCatalogsTabId,
  PaymentCatalogsTabLabelKey,
} from "@/frontend/common/views/dashboard/admin/payment-catalogs/tabs/types";
import { getVisibleTabs, type TabDefinition } from "@/frontend/common/views/dashboard/lib/tabbedPane";

const PAYMENT_CATALOGS_TABS: readonly TabDefinition<PaymentCatalogsTabId, PaymentCatalogsTabLabelKey>[] = [
  {
    id: "paymentCatalogs",
    labelKey: "paymentCatalogs",
    permissions: PAGE_PERMISSIONS.paymentCatalogsTab,
    icon: AccountBalanceWalletOutlined,
  },
  {
    id: "meetingProviders",
    labelKey: "meetingProviders",
    permissions: PAGE_PERMISSIONS.paymentCatalogsMeetingProviders,
    icon: VideocamOutlined,
  },
] as const;

export function getVisiblePaymentCatalogsTabs(
  hasPermission: (permission: AppPermission) => boolean
): TabDefinition<PaymentCatalogsTabId, PaymentCatalogsTabLabelKey>[] {
  return getVisibleTabs<PaymentCatalogsTabId, PaymentCatalogsTabLabelKey>(PAYMENT_CATALOGS_TABS, hasPermission);
}
