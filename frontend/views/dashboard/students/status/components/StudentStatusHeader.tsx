import { Fingerprint, HistoryOutlined, MailOutlineOutlined } from "@mui/icons-material";
import { Avatar, Box, Button, Typography, useMediaQuery, useTheme } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { StatusBadge } from "@/frontend/components/ui/badge/StatusBadge";
import { StudentStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import { useRouter } from "@/shared/i18n/routing";
import type { StudentStatusHeaderProps } from "../types";

const STATUS_DOT_COLOR_MAP: Record<string, string> = {
  [StudentStatus.Regular]: "success",
  [StudentStatus.Suspended]: "error",
  [StudentStatus.OnLeave]: "warning",
  [StudentStatus.OnTrial]: "info",
  [StudentStatus.Deactivated]: "grey",
};

function getStatusDotColor(student: StudentStatusHeaderProps["student"], theme: Theme) {
  const key = STATUS_DOT_COLOR_MAP[student.status] ?? "warning";
  if (key === "success") return theme.palette.success.main;
  if (key === "error") return theme.palette.error.main;
  if (key === "warning") return theme.palette.warning.main;
  if (key === "info") return theme.palette.info.main;
  if (key === "grey") return theme.palette.outline;
  return theme.palette.onSurfaceVariant;
}

const STATUS_BADGE_MAP: Record<string, string> = {
  [StudentStatus.Regular]: "regular",
  [StudentStatus.Suspended]: "suspended",
  [StudentStatus.OnLeave]: "on_leave",
  [StudentStatus.OnTrial]: "on_trial",
  [StudentStatus.Deactivated]: "deactivated",
};

function getBadgeStatusKey(status: StudentStatus): string {
  return STATUS_BADGE_MAP[status] ?? "regular";
}

function StudentAvatar({
  student,
  isMobile,
}: Readonly<{ student: StudentStatusHeaderProps["student"]; isMobile: boolean }>) {
  const theme = useTheme();
  return (
    <Box sx={{ position: "relative" }}>
      <Avatar
        src={student.avatarUrl ?? undefined}
        alt={student.name}
        sx={{
          width: 96,
          height: 96,
          border: `4px solid ${theme.palette.background.paper}`,
          boxShadow: theme.palette.shadow.card,
        }}
      />
      {isMobile && (
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: 24,
            height: 24,
            borderRadius: "full",
            border: `4px solid ${theme.palette.background.paper}`,
            backgroundColor: getStatusDotColor(student, theme),
          }}
        />
      )}
    </Box>
  );
}

function StudentInfo({ student }: Readonly<{ student: StudentStatusHeaderProps["student"] }>) {
  const t = useTranslations("dashboard.studentStatus");

  return (
    <Box>
      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: "center", gap: 1.5 }}>
        <Typography variant="headlineMd" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 700 })}>
          {student.name}
        </Typography>
        <StatusBadge
          category="studentAccount"
          status={getBadgeStatusKey(student.status)}
          label={t(`statusOptions.${student.status}`)}
        />
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 1 }}>
        <Box
          sx={theme => ({
            display: "flex",
            alignItems: "center",
            justifyContent: { xs: "center", md: "flex-start" },
            gap: 1,
            color: theme.palette.onSurfaceVariant,
          })}
        >
          <Fingerprint sx={{ fontSize: 16 }} />
          <Typography variant="labelMd" sx={{ letterSpacing: "0.05em" }}>
            {t("studentId", { id: student.id.replace("STU-", "") })}
          </Typography>
        </Box>
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
          {student.teacherName}
        </Typography>
      </Box>
    </Box>
  );
}

function HeaderActions({
  student,
  isMobile,
}: Readonly<{ student: StudentStatusHeaderProps["student"]; isMobile: boolean }>) {
  const t = useTranslations("dashboard.studentStatus");
  const router = useRouter();

  const handleViewHistory = useCallback(() => {
    router.push(`/students/${student.id}/history`);
  }, [router, student.id]);

  const handleContactParent = useCallback(() => {
    router.push(`/students/${student.id}/quota`);
  }, [router, student.id]);

  return (
    <Box sx={{ display: "flex", gap: 1.5, width: { xs: "100%", md: "auto" } }}>
      <Button
        fullWidth={isMobile}
        variant="outlined"
        startIcon={<HistoryOutlined />}
        onClick={handleViewHistory}
        sx={theme => ({
          borderRadius: "button",
          color: theme.palette.secondary.main,
          borderColor: theme.palette.border.main,
          "&:hover": {
            borderColor: theme.palette.secondary.main,
            backgroundColor: theme.palette.surfaceContainerHigh,
          },
        })}
      >
        {t("actions.viewHistory")}
      </Button>
      <Button
        fullWidth={isMobile}
        variant="outlined"
        startIcon={<MailOutlineOutlined />}
        onClick={handleContactParent}
        sx={theme => ({
          borderRadius: "button",
          color: theme.palette.secondary.main,
          borderColor: theme.palette.border.main,
          "&:hover": {
            borderColor: theme.palette.secondary.main,
            backgroundColor: theme.palette.surfaceContainerHigh,
          },
        })}
      >
        {t("actions.contactParent")}
      </Button>
    </Box>
  );
}

export function StudentStatusHeader({ student }: Readonly<StudentStatusHeaderProps>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Box
      sx={theme => ({
        backgroundColor: theme.palette.background.paper,
        borderRadius: "xl",
        boxShadow: theme.palette.shadow.card,
        p: { xs: 3, md: "cardPadding" },
        mb: { xs: 3, md: 4 },
        border: `1px solid ${theme.palette.border.main}`,
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        alignItems: { xs: "center", md: "center" },
        justifyContent: "space-between",
        textAlign: { xs: "center", md: "left" },
        gap: 3,
      })}
    >
      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: "center", gap: 3 }}>
        <StudentAvatar student={student} isMobile={isMobile} />
        <StudentInfo student={student} />
      </Box>
      <HeaderActions student={student} isMobile={isMobile} />
    </Box>
  );
}
