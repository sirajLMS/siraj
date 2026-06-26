import { Fingerprint, HistoryOutlined, MailOutlineOutlined } from "@mui/icons-material";
import { Avatar, Box, Button, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useTranslations } from "next-intl";
import { StatusBadge } from "@/frontend/components/ui/StatusBadge";
import type { StudentStatusInfo } from "../types";

interface StudentStatusHeaderProps {
  readonly student: StudentStatusInfo;
}

function StudentAvatar({ student, isMobile }: Readonly<{ student: StudentStatusInfo; isMobile: boolean }>) {
  return (
    <Box sx={{ position: "relative" }}>
      <Avatar
        src={student.profileImage}
        alt={student.name}
        sx={theme => ({
          width: 96,
          height: 96,
          border: `4px solid ${theme.palette.background.paper}`,
          boxShadow: theme.palette.shadow.card,
        })}
      />
      {isMobile && (
        <Box
          sx={theme => {
            let statusColor = theme.palette.warning.main;
            if (student.status === "regular") statusColor = theme.palette.success.main;
            else if (student.status === "suspended") statusColor = theme.palette.error.main;

            return {
              position: "absolute",
              bottom: 0,
              right: 0,
              width: 24,
              height: 24,
              borderRadius: "full",
              border: `4px solid ${theme.palette.background.paper}`,
              backgroundColor: statusColor,
            };
          }}
        />
      )}
    </Box>
  );
}

function StudentInfo({ student }: Readonly<{ student: StudentStatusInfo }>) {
  const t = useTranslations("dashboard.studentStatus");

  return (
    <Box>
      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: "center", gap: 1.5 }}>
        <Typography variant="headlineMd" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 700 })}>
          {student.name}
        </Typography>
        <StatusBadge
          category="studentAccount"
          status={student.status}
          label={t(`statusOptions.${student.status}`).split(" (")[0]}
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
          {student.grade}
        </Typography>
      </Box>
    </Box>
  );
}

function HeaderActions({ isMobile }: Readonly<{ isMobile: boolean }>) {
  const t = useTranslations("dashboard.studentStatus");

  return (
    <Box sx={{ display: "flex", gap: 1.5, width: { xs: "100%", md: "auto" } }}>
      <Button
        fullWidth={isMobile}
        variant="outlined"
        startIcon={<HistoryOutlined />}
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
      <HeaderActions isMobile={isMobile} />
    </Box>
  );
}
