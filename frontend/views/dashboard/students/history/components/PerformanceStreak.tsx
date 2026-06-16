import { Box, Typography } from "@mui/material";
import { useTranslations } from "next-intl";

export function PerformanceStreak() {
  const t = useTranslations("dashboard.studentHistory.performanceStreak");

  const streakData = [
    { id: "streak-1", height: 16 },
    { id: "streak-2", height: 24 },
    { id: "streak-3", height: 32 },
    { id: "streak-4", height: 40 },
    { id: "streak-5", height: 48 },
    { id: "streak-6", height: 0 },
    { id: "streak-7", height: 0 },
  ];

  return (
    <Box
      sx={theme => ({
        mt: 4,
        bgcolor: theme.palette.primary.main,
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
          {t("description")}
        </Typography>

        <Box sx={{ display: "flex", gap: 0.5, height: 48, alignItems: "flex-end" }}>
          {streakData.map(item => (
            <Box
              key={item.id}
              sx={theme => ({
                flex: 1,
                bgcolor: theme.palette.onPrimary,
                opacity: item.height === 48 ? 1 : 0.2,
                borderTopLeftRadius: 4,
                borderTopRightRadius: 4,
                height: item.height,
                transition: "all 0.2s",
                "&:hover": {
                  height: 40,
                  opacity: 0.4,
                },
              })}
            />
          ))}
        </Box>
      </Box>

      {/* Decorative background effect */}
      <Box
        sx={theme => ({
          position: "absolute",
          right: -40,
          bottom: -40,
          width: 160,
          height: 160,
          bgcolor: theme.palette.onPrimary,
          opacity: 0.05,
          borderRadius: "50%",
          filter: "blur(24px)",
        })}
      />
    </Box>
  );
}
