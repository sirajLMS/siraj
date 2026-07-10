"use client";

import { AccountCircleOutlined, SettingsSuggestOutlined } from "@mui/icons-material";
import { Box, Switch, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { Controller, useFormContext } from "react-hook-form";
import { StatusBadge } from "@/frontend/components/ui/badge/StatusBadge";
import { BaseCard } from "@/frontend/components/ui/card/BaseCard";
import { SectionHeader } from "@/frontend/views/dashboard/teachers/profile/components/SectionHeader";
import type { TeacherProfileFormData } from "@/frontend/views/dashboard/teachers/profile/schemas/teacherProfileSchema";

export function SystemConfigSection() {
  const t = useTranslations("dashboard.teacherProfile");
  const { control } = useFormContext<TeacherProfileFormData>();

  return (
    <Box component="section">
      <SectionHeader title={t("sections.systemConfig")} icon={SettingsSuggestOutlined} />
      <BaseCard
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <AccountCircleOutlined sx={theme => ({ color: theme.palette.primary.main })} />
          <Box>
            <Typography
              variant="bodyMd"
              sx={theme => ({
                color: theme.palette.primary.main,
              })}
            >
              {t("fields.accountStatus")}
            </Typography>
            <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
              {t("fields.accountStatusDesc")}
            </Typography>
          </Box>
        </Box>
        <Controller
          name="accountStatus"
          control={control}
          render={({ field }) => (
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Switch {...field} checked={field.value} />
              <StatusBadge
                category="staffAccount"
                status={field.value ? "activated" : "deactivated"}
                label={field.value ? t("fields.active") : t("fields.inactive")}
              />
            </Box>
          )}
        />
      </BaseCard>
    </Box>
  );
}
