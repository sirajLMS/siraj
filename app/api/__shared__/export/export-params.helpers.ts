import { ValidationError } from "@/backend/lib";
import { readTrimmedParam } from "@/shared/lib/query-params.helpers";
import type { ErrorsLabels } from "@/shared/locale";

/** Free-text search bound shared by the CSV export filter inputs. */
const SEARCH_MAX_LENGTH = 200;

/** Reads one query param and validates it: absent/blank → null, invalid value → localized 400 error. */
export function readValidatedParam(
  searchParams: URLSearchParams,
  name: string,
  isValid: (value: string) => boolean,
  tErrors: ErrorsLabels
): string | null {
  const value = readTrimmedParam(searchParams, name);
  if (value === null) {
    return null;
  }
  if (!isValid(value)) {
    throw new ValidationError(tErrors.invalidInput);
  }
  return value;
}

export function isSearchWithinLimit(value: string): boolean {
  return value.length <= SEARCH_MAX_LENGTH;
}

/**
 * Accepts both repeatable params (`?x=A&x=B`) and comma-separated values
 * (`?x=A,B`); absent/blank → null, unknown member → localized 400 error.
 */
export function parseEnumListParam<T extends string>(
  searchParams: URLSearchParams,
  name: string,
  isMember: (value: string) => value is T,
  tErrors: ErrorsLabels
): T[] | null {
  const rawValues = searchParams
    .getAll(name)
    .flatMap(raw => raw.split(","))
    .map(raw => raw.trim())
    .filter(raw => raw !== "");
  if (rawValues.length === 0) {
    return null;
  }
  const members: T[] = [];
  for (const rawValue of rawValues) {
    if (!isMember(rawValue)) {
      throw new ValidationError(tErrors.invalidInput);
    }
    members.push(rawValue);
  }
  return members;
}
