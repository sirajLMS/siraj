"use client";

import { Box, MenuItem, Select, Stack, TextField, Typography } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";
import { AdminControlPanel, PrimaryPageAction } from "@/frontend/common/components/ui";
import { ParentStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import type { LifecycleUpdateFormData } from "@/frontend/common/views/dashboard/parents/lifecycle/schemas/lifecycleUpdateSchema";
import type { ParentLifecycleLabels } from "@/shared/locale/types/dashboard/parents";

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
