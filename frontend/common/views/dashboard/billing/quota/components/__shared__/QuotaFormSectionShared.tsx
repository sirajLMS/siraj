"use client";

import type { Control, FieldErrors } from "react-hook-form";
import type { QuotaKind, QuotaPeriodType } from "@/frontend/common/graphql/generated/gql/graphql";
import { QuotaConfigFields } from "@/frontend/common/views/dashboard/billing/quota/components/__shared__/QuotaFormSectionShared.configFields";
import { StudentInfoFields } from "@/frontend/common/views/dashboard/billing/quota/components/__shared__/QuotaFormSectionShared.studentFields";
import type {
  DatePickerSlot,
  SectionWrapper,
} from "@/frontend/common/views/dashboard/billing/quota/components/__shared__/QuotaFormSectionShared.types";
import { ValidityDateFields } from "@/frontend/common/views/dashboard/billing/quota/components/__shared__/QuotaFormSectionShared.validityFields";
import type {
  QuotaFormData,
  QuotaFormInput,
} from "@/frontend/common/views/dashboard/billing/quota/schemas/quotaSchema";
import { useQuotaFormAccess } from "@/frontend/common/views/dashboard/billing/quota/useQuotaFormAccess";
import type { QuotaLabels } from "@/shared/locale/types/dashboard/billing/quota";

export type { DatePickerSlotProps } from "@/frontend/common/views/dashboard/billing/quota/components/__shared__/QuotaFormSectionShared.types";

export interface QuotaFormSectionSharedProps {
  readonly control: Control<QuotaFormInput, undefined, QuotaFormData>;
  readonly errors: FieldErrors<QuotaFormInput>;
  readonly labels: QuotaLabels;
  readonly isEditing: boolean;
  readonly watchPeriodType: QuotaPeriodType | null | undefined;
  readonly watchKind: QuotaKind | undefined;
  readonly datePickerSlot: DatePickerSlot;
  readonly wrapSection: SectionWrapper;
}

export function QuotaFormSectionShared({
  control,
  errors,
  labels,
  isEditing,
  watchPeriodType,
  watchKind,
  datePickerSlot,
  wrapSection,
}: Readonly<QuotaFormSectionSharedProps>) {
  const { fieldAccess } = useQuotaFormAccess();

  return (
    <>
      {wrapSection({
        title: labels.fields.student,
        children: (
          <StudentInfoFields
            control={control}
            errors={errors}
            labels={labels}
            isEditing={isEditing}
            fieldAccess={fieldAccess}
          />
        ),
      })}

      {wrapSection({
        title: labels.fields.kind,
        children: (
          <QuotaConfigFields
            control={control}
            errors={errors}
            labels={labels}
            isEditing={isEditing}
            watchKind={watchKind}
            watchPeriodType={watchPeriodType}
            fieldAccess={fieldAccess}
          />
        ),
      })}

      {wrapSection({
        title: labels.fields.validFrom,
        children: (
          <ValidityDateFields
            control={control}
            errors={errors}
            labels={labels}
            fieldAccess={fieldAccess}
            datePickerSlot={datePickerSlot}
          />
        ),
      })}
    </>
  );
}
