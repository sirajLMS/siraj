"use client";

import {
  type QuotaAudienceSection,
  QuotaAudienceViewShared,
} from "@/frontend/common/views/dashboard/students/quota/audience/__shared__/quotaAudienceViewShared";
import type { StudentQuotaLabels } from "@/shared/locale/types/dashboard/students/quota";

interface ParentQuotaViewProps {
  readonly t: StudentQuotaLabels;
}

function buildParentSections(t: StudentQuotaLabels): readonly QuotaAudienceSection[] {
  return [
    { label: t.audience.remainingCredits, emptyStateMessage: t.audience.noChildren, highlighted: true },
    { label: t.audience.activeQuotas, emptyStateMessage: t.audience.noChildren },
    { label: t.audience.onDemandPending, emptyStateMessage: t.audience.noChildren },
  ];
}

export function ParentQuotaView({ t }: Readonly<ParentQuotaViewProps>) {
  return <QuotaAudienceViewShared title={t.audience.parentTitle} sections={buildParentSections(t)} />;
}
