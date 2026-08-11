"use client";

import type { Control, FieldErrors } from "react-hook-form";
import { ComplaintFormFieldsShared } from "@/frontend/common/views/dashboard/complaints/components/complaintFormFieldsShared";
import type { ComplaintFormData } from "@/frontend/common/views/dashboard/complaints/schemas/complaintFormSchema";
import { StudentAutocompleteMobile } from "@/frontend/mobile/components/ui/input/userSelect";
import type { ComplaintsParentLabels } from "@/shared/locale";

interface ComplaintFormFieldsMobileProps {
  readonly control: Control<ComplaintFormData>;
  readonly errors: FieldErrors<ComplaintFormData>;
  readonly labels: ComplaintsParentLabels;
}

const MOBILE_OPTIONS = {
  fieldGap: 3,
  headerMarginBottom: 0,
  detailsMinRows: 4,
} as const;

export function ComplaintFormFieldsMobile({ control, errors, labels }: Readonly<ComplaintFormFieldsMobileProps>) {
  return (
    <ComplaintFormFieldsShared
      control={control}
      errors={errors}
      labels={labels}
      slots={{ StudentAutocomplete: StudentAutocompleteMobile }}
      options={MOBILE_OPTIONS}
    />
  );
}
