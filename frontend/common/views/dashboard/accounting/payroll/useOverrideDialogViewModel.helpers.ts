"use client";

import { z } from "zod";
import {
  CalculationStatus,
  type CurrencyCode,
  type PayrollOverrideInput,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type { PayrollReportRow } from "@/frontend/common/views/dashboard/accounting/payroll/usePayrollReportsViewModel";
import type { PayrollLabels } from "@/shared/locale/types/dashboard/billing/payroll";

/** Terminal domain rejections the dialog maps onto inline banners. */
export const ALREADY_PAID_ERROR_CODE = "PAYROLL_ALREADY_PAID";
export const AWAITING_SETTLEMENT_ERROR_CODE = "PAYROLL_AWAITING_SETTLEMENT";

/** Server-side cap on the persisted operator note, mirrored so typing stops at the limit. */
export const NOTE_MAX_LENGTH = 2000;

/** Server-side percentage bounds (whole numbers), mirrored for the Partially target. */
const MIN_PARTIAL_PERCENTAGE = 0;
const MAX_PARTIAL_PERCENTAGE = 100;

/** Target statuses an operator may pick; the terminal Paid/Waiting Paid states are not overridable targets. */
const OVERRIDE_TARGET_STATUSES = [
  CalculationStatus.Refund,
  CalculationStatus.Calculated,
  CalculationStatus.NotCalculated,
  CalculationStatus.Partially,
] as const;

type OverrideTargetStatus = (typeof OVERRIDE_TARGET_STATUSES)[number];

const OVERRIDE_TARGET_VALUE_SET: ReadonlySet<string> = new Set(OVERRIDE_TARGET_STATUSES);

export function isOverrideTargetValue(value: string): value is OverrideTargetStatus {
  return OVERRIDE_TARGET_VALUE_SET.has(value);
}

/**
 * Client mirror of the server-side override rules: percentage is a whole
 * number 0–100 required for Partially, and the note is required for Refund and
 * Partially. Messages come from the payroll namespace so both locales render.
 * The percentage bounds apply only on the Partially target — the server runs
 * its percentage check solely for PARTIALLY, so a stale value left in the
 * hidden field must never block the other targets.
 */
export function createOverrideSchema(labels: PayrollLabels) {
  return z
    .object({
      targetStatus: z.enum(OVERRIDE_TARGET_STATUSES),
      // Parsed leniently (empty or unparseable text becomes null); the range
      // rules live in superRefine so they stay conditional on the target.
      partialPercentage: z.string().transform(value => {
        const trimmed = value.trim();
        if (trimmed === "") return null;
        const parsed = Number(trimmed);
        return Number.isNaN(parsed) ? null : parsed;
      }),
      note: z.string().max(NOTE_MAX_LENGTH),
      force: z.boolean(),
    })
    .superRefine((data, ctx) => {
      if (data.targetStatus === CalculationStatus.Partially) {
        const percentage = data.partialPercentage;
        if (
          percentage === null ||
          !Number.isInteger(percentage) ||
          percentage < MIN_PARTIAL_PERCENTAGE ||
          percentage > MAX_PARTIAL_PERCENTAGE
        ) {
          ctx.addIssue({ code: "custom", message: labels.validation.percentageRequired, path: ["partialPercentage"] });
        }
      }
      const noteRequired =
        data.targetStatus === CalculationStatus.Refund || data.targetStatus === CalculationStatus.Partially;
      if (noteRequired && data.note.trim() === "") {
        ctx.addIssue({ code: "custom", message: labels.validation.noteRequired, path: ["note"] });
      }
    });
}

export type OverrideFormInput = z.input<ReturnType<typeof createOverrideSchema>>;
export type OverrideFormData = z.output<ReturnType<typeof createOverrideSchema>>;

export function buildDefaultValues(): OverrideFormInput {
  return {
    targetStatus: CalculationStatus.Calculated,
    partialPercentage: "",
    note: "",
    force: false,
  };
}

/** One selectable override target with its localized label (label text includes the helper copy). */
export interface OverrideTargetOption {
  readonly value: OverrideTargetStatus;
  readonly label: string;
}

export function buildTargetOptions(labels: PayrollLabels["override"]): readonly OverrideTargetOption[] {
  return [
    { value: CalculationStatus.Refund, label: labels.target.Refund },
    { value: CalculationStatus.Calculated, label: labels.target.Calculated },
    { value: CalculationStatus.NotCalculated, label: labels.target.NotCalculated },
    { value: CalculationStatus.Partially, label: labels.target.Partially },
  ];
}

/** Bridges the locale status labels (literal keys) onto the generated enum keys the status chip consumes. */
export function toStatusLabels(labels: PayrollLabels): Record<CalculationStatus, string> {
  return {
    [CalculationStatus.NotCalculated]: labels.status.NOT_CALCULATED,
    [CalculationStatus.Calculated]: labels.status.CALCULATED,
    [CalculationStatus.Partially]: labels.status.PARTIALLY,
    [CalculationStatus.Refund]: labels.status.REFUND,
    [CalculationStatus.WaitingPaid]: labels.status.WAITING_PAID,
    [CalculationStatus.Paid]: labels.status.PAID,
  };
}

/** Read-only snapshot of the row's current calculation values shown in the summary card. */
export interface OverrideSummaryValues {
  readonly calculationStatus: CalculationStatus | null;
  readonly teacherPaidAmount: string | null;
  readonly teacherPaidCurrency: CurrencyCode | null;
  readonly calculatedDuration: number | null;
  readonly isPartialPercentage: number | null;
  readonly payrollNote: string | null;
}

/**
 * Payroll snapshot the dialog consumes: the override target id plus the current
 * calculation values shown in the summary card. The payroll report's full row
 * satisfies this narrower shape, so report pages pass rows unchanged while
 * other surfaces (for example a per-instance detail view) can supply an
 * instance-scoped snapshot with only these members.
 */
export type OverrideDialogRow = Pick<
  PayrollReportRow,
  | "instanceId"
  | "calculationStatus"
  | "teacherPaidAmount"
  | "teacherPaidCurrency"
  | "calculatedDuration"
  | "isPartialPercentage"
  | "payrollNote"
>;

export function buildOverrideInput(
  data: OverrideFormData,
  instanceId: string,
  clientRequestId: string
): PayrollOverrideInput {
  const note = data.note.trim();
  const isPartial = data.targetStatus === CalculationStatus.Partially;
  return {
    instanceId,
    targetStatus: data.targetStatus,
    partialPercentage: isPartial ? data.partialPercentage : null,
    note: note === "" ? null : note,
    force: data.force,
    clientRequestId,
  };
}

/** Domain rejection surfacing as an inline banner; null means no banner. */
export type OverrideRejection = "alreadyPaid" | "awaitingSettlement";

export { getGraphQLErrorCode, getGraphQLErrorMessage } from "@/frontend/common/views/dashboard/accounting/__shared__";
