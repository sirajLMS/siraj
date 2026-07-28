// cspell:disable
"use client";

import { HistoryOutlined, MailOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { BaseCard } from "@/frontend/common/components/ui";
import type {
  BentoCardProps,
  ReassignmentBentoGridProps,
} from "@/frontend/common/views/dashboard/teachers/reassignment/types";
import { DesktopUserAvatar } from "@/frontend/desktop/components/ui/avatar";

function BentoCard({ icon: Icon, title, subtitle, onClick }: Readonly<BentoCardProps>) {
  return (
    <BaseCard
      onClick={onClick}
      sx={theme => ({
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        cursor: onClick ? "pointer" : "default",
        "&:hover": onClick ? { boxShadow: theme.palette.shadow.card } : undefined,
        transition: "box-shadow 0.2s",
      })}
    >
      <DesktopUserAvatar
        size={40}
        sx={theme => ({
          border: `2px solid ${theme.palette.primary.main}`,
          color: theme.palette.primary.main,
          backgroundColor: theme.palette.background.paper,
        })}
      >
        <Icon />
      </DesktopUserAvatar>
      <Box>
        <Typography variant="labelSm" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        <Typography variant="labelSm" sx={theme => ({ color: theme.palette.onSurfaceVariant, fontSize: "10px" })}>
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
  labels,
}: Readonly<ReassignmentBentoGridProps>) {
  const formattedDate = lastUpdated
    ? new Date(lastUpdated).toLocaleDateString("en-US", { month: "short", year: "2-digit" })
    : "N/A";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <BentoCard
        icon={HistoryOutlined}
        title={labels.changeHistory}
        subtitle={labels.lastUpdated(formattedDate)}
        onClick={onOpenChangeHistory}
      />
      <BentoCard
        icon={MailOutlined}
        title={labels.parentContact}
        subtitle={labels.pendingNotifications(pendingNotificationCount)}
        onClick={onOpenParentContact}
      />
    </Box>
  );
}
