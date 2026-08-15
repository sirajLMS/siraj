import type { ReactNode } from "react";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import { buildHealthHeaderMetrics } from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/__shared__/meetingIntegrationsHealthHeadersShared.helpers";
import type { MeetingIntegrationsViewModel } from "@/frontend/common/views/dashboard/settings/types/meetingIntegrations.types";

export interface MeetingIntegrationsHealthHeadersSharedProps {
  readonly viewModel: Readonly<MeetingIntegrationsViewModel>;
  /** Tier-specific skeleton placeholder shown while data loads. */
  readonly renderSkeleton: () => ReactNode;
  /** Tier-specific grid rendering of the computed metric items. */
  readonly renderMetrics: (metrics: readonly MetricItem[]) => ReactNode;
}

export function MeetingIntegrationsHealthHeadersShared({
  viewModel,
  renderSkeleton,
  renderMetrics,
}: Readonly<MeetingIntegrationsHealthHeadersSharedProps>): ReactNode {
  if (viewModel.loading) {
    return renderSkeleton();
  }

  const metrics = buildHealthHeaderMetrics(viewModel);
  return renderMetrics(metrics);
}
