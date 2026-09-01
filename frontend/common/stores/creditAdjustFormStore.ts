"use client";

import { create } from "zustand";
import { CreditAdjustmentType } from "@/shared/constants/billing";

/**
 * Form state for the student credit adjustment flow.
 *
 * Carryover dates are held as ISO date strings (`string | null`), matching how
 * sibling forms round-trip date-picker values; the GraphQL mutation input also
 * accepts them as strings. Carryover fields stay independent from the student
 * selection so changing the student does not wipe a chosen carryover teacher.
 */
interface CreditAdjustFormFields {
  readonly studentId: string | null;
  readonly adjustmentType: CreditAdjustmentType;
  readonly hours: number | null;
  readonly notes: string;
  /** Plain-text operator note; staff-only, stored verbatim (never rich text). */
  readonly internalNotes: string;
  readonly carryoverTeacherId: string | null;
  readonly fromDate: string | null;
  readonly toDate: string | null;
  readonly paymentDate: string | null;
  /**
   * Client-side double-submit guard token. A fresh token is issued whenever a
   * new form session starts so a stale mounted copy cannot replay an earlier
   * submission. It is never sent to the server — adjustment idempotency is
   * derived server-side from the adjustment payload itself.
   */
  readonly clientRequestId: string;
}

export interface CreditAdjustFormState extends CreditAdjustFormFields {
  readonly setStudentId: (studentId: string | null) => void;
  readonly setAdjustmentType: (adjustmentType: CreditAdjustmentType) => void;
  readonly setHours: (hours: number | null) => void;
  readonly setNotes: (notes: string) => void;
  readonly setInternalNotes: (internalNotes: string) => void;
  readonly setCarryoverTeacherId: (carryoverTeacherId: string | null) => void;
  readonly setFromDate: (fromDate: string | null) => void;
  readonly setToDate: (toDate: string | null) => void;
  readonly setPaymentDate: (paymentDate: string | null) => void;
  /** Issues a fresh double-submit guard token for a new form session. */
  readonly regenerateClientRequestId: () => void;
  /** Clears all carryover fields when the adjustment type leaves the carryover path. */
  readonly clearCarryover: () => void;
  /** Restores the pristine form, issuing a fresh guard token. */
  readonly reset: () => void;
}

function buildInitialFields(): CreditAdjustFormFields {
  return {
    studentId: null,
    adjustmentType: CreditAdjustmentType.ADD,
    hours: null,
    notes: "",
    internalNotes: "",
    carryoverTeacherId: null,
    fromDate: null,
    toDate: null,
    paymentDate: null,
    clientRequestId: crypto.randomUUID(),
  };
}

/** Carryover-only slice, nulled out when the operator switches adjustment types. */
const clearedCarryoverFields = {
  carryoverTeacherId: null,
  fromDate: null,
  toDate: null,
  paymentDate: null,
} as const;

export const useCreditAdjustFormStore = create<CreditAdjustFormState>(set => ({
  ...buildInitialFields(),
  setStudentId: studentId => set({ studentId }),
  setAdjustmentType: adjustmentType => set({ adjustmentType }),
  setHours: hours => set({ hours }),
  setNotes: notes => set({ notes }),
  setInternalNotes: internalNotes => set({ internalNotes }),
  setCarryoverTeacherId: carryoverTeacherId => set({ carryoverTeacherId }),
  setFromDate: fromDate => set({ fromDate }),
  setToDate: toDate => set({ toDate }),
  setPaymentDate: paymentDate => set({ paymentDate }),
  regenerateClientRequestId: () => set({ clientRequestId: crypto.randomUUID() }),
  clearCarryover: () => set(clearedCarryoverFields),
  reset: () => set(buildInitialFields()),
}));
