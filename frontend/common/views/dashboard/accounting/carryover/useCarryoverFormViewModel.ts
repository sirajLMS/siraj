"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { buildFormDefaults } from "@/frontend/common/views/dashboard/accounting/carryover/useCarryoverFormViewModel.helpers";
import {
  useCarryoverFormSession,
  useCarryoverWrites,
} from "@/frontend/common/views/dashboard/accounting/carryover/useCarryoverFormViewModel.hooks";
import {
  type CarryoverFormData,
  type CarryoverFormInput,
  type CarryoverFormReturn,
  type CarryoverValidationCopy,
  createCarryoverFormSchema,
} from "@/frontend/common/views/dashboard/accounting/carryover/useCarryoverFormViewModel.schema";
import type { CarryoverFormRow } from "@/frontend/common/views/dashboard/accounting/carryover/useCarryoverFormViewModel.types";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardAccountingCarryover, Translation } from "@/shared/locale/namespaces";
import type { CommonLabels } from "@/shared/locale/types/common";
import type { CarryoverLabels } from "@/shared/locale/types/dashboard/accounting/carryover";

export { CARRYOVER_NOTE_MAX_LENGTH } from "@/frontend/common/views/dashboard/accounting/carryover/useCarryoverFormViewModel.constants";

export type { CarryoverFormRow } from "@/frontend/common/views/dashboard/accounting/carryover/useCarryoverFormViewModel.types";

export interface UseCarryoverFormViewModelProps {
  /** Whether the dialog is visible; every open starts a fresh form session. */
  readonly open: boolean;
  /** Carryover snapshot for edit mode; `null` opens the dialog in add mode. */
  readonly row: CarryoverFormRow | null;
  /** Close request raised by Cancel, Escape, backdrop click, or a successful write. */
  readonly onClose: () => void;
  /** Runs after a successful create/update so the host page can refresh its queries. */
  readonly onSaved?: () => void;
}

export interface CarryoverFormViewModel {
  readonly form: CarryoverFormReturn;
  readonly labels: CarryoverLabels;
  readonly commonLabels: CommonLabels;
  /** Edit mode re-assigns no teacher, so the picker is locked and prefilled. */
  readonly isEdit: boolean;
  readonly title: string;
  readonly submitting: boolean;
  /**
   * Add mode needs a selected teacher; edit mode always can submit because the
   * teacher is prefilled from the row snapshot.
   */
  readonly canSubmit: boolean;
  readonly onSubmit: () => void;
  readonly onCancel: () => void;
}

export function useCarryoverFormViewModel({
  open,
  row,
  onClose,
  onSaved,
}: Readonly<UseCarryoverFormViewModelProps>): CarryoverFormViewModel {
  const labels = useAppTranslation(DashboardAccountingCarryover);
  const commonLabels = useAppTranslation(Translation.Common);
  const userSelectLabels = useAppTranslation(Translation.Ui.UserSelect);
  const errorLabels = useAppTranslation(Translation.Errors);

  const isEdit = row !== null;
  const validationCopy: CarryoverValidationCopy = {
    teacherRequired: labels.validation.teacherRequired,
    required: userSelectLabels.required,
    dateRangeInvalid: labels.validation.dateRangeInvalid,
    payableNegative: labels.validation.payableNegative,
    currencyRequired: labels.validation.currencyRequired,
    noteTooLong: labels.validation.noteTooLong,
  };

  const form = useForm<CarryoverFormInput, undefined, CarryoverFormData>({
    resolver: zodResolver(createCarryoverFormSchema(validationCopy)),
    defaultValues: buildFormDefaults(null),
  });

  const refs = useCarryoverFormSession(form, row, open);
  const teacherSelection = useWatch({ control: form.control, name: "teacher" });
  const { submitting, onSubmit } = useCarryoverWrites({
    form,
    refs,
    isEdit,
    labels,
    commonLabels,
    teacherImmutableMessage: errorLabels.carryover.teacherImmutable,
    onSaved,
    onClose,
  });

  return {
    form,
    labels,
    commonLabels,
    isEdit,
    title: isEdit ? labels.modal.form.titleEdit : labels.modal.form.titleAdd,
    submitting,
    canSubmit: isEdit || (teacherSelection !== null && teacherSelection.id !== ""),
    onSubmit,
    onCancel: onClose,
  };
}
