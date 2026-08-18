// cspell:disable
"use client";

import { HistoryOutlined, MailOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import type {
  BentoCardProps,
  ReassignmentBentoGridProps,
} from "@/frontend/common/views/dashboard/teachers/reassignment/types";
import type { ReassignmentBentoGridSlotProps } from "@/frontend/common/views/dashboard/teachers/reassignment/types/reassignmentComponentsShared.types";

export interface ReassignmentBentoGridSharedProps {
  readonly props: Readonly<ReassignmentBentoGridProps>;
  readonly slots: ReassignmentBentoGridSlotProps;
}

function BentoCard({
  icon: Icon,
  title,
  subtitle,
  onClick,
  CardContainer,
  UserAvatar,
}: Readonly<BentoCardProps & ReassignmentBentoGridSlotProps>) {
  return (
    <CardContainer
      onClick={onClick}
      sx={theme => ({
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        cursor: onClick ? "pointer" : "default",
        "&:hover": onClick ? { boxShadow: theme.palette.shadow.card } : undefined,
        transition: theme.transitions.create("box-shadow", { duration: 200 }),
      })}
    >
      <UserAvatar
        size={40}
        sx={theme => ({
          border: `2px solid ${theme.palette.primary.main}`,
          color: theme.palette.primary.main,
          backgroundColor: theme.palette.background.paper,
        })}
      >
        <Icon />
      </UserAvatar>
      <Box>
        <Typography variant="labelSm" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        <Typography variant="labelSm" sx={theme => ({ color: theme.palette.onSurfaceVariant, fontSize: "10px" })}>
          {subtitle}
        </Typography>
      </Box>
    </CardContainer>
  );
}

export function ReassignmentBentoGridShared({ props, slots }: Readonly<ReassignmentBentoGridSharedProps>) {
  const {
    studentId: _studentId,
    lastUpdated,
    pendingNotificationCount,
    onOpenChangeHistory,
    onOpenParentContact,
    labels,
  } = props;
  const { CardContainer, UserAvatar } = slots;

  const formattedDate = lastUpdated
    ? new Date(lastUpdated).toLocaleDateString("en-US", { month: "short", year: "2-digit" })
    : "N/A";

  const bentoCardProps = { CardContainer, UserAvatar };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <BentoCard
        icon={HistoryOutlined}
        title={labels.changeHistory}
        subtitle={labels.lastUpdated(formattedDate)}
        onClick={onOpenChangeHistory}
        {...bentoCardProps}
      />
      <BentoCard
        icon={MailOutlined}
        title={labels.parentContact}
        subtitle={labels.pendingNotifications(pendingNotificationCount)}
        onClick={onOpenParentContact}
        {...bentoCardProps}
      />
    </Box>
  );
}
