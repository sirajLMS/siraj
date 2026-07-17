"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PersonOutlined } from "@mui/icons-material";
import { Box, MenuItem, Select, Stack, TextField, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { Controller, FormProvider, useForm, useFormContext } from "react-hook-form";
import { AdminControlPanel, PrimaryPageAction, StatusBadge } from "@/frontend/common/components/ui";
import { ParentStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { profileHrefForParent } from "@/frontend/common/utils/profileHref";
import {
  type LifecycleUpdateFormData,
  lifecycleUpdateSchema,
} from "@/frontend/common/views/dashboard/parents/lifecycle/schemas/lifecycleUpdateSchema";
import type { ParentLifecycleViewProps } from "@/frontend/common/views/dashboard/parents/lifecycle/types";
import { useAppTranslation } from "@/shared/locale";

export function LifecycleParentSummaryCard({
  parent,
  size = "lg",
}: Readonly<{ parent: ParentLifecycleViewProps["parent"]; size?: "lg" | "sm" }>) {
  const tp = useAppTranslation().profileTranslations.base;
  const lifecycleKey = parent.lifecycleStatus.toLowerCase();
  const accountKey = parent.accountStatus.toLowerCase();

  return (
    <Box
      sx={theme => ({
        backgroundColor: theme.palette.background.paper,
        borderRadius: "xl",
        boxShadow: theme.palette.shadow.card,
        p: size === "lg" ? { xs: 3, md: 4 } : { xs: 2, md: 3 },
        border: `1px solid ${theme.palette.border.main}`,
        mb: 3,
      })}
    >
      <Stack sx={{ flexDirection: "row", gap: 2, alignItems: "center" }}>
        <PersonOutlined sx={theme => ({ color: theme.palette.primary.main, fontSize: size === "lg" ? 40 : 32 })} />
        <Box>
          <Typography sx={{ typography: size === "lg" ? "titleLg" : "titleMd", fontWeight: 700 }}>
            {parent.name}
          </Typography>
          <Typography
            sx={theme => ({
              typography: size === "lg" ? "bodyMd" : "bodySm",
              color: theme.palette.text.secondary,
            })}
          >
            {parent.email}
          </Typography>
          <Stack sx={{ mt: 1, flexDirection: "row", gap: 1, flexWrap: "wrap" }}>
            <StatusBadge
              category="studentAccount"
              status={lifecycleKey}
              label={
                tp.parent.status[lifecycleKey as "regular" | "on_trial" | "on_leave" | "suspended" | "deactivated"]
              }
            />
            <StatusBadge
              category="staffAccount"
              status={accountKey}
              label={tp.parent.accountStatus[accountKey as "activated" | "deactivated"]}
            />
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}

export function PolicyOverviewCard() {
  const t = useAppTranslation().dashboardTranslations.parentLifecycle;

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
        {t.sections.policyOverview}
      </Typography>
      <Stack spacing={2}>
        <Box>
          <Typography variant="bodyLg" sx={{ fontWeight: 700 }}>
            {t.policies.lifecycleTitle}
          </Typography>
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
            {t.policies.lifecycleDesc}
          </Typography>
        </Box>
        <Box>
          <Typography variant="bodyLg" sx={{ fontWeight: 700 }}>
            {t.policies.accountTitle}
          </Typography>
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
            {t.policies.accountDesc}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

export function LifecycleControls({ isUpdating }: Readonly<{ isUpdating: boolean }>) {
  const t = useAppTranslation().dashboardTranslations.parentLifecycle;
  const { control, register } = useFormContext<LifecycleUpdateFormData>();

  return (
    <AdminControlPanel title={t.sections.adminControls}>
      <Stack spacing={3}>
        <Box>
          <Typography
            variant="labelMd"
            sx={theme => ({ color: theme.palette.text.secondary, mb: 1, display: "block" })}
          >
            {t.fields.lifecycleStatus}
          </Typography>
          <Controller
            name="lifecycleStatus"
            control={control}
            render={({ field }) => (
              <Select {...field} fullWidth size="small">
                <MenuItem value={ParentStatus.Regular}>{t.statusOptions.REGULAR}</MenuItem>
                <MenuItem value={ParentStatus.OnTrial}>{t.statusOptions.ON_TRIAL}</MenuItem>
                <MenuItem value={ParentStatus.OnLeave}>{t.statusOptions.ON_LEAVE}</MenuItem>
                <MenuItem value={ParentStatus.Suspended}>{t.statusOptions.SUSPENDED}</MenuItem>
              </Select>
            )}
          />
        </Box>

        <TextField
          {...register("reason")}
          label={t.fields.reason}
          placeholder={t.fields.reasonPlaceholder}
          multiline
          rows={3}
          fullWidth
          size="small"
        />

        <PrimaryPageAction type="submit" disabled={isUpdating}>
          {t.actions.applyChange}
        </PrimaryPageAction>
      </Stack>
    </AdminControlPanel>
  );
}

export function useParentLifecycleForm(parent: ParentLifecycleViewProps["parent"]) {
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

  return methods;
}

export function LifecycleFormBody({
  parent,
  isUpdating,
  onUpdateLifecycle,
  children,
}: Readonly<ParentLifecycleViewProps & { readonly children?: ReactNode }>) {
  const methods = useParentLifecycleForm(parent);

  const handleSubmit = async (data: LifecycleUpdateFormData) => {
    await onUpdateLifecycle(data.lifecycleStatus, data.reason ?? "");
    methods.reset({ lifecycleStatus: data.lifecycleStatus, reason: "" });
  };

  return (
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
      {children}
    </Box>
  );
}

export function useParentLifecycleProfileHref(parent: ParentLifecycleViewProps["parent"]): string | undefined {
  return profileHrefForParent({ userId: parent.userId, parentId: parent.id }) || undefined;
}
