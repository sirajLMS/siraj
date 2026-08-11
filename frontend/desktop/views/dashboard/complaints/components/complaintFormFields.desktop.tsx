"use client";

import type { Control, FieldErrors } from "react-hook-form";
import { ComplaintFormFieldsShared } from "@/frontend/common/views/dashboard/complaints/components/complaintFormFieldsShared";
import type { ComplaintFormData } from "@/frontend/common/views/dashboard/complaints/schemas/complaintFormSchema";
import { StudentAutocompleteDesktop } from "@/frontend/desktop/components/ui/input/userSelect";
import type { ComplaintsParentLabels } from "@/shared/locale";

interface ComplaintFormFieldsDesktopProps {
  readonly control: Control<ComplaintFormData>;
  readonly errors: FieldErrors<ComplaintFormData>;
  readonly labels: ComplaintsParentLabels;
}

const DESKTOP_OPTIONS = {
  fieldGap: 4,
  headerMarginBottom: 1,
  detailsMinRows: 5,
} as const;

export function ComplaintFormFieldsDesktop({ control, errors, labels }: Readonly<ComplaintFormFieldsDesktopProps>) {
  return (
    <ComplaintFormFieldsShared
      control={control}
      errors={errors}
      labels={labels}
      slots={{ StudentAutocomplete: StudentAutocompleteDesktop }}
      options={DESKTOP_OPTIONS}
    />
  );
}
