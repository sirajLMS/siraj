import { Box, Typography } from "@mui/material";
import { useTranslations } from "next-intl";

interface MobileWeeklyScrollerProps {
  selectedWeek: number;
  onSelectWeek: (week: number) => void;
}

export function MobileWeeklyScroller({ selectedWeek, onSelectWeek }: Readonly<MobileWeeklyScrollerProps>) {
  const t = useTranslations("dashboard.studentHistory.calendar");

  const days = [
    { day: "mon", date: 14, hasClass: true, status: "present" },
    { day: "tue", date: 15, hasClass: true, status: "active" }, // Currently selected
    { day: "wed", date: 16, hasClass: true, status: "present" },
    { day: "thu", date: 17, hasClass: true, status: "present" },
    { day: "fri", date: 18, hasClass: true, status: "absent" },
    { day: "sat", date: 19, hasClass: false, status: "none" },
  ];

  return (
    <Box
      sx={theme => ({
        backgroundColor: theme.palette.surfaceContainerLowest,
        borderRadius: "xl",
        boxShadow: theme.palette.shadow.card,
        border: `1px solid ${theme.palette.border.light}`,
        p: 2,
        mb: 3,
      })}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="titleLg" sx={theme => ({ color: theme.palette.onSurface })}>
          {t("weeklyAttendance")}
        </Typography>
        <Typography variant="labelMd" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 700 })}>
          {t("week", { number: selectedWeek })}
        </Typography>
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          overflowX: "auto",
          gap: 1,
          msOverflowStyle: "none",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {days.map(d => {
          const isSelected = d.date === 15; // Hardcoded for this mockup

          return (
            <Box
              key={d.day}
              sx={theme => ({
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                minWidth: 48,
                py: 1.5,
                borderRadius: "xl",
                backgroundColor: isSelected ? theme.palette.primaryContainer : "transparent",
                color: isSelected ? theme.palette.onPrimaryContainer : "inherit",
                boxShadow: isSelected ? theme.palette.shadow.cardHover : "none",
                ...(isSelected && { outline: `1px solid ${theme.palette.primary.main}33` }),
                "&:hover": {
                  backgroundColor: isSelected ? theme.palette.primaryContainer : theme.palette.surfaceContainerLow,
                },
                opacity: d.hasClass ? 1 : 0.4,
                cursor: "pointer",
              })}
              onClick={() => {
                onSelectWeek(selectedWeek);
              }}
            >
              <Typography
                variant="labelMd"
                sx={theme => ({ color: isSelected ? "inherit" : theme.palette.onSurfaceVariant, mb: 0.5 })}
              >
                {t(`days.${d.day}`)}
              </Typography>
              <Typography variant="titleLg">{d.date}</Typography>
              {d.hasClass && (
                <Box
                  sx={theme => {
                    let dotColor = theme.palette.primary.main;
                    if (isSelected) dotColor = theme.palette.onPrimaryContainer;
                    else if (d.status === "absent") dotColor = theme.palette.error.main;

                    return {
                      width: 6,
                      height: 6,
                      borderRadius: "full",
                      backgroundColor: dotColor,
                      mt: 0.5,
                    };
                  }}
                />
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
