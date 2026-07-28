"use client";

import { Stack } from "@mui/material";
import { SectionPanel } from "@/frontend/common/components/ui";
import { InfoField } from "@/frontend/common/views/dashboard/profile/teacher/sections/InfoField";
import {
  isTeacherAdminData,
  type TeacherProfileViewLabels,
  type TeacherViewData,
} from "@/frontend/common/views/dashboard/profile/teacher/sections/teacherProfileTypes";

type StatsSectionProps = {
  readonly labels: Pick<TeacherProfileViewLabels, "dashboard">;
  readonly teacherData: TeacherViewData;
  readonly isAdminScope: boolean;
};

export function StatsSection({ labels, teacherData, isAdminScope }: StatsSectionProps) {
  const t = labels.dashboard.stats;

  const adminData = isTeacherAdminData(teacherData) ? teacherData : null;

  return (
    <SectionPanel title={t.totalClasses}>
      <Stack spacing={2}>
        <InfoField label={t.totalClasses} value={String(teacherData.totalClasses ?? 0)} />
        {isAdminScope && adminData ? (
          <InfoField label={t.avgEngagement} value={(adminData.avgEngagementScore ?? 0).toFixed(1)} />
        ) : null}
      </Stack>
    </SectionPanel>
  );
}
