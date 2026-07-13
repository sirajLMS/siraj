import { CalendarTodayOutlined, PersonOutlined } from "@mui/icons-material";
import { Box, Button, Typography } from "@mui/material";
import { useLocale, useTranslations } from "next-intl";
import { useCallback } from "react";
import { PersonProfileLink } from "@/frontend/common/components/ui";
import { StatusBadge } from "@/frontend/common/components/ui/badge/StatusBadge";
import { MeetingJoinAction } from "@/frontend/common/components/ui/display/meetingConfig/MeetingJoinAction";
import { profileHrefForTeacher, studentProfileTabHref } from "@/frontend/common/utils/profileHref";
import type {
  UpcomingClassDisplay,
  UpcomingClassesTableProps,
} from "@/frontend/common/views/dashboard/students/status/types";
import { useRouter } from "@/shared/i18n/routing";
import { getLatnLocaleTag } from "@/shared/lib/locale-tag";
import { isJoinableClassInstance } from "@/shared/lib/meeting/isJoinableByExecutionState";

function formatDateTime(locale: string, dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString(getLatnLocaleTag(locale), { weekday: "short", month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

function formatTime(locale: string, dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleTimeString(getLatnLocaleTag(locale), { hour: "2-digit", minute: "2-digit" });
  } catch {
    return dateStr;
  }
}

export function UpcomingClassesTableMobile({ classes, studentId }: Readonly<UpcomingClassesTableProps>) {
  const t = useTranslations("dashboard.studentStatus");
  const locale = useLocale();
  const router = useRouter();

  const handleViewAll = useCallback(() => {
    router.push(studentProfileTabHref(studentId, "history"));
  }, [router, studentId]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 700 })}>
          {t("sections.upcomingClassesMobile")}
        </Typography>
        <Button
          onClick={handleViewAll}
          sx={theme => ({
            color: theme.palette.primary.main,
            fontWeight: 700,
            typography: "labelMd",
          })}
        >
          {t("actions.viewAll")}
        </Button>
      </Box>
      {classes.length === 0 ? (
        <Typography
          variant="bodyMd"
          sx={theme => ({ color: theme.palette.onSurfaceVariant, textAlign: "center", py: 4 })}
        >
          {t("table.noUpcomingClasses")}
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {classes.map((cls: UpcomingClassDisplay) => (
            <Box
              key={cls.id}
              sx={theme => ({
                backgroundColor: theme.palette.background.paper,
                borderRadius: "xl",
                p: 2.5,
                boxShadow: theme.palette.shadow.card,
                borderLeft: `4px solid ${cls.isFrozen ? theme.palette.error.main : theme.palette.primary.main}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                opacity: cls.isFrozen ? 0.7 : 1,
              })}
            >
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Typography variant="bodyLg" sx={{ fontWeight: 700 }}>
                  {formatDateTime(locale, cls.scheduledStartAt)}
                </Typography>
                <Box
                  sx={theme => ({
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    color: theme.palette.onSurfaceVariant,
                  })}
                >
                  <PersonOutlined sx={{ fontSize: 18 }} />
                  <PersonProfileLink
                    href={profileHrefForTeacher({ teacherId: cls.teacherId })}
                    name={cls.instructor}
                    showAvatar={false}
                    typographyVariant="bodyMd"
                    fontWeight={400}
                  />
                </Box>
                <Box
                  sx={theme => ({
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    color: theme.palette.onSurfaceVariant,
                  })}
                >
                  <CalendarTodayOutlined sx={{ fontSize: 18 }} />
                  <Typography variant="bodyMd">
                    {formatTime(locale, cls.scheduledStartAt)} - {formatTime(locale, cls.scheduledEndAt)}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
                <StatusBadge
                  category="classInstance"
                  status={cls.executionState}
                  label={cls.isFrozen ? t("table.frozen").toUpperCase() : cls.executionState}
                />
                {isJoinableClassInstance(cls.executionState, cls.outcome, { isFrozen: cls.isFrozen }) ? (
                  <MeetingJoinAction
                    variant="icon"
                    joinUrl={cls.meetingJoinUrl}
                    meeting={cls.effectiveMeeting}
                    emptyRole="parent"
                    label={t("table.joinSession")}
                  />
                ) : null}
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
