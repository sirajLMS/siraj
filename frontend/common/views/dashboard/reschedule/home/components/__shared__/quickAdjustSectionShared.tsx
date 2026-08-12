"use client";

import { AddOutlined } from "@mui/icons-material";
import { Box, Button, type Theme, Typography } from "@mui/material";
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
import type { RescheduleFormLabels } from "@/shared/locale/types/dashboard/classes/rescheduleForm";

interface Props {
  readonly labels: RescheduleFormLabels;
  readonly setValue: UseFormSetValue<RescheduleFormData>;
  readonly getValues: UseFormGetValues<RescheduleFormData>;
  readonly optionsContainerSlot: React.ComponentType<Readonly<{ children: React.ReactNode }>>;
  readonly buttonSxSlot?: Readonly<Record<string, unknown>>;
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

function mergeButtonSx(theme: Theme, extra: Readonly<Record<string, unknown>> | undefined): Record<string, unknown> {
  return Object.assign(
    {
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
    },
    extra ?? {}
  );
}

export function QuickAdjustSectionShared({
  labels,
  setValue,
  getValues,
  optionsContainerSlot: OptionsContainer,
  buttonSxSlot,
}: Readonly<Props>) {
  const quickAdjustLabels = labels.quickAdjust;

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
        {quickAdjustLabels.label}:
      </Typography>
      <OptionsContainer>
        {QUICK_OPTIONS.map(option => (
          <Button
            key={option.key}
            type="button"
            variant="outlined"
            startIcon={<AddOutlined />}
            onClick={() => {
              applyQuickAdjust(getValues, setValue, option.apply);
            }}
            sx={theme => mergeButtonSx(theme, buttonSxSlot)}
          >
            {quickAdjustLabels[option.key]}
          </Button>
        ))}
      </OptionsContainer>
    </Box>
  );
}
