"use client";

import type { QuotaAudienceSection } from "@/frontend/common/views/dashboard/students/quota/audience/__shared__/quotaAudienceViewShared";
import { QuotaAudienceViewShared } from "@/frontend/common/views/dashboard/students/quota/audience/__shared__/quotaAudienceViewShared";
import type { StudentQuotaLabels } from "@/shared/locale/types/dashboard/students/quota";

interface StudentQuotaViewProps {
  readonly t: StudentQuotaLabels;
}

function buildStudentSections(t: StudentQuotaLabels): readonly QuotaAudienceSection[] {
  return [
    { label: t.audience.remainingCredits, emptyStateMessage: t.audience.noData, highlighted: true },
    { label: t.audience.activeQuotas, emptyStateMessage: t.audience.noData },
    { label: t.audience.onDemandPending, emptyStateMessage: t.audience.noData },
  ];
}

export function StudentQuotaAudienceView({ t }: Readonly<StudentQuotaViewProps>) {
  return <QuotaAudienceViewShared title={t.audience.studentTitle} sections={buildStudentSections(t)} />;
}
