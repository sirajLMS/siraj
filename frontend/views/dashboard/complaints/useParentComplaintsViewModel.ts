"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { type Control, type FieldErrors, type UseFormHandleSubmit, type UseFormReset, useForm } from "react-hook-form";
import { ComplaintCategory } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  type ComplaintFormData,
  complaintFormSchema,
} from "@/frontend/views/dashboard/complaints/schemas/complaintFormSchema";
import type {
  ParentComplaintRecord,
  ParentStudentOption,
} from "@/frontend/views/dashboard/complaints/types/complaints.types";
import type { ComplaintsParentLabels } from "@/shared/messages/types/dashboard/complaints/main";

export interface ParentComplaintsViewModel {
  readonly labels: ComplaintsParentLabels;
  readonly studentOptions: readonly ParentStudentOption[];
  readonly records: readonly ParentComplaintRecord[];
  readonly hasOlderRecords: boolean;
  readonly control: Control<ComplaintFormData>;
  readonly errors: FieldErrors<ComplaintFormData>;
  readonly isSubmitting: boolean;
  readonly showSuccess: boolean;
  readonly canSubmit: boolean;
  readonly onDismissSuccess: () => void;
  readonly onFormSubmit: () => void;
  readonly onLoadOlderRecords: () => void;
  readonly page?: number;
  readonly pageSize?: number;
  readonly totalCount?: number;
  readonly onPageChange?: (page: number) => void;
}

export interface UseParentComplaintsViewModelProps {
  readonly labels: ComplaintsParentLabels;
  readonly studentOptions: readonly ParentStudentOption[];
  readonly records: readonly ParentComplaintRecord[];
  readonly hasOlderRecords: boolean;
  readonly isSubmitting: boolean;
  readonly showSuccess: boolean;
  readonly canSubmit: boolean;
  readonly onSubmit: (data: ComplaintFormData) => void;
  readonly onDismissSuccess: () => void;
  readonly onLoadOlderRecords: () => void;
  readonly page?: number;
  readonly pageSize?: number;
  readonly totalCount?: number;
  readonly onPageChange?: (page: number) => void;
}

const DEFAULT_FORM_VALUES: ComplaintFormData = {
  category: ComplaintCategory.Other,
  studentId: "",
  contactEmail: "",
  complaintDetails: "",
};

function useSuccessDismissTimer(showSuccess: boolean, onDismissSuccess: () => void): void {
  useEffect(() => {
    if (!showSuccess) {
      return undefined;
    }

    const timer = setTimeout(() => {
      onDismissSuccess();
    }, 4000);

    return () => {
      clearTimeout(timer);
    };
  }, [showSuccess, onDismissSuccess]);
}

function buildFormSubmitHandler(
  handleSubmit: UseFormHandleSubmit<ComplaintFormData>,
  reset: UseFormReset<ComplaintFormData>,
  onSubmit: (data: ComplaintFormData) => void
): () => void {
  return () => {
    handleSubmit(data => {
      onSubmit(data);
      reset();
    })();
  };
}

export function useParentComplaintsViewModel(
  props: Readonly<UseParentComplaintsViewModelProps>
): ParentComplaintsViewModel {
  const {
    labels,
    studentOptions,
    records,
    hasOlderRecords,
    isSubmitting,
    showSuccess,
    canSubmit,
    onSubmit,
    onDismissSuccess,
    onLoadOlderRecords,
    page,
    pageSize,
    totalCount,
    onPageChange,
  } = props;

  const schema = complaintFormSchema(labels.validation);
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ComplaintFormData>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_FORM_VALUES,
  });

  useSuccessDismissTimer(showSuccess, onDismissSuccess);

  const handleFormSubmit = buildFormSubmitHandler(handleSubmit, reset, onSubmit);

  return {
    labels,
    studentOptions,
    records,
    hasOlderRecords,
    control,
    errors,
    isSubmitting,
    showSuccess,
    canSubmit,
    onDismissSuccess,
    onFormSubmit: handleFormSubmit,
    onLoadOlderRecords,
    page,
    pageSize,
    totalCount,
    onPageChange,
  };
}
