"use client";

import { AccountCircleOutlined, InfoOutlined, SettingsSuggestOutlined } from "@mui/icons-material";
import { Box, Switch, TextField, Tooltip, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { Controller, useFormContext } from "react-hook-form";
import { StatusBadge } from "@/frontend/components/ui/badge/StatusBadge";
import { BaseCard } from "@/frontend/components/ui/card/BaseCard";
import { labelSx } from "@/frontend/components/ui/form";
import { SectionHeader } from "@/frontend/views/dashboard/teachers/profile/components/SectionHeader";
import type { TeacherProfileFormData } from "@/frontend/views/dashboard/teachers/profile/schemas/teacherProfileSchema";

export function SystemConfigSection() {
  const t = useTranslations("dashboard.teacherProfile");
  const { control } = useFormContext<TeacherProfileFormData>();

  return (
    <Box component="section">
      <SectionHeader title={t("sections.systemConfig")} icon={SettingsSuggestOutlined} />
      <Box
        sx={theme => ({
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: theme.layout.sectionGap,
        })}
      >
        <Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography sx={labelSx}>{t("fields.zoomLink")}</Typography>
            <Tooltip title={t("fields.zoomLinkTooltip")}>
              <InfoOutlined
                sx={theme => ({
                  fontSize: 16,
                  color: theme.palette.outline,
                  cursor: "help",
                  mb: 0.5,
                })}
              />
            </Tooltip>
          </Box>
          <Controller
            name="zoomLink"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                slotProps={{
                  input: {
                    sx: [theme => ({ borderRadius: theme.layout.radius.card })],
                  },
                }}
              />
            )}
          />
        </Box>

        <BaseCard
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "100%",
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
    </Box>
  );
}
