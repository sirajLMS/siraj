import type { SvgIconComponent } from "@mui/icons-material";
import type { MetricCardVariant } from "@/frontend/common/components/ui/card/MetricCard";

export interface BillingMetricItem {
  readonly key: string;
  readonly label: string;
  readonly value: string | number;
  readonly icon: SvgIconComponent;
  readonly variant?: MetricCardVariant;
  readonly subLabel?: string;
}

export interface BillingMetricsRowProps {
  readonly metrics: readonly BillingMetricItem[];
  readonly compact?: boolean;
  readonly loading?: boolean;
}
