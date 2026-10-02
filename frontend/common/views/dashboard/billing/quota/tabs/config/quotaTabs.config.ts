import { InsightsOutlined, ReceiptLongOutlined } from "@mui/icons-material";
import type { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { PAGE_PERMISSIONS } from "@/frontend/common/types/page-permissions.types";
import type { QuotaTabId, QuotaTabLabelKey } from "@/frontend/common/views/dashboard/billing/quota/tabs/types";
import { getVisibleTabs, type TabDefinition } from "@/frontend/common/views/dashboard/lib/tabbedPane";

const QUOTA_TABS: readonly TabDefinition<QuotaTabId, QuotaTabLabelKey>[] = [
  {
    id: "allocations",
    labelKey: "listTitle",
    permissions: PAGE_PERMISSIONS.quotas,
    icon: ReceiptLongOutlined,
  },
  {
    id: "insights",
    labelKey: "insights",
    permissions: PAGE_PERMISSIONS.quotas,
    icon: InsightsOutlined,
  },
] as const;

export function getVisibleQuotaTabs(
  hasPermission: (permission: AppPermission) => boolean
): TabDefinition<QuotaTabId, QuotaTabLabelKey>[] {
  return getVisibleTabs<QuotaTabId, QuotaTabLabelKey>(QUOTA_TABS, hasPermission);
}
