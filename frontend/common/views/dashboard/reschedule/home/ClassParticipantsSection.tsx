"use client";

import { PersonOutlined, SchoolOutlined } from "@mui/icons-material";
import { Box, Grid, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import type { RescheduleSession } from "@/frontend/common/views/dashboard/reschedule/home/types";

interface Props {
  readonly session: RescheduleSession;
}

function ParticipantField({
  label,
  value,
  icon: Icon,
}: Readonly<{
  label: string;
  value: string;
  icon: typeof SchoolOutlined;
}>) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
      <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary, textTransform: "uppercase" })}>
        {label}
      </Typography>
      <Box
        sx={theme => ({
          display: "flex",
          alignItems: "center",
          gap: 1,
          py: 1,
          borderBottom: `1px solid ${theme.palette.outlineVariant}`,
        })}
      >
        <Icon sx={theme => ({ color: theme.palette.primary.main, fontSize: 20 })} />
        <Typography variant="titleLg" sx={theme => ({ color: theme.palette.onSurface, fontWeight: 600 })}>
          {value}
        </Typography>
      </Box>
    </Box>
  );
}

export function ClassParticipantsSection({ session }: Readonly<Props>) {
  const t = useTranslations("dashboard.rescheduleForm.fields");

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 6 }}>
        <ParticipantField label={t("teacherName")} value={session.teacherName} icon={SchoolOutlined} />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <ParticipantField label={t("studentName")} value={session.studentName} icon={PersonOutlined} />
      </Grid>
    </Grid>
  );
}
