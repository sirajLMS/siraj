"use client";

import type { ReactElement } from "react";
import type { Control, FieldErrors } from "react-hook-form";
import type { QuotaKind, QuotaPeriodType } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  type DatePickerSlotProps,
  QuotaFormSectionShared,
  type QuotaFormSectionSharedProps,
} from "@/frontend/common/views/dashboard/billing/quota/components/__shared__/QuotaFormSectionShared";
import type {
  QuotaFormData,
  QuotaFormInput,
} from "@/frontend/common/views/dashboard/billing/quota/schemas/quotaSchema";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container";
import { DesktopAppDatePicker } from "@/frontend/desktop/components/ui/form/date";
import type { QuotaLabels } from "@/shared/locale/types/dashboard/billing/quota";

export type QuotaFormSectionDesktopProps = Omit<QuotaFormSectionSharedProps, "datePickerSlot" | "wrapSection"> & {
  readonly control: Control<QuotaFormInput, undefined, QuotaFormData>;
  readonly errors: FieldErrors<QuotaFormInput>;
  readonly labels: QuotaLabels;
  readonly isEditing: boolean;
  readonly watchPeriodType: QuotaPeriodType | null | undefined;
  readonly watchKind: QuotaKind | undefined;
};

function DesktopDatePickerAdapter(props: Readonly<DatePickerSlotProps>) {
  return (
    <DesktopAppDatePicker
      label={props.label}
      value={props.value}
      onChange={props.onChange}
      disabled={props.disabled}
      slotProps={{
        textField: {
          fullWidth: props.fullWidth,
          error: props.error,
          helperText: props.helperText,
          sx: props.sx,
        },
      }}
    />
  );
}

function DesktopSectionWrapper({ title, children }: Readonly<{ title: string; children: ReactElement }>): ReactElement {
  return <DesktopSectionPanel title={title}>{children}</DesktopSectionPanel>;
}

export function QuotaFormSectionDesktop({
  control,
  errors,
  labels,
  isEditing,
  watchPeriodType,
  watchKind,
}: Readonly<QuotaFormSectionDesktopProps>) {
  return (
    <QuotaFormSectionShared
      control={control}
      errors={errors}
      labels={labels}
      isEditing={isEditing}
      watchPeriodType={watchPeriodType}
      watchKind={watchKind}
      datePickerSlot={{ component: DesktopDatePickerAdapter }}
      wrapSection={DesktopSectionWrapper}
    />
  );
}
