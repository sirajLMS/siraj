import type { ChangeEvent } from "react";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect/types";
import type {
  CreditAdjustmentInput,
  StudentByIdQuery_studentById,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type { CarryoverBannerErrors } from "@/frontend/common/views/dashboard/accounting/credits/CarryoverBanner";
import type { CreditAdjustmentType } from "@/shared/constants/billing";
import type { CreditAdjustmentLabels } from "@/shared/locale/types/dashboard/billing/creditAdjustment";

export interface CreditAdjustFieldErrors {
  readonly student?: string;
  readonly hours?: string;
  readonly notes?: string;
  readonly carryover?: CarryoverBannerErrors;
}

export interface CreditAdjustDraft {
  readonly studentId: string | null;
  readonly adjustmentType: CreditAdjustmentType;
  readonly hours: number | null;
  readonly notes: string;
  readonly internalNotes: string;
  readonly carryoverTeacherId: string | null;
  readonly fromDate: string | null;
  readonly toDate: string | null;
  readonly paymentDate: string | null;
}

/** Copy slice the validator needs; assembled from the credit-adjustment and user-select namespaces. */
export interface CreditAdjustValidationCopy {
  readonly required: string;
  readonly hoursPositive: string;
  readonly fromAfterTo: string;
  readonly paymentTooFar: string;
}

/** Previewable balance pair; null until the row loads and hours is valid. */
export interface BalancePreview {
  readonly from: number;
  readonly to: number;
}

/** Rows whose balance fields can drive the preview (the fetched student record). */
export interface BalancePreviewSource {
  readonly classesRemaining: number | null;
}

export interface CreditAdjustmentLabelsForSuccess {
  readonly success: {
    readonly added: (hours: number) => string;
    readonly subtracted: (hours: number) => string;
    readonly carryover: (hours: number, teacher: string) => string;
  };
}

export interface CreditAdjustmentLabelsForSummary {
  readonly summary: {
    readonly add: (hours: number, student: string) => string;
    readonly subtract: (hours: number, student: string) => string;
    readonly carryover: (hours: number, teacher: string, paymentDate: string) => string;
  };
}

/** Authoritative server rejection shown in the full-width band above the actions. */
export interface SubmitError {
  readonly code: string | undefined;
  readonly message: string;
}

export type RecordAdjustment = (options: {
  readonly variables: { readonly input: CreditAdjustmentInput };
}) => Promise<unknown>;

export interface CreditAdjustFormBodyLabels {
  readonly t: CreditAdjustmentLabels;
  readonly common: { readonly cancel: string };
}

interface CreditAdjustFormBodyState {
  readonly displayedStudent: PersonOption | null;
  readonly studentSummary: StudentByIdQuery_studentById | null;
  readonly balancePreview: BalancePreview | null;
  readonly isCarryover: boolean;
  readonly carryoverErrors: CarryoverBannerErrors | undefined;
  readonly submitError: SubmitError | null;
  readonly summaryText: string | null;
  readonly submitting: boolean;
}

interface CreditAdjustFormBodyActions {
  readonly onStudentChange: (next: PersonOption | null) => void;
  readonly onHoursChange: (event: ChangeEvent<HTMLInputElement>) => void;
  readonly onNotesChange: (html: string) => void;
  readonly onInternalNotesChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  readonly onCancel: () => void;
  readonly onSubmit: () => void;
}

export interface CreditAdjustFormBodyProps {
  readonly state: CreditAdjustFormBodyState;
  readonly actions: CreditAdjustFormBodyActions;
  readonly errors: CreditAdjustFieldErrors;
  readonly draft: CreditAdjustDraft;
  readonly labels: CreditAdjustFormBodyLabels;
}
