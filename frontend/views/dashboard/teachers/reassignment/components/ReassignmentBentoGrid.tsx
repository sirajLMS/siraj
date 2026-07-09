"use client";

import { HistoryOutlined, MailOutlined } from "@mui/icons-material";
import { Box, Grid, Typography } from "@mui/material";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useTranslations } from "next-intl";
import { BaseCard, UserAvatar } from "@/frontend/components/ui";
import type {
  BentoCardProps,
  ReassignmentBentoGridProps,
} from "@/frontend/views/dashboard/teachers/reassignment/types";
import { useRouter } from "@/shared/i18n/routing";

function BentoCard({ icon: Icon, title, subtitle, onClick }: Readonly<BentoCardProps>) {
  return (
    <BaseCard
      onClick={onClick}
      sx={theme => ({
        display: "flex",
        alignItems: "center",
        gap: 2,
        cursor: onClick ? "pointer" : "default",
        "&:hover": onClick ? { boxShadow: theme.palette.shadow.card } : undefined,
        transition: "box-shadow 0.2s",
      })}
    >
      <UserAvatar
        size={48}
        sx={theme => ({
          border: `2px solid ${theme.palette.primary.main}`,
          color: theme.palette.primary.main,
          backgroundColor: theme.palette.background.paper,
        })}
      >
        <Icon />
      </UserAvatar>
      <Box>
        <Typography variant="bodyMd" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        <Typography variant="labelSm" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
          {subtitle}
        </Typography>
      </Box>
    </BaseCard>
  );
}

export function ReassignmentBentoGrid({
  studentId,
  lastUpdated,
  pendingNotificationCount,
}: Readonly<ReassignmentBentoGridProps>) {
  const t = useTranslations("dashboard.teacherReassignment.historyAndContact");
  const router = useRouter();
  const notifications = useNotifications();

  const formattedDate = lastUpdated
    ? new Date(lastUpdated).toLocaleDateString("en-US", { month: "short", year: "2-digit" })
    : "N/A";

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 6 }}>
        <BentoCard
          icon={HistoryOutlined}
          title={t("changeHistory")}
          subtitle={t("lastUpdated", { date: formattedDate })}
          onClick={() => router.push(`/students/${studentId}/history`)}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <BentoCard
          icon={MailOutlined}
          title={t("parentContact")}
          subtitle={t("pendingNotifications", { count: pendingNotificationCount })}
          onClick={() => notifications.show(t("parentContact"), { severity: "info", autoHideDuration: 4000 })}
        />
      </Grid>
    </Grid>
  );
}
