import { Box, MenuItem, Select, TextField, Typography } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";
import { AdminControlPanel, FilterButton, PrimaryPageAction } from "@/frontend/common/components/ui";
import { StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { StatusUpdateFormData } from "@/frontend/common/views/dashboard/students/status/schemas/statusUpdateSchema";
import type { AdminHoldControlsProps } from "@/frontend/common/views/dashboard/students/status/types";
import { useAppTranslation } from "@/shared/locale/client";

function StatusSelectionField() {
  const t = useAppTranslation().dashboardTranslations.studentStatus;
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

function ReasonEntryField() {
  const t = useAppTranslation().dashboardTranslations.studentStatus;
  const {
    control,
    formState: { errors },
    setValue,
  } = useFormContext<StatusUpdateFormData>();

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
            error={!!errors.reason}
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
      <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
        {quickReasons.map(reason => (
          <FilterButton
            key={reason.label}
            size="small"
            onClick={() => {
              setValue("reason", reason.text, { shouldValidate: true });
            }}
          >
            {reason.label}
          </FilterButton>
        ))}
      </Box>
    </Box>
  );
}

function SubmitStatusButton({ isUpdating }: Readonly<{ isUpdating: boolean }>) {
  const t = useAppTranslation().dashboardTranslations.studentStatus;
  const { watch } = useFormContext<StatusUpdateFormData>();
  const currentStatus = watch("status");

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

export function AdminHoldControls({ isUpdating }: Readonly<AdminHoldControlsProps>) {
  const t = useAppTranslation().dashboardTranslations.studentStatus;

  return (
    <AdminControlPanel title={t.sections.adminHold}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <StatusSelectionField />
        <ReasonEntryField />
        <SubmitStatusButton isUpdating={isUpdating} />
      </Box>
    </AdminControlPanel>
  );
}
