import {
  AccountBalanceWalletOutlined,
  AssessmentOutlined,
  CurrencyExchangeOutlined,
  DashboardOutlined,
  ReceiptLongOutlined,
  ShieldOutlined,
} from "@mui/icons-material";
import type { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { PAGE_PERMISSIONS } from "@/frontend/common/types/page-permissions.types";
import type { BillingTabId, BillingTabLabelKey } from "@/frontend/common/views/dashboard/billing/tabs/types";
import { getVisibleTabs, type TabDefinition } from "@/frontend/common/views/dashboard/lib/tabbedPane";

export const BILLING_TABS: readonly TabDefinition<BillingTabId, BillingTabLabelKey>[] = [
  {
    id: "overview",
    labelKey: "overview",
    permissions: PAGE_PERMISSIONS.billingOverview,
    icon: DashboardOutlined,
  },
  {
    id: "invoices",
    labelKey: "invoices",
    permissions: PAGE_PERMISSIONS.billingInvoices,
    icon: ReceiptLongOutlined,
  },
  {
    id: "exchangeRates",
    labelKey: "exchangeRates",
    permissions: PAGE_PERMISSIONS.billingExchangeRates,
    icon: CurrencyExchangeOutlined,
  },
  {
    id: "currencies",
    labelKey: "currencies",
    permissions: PAGE_PERMISSIONS.billingCurrencies,
    icon: AssessmentOutlined,
  },
  {
    id: "hedges",
    labelKey: "hedges",
    permissions: PAGE_PERMISSIONS.billingHedges,
    icon: ShieldOutlined,
  },
  {
    id: "manual",
    labelKey: "manual",
    permissions: PAGE_PERMISSIONS.billingManual,
    icon: AccountBalanceWalletOutlined,
  },
] as const;

export function getVisibleBillingTabs(
  hasPermission: (permission: AppPermission) => boolean
): TabDefinition<BillingTabId, BillingTabLabelKey>[] {
  return getVisibleTabs<BillingTabId, BillingTabLabelKey>(BILLING_TABS, hasPermission);
}
