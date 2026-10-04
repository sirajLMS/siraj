import type { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect/types";
import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import { CARRYOVER_NOTE_MAX_LENGTH } from "@/frontend/common/views/dashboard/accounting/carryover/useCarryoverFormViewModel.constants";

/**
 * Client mirror of the server-side carryover form rules: teacher and currency
 * are required, payable must be a non-negative number, both period bounds are
 * required, and the range must not be inverted. Messages come from the
 * carryover and shared user-select namespaces so both locales render.
 */
export interface CarryoverValidationCopy {
  readonly teacherRequired: string;
  readonly required: string;
  readonly dateRangeInvalid: string;
  readonly payableNegative: string;
  readonly currencyRequired: string;
  readonly noteTooLong: string;
}

function addPresenceIssues(values: CarryoverFormData, copy: CarryoverValidationCopy, ctx: z.RefinementCtx) {
  if (values.teacher === null) {
    ctx.addIssue({ code: "custom", message: copy.teacherRequired, path: ["teacher"] });
  }
  if (values.teacherCurrency === null) {
    ctx.addIssue({ code: "custom", message: copy.currencyRequired, path: ["teacherCurrency"] });
  }
  const payableRaw = values.payable.trim();
  if (payableRaw === "") {
    ctx.addIssue({ code: "custom", message: copy.required, path: ["payable"] });
    return;
  }
  const payable = Number(payableRaw);
  if (Number.isNaN(payable) || payable < 0) {
    ctx.addIssue({ code: "custom", message: copy.payableNegative, path: ["payable"] });
  }
}

/** A picker can hand over an invalid Date (unparseable keystrokes); those read as "missing". */
export function asValidDate(value: Date | null): Date | null {
  if (value === null) return null;
  return Number.isNaN(value.getTime()) ? null : value;
}

function addDateIssues(values: CarryoverFormData, copy: CarryoverValidationCopy, ctx: z.RefinementCtx) {
  const fromDate = asValidDate(values.fromDate);
  const toDate = asValidDate(values.toDate);
  if (fromDate === null) {
    ctx.addIssue({ code: "custom", message: copy.required, path: ["fromDate"] });
  }
  if (toDate === null) {
    ctx.addIssue({ code: "custom", message: copy.required, path: ["toDate"] });
  }
  if (fromDate !== null && toDate !== null && fromDate.getTime() > toDate.getTime()) {
    ctx.addIssue({ code: "custom", message: copy.dateRangeInvalid, path: ["fromDate"] });
    ctx.addIssue({ code: "custom", message: copy.dateRangeInvalid, path: ["toDate"] });
  }
}

export function createCarryoverFormSchema(copy: CarryoverValidationCopy) {
  return z
    .object({
      teacher: z.custom<PersonOption | null>(value => value === null || typeof value === "object"),
      fromDate: z.custom<Date | null>(value => value === null || value instanceof Date),
      toDate: z.custom<Date | null>(value => value === null || value instanceof Date),
      payable: z.string(),
      teacherCurrency: z.custom<CurrencyCode | null>(value => value === null || typeof value === "string"),
      // Parsed leniently (empty or non-integer text becomes null); the count is
      // optional so an unparseable trailing value degrades to "not provided"
      // rather than blocking the whole write.
      studentsCount: z.string(),
      studentsText: z.string(),
      note: z.string().max(CARRYOVER_NOTE_MAX_LENGTH, copy.noteTooLong),
    })
    .superRefine((values, ctx) => {
      addPresenceIssues(values, copy, ctx);
      addDateIssues(values, copy, ctx);
    });
}

export type CarryoverFormInput = z.input<ReturnType<typeof createCarryoverFormSchema>>;

export type CarryoverFormData = z.output<ReturnType<typeof createCarryoverFormSchema>>;

export type CarryoverFormReturn = UseFormReturn<CarryoverFormInput, undefined, CarryoverFormData>;
