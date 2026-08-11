"use client";

import { WarningAmberOutlined } from "@mui/icons-material";
import type { QuotaAudienceSection } from "@/frontend/common/views/dashboard/students/quota/audience/__shared__/quotaAudienceViewShared";
import { QuotaAudienceViewShared } from "@/frontend/common/views/dashboard/students/quota/audience/__shared__/quotaAudienceViewShared";
import type { StudentQuotaLabels } from "@/shared/locale/types/dashboard/students/quota";

interface TeacherQuotaViewProps {
  readonly t: StudentQuotaLabels;
}

function buildTeacherSections(t: StudentQuotaLabels): readonly QuotaAudienceSection[] {
  return [
    {
      label: t.audience.conflictHeld,
      emptyStateMessage: t.audience.noData,
      icon: WarningAmberOutlined,
      iconColor: "error.main",
    },
    { label: t.audience.classQuotaUsage, emptyStateMessage: t.audience.noData },
    { label: t.audience.onDemandPendingQueue, emptyStateMessage: t.audience.noData },
    { label: t.audience.classAnalytics, emptyStateMessage: t.audience.noData },
  ];
}

export function TeacherQuotaView({ t }: Readonly<TeacherQuotaViewProps>) {
  return <QuotaAudienceViewShared title={t.audience.teacherTitle} sections={buildTeacherSections(t)} />;
}
