// cspell:disable
"use client";

import { HistoryOutlined, MailOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { useNotifications } from "@toolpad/core/useNotifications";
import { studentProfileTabHref } from "@/frontend/common/utils/profileHref";
import type {
  BentoCardProps,
  ReassignmentBentoGridProps,
} from "@/frontend/common/views/dashboard/teachers/reassignment/types";
import { MobileUserAvatar } from "@/frontend/mobile/components/ui/avatar";
import { MobileBaseCard } from "@/frontend/mobile/components/ui/card";
import { useRouter } from "@/shared/i18n/routing";
import { useAppTranslation } from "@/shared/locale";

function BentoCard({ icon: Icon, title, subtitle, onClick }: Readonly<BentoCardProps>) {
  return (
    <MobileBaseCard
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
      <MobileUserAvatar
        size={40}
        sx={theme => ({
          border: `2px solid ${theme.palette.primary.main}`,
          color: theme.palette.primary.main,
          backgroundColor: theme.palette.background.paper,
        })}
      >
        <Icon />
      </MobileUserAvatar>
      <Box>
        <Typography variant="labelSm" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        <Typography variant="labelSm" sx={theme => ({ color: theme.palette.onSurfaceVariant, fontSize: "10px" })}>
          {subtitle}
        </Typography>
      </Box>
    </MobileBaseCard>
  );
}

export function ReassignmentBentoGridMobile({
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
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <BentoCard
        icon={HistoryOutlined}
        title={t.changeHistory}
        subtitle={t.lastUpdated(formattedDate)}
        onClick={() => router.push(studentProfileTabHref(studentId, "history"))}
      />
      <BentoCard
        icon={MailOutlined}
        title={t.parentContact}
        subtitle={t.pendingNotifications(pendingNotificationCount)}
        onClick={() => notifications.show(t.parentContact, { severity: "info", autoHideDuration: 4000 })}
      />
    </Box>
  );
}
