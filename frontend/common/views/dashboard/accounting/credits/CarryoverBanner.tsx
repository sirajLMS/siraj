"use client";

import SwapHorizOutlinedIcon from "@mui/icons-material/SwapHorizOutlined";
import { Alert, AlertTitle, Box } from "@mui/material";
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
  gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)", xl: "repeat(4, 1fr)" },
} as const;

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
    <Alert severity="success" icon={<SwapHorizOutlinedIcon />} sx={{ alignItems: "flex-start" }}>
      <AlertTitle>{t.carryover.bannerTitle}</AlertTitle>
      <Box sx={FIELDS_GRID_SX}>
        <TeacherAutocomplete
          value={teacher}
          onChange={handleTeacherChange}
          label={t.carryover.teacher}
          error={Boolean(errors?.teacher)}
          helperText={errors?.teacher}
          required
          fullWidth
        />
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
