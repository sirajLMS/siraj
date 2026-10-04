import { VALID_GENDER_VALUES, VALID_SORT_BY_VALUES } from "@/frontend/common/stores/searchScheduleStore.constants";
import type { PersistedSearchScheduleState } from "@/frontend/common/stores/searchScheduleStore.types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasValidTeacherFields(value: unknown): boolean {
  return isRecord(value) && typeof value.id === "string" && typeof value.name === "string";
}

function isValidEnumValue<T extends string>(value: unknown, validValues: readonly T[]): value is T {
  return typeof value === "string" && (validValues as readonly string[]).includes(value);
}

function isValidNullableNumber(value: unknown): boolean {
  return value === null || (typeof value === "number" && Number.isFinite(value));
}

export function isPersistedSearchScheduleState(value: unknown): value is PersistedSearchScheduleState {
  if (!isRecord(value)) {
    return false;
  }
  const v = value;

  const requiredKeys = [
    "draftFilters",
    "selectedTeacher",
    "pageSize",
    "monthDrawerAnchorFromDate",
    "monthDrawerCurrentMonth",
    "monthDrawerTeacher",
  ] as const;
  if (!requiredKeys.every(key => key in v)) {
    return false;
  }

  // pageSize must be a finite positive integer.
  if (typeof v.pageSize !== "number" || !Number.isFinite(v.pageSize) || v.pageSize < 1) {
    return false;
  }

  // String-shaped lifted UI state.
  if (typeof v.monthDrawerAnchorFromDate !== "string" || typeof v.monthDrawerCurrentMonth !== "string") {
    return false;
  }

  // selectedTeacher may be null — missing/invalid resets to null on merge.
  if (v.selectedTeacher !== null && !hasValidTeacherFields(v.selectedTeacher)) {
    return false;
  }

  const draft = v.draftFilters;
  if (!isRecord(draft)) {
    return false;
  }

  // sortBy is required and must be a known enum value (post-JSON.parse string drift protection).
  if (!isValidEnumValue(draft.sortBy, VALID_SORT_BY_VALUES)) {
    return false;
  }

  // gender is nullable — null is valid; non-null must be a known enum value.
  if (draft.gender !== null && !isValidEnumValue(draft.gender, VALID_GENDER_VALUES)) {
    return false;
  }

  // minAvailableDays / minTotalGaps are nullable finite numbers.
  if (!isValidNullableNumber(draft.minAvailableDays) || !isValidNullableNumber(draft.minTotalGaps)) {
    return false;
  }

  // daysOfWeek is nullable; when present it must be an array of DayOfWeek enum strings.
  if (draft.daysOfWeek !== null) {
    if (!Array.isArray(draft.daysOfWeek) || !draft.daysOfWeek.every((d: unknown) => typeof d === "string")) {
      return false;
    }
  }

  return true;
}
