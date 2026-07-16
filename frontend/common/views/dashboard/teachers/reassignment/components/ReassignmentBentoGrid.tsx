"use client";

import { HistoryOutlined, MailOutlined } from "@mui/icons-material";
import { Box, Grid, Typography } from "@mui/material";
import { useNotifications } from "@toolpad/core/useNotifications";
import { BaseCard, UserAvatar } from "@/frontend/common/components/ui";
import { studentProfileTabHref } from "@/frontend/common/utils/profileHref";
import type {
  BentoCardProps,
  ReassignmentBentoGridProps,
} from "@/frontend/common/views/dashboard/teachers/reassignment/types";
import { useRouter } from "@/shared/i18n/routing";
import { useAppTranslation } from "@/shared/locale";

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
  const t = useAppTranslation().dashboardTranslations.teacherReassignment.historyAndContact;
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
          title={t.changeHistory}
          subtitle={t.lastUpdated(formattedDate)}
          onClick={() => router.push(studentProfileTabHref(studentId, "history"))}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <BentoCard
          icon={MailOutlined}
          title={t.parentContact}
          subtitle={t.pendingNotifications(pendingNotificationCount)}
          onClick={() => notifications.show(t.parentContact, { severity: "info", autoHideDuration: 4000 })}
        />
      </Grid>
    </Grid>
  );
}
