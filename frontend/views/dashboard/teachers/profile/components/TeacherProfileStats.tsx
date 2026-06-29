import { HistoryEduOutlined, TrendingUpOutlined } from "@mui/icons-material";
import { Box, type Theme } from "@mui/material";
import { useTranslations } from "next-intl";
import { MetricCard } from "@/frontend/components/ui";
import type { TeacherProfileStatsProps } from "../types";

export function TeacherProfileStats({ totalClasses, avgEngagementScore }: Readonly<TeacherProfileStatsProps>) {
  const t = useTranslations("dashboard.teacherProfile.stats");

  return (
    <Box
      component="section"
      sx={(theme: Theme) => ({
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
        gap: theme.layout.sectionGap,
        mt: 4,
      })}
    >
      <MetricCard label={t("totalClasses")} value={totalClasses} icon={HistoryEduOutlined} variant="default" />
      <MetricCard label={t("avgEngagement")} value={avgEngagementScore} icon={TrendingUpOutlined} variant="default" />
    </Box>
  );
}
