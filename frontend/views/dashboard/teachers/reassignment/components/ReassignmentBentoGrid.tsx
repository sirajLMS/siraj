"use client";

import type { SvgIconComponent } from "@mui/icons-material";
import { HistoryOutlined, MailOutlined } from "@mui/icons-material";
import { Avatar, Box, Grid, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { BaseCard } from "@/frontend/components/ui";

interface BentoCardProps {
  readonly icon: SvgIconComponent;
  readonly title: string;
  readonly subtitle: string;
}

function BentoCard({ icon: Icon, title, subtitle }: Readonly<BentoCardProps>) {
  return (
    <BaseCard
      sx={theme => ({
        display: "flex",
        alignItems: "center",
        gap: 2,
        cursor: "pointer",
        "&:hover": { boxShadow: theme.palette.shadow.card },
        transition: "box-shadow 0.2s",
      })}
    >
      <Avatar
        sx={theme => ({
          backgroundColor: "transparent",
          border: `2px solid ${theme.palette.primary.main}`,
          color: theme.palette.primary.main,
          width: 48,
          height: 48,
        })}
      >
        <Icon />
      </Avatar>
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

export function ReassignmentBentoGrid() {
  const t = useTranslations("dashboard.teacherReassignment.historyAndContact");

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 6 }}>
        <BentoCard icon={HistoryOutlined} title={t("changeHistory")} subtitle={t("lastUpdated", { date: "Oct 24" })} />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <BentoCard icon={MailOutlined} title={t("parentContact")} subtitle={t("pendingNotifications", { count: 2 })} />
      </Grid>
    </Grid>
  );
}
