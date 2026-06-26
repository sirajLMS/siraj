import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/routing";
import type { ClassSession } from "../types";

interface ClassSessionListProps {
  dateStr: string;
  sessions: ClassSession[];
}

export function ClassSessionList({ dateStr, sessions }: Readonly<ClassSessionListProps>) {
  const t = useTranslations("dashboard.studentHistory.classDetails");
  const formatDuration = (mins: number) => {
    if (mins < 60) return `${mins}m`;
    const hrs = mins / 60;
    return `${hrs % 1 === 0 ? hrs : hrs.toFixed(1)}h`;
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 0.5 }}>
        <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main })}>
          {t("title")}
        </Typography>
        <Typography
          variant="labelMd"
          sx={theme => ({
            color: theme.palette.text.secondary,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          })}
        >
          {dateStr}
        </Typography>
      </Box>

      {sessions.map(session => {
        return (
          <Box
            key={session.id}
            component={Link}
            href={`/classes/${session.id}`}
            sx={theme => ({
              backgroundColor: theme.palette.surfaceContainerLowest,
              borderRadius: "xl",
              boxShadow: theme.palette.shadow.card,
              border: `1px solid ${theme.palette.border.light}`,
              p: theme.spacing(2),
              display: "flex",
              alignItems: "center",
              gap: 2,
              transition: "transform 0.2s",
              textDecoration: "none",
              color: "inherit",
              "&:hover": { transform: "translateX(4px)" },
              cursor: "pointer",
            })}
          >
            <Box
              sx={theme => ({
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                p: 1,
                borderRadius: "lg",
                width: 64,
                height: 64,
                flexShrink: 0,
              })}
            >
              <Typography variant="labelMd" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 700 })}>
                {session.time.split(" ")[0]}
              </Typography>
              <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary })}>
                {session.time.split(" ")[1]}
              </Typography>
            </Box>

            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="bodyLg" sx={theme => ({ fontWeight: 700, color: theme.palette.onSurface })}>
                {session.title}
              </Typography>
              <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
                {session.notes}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.5 }}>
              <Box
                sx={theme => {
                  let colors = {
                    backgroundColor: theme.palette.secondaryContainer,
                    color: theme.palette.onSecondaryContainer,
                  };

                  if (session.status === "present") {
                    colors = {
                      backgroundColor: theme.palette.status.activeContainer,
                      color: theme.palette.status.onActiveContainer,
                    };
                  } else if (session.status === "absent") {
                    colors = {
                      backgroundColor: theme.palette.errorContainer,
                      color: theme.palette.onErrorContainer,
                    };
                  }

                  return {
                    ...colors,
                    px: 1,
                    py: 0.25,
                    borderRadius: 1,
                    fontSize: "10px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  };
                }}
              >
                {t(`status.${session.status}`)}
              </Box>
              <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary })}>
                {formatDuration(session.duration)}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
