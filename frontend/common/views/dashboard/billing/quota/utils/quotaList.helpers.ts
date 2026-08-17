import { CheckCircleOutlined, ConfirmationNumberOutlined, ScheduleOutlined } from "@mui/icons-material";
import { QuotaStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import type { QuotaItem } from "@/frontend/common/views/dashboard/billing/quota/types/quota.types";
import type { QuotaLabels } from "@/shared/locale/types/dashboard/billing/quota";

export function buildQuotaListMetrics(t: QuotaLabels, totalCount: number, quotas: readonly QuotaItem[]): MetricItem[] {
  const activeCount = quotas.filter(q => q.status === QuotaStatus.Active).length;
  const expiredCount = quotas.filter(q => q.status === QuotaStatus.Expired).length;
  return [
    {
      key: "total-quotas",
      count: totalCount,
      label: t.listTitle,
      labelKey: "billing.quota.totalQuotas",
      icon: ConfirmationNumberOutlined,
    },
    {
      key: "active-quotas",
      count: activeCount,
      label: t.statuses.ACTIVE,
      labelKey: "billing.quota.activeQuotas",
      icon: CheckCircleOutlined,
    },
    {
      key: "expired-quotas",
      count: expiredCount,
      label: t.statuses.EXPIRED,
      labelKey: "billing.quota.expiredQuotas",
      icon: ScheduleOutlined,
    },
  ];
}
