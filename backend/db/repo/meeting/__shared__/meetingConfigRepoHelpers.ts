import type { Column } from "drizzle-orm";
import { eq, isNull } from "drizzle-orm";
import type { ErrorsLabels } from "@/shared/locale";

/**
 * Label equality helper — `eq(labelColumn, label)` when label is truthy,
 * `isNull(labelColumn)` when label is null/undefined.
 *
 * Shared between `classMeetingConfigs` and `userMeetingConfigs` repos
 * to eliminate the identical `labelCondition` function duplicated in both.
 */
export function labelCondition(labelColumn: Column, label: string | null | undefined) {
  return label ? eq(labelColumn, label) : isNull(labelColumn);
}

/**
 * Returns the row if non-null, otherwise throws `meetingConfigNotFound`.
 *
 * Shared between both meeting config repos — each repo's `getByIdOrThrow`
 * delegates here after fetching the row, eliminating the duplicated
 * null-check + throw pattern.
 */
export function requireConfigOrThrow<TSelect>(row: TSelect | null, id: string, tErrors: ErrorsLabels): TSelect {
  if (row) return row;
  throw new Error(tErrors.meetingConfigNotFound(id));
}
