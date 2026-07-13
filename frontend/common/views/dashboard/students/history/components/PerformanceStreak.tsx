import { Box, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import type { PerformanceStreakProps } from "@/frontend/common/views/dashboard/students/history/types";

const MAX_STREAK_HEIGHT = 48;
const MIN_STREAK_HEIGHT = 16;

const WEEK_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

export function PerformanceStreak({ streakDays }: Readonly<PerformanceStreakProps>) {
  const t = useTranslations("dashboard.studentHistory.performanceStreak");

  return (
    <Box
      sx={theme => ({
        mt: 4,
        backgroundColor: theme.palette.primary.main,
        p: 3,
        borderRadius: 4,
        position: "relative",
        overflow: "hidden",
        boxShadow: theme.palette.shadow.card,
      })}
    >
      <Box sx={{ position: "relative", zIndex: 10 }}>
        <Typography variant="titleLg" sx={theme => ({ color: theme.palette.onPrimary, mb: 1 })}>
          {t("title")}
        </Typography>
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onPrimary, opacity: 0.8, mb: 3 })}>
          {t("description", { count: streakDays.length })}
        </Typography>

        <Box sx={{ display: "flex", gap: 0.5, height: MAX_STREAK_HEIGHT, alignItems: "flex-end" }}>
          {streakDays.map((height, i) => {
            const barHeight = height > 0 ? Math.max(MIN_STREAK_HEIGHT, height) : 0;
            const isFull = height >= MAX_STREAK_HEIGHT;

            return (
              <Box
                key={WEEK_DAYS[i]}
                sx={theme => ({
                  flex: 1,
                  backgroundColor: theme.palette.onPrimary,
                  opacity: isFull ? 1 : 0.2,
                  borderTopLeftRadius: 4,
                  borderTopRightRadius: 4,
                  height: barHeight,
                  transition: "all 0.2s",
                  "&:hover": {
                    height: barHeight > 0 ? 40 : 0,
                    opacity: barHeight > 0 ? 0.4 : 0.2,
                  },
                })}
              />
            );
          })}
        </Box>
      </Box>

      <Box
        sx={theme => ({
          position: "absolute",
          right: -40,
          bottom: -40,
          width: 160,
          height: 160,
          backgroundColor: theme.palette.onPrimary,
          opacity: 0.05,
          borderRadius: "50%",
          filter: "blur(24px)",
        })}
      />
    </Box>
  );
}
