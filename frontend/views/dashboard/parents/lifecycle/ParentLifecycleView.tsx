"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PersonOutlined } from "@mui/icons-material";
import { Box, Button, Grid, MenuItem, Select, Stack, TextField, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Controller, FormProvider, useForm, useFormContext } from "react-hook-form";
import { AdminControlPanel, PageContainer, PageHeader, PrimaryPageAction, StatusBadge } from "@/frontend/components/ui";
import { ParentStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { profileHrefForParent } from "@/frontend/common/utils/profileHref";
import {
  type LifecycleUpdateFormData,
  lifecycleUpdateSchema,
} from "@/frontend/views/dashboard/parents/lifecycle/schemas/lifecycleUpdateSchema";
import type { ParentLifecycleViewProps } from "@/frontend/views/dashboard/parents/lifecycle/types";
import { Link } from "@/shared/i18n/routing";

function PolicyOverviewCard() {
  const t = useTranslations("dashboard.parentLifecycle");

  return (
    <Box
      sx={theme => ({
        backgroundColor: theme.palette.background.paper,
        borderRadius: "xl",
        boxShadow: theme.palette.shadow.card,
        p: { xs: 3, md: 4 },
        border: `1px solid ${theme.palette.border.main}`,
      })}
    >
      <Typography variant="titleLg" sx={{ fontWeight: 700, mb: 2 }}>
        {t("sections.policyOverview")}
      </Typography>
      <Stack spacing={2}>
        <Box>
          <Typography variant="bodyLg" sx={{ fontWeight: 700 }}>
            {t("policies.lifecycleTitle")}
          </Typography>
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
            {t("policies.lifecycleDesc")}
          </Typography>
        </Box>
        <Box>
          <Typography variant="bodyLg" sx={{ fontWeight: 700 }}>
            {t("policies.accountTitle")}
          </Typography>
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
            {t("policies.accountDesc")}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

function LifecycleControls({ isUpdating }: Readonly<{ isUpdating: boolean }>) {
  const t = useTranslations("dashboard.parentLifecycle");
  const { control, register } = useFormContext<LifecycleUpdateFormData>();

  return (
    <AdminControlPanel title={t("sections.adminControls")}>
      <Stack spacing={3}>
        <Box>
          <Typography
            variant="labelMd"
            sx={theme => ({ color: theme.palette.text.secondary, mb: 1, display: "block" })}
          >
            {t("fields.lifecycleStatus")}
          </Typography>
          <Controller
            name="lifecycleStatus"
            control={control}
            render={({ field }) => (
              <Select {...field} fullWidth size="small">
                <MenuItem value={ParentStatus.Regular}>{t("statusOptions.REGULAR")}</MenuItem>
                <MenuItem value={ParentStatus.OnTrial}>{t("statusOptions.ON_TRIAL")}</MenuItem>
                <MenuItem value={ParentStatus.OnLeave}>{t("statusOptions.ON_LEAVE")}</MenuItem>
                <MenuItem value={ParentStatus.Suspended}>{t("statusOptions.SUSPENDED")}</MenuItem>
              </Select>
            )}
          />
        </Box>

        <TextField
          {...register("reason")}
          label={t("fields.reason")}
          placeholder={t("fields.reasonPlaceholder")}
          multiline
          rows={3}
          fullWidth
          size="small"
        />

        <PrimaryPageAction type="submit" disabled={isUpdating}>
          {t("actions.applyChange")}
        </PrimaryPageAction>
      </Stack>
    </AdminControlPanel>
  );
}

export function ParentLifecycleView({ parent, isUpdating, onUpdateLifecycle }: Readonly<ParentLifecycleViewProps>) {
  const t = useTranslations("dashboard.parentLifecycle");
  const tp = useTranslations("profile.parent");

  const methods = useForm<LifecycleUpdateFormData>({
    resolver: zodResolver(lifecycleUpdateSchema),
    defaultValues: {
      lifecycleStatus: ParentStatus.Regular,
      reason: "",
    },
  });

  useEffect(() => {
    methods.reset({
      lifecycleStatus: parent.lifecycleStatus,
      reason: "",
    });
  }, [parent, methods]);

  const lifecycleKey = parent.lifecycleStatus.toLowerCase();
  const accountKey = parent.accountStatus.toLowerCase();

  const handleSubmit = async (data: LifecycleUpdateFormData) => {
    await onUpdateLifecycle(data.lifecycleStatus, data.reason ?? "");
    methods.reset({ lifecycleStatus: data.lifecycleStatus, reason: "" });
  };

  const profileHref = profileHrefForParent({ userId: parent.userId, parentId: parent.id });

  return (
    <PageContainer>
      <PageHeader
        title={t("pageTitle")}
        subtitle={t("parentId", { id: parent.id })}
        breadcrumbs={[
          { label: t("breadcrumbs.parents"), href: "/parents" },
          { label: t("breadcrumbs.lifecycle"), current: true },
        ]}
        actions={
          profileHref ? (
            <Button component={Link} href={profileHref} variant="outlined">
              {t("actions.viewProfile")}
            </Button>
          ) : undefined
        }
      />

      <Box
        sx={theme => ({
          backgroundColor: theme.palette.background.paper,
          borderRadius: "xl",
          boxShadow: theme.palette.shadow.card,
          p: { xs: 3, md: 4 },
          border: `1px solid ${theme.palette.border.main}`,
          mb: 3,
        })}
      >
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          <PersonOutlined sx={theme => ({ color: theme.palette.primary.main, fontSize: 40 })} />
          <Box>
            <Typography variant="titleLg" sx={{ fontWeight: 700 }}>
              {parent.name}
            </Typography>
            <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
              {parent.email}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
              <StatusBadge category="studentAccount" status={lifecycleKey} label={tp(`status.${lifecycleKey}`)} />
              <StatusBadge
                category="staffAccount"
                status={accountKey}
                label={tp(`accountStatus.${accountKey as "activated" | "deactivated"}`)}
              />
            </Stack>
          </Box>
        </Stack>
      </Box>

      <Grid container spacing="gutter">
        <Grid size={{ xs: 12, lg: 4 }}>
          <Box
            component="form"
            onSubmit={e => {
              methods.handleSubmit(handleSubmit)(e);
            }}
            sx={{ display: "flex", flexDirection: "column", gap: "gutter" }}
          >
            <FormProvider {...methods}>
              <LifecycleControls isUpdating={isUpdating} />
            </FormProvider>
            <PolicyOverviewCard />
          </Box>
        </Grid>
      </Grid>
    </PageContainer>
  );
}
