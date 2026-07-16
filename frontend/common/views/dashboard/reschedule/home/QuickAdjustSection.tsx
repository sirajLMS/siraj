"use client";

import { AddOutlined } from "@mui/icons-material";
import { Box, Button, Typography } from "@mui/material";
import type { UseFormGetValues, UseFormSetValue } from "react-hook-form";
import type { RescheduleFormData } from "@/frontend/common/views/dashboard/reschedule/home/schemas/rescheduleSchema";
import {
  addOneDay,
  addOneHour,
  addOneWeek,
  combineDateTime,
  toDateString,
  toTimeString,
} from "@/frontend/common/views/dashboard/reschedule/home/utils/rescheduleDateTime";
import { useAppTranslation } from "@/shared/locale";

interface Props {
  readonly setValue: UseFormSetValue<RescheduleFormData>;
  readonly getValues: UseFormGetValues<RescheduleFormData>;
}

const QUICK_OPTIONS = [
  { key: "oneHour", apply: addOneHour },
  { key: "oneDay", apply: addOneDay },
  { key: "oneWeek", apply: addOneWeek },
] as const;

function applyQuickAdjust(
  getValues: UseFormGetValues<RescheduleFormData>,
  setValue: UseFormSetValue<RescheduleFormData>,
  adjust: (date: Date) => Date
): void {
  const { newDate, newTime } = getValues();
  const current = combineDateTime(newDate, newTime);
  if (!current) return;
  const adjusted = adjust(current);
  setValue("newDate", toDateString(adjusted), { shouldValidate: true });
  setValue("newTime", toTimeString(adjusted), { shouldValidate: true });
}

export function QuickAdjustSection({ setValue, getValues }: Readonly<Props>) {
  const t = useAppTranslation().dashboardTranslations.rescheduleForm.quickAdjust;

  return (
    <Box
      sx={theme => ({
        p: 2,
        borderRadius: 3,
        border: `1px dashed ${theme.palette.outlineVariant}`,
        backgroundColor: theme.palette.surface,
      })}
    >
      <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary, mb: 1.5, display: "block" })}>
        {t.label}:
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
        {QUICK_OPTIONS.map(option => (
          <Button
            key={option.key}
            type="button"
            variant="outlined"
            startIcon={<AddOutlined />}
            onClick={() => {
              applyQuickAdjust(getValues, setValue, option.apply);
            }}
            sx={theme => ({
              borderRadius: 99,
              textTransform: "none",
              fontWeight: 700,
              borderColor: theme.palette.outlineVariant,
              color: theme.palette.onSurface,
              "&:hover": {
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.onPrimary,
                borderColor: theme.palette.primary.main,
              },
            })}
          >
            {t[option.key]}
          </Button>
        ))}
      </Box>
    </Box>
  );
}
