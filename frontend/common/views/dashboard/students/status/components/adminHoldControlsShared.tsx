"use client";

import { Box, MenuItem, Select, TextField, Typography } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";
import { StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { StatusUpdateFormData } from "@/frontend/common/views/dashboard/students/status/schemas/statusUpdateSchema";
import type { AdminHoldControlsProps } from "@/frontend/common/views/dashboard/students/status/types";
import type { AdminHoldControlsSlotProps } from "@/frontend/common/views/dashboard/students/status/types/adminHoldControlsShared.types";
import { useStudentStatusLabels } from "@/frontend/common/views/dashboard/students/status/useStudentStatusLabels";

function StatusSelectionField() {
  const t = useStudentStatusLabels();
  const { control } = useFormContext<StatusUpdateFormData>();

  return (
    <Box>
      <Typography
        variant="labelMd"
        sx={theme => ({
          color: theme.palette.onSurfaceVariant,
          textTransform: "uppercase",
          fontWeight: 700,
          mb: 1,
          display: "block",
        })}
      >
        {t.fields.accountStatus}
      </Typography>
      <Controller
        name="status"
        control={control}
        render={({ field }) => (
          <Select
            {...field}
            fullWidth
            sx={theme => ({
              borderRadius: "button",
              "& .MuiOutlinedInput-notchedOutline": { borderColor: theme.palette.border.main },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: theme.palette.primary.main,
              },
            })}
          >
            <MenuItem value={StudentStatus.Regular}>{t.statusOptions.REGULAR}</MenuItem>
            <MenuItem value={StudentStatus.Suspended}>{t.statusOptions.SUSPENDED}</MenuItem>
            <MenuItem value={StudentStatus.OnLeave}>{t.statusOptions.ON_LEAVE}</MenuItem>
            <MenuItem value={StudentStatus.OnTrial}>{t.statusOptions.ON_TRIAL}</MenuItem>
            <MenuItem value={StudentStatus.Deactivated}>{t.statusOptions.DEACTIVATED}</MenuItem>
          </Select>
        )}
      />
    </Box>
  );
}

function ReasonEntryField({ slots }: Readonly<{ slots: AdminHoldControlsSlotProps }>) {
  const t = useStudentStatusLabels();
  const {
    control,
    formState: { errors },
    setValue,
  } = useFormContext<StatusUpdateFormData>();
  const { FilterButton, QuickReasonsContainer } = slots;

  const quickReasons = [
    {
      label: t.reasons.unpaidInvoice,
      text: t.reasons.unpaidInvoice,
    },
    {
      label: t.reasons.misconduct,
      text: t.reasons.misconduct,
    },
    {
      label: t.reasons.vacation,
      text: t.reasons.vacation,
    },
  ];

  return (
    <Box>
      <Typography
        variant="labelMd"
        sx={theme => ({
          color: theme.palette.onSurfaceVariant,
          textTransform: "uppercase",
          fontWeight: 700,
          mb: 1,
          display: "block",
        })}
      >
        {t.fields.statusReason}
      </Typography>
      <Controller
        name="reason"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            multiline
            rows={4}
            fullWidth
            placeholder={t.fields.statusReasonPlaceholder}
            error={Boolean(errors.reason)}
            helperText={errors.reason?.message}
            sx={theme => ({
              "& .MuiOutlinedInput-root": {
                borderRadius: "button",
                "& fieldset": { borderColor: theme.palette.border.main },
                "&.Mui-focused fieldset": { borderColor: theme.palette.primary.main },
              },
            })}
          />
        )}
      />
      <QuickReasonsContainer>
        {quickReasons.map(reason => (
          <FilterButton
            key={reason.label}
            size="small"
            onClick={() => {
              setValue("reason", reason.text, { shouldValidate: true });
            }}
            sx={{ flexShrink: 0 }}
          >
            {reason.label}
          </FilterButton>
        ))}
      </QuickReasonsContainer>
    </Box>
  );
}

function SubmitStatusButton({
  isUpdating,
  slots,
}: Readonly<{ isUpdating: boolean; slots: AdminHoldControlsSlotProps }>) {
  const t = useStudentStatusLabels();
  const { watch } = useFormContext<StatusUpdateFormData>();
  const currentStatus = watch("status");
  const { PrimaryPageAction } = slots;

  const isSuspended = currentStatus === StudentStatus.Suspended;

  return (
    <PrimaryPageAction
      type="submit"
      disabled={isUpdating}
      sx={theme => ({
        py: 1.5,
        borderRadius: "button",
        backgroundColor: isSuspended ? theme.palette.error.main : theme.palette.primary.main,
        color: isSuspended ? theme.palette.onError : theme.palette.onPrimary,
        "&:hover": { backgroundColor: isSuspended ? theme.palette.error.dark : theme.palette.primary.dark },
        textTransform: "uppercase" as const,
      })}
    >
      {t.actions.applyChange}
    </PrimaryPageAction>
  );
}

export interface AdminHoldControlsSharedProps {
  readonly props: Readonly<AdminHoldControlsProps>;
  readonly slots: AdminHoldControlsSlotProps;
  readonly containerGap?: number;
}

export function AdminHoldControlsShared({ props, slots, containerGap = 3 }: Readonly<AdminHoldControlsSharedProps>) {
  const t = useStudentStatusLabels();
  const { AdminControlPanel } = slots;

  return (
    <AdminControlPanel title={t.sections.adminHold}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: containerGap }}>
        <StatusSelectionField />
        <ReasonEntryField slots={slots} />
        <SubmitStatusButton isUpdating={props.isUpdating} slots={slots} />
      </Box>
    </AdminControlPanel>
  );
}
