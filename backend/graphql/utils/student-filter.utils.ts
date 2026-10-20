/**
 * Canonical GraphQL-layer student filter-args mapping.
 *
 * Converts the loose GraphQL filter-args input into the typed
 * {@link StudentFilterArgs} contract consumed by the student services.
 * All student query resolvers should import from this module instead of
 * re-implementing the args mapping and enum guards locally.
 */

import { AppLanguage } from "@/backend/enum/auth/auth.enum";
import { StudentStatus } from "@/backend/enum/students/student-lifecycle.enum";
import { Gender } from "@/backend/enum/users/user.enum";
import type { StudentFilterArgs } from "@/backend/types";

/**
 * All-fields-undefined base for {@link StudentFilterArgs}. The type requires
 * every key to be present (with a `| null | undefined` value), so partial
 * literals cannot satisfy it directly — spread this base and override the
 * populated fields.
 */
export const EMPTY_STUDENT_FILTER_ARGS: StudentFilterArgs = {
  name: undefined,
  nameNotContains: undefined,
  nameEquals: undefined,
  nameNotEquals: undefined,
  nameStartsWith: undefined,
  nameEndsWith: undefined,
  nameIsEmpty: undefined,
  nameIsNotEmpty: undefined,
  parentId: undefined,
  primaryTeacherId: undefined,
  gender: undefined,
  language: undefined,
  status: undefined,
  createdAt: undefined,
  createdAtNot: undefined,
  createdAtFrom: undefined,
  createdAtTo: undefined,
  createdAtAfter: undefined,
  createdAtBefore: undefined,
  createdAtOnOrAfter: undefined,
  createdAtOnOrBefore: undefined,
  createdAtIsEmpty: undefined,
  createdAtIsNotEmpty: undefined,
  birthDate: undefined,
  birthDateNot: undefined,
  birthDateFrom: undefined,
  birthDateTo: undefined,
  birthDateAfter: undefined,
  birthDateBefore: undefined,
  birthDateOnOrAfter: undefined,
  birthDateOnOrBefore: undefined,
  birthDateIsEmpty: undefined,
  birthDateIsNotEmpty: undefined,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Module-level Set caches to avoid repeated `Object.values()` array allocations
 * and linear O(N) `.includes()` array scans on every GraphQL filter mapping call.
 */
const GENDER_SET = new Set<string>(Object.values(Gender));
const APP_LANGUAGE_SET = new Set<string>(Object.values(AppLanguage));
const STUDENT_STATUS_SET = new Set<string>(Object.values(StudentStatus));

function isGender(value: unknown): value is StudentFilterArgs["gender"] {
  return typeof value === "string" && GENDER_SET.has(value);
}

function isAppLanguage(value: unknown): value is StudentFilterArgs["language"] {
  return typeof value === "string" && APP_LANGUAGE_SET.has(value);
}

function isStudentStatus(value: unknown): value is StudentFilterArgs["status"] {
  return typeof value === "string" && STUDENT_STATUS_SET.has(value);
}

function pickString(record: Record<string, unknown>, key: string): string | undefined {
  const val = record[key];
  return typeof val === "string" ? val : undefined;
}

function pickBoolean(record: Record<string, unknown>, key: string): boolean | undefined {
  const val = record[key];
  return typeof val === "boolean" ? val : undefined;
}

function pickDate(record: Record<string, unknown>, key: string): Date | undefined {
  const val = record[key];
  return val instanceof Date ? val : undefined;
}

/**
 * Map a GraphQL filter-args input into the typed service-level
 * {@link StudentFilterArgs}. Unknown keys are ignored, enum values are
 * validated against the canonical backend enums, and every unmapped field
 * resolves to `undefined`.
 */
function toStudentFilterArgs(value: unknown): StudentFilterArgs {
  if (!isRecord(value)) return EMPTY_STUDENT_FILTER_ARGS;
  return {
    ...EMPTY_STUDENT_FILTER_ARGS,
    name: pickString(value, "name"),
    nameNotContains: pickString(value, "nameNotContains"),
    nameEquals: pickString(value, "nameEquals"),
    nameNotEquals: pickString(value, "nameNotEquals"),
    nameStartsWith: pickString(value, "nameStartsWith"),
    nameEndsWith: pickString(value, "nameEndsWith"),
    nameIsEmpty: pickBoolean(value, "nameIsEmpty"),
    nameIsNotEmpty: pickBoolean(value, "nameIsNotEmpty"),
    parentId: pickString(value, "parentId"),
    primaryTeacherId: pickString(value, "primaryTeacherId"),
    gender: isGender(value.gender) ? value.gender : undefined,
    language: isAppLanguage(value.language) ? value.language : undefined,
    status: isStudentStatus(value.status) ? value.status : undefined,
    createdAt: pickDate(value, "createdAt"),
    createdAtNot: pickDate(value, "createdAtNot"),
    createdAtFrom: pickDate(value, "createdAtFrom"),
    createdAtTo: pickDate(value, "createdAtTo"),
    createdAtAfter: pickDate(value, "createdAtAfter"),
    createdAtBefore: pickDate(value, "createdAtBefore"),
    createdAtOnOrAfter: pickDate(value, "createdAtOnOrAfter"),
    createdAtOnOrBefore: pickDate(value, "createdAtOnOrBefore"),
    createdAtIsEmpty: pickBoolean(value, "createdAtIsEmpty"),
    createdAtIsNotEmpty: pickBoolean(value, "createdAtIsNotEmpty"),
    birthDate: pickDate(value, "birthDate"),
    birthDateNot: pickDate(value, "birthDateNot"),
    birthDateFrom: pickDate(value, "birthDateFrom"),
    birthDateTo: pickDate(value, "birthDateTo"),
    birthDateAfter: pickDate(value, "birthDateAfter"),
    birthDateBefore: pickDate(value, "birthDateBefore"),
    birthDateOnOrAfter: pickDate(value, "birthDateOnOrAfter"),
    birthDateOnOrBefore: pickDate(value, "birthDateOnOrBefore"),
    birthDateIsEmpty: pickBoolean(value, "birthDateIsEmpty"),
    birthDateIsNotEmpty: pickBoolean(value, "birthDateIsNotEmpty"),
  };
}

/**
 * Null-safe variant of {@link toStudentFilterArgs}: returns `null` when the
 * input is null/undefined so resolvers can pass the result straight through
 * to services that accept `StudentFilterArgs | null`.
 */
export function toStudentFilterArgsOrNull(value: unknown): StudentFilterArgs | null {
  return value == null ? null : toStudentFilterArgs(value);
}
