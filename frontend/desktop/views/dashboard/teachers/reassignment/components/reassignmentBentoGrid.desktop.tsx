// cspell:disable
"use client";

import { HistoryOutlined, MailOutlined } from "@mui/icons-material";
import { Box, Grid, Typography } from "@mui/material";
import { BaseCard } from "@/frontend/common/components/ui";
import type {
  BentoCardProps,
  ReassignmentBentoGridProps,
} from "@/frontend/common/views/dashboard/teachers/reassignment/types";
import { DesktopUserAvatar } from "@/frontend/desktop/components/ui/avatar/DesktopUserAvatar";
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
      <DesktopUserAvatar
        size={48}
        sx={theme => ({
          border: `2px solid ${theme.palette.primary.main}`,
          color: theme.palette.primary.main,
          backgroundColor: theme.palette.background.paper,
        })}
      >
        <Icon />
      </DesktopUserAvatar>
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

export function ReassignmentBentoGridDesktop({
  studentId: _studentId,
  lastUpdated,
  pendingNotificationCount,
  onOpenChangeHistory,
  onOpenParentContact,
}: Readonly<ReassignmentBentoGridProps>) {
  const t = useAppTranslation().dashboardTranslations.teacherReassignment.historyAndContact;

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
          onClick={onOpenChangeHistory}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <BentoCard
          icon={MailOutlined}
          title={t.parentContact}
          subtitle={t.pendingNotifications(pendingNotificationCount)}
          onClick={onOpenParentContact}
        />
      </Grid>
    </Grid>
  );
}
