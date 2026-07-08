"use client";

import { Stack } from "@mui/material";
import { useTranslations } from "next-intl";
import { SectionPanel } from "@/frontend/components/ui";
import { InfoField } from "./InfoField";
import { isTeacherAdminData, type TeacherViewData } from "./teacherProfileTypes";

type StatsSectionProps = {
  readonly teacherData: TeacherViewData;
  readonly isAdminScope: boolean;
};

export function StatsSection({ teacherData, isAdminScope }: StatsSectionProps) {
  const t = useTranslations("profile.teacher");
  const adminData = isTeacherAdminData(teacherData) ? teacherData : null;

  return (
    <SectionPanel title={t("sections.stats")}>
      <Stack spacing={2}>
        <InfoField label={t("stats.totalClasses")} value={String(teacherData.totalClasses ?? 0)} />
        {isAdminScope && adminData ? (
          <InfoField label={t("stats.avgEngagement")} value={(adminData.avgEngagementScore ?? 0).toFixed(1)} />
        ) : null}
      </Stack>
    </SectionPanel>
  );
}
