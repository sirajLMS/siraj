"use client";

import { Box, FormControl, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";
import { StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import type { StatusUpdateFormData } from "@/frontend/common/views/dashboard/students/status/schemas/statusUpdateSchema";
import type { AdminHoldControlsSlotProps } from "@/frontend/common/views/dashboard/students/status/types/adminHoldControlsShared.types";
import { useStudentStatusLabels } from "@/frontend/common/views/dashboard/students/status/useStudentStatusLabels";

export function StatusSelectionField() {
  const t = useStudentStatusLabels();
  const { control } = useFormContext<StatusUpdateFormData>();

  return (
    <Controller
      name="status"
      control={control}
      render={({ field }) => (
        <FormControl fullWidth>
          <InputLabel id="admin-hold-account-status-label" shrink>
            {t.fields.accountStatus}
          </InputLabel>
          <Select
            {...field}
            labelId="admin-hold-account-status-label"
            label={t.fields.accountStatus}
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
        </FormControl>
      )}
    />
  );
}

export function ReasonEntryField({ slots }: Readonly<{ slots: AdminHoldControlsSlotProps }>) {
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
      <Controller
        name="reason"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            multiline
            rows={4}
            fullWidth
            label={t.fields.statusReason}
            placeholder={t.fields.statusReasonPlaceholder}
            error={Boolean(errors.reason)}
            helperText={errors.reason?.message}
            aria-invalid={Boolean(errors.reason)}
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

export function SubmitStatusButton({
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
