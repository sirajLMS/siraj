"use client";

import { Stack } from "@mui/material";
import { SectionPanel } from "@/frontend/common/components/ui";
import { InfoField } from "@/frontend/common/views/dashboard/profile/teacher/sections/InfoField";
import {
  isTeacherAdminData,
  type TeacherViewData,
} from "@/frontend/common/views/dashboard/profile/teacher/sections/teacherProfileTypes";
import { useAppTranslation } from "@/shared/locale/client";

type StatsSectionProps = {
  readonly teacherData: TeacherViewData;
  readonly isAdminScope: boolean;
};

export function StatsSection({ teacherData, isAdminScope }: StatsSectionProps) {
  const t = useAppTranslation().dashboardTranslations.teacherProfile;

  const adminData = isTeacherAdminData(teacherData) ? teacherData : null;

  return (
    <SectionPanel title={t.stats.totalClasses}>
      <Stack spacing={2}>
        <InfoField label={t.stats.totalClasses} value={String(teacherData.totalClasses ?? 0)} />
        {isAdminScope && adminData ? (
          <InfoField label={t.stats.avgEngagement} value={(adminData.avgEngagementScore ?? 0).toFixed(1)} />
        ) : null}
      </Stack>
    </SectionPanel>
  );
}
