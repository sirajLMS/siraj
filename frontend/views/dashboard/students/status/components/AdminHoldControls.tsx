import { AdminPanelSettingsOutlined } from "@mui/icons-material";
import { Box, Button, Chip, MenuItem, Select, TextField, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { Controller, useFormContext } from "react-hook-form";
import type { StatusUpdateFormData } from "../schemas/statusUpdateSchema";

interface AdminHoldControlsProps {
  readonly isUpdating: boolean;
}

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
            <MenuItem value="regular">{t("statusOptions.regular")}</MenuItem>
            <MenuItem value="suspended">{t("statusOptions.suspended")}</MenuItem>
            <MenuItem value="on-leave">{t("statusOptions.onLeave")}</MenuItem>
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
      text: "Status change requested due to: Unpaid Invoice. Automated hold protocol initiated.",
    },
    {
      label: t("reasons.misconduct"),
      text: "Status change requested due to: Misconduct. Automated hold protocol initiated.",
    },
    {
      label: t("reasons.vacation"),
      text: "Status change requested due to: Vacation. Automated hold protocol initiated.",
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
          <Chip
            key={reason.label}
            label={reason.label}
            onClick={() => {
              setValue("reason", reason.text, { shouldValidate: true });
            }}
            size="small"
            sx={theme => ({
              fontSize: "10px",
              fontWeight: 600,
              bgcolor: theme.palette.surfaceContainerLow,
              color: theme.palette.onSurfaceVariant,
              "&:hover": { bgcolor: theme.palette.surfaceContainerHigh },
            })}
          />
        ))}
      </Box>
    </Box>
  );
}

function SubmitStatusButton({ isUpdating }: Readonly<{ isUpdating: boolean }>) {
  const t = useTranslations("dashboard.studentStatus");
  const { watch } = useFormContext<StatusUpdateFormData>();
  const currentStatus = watch("status");

  return (
    <Button
      type="submit"
      variant="contained"
      disabled={isUpdating}
      sx={theme => ({
        py: 1.5,
        borderRadius: "button",
        bgcolor: currentStatus === "suspended" ? theme.palette.error.main : theme.palette.primary.main,
        color: currentStatus === "suspended" ? theme.palette.onError : theme.palette.onPrimary,
        "&:hover": {
          bgcolor: currentStatus === "suspended" ? theme.palette.error.dark : theme.palette.primary.dark,
        },
        typography: "buttonText",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        boxShadow: theme.palette.shadow.button,
        "&:hover:not(:disabled)": {
          boxShadow: theme.palette.shadow.buttonHover,
        },
      })}
    >
      {t("actions.applyChange")}
    </Button>
  );
}

export function AdminHoldControls({ isUpdating }: Readonly<AdminHoldControlsProps>) {
  const t = useTranslations("dashboard.studentStatus");

  return (
    <Box
      sx={theme => ({
        bgcolor: theme.palette.background.paper,
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
