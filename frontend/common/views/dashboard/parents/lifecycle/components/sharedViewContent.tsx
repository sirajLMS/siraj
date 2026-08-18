"use client";

import { PersonOutlined } from "@mui/icons-material";
import { Box, MenuItem, Select, Stack, TextField, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { Controller, FormProvider, useFormContext } from "react-hook-form";
import { AdminControlPanel, PrimaryPageAction, StatusBadge } from "@/frontend/common/components/ui";
import { ParentStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useParentLifecycleForm } from "@/frontend/common/views/dashboard/parents/lifecycle/components/useParentLifecycleForm";
import type { LifecycleUpdateFormData } from "@/frontend/common/views/dashboard/parents/lifecycle/schemas/lifecycleUpdateSchema";
import type { ParentLifecycleViewProps } from "@/frontend/common/views/dashboard/parents/lifecycle/types";
import type { ParentLifecycleLabels } from "@/shared/locale/types/dashboard/parents";

type LifecycleStatusKey = keyof ParentLifecycleLabels["status"];
type AccountStatusKey = keyof ParentLifecycleLabels["accountStatus"];

const LIFECYCLE_STATUS_KEYS: readonly LifecycleStatusKey[] = [
  "regular",
  "on_trial",
  "on_leave",
  "suspended",
  "deactivated",
];

const ACCOUNT_STATUS_KEYS: readonly AccountStatusKey[] = ["activated", "deactivated"];

function isLifecycleStatusKey(value: string): value is LifecycleStatusKey {
  return (LIFECYCLE_STATUS_KEYS as readonly string[]).includes(value);
}

function isAccountStatusKey(value: string): value is AccountStatusKey {
  return (ACCOUNT_STATUS_KEYS as readonly string[]).includes(value);
}

export function LifecycleParentSummaryCard({
  parent,
  labels,
  size = "lg",
}: Readonly<{ parent: ParentLifecycleViewProps["parent"]; labels: ParentLifecycleLabels; size?: "lg" | "sm" }>) {
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
          <Typography sx={{ typography: "titleLg", fontWeight: 700 }}>{parent.name}</Typography>
          <Typography
            sx={theme => ({
              typography: "bodyMd",
              color: theme.palette.text.secondary,
            })}
          >
            {parent.email}
          </Typography>
          <Stack sx={{ mt: 1, flexDirection: "row", gap: 1, flexWrap: "wrap" }}>
            <StatusBadge
              category="studentAccount"
              status={lifecycleKey}
              label={labels.status[isLifecycleStatusKey(lifecycleKey) ? lifecycleKey : "regular"]}
            />
            <StatusBadge
              category="staffAccount"
              status={accountKey}
              label={labels.accountStatus[isAccountStatusKey(accountKey) ? accountKey : "activated"]}
            />
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}

export function PolicyOverviewCard({ labels }: Readonly<{ labels: ParentLifecycleLabels }>) {
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
        {labels.sections.policyOverview}
      </Typography>
      <Stack spacing={2}>
        <Box>
          <Typography variant="bodyLg" sx={{ fontWeight: 700 }}>
            {labels.policies.lifecycleTitle}
          </Typography>
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
            {labels.policies.lifecycleDesc}
          </Typography>
        </Box>
        <Box>
          <Typography variant="bodyLg" sx={{ fontWeight: 700 }}>
            {labels.policies.accountTitle}
          </Typography>
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
            {labels.policies.accountDesc}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

export function LifecycleControls({
  labels,
  isUpdating,
}: Readonly<{ labels: ParentLifecycleLabels; isUpdating: boolean }>) {
  const { control, register } = useFormContext<LifecycleUpdateFormData>();

  return (
    <AdminControlPanel title={labels.sections.adminControls}>
      <Stack spacing={3}>
        <Box>
          <Typography
            variant="labelMd"
            sx={theme => ({ color: theme.palette.text.secondary, mb: 1, display: "block" })}
          >
            {labels.fields.lifecycleStatus}
          </Typography>
          <Controller
            name="lifecycleStatus"
            control={control}
            render={({ field }) => (
              <Select {...field} fullWidth size="small">
                <MenuItem value={ParentStatus.Regular}>{labels.statusOptions.REGULAR}</MenuItem>
                <MenuItem value={ParentStatus.OnTrial}>{labels.statusOptions.ON_TRIAL}</MenuItem>
                <MenuItem value={ParentStatus.OnLeave}>{labels.statusOptions.ON_LEAVE}</MenuItem>
                <MenuItem value={ParentStatus.Suspended}>{labels.statusOptions.SUSPENDED}</MenuItem>
              </Select>
            )}
          />
        </Box>

        <TextField
          {...register("reason")}
          label={labels.fields.reason}
          placeholder={labels.fields.reasonPlaceholder}
          multiline
          rows={3}
          fullWidth
          size="small"
        />

        <PrimaryPageAction type="submit" disabled={isUpdating}>
          {labels.actions.applyChange}
        </PrimaryPageAction>
      </Stack>
    </AdminControlPanel>
  );
}

export function LifecycleFormBody({
  parent,
  labels,
  isUpdating,
  onUpdateLifecycle,
  children,
}: Readonly<ParentLifecycleViewProps & { readonly labels: ParentLifecycleLabels; readonly children?: ReactNode }>) {
  const methods = useParentLifecycleForm(parent);

  const handleSubmit = async (data: LifecycleUpdateFormData) => {
    await onUpdateLifecycle(data.lifecycleStatus, data.reason ?? "");
    methods.reset({ lifecycleStatus: data.lifecycleStatus, reason: "" });
  };

  return (
    <Box
      component="form"
      onSubmit={e => {
        void methods.handleSubmit(handleSubmit)(e);
      }}
      sx={{ display: "flex", flexDirection: "column", gap: "gutter" }}
    >
      <FormProvider {...methods}>
        <LifecycleControls labels={labels} isUpdating={isUpdating} />
      </FormProvider>
      <PolicyOverviewCard labels={labels} />
      {children}
    </Box>
  );
}
