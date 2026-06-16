import { HistoryEduOutlined, StarHalfOutlined } from "@mui/icons-material";
import { Box, type Theme } from "@mui/material";
import { useTranslations } from "next-intl";
import { MetricCard } from "@/frontend/components/ui";

interface TeacherProfileStatsProps {
  readonly totalClasses: number;
  readonly parentRating: string;
}

export function TeacherProfileStats({ totalClasses, parentRating }: Readonly<TeacherProfileStatsProps>) {
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
      <MetricCard label={t("parentRating")} value={parentRating} icon={StarHalfOutlined} variant="default" />
    </Box>
  );
}
