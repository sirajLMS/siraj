"use client";

import SwapHorizOutlinedIcon from "@mui/icons-material/SwapHorizOutlined";
import { Alert, AlertTitle, Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { addDays } from "date-fns";
import { useState } from "react";
import { formatDateInput, parseDateInput } from "@/frontend/common/components/intl/dateFormat";
import { AppDatePicker } from "@/frontend/common/components/ui/form/date";
import { TeacherAutocomplete } from "@/frontend/common/components/ui/input/userSelect/TeacherAutocomplete";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect/types";
import { useCreditAdjustFormStore } from "@/frontend/common/stores/creditAdjustFormStore";
import { PAYMENT_DATE_MAX_FUTURE_DAYS } from "@/frontend/common/views/dashboard/accounting/credits/creditAdjust.constants";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardBillingCreditAdjustment } from "@/shared/locale/namespaces";

export interface CarryoverBannerErrors {
  readonly teacher?: string;
  readonly fromDate?: string;
  readonly toDate?: string;
  readonly paymentDate?: string;
}

export interface CarryoverBannerProps {
  /** Inline validation messages per field; absent keys render without error state. */
  readonly errors?: CarryoverBannerErrors;
}

const FIELDS_GRID_SX = {
  display: "grid",
  gap: 2,
  mt: 1,
  // One column on phones, two from `sm` up so tablets keep the date pickers
  // side-by-side, and three from `lg` up where all three date pickers share
  // one row below the full-width teacher picker. The wide layout engages at
  // `lg` (1200px) rather than `xl` so common 1440px desktops use it.
  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
} as const;

/** Teacher picker spans the full grid width on every breakpoint. */
const TEACHER_FIELD_SX = { gridColumn: "1 / -1" } as const;

/**
 * Carryover allocation section of the credit adjustment form. Surfaces only
 * when the operator chooses the subtract-with-carryover adjustment type and
 * binds the teacher picker plus the carryover date range to the form store.
 *
 * Constraint wiring mirrors the server-side validation rules: the To Date
 * cannot precede the From Date (and vice versa), and the Payment Date cannot
 * be more than one day in the future.
 */
export function CarryoverBanner({ errors }: Readonly<CarryoverBannerProps>) {
  const t = useAppTranslation(DashboardBillingCreditAdjustment);

  const fromDate = useCreditAdjustFormStore(state => state.fromDate);
  const toDate = useCreditAdjustFormStore(state => state.toDate);
  const paymentDate = useCreditAdjustFormStore(state => state.paymentDate);
  const setCarryoverTeacherId = useCreditAdjustFormStore(state => state.setCarryoverTeacherId);
  const setFromDate = useCreditAdjustFormStore(state => state.setFromDate);
  const setToDate = useCreditAdjustFormStore(state => state.setToDate);
  const setPaymentDate = useCreditAdjustFormStore(state => state.setPaymentDate);

  // The picker works with full person records while the store keeps only the
  // teacher id; the banner owns the selected record for display and writes the
  // id through on every change.
  const [teacher, setTeacher] = useState<PersonOption | null>(null);

  const fromDateValue = parseDateInput(fromDate);
  const toDateValue = parseDateInput(toDate);
  const maxPaymentDate = addDays(new Date(), PAYMENT_DATE_MAX_FUTURE_DAYS);

  const handleTeacherChange = (next: PersonOption | null) => {
    setTeacher(next);
    setCarryoverTeacherId(next?.id ?? null);
  };

  return (
    <Alert
      severity="success"
      icon={<SwapHorizOutlinedIcon />}
      sx={theme => ({
        alignItems: "flex-start",
        // The stock success-alert tone renders muddy-dark against the page;
        // the success container pair is the theme's contrast-safe surface.
        backgroundColor: theme.palette.successContainer,
        color: theme.palette.onSuccessContainer,
        "& .MuiAlert-icon": { color: theme.palette.success.main },
        // Outlined inputs inherit the page-level divider alpha, which reads as
        // a ghost over the green banner surface; derive the ring from the
        // banner's own on-container tone so it stays visible. Scoped to the
        // banner's fields only — the shared picker/field themes are untouched.
        "& .MuiOutlinedInput-root:not(.Mui-focused) .MuiOutlinedInput-notchedOutline, & .MuiPickersOutlinedInput-root:not(.Mui-focused) .MuiPickersOutlinedInput-notchedOutline":
          {
            borderColor: alpha(theme.palette.onSuccessContainer, 0.35),
          },
        // Floating labels ride in the outlined-input notch above the banner
        // surface; paint them with the banner tone so the notch does not let
        // the surrounding page show through behind the label text.
        "& .MuiInputLabel-root, & .MuiPickersInputLabel-root": {
          backgroundColor: theme.palette.successContainer,
        },
      })}
    >
      <AlertTitle>{t.carryover.bannerTitle}</AlertTitle>
      <Typography
        variant="caption"
        sx={theme => ({
          // Keep the caption visually subordinate to the banner title while
          // staying on the contrast-safe on-container tone.
          color: alpha(theme.palette.onSuccessContainer, 0.85),
        })}
      >
        {t.carryover.bannerCaption}
      </Typography>
      <Box sx={FIELDS_GRID_SX}>
        <Box sx={TEACHER_FIELD_SX}>
          <TeacherAutocomplete
            value={teacher}
            onChange={handleTeacherChange}
            label={t.carryover.teacher}
            error={Boolean(errors?.teacher)}
            helperText={errors?.teacher}
            required
            fullWidth
          />
        </Box>
        <AppDatePicker
          label={t.carryover.fromDate}
          value={fromDateValue}
          onChange={(date: Date | null) => setFromDate(formatDateInput(date) || null)}
          maxDate={toDateValue ?? undefined}
          slotProps={{
            textField: {
              required: true,
              fullWidth: true,
              error: Boolean(errors?.fromDate),
              helperText: errors?.fromDate,
            },
          }}
        />
        <AppDatePicker
          label={t.carryover.toDate}
          value={toDateValue}
          onChange={(date: Date | null) => setToDate(formatDateInput(date) || null)}
          minDate={fromDateValue ?? undefined}
          slotProps={{
            textField: {
              required: true,
              fullWidth: true,
              error: Boolean(errors?.toDate),
              helperText: errors?.toDate,
            },
          }}
        />
        <AppDatePicker
          label={t.carryover.paymentDate}
          value={parseDateInput(paymentDate)}
          onChange={(date: Date | null) => setPaymentDate(formatDateInput(date) || null)}
          maxDate={maxPaymentDate}
          slotProps={{
            textField: {
              required: true,
              fullWidth: true,
              error: Boolean(errors?.paymentDate),
              helperText: errors?.paymentDate,
            },
          }}
        />
      </Box>
    </Alert>
  );
}
