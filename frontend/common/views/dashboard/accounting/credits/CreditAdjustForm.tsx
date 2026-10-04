"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useRef, useState } from "react";
import { SectionPanel } from "@/frontend/common/components/ui/container";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect/types";
import { recordCreditAdjustmentMutationDocument } from "@/frontend/common/graphql/sharedDocuments/billing/credit-adjustment.documents";
import { studentByIdQueryDocument } from "@/frontend/common/graphql/sharedDocuments/students/student.documents";
import { useCreditAdjustFormStore } from "@/frontend/common/stores/creditAdjustFormStore";
import { CreditAdjustFormBody } from "@/frontend/common/views/dashboard/accounting/credits/CreditAdjustForm.body.parts";
import {
  buildValidationCopy,
  resolveCarryoverErrors,
} from "@/frontend/common/views/dashboard/accounting/credits/CreditAdjustForm.helpers";
import {
  buildSummaryText,
  computeBalancePreview,
} from "@/frontend/common/views/dashboard/accounting/credits/CreditAdjustForm.preview";
import type {
  CreditAdjustDraft,
  CreditAdjustFieldErrors,
} from "@/frontend/common/views/dashboard/accounting/credits/CreditAdjustForm.types";
import { useCreditAdjustFormHandlers } from "@/frontend/common/views/dashboard/accounting/credits/useCreditAdjustFormHandlers";
import { useCreditAdjustFormSession } from "@/frontend/common/views/dashboard/accounting/credits/useCreditAdjustFormSession";
import { useCreditAdjustSubmit } from "@/frontend/common/views/dashboard/accounting/credits/useCreditAdjustSubmit";
import { CreditAdjustmentType } from "@/shared/constants/billing";
import { Translation, useAppTranslation } from "@/shared/locale";
import { DashboardBillingCreditAdjustment } from "@/shared/locale/namespaces";

export interface CreditAdjustFormProps {
  /** Student pre-selected through the credits list deep link (`?studentId=`). */
  readonly studentId: string | null;
}

export function CreditAdjustForm({ studentId: preselectedStudentId }: Readonly<CreditAdjustFormProps>) {
  const t = useAppTranslation(DashboardBillingCreditAdjustment);
  const common = useAppTranslation(Translation.Common);
  const userSelect = useAppTranslation(Translation.Ui.UserSelect);

  const adjustmentType = useCreditAdjustFormStore(state => state.adjustmentType);
  const storeStudentId = useCreditAdjustFormStore(state => state.studentId);
  const hours = useCreditAdjustFormStore(state => state.hours);
  const notes = useCreditAdjustFormStore(state => state.notes);
  const internalNotes = useCreditAdjustFormStore(state => state.internalNotes);
  const carryoverTeacherId = useCreditAdjustFormStore(state => state.carryoverTeacherId);
  const fromDate = useCreditAdjustFormStore(state => state.fromDate);
  const toDate = useCreditAdjustFormStore(state => state.toDate);
  const paymentDate = useCreditAdjustFormStore(state => state.paymentDate);
  const clientRequestId = useCreditAdjustFormStore(state => state.clientRequestId);

  // The picker renders full person records while the store keeps only the id.
  const [student, setStudent] = useState<PersonOption | null>(null);
  const [fieldErrors, setFieldErrors] = useState<CreditAdjustFieldErrors>({});
  const submittedTokenRef = useRef<string | null>(null);

  const [recordAdjustment, { loading: submitting }] = useMutation(recordCreditAdjustmentMutationDocument, {
    // Match the production client default: domain errors reject with
    // CombinedGraphQLErrors carrying `extensions.code` instead of resolving.
    errorPolicy: "none",
  });
  // The selected student (deep-linked or freshly picked) is the live-context
  // surface: fetch the full record whenever the store holds an id so the
  // summary card and the balance preview always reflect real data.
  const { data: selectedStudentData } = useQuery(studentByIdQueryDocument, {
    variables: { studentId: storeStudentId ?? "" },
    skip: storeStudentId === null,
  });

  useCreditAdjustFormSession(preselectedStudentId);

  const selectedRowRaw = selectedStudentData?.studentById;
  // A stale response for a previously selected student must never leak into
  // the display: only use the row while it still matches the store id.
  const selectedRow = selectedRowRaw?.id === storeStudentId ? selectedRowRaw : null;
  const displayedStudent: PersonOption | null =
    student ??
    (selectedRow?.id && selectedRow.name
      ? { id: selectedRow.id, name: selectedRow.name, avatarUrl: selectedRow.avatarUrl }
      : null);
  const studentSummary = selectedRow?.name ? selectedRow : null;

  const draft: CreditAdjustDraft = {
    studentId: storeStudentId,
    adjustmentType,
    hours,
    notes,
    internalNotes,
    carryoverTeacherId,
    fromDate,
    toDate,
    paymentDate,
  };
  // Carryover error highlights are re-derived from the live draft each render:
  // once a failed submit has flagged the section, fixing a field lifts its
  // error immediately instead of waiting for the next submit.
  const validationCopy = buildValidationCopy(userSelect.required, t.validation);
  const isCarryover = adjustmentType === CreditAdjustmentType.SUBTRACT_WITH_CARRYOVER;
  const carryoverErrors = resolveCarryoverErrors(fieldErrors, draft, validationCopy);
  const balancePreview = computeBalancePreview(studentSummary, adjustmentType, hours);
  const studentName = studentSummary?.name ?? null;
  const summaryText = studentName === null ? null : buildSummaryText(t, draft, studentName);

  const { handleStudentChange, handleHoursChange, handleNotesChange, handleInternalNotesChange, handleCancel } =
    useCreditAdjustFormHandlers({ setStudent, setFieldErrors });

  const { submitError, handleSubmit } = useCreditAdjustSubmit({
    draft,
    validationCopy,
    clientRequestId,
    submittedTokenRef,
    recordAdjustment,
    successLabels: t,
    operationFailed: common.operationFailed,
    insufficientClassesMessage: t.validation.insufficientClasses,
    setFieldErrors,
  });

  const state = {
    displayedStudent,
    studentSummary,
    balancePreview,
    isCarryover,
    carryoverErrors,
    submitError,
    summaryText,
    submitting,
  };
  const actions = {
    onStudentChange: handleStudentChange,
    onHoursChange: handleHoursChange,
    onNotesChange: handleNotesChange,
    onInternalNotesChange: handleInternalNotesChange,
    onCancel: handleCancel,
    onSubmit: handleSubmit,
  };

  return (
    <SectionPanel title={t.adjustCredits} subTitle={t.adjustCreditsSubtitle}>
      <CreditAdjustFormBody state={state} actions={actions} errors={fieldErrors} draft={draft} labels={{ t, common }} />
    </SectionPanel>
  );
}
