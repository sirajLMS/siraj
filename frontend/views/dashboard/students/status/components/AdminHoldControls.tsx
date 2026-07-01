import { AdminPanelSettingsOutlined } from "@mui/icons-material";
import { Box, MenuItem, Select, TextField, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { Controller, useFormContext } from "react-hook-form";
import { FilterButton, PrimaryPageAction } from "@/frontend/components/ui";
import { StudentStatus } from "@/shared/lib/enum";
import type { StatusUpdateFormData } from "../schemas/statusUpdateSchema";
import type { AdminHoldControlsProps } from "../types";

function StatusSelectionField() {
  const t = useTranslations("dashboard.studentStatus");
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
        {t("fields.accountStatus")}
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
            <MenuItem value={StudentStatus.REGULAR}>{t("statusOptions.REGULAR")}</MenuItem>
            <MenuItem value={StudentStatus.SUSPENDED}>{t("statusOptions.SUSPENDED")}</MenuItem>
            <MenuItem value={StudentStatus.ON_LEAVE}>{t("statusOptions.ON_LEAVE")}</MenuItem>
            <MenuItem value={StudentStatus.ON_TRIAL}>{t("statusOptions.ON_TRIAL")}</MenuItem>
            <MenuItem value={StudentStatus.DEACTIVATED}>{t("statusOptions.DEACTIVATED")}</MenuItem>
          </Select>
        )}
      />
    </Box>
  );
}

function ReasonEntryField() {
  const t = useTranslations("dashboard.studentStatus");
  const {
    control,
    formState: { errors },
    setValue,
  } = useFormContext<StatusUpdateFormData>();

  const quickReasons = [
    {
      label: t("reasons.unpaidInvoice"),
      text: t("reasons.unpaidInvoice"),
    },
    {
      label: t("reasons.misconduct"),
      text: t("reasons.misconduct"),
    },
    {
      label: t("reasons.vacation"),
      text: t("reasons.vacation"),
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
        {t("fields.statusReason")}
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
            placeholder={t("fields.statusReasonPlaceholder")}
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
  const t = useTranslations("dashboard.studentStatus");
  const { watch } = useFormContext<StatusUpdateFormData>();
  const currentStatus = watch("status");

  const isSuspended = currentStatus === StudentStatus.SUSPENDED;

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
      {t("actions.applyChange")}
    </PrimaryPageAction>
  );
}

export function AdminHoldControls({ isUpdating }: Readonly<AdminHoldControlsProps>) {
  const t = useTranslations("dashboard.studentStatus");

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
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 4 }}>
        <AdminPanelSettingsOutlined sx={theme => ({ color: theme.palette.primary.main })} />
        <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 700 })}>
          {t("sections.adminHold")}
        </Typography>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <StatusSelectionField />
        <ReasonEntryField />
        <SubmitStatusButton isUpdating={isUpdating} />
      </Box>
    </Box>
  );
}
