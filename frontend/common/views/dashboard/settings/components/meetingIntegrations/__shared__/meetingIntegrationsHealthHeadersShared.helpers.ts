import { CheckCircleOutlined, CloudOffOutlined, DnsOutlined, WarningOutlined } from "@mui/icons-material";
import type { MetricItem, MetricItemVariant } from "@/frontend/common/types/shared.types";
import type { MeetingIntegrationsViewModel } from "@/frontend/common/views/dashboard/settings/types/meetingIntegrations.types";

const METRIC_KEYS = {
  totalProviders: "totalProviders",
  connected: "connected",
  issues: "issues",
  disconnected: "disconnected",
} as const;

export function buildHealthHeaderMetrics(viewModel: Readonly<MeetingIntegrationsViewModel>): readonly MetricItem[] {
  const { labels, providers, loading, error } = viewModel;

  if (loading) {
    return [
      { key: METRIC_KEYS.totalProviders, count: 0, labelKey: METRIC_KEYS.totalProviders, icon: DnsOutlined },
      { key: METRIC_KEYS.connected, count: 0, labelKey: METRIC_KEYS.connected, icon: CheckCircleOutlined },
      { key: METRIC_KEYS.issues, count: 0, labelKey: METRIC_KEYS.issues, icon: WarningOutlined },
      { key: METRIC_KEYS.disconnected, count: 0, labelKey: METRIC_KEYS.disconnected, icon: CloudOffOutlined },
    ];
  }

  const totalProviders = providers.length;
  const connected = providers.filter(p => p.credentialsHealthy).length;
  const disconnected = providers.filter(p => !p.credentialsHealthy).length;
  const issues = providers.reduce((sum, p) => sum + p.reauthNeededCount, 0);

  const errorVariant: MetricItemVariant | undefined = error ? "error" : undefined;
  const isEmpty = totalProviders === 0 && !error;

  return [
    {
      key: METRIC_KEYS.totalProviders,
      count: totalProviders,
      labelKey: METRIC_KEYS.totalProviders,
      label: labels.totalProviders,
      icon: DnsOutlined,
      variant: errorVariant,
    },
    {
      key: METRIC_KEYS.connected,
      count: connected,
      labelKey: METRIC_KEYS.connected,
      label: labels.connectedProviders,
      icon: CheckCircleOutlined,
      variant: errorVariant,
    },
    {
      key: METRIC_KEYS.issues,
      count: issues,
      labelKey: METRIC_KEYS.issues,
      label: labels.providersWithIssues,
      icon: WarningOutlined,
      variant: errorVariant,
    },
    {
      key: METRIC_KEYS.disconnected,
      count: disconnected,
      labelKey: METRIC_KEYS.disconnected,
      icon: CloudOffOutlined,
      label: labels.disconnectedProviders,
      variant: disconnected > 0 ? "error" : errorVariant,
    },
  ].map(metric => (isEmpty ? Object.assign({}, metric, { label: metric.label ?? "" }) : metric));
}
