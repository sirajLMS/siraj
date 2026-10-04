import { formatDateInput, parseDateInput } from "@/frontend/common/components/intl/dateFormat";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect/types";
import type {
  CreateCarryoverInput,
  CurrencyCode,
  UpdateCarryoverInput,
} from "@/frontend/common/graphql/generated/gql/graphql";
import {
  asValidDate,
  type CarryoverFormData,
  type CarryoverFormInput,
} from "@/frontend/common/views/dashboard/accounting/carryover/useCarryoverFormViewModel.schema";
import type { CarryoverFormRow } from "@/frontend/common/views/dashboard/accounting/carryover/useCarryoverFormViewModel.types";

/** Post-validation view of the form where the required picker fields are non-null. */
export type ValidCarryoverData = Omit<CarryoverFormData, "teacher" | "teacherCurrency"> & {
  readonly teacher: PersonOption;
  readonly teacherCurrency: CurrencyCode;
};

function buildTeacherOption(row: CarryoverFormRow): PersonOption | null {
  if (row.teacherId === null) return null;
  return { id: row.teacherId, name: row.teacherName ?? "", avatarUrl: row.teacherAvatarUrl ?? null };
}

/**
 * Fresh form values for a dialog session: blank for add mode, prefilled from
 * the carryover snapshot in edit mode.
 */
export function buildFormDefaults(row: CarryoverFormRow | null): CarryoverFormInput {
  return {
    teacher: row === null ? null : buildTeacherOption(row),
    fromDate: parseDateInput(row?.fromDate),
    toDate: parseDateInput(row?.toDate),
    payable: row?.payable ?? "",
    teacherCurrency: row?.teacherCurrency ?? null,
    studentsCount: row?.studentsCount == null ? "" : String(row.studentsCount),
    studentsText: row?.studentsText ?? "",
    note: row?.note ?? "",
  };
}

/** Optional non-negative whole count; blank or garbage input persists as "not provided". */
function toOptionalStudentCount(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed < 0) return null;
  return parsed;
}

/** Omitted (null) when blank so an untouched note/students text never reaches the wire. */
function toOptionalText(raw: string): string | null {
  const trimmed = raw.trim();
  return trimmed === "" ? null : trimmed;
}

function toOptionalIsoDate(value: Date | null): string | null {
  const parsed = asValidDate(value);
  return parsed === null ? null : formatDateInput(parsed);
}

/** Editable fields shared by the create patch and the update patch. */
function buildEditableCarryoverFields(data: CarryoverFormData) {
  return {
    fromDate: toOptionalIsoDate(data.fromDate),
    toDate: toOptionalIsoDate(data.toDate),
    payable: data.payable.trim(),
    teacherCurrency: data.teacherCurrency,
    studentsCount: toOptionalStudentCount(data.studentsCount),
    studentsText: toOptionalText(data.studentsText),
    note: toOptionalText(data.note),
  };
}

export function buildCreateCarryoverInput(data: ValidCarryoverData, clientRequestId: string): CreateCarryoverInput {
  return {
    ...buildEditableCarryoverFields(data),
    teacherId: data.teacher.id,
    teacherCurrency: data.teacherCurrency,
    clientRequestId,
  };
}

export function buildUpdateCarryoverInput(data: CarryoverFormData, id: string): UpdateCarryoverInput {
  return { id, ...buildEditableCarryoverFields(data) };
}

export { getGraphQLErrorCode, getGraphQLErrorMessage } from "@/frontend/common/views/dashboard/accounting/__shared__";
