"use client";

import type { ReactElement } from "react";
import type { Control, FieldErrors } from "react-hook-form";
import type { QuotaKind, QuotaPeriodType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  type DatePickerSlotProps,
  QuotaFormSectionShared,
  type QuotaFormSectionSharedProps,
} from "@/frontend/common/views/dashboard/billing/quota/components/__shared__/QuotaFormSectionShared";
import type {
  QuotaFormData,
  QuotaFormInput,
} from "@/frontend/common/views/dashboard/billing/quota/schemas/quotaSchema";
import { MobileAppDatePicker } from "@/frontend/mobile/components/ui/form/date/MobileAppDatePicker";
import type { QuotaLabels } from "@/shared/locale/types/dashboard/billing/quota";

export type QuotaFormSectionMobileProps = Omit<QuotaFormSectionSharedProps, "datePickerSlot" | "wrapSection"> & {
  readonly control: Control<QuotaFormInput, undefined, QuotaFormData>;
  readonly errors: FieldErrors<QuotaFormInput>;
  readonly labels: QuotaLabels;
  readonly isEditing: boolean;
  readonly watchPeriodType: QuotaPeriodType | null | undefined;
  readonly watchKind: QuotaKind | undefined;
};

function MobileDatePickerAdapter(props: Readonly<DatePickerSlotProps>) {
  return (
    <MobileAppDatePicker
      label={props.label}
      value={props.value}
      onChange={props.onChange}
      disabled={props.disabled}
      error={props.error}
      helperText={props.helperText}
      fullWidth={props.fullWidth}
      sx={props.sx}
    />
  );
}

function MobileSectionWrapper({
  title: _title,
  children,
}: Readonly<{ title: string; children: ReactElement }>): ReactElement {
  return children;
}

export function QuotaFormSectionMobile({
  control,
  errors,
  labels,
  isEditing,
  watchPeriodType,
  watchKind,
}: Readonly<QuotaFormSectionMobileProps>) {
  return (
    <QuotaFormSectionShared
      control={control}
      errors={errors}
      labels={labels}
      isEditing={isEditing}
      watchPeriodType={watchPeriodType}
      watchKind={watchKind}
      datePickerSlot={{ component: MobileDatePickerAdapter }}
      wrapSection={MobileSectionWrapper}
    />
  );
}
