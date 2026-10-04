import { CombinedGraphQLErrors } from "@apollo/client";
import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import { formatLockedAmount } from "@/frontend/common/lib/currency";
import type { SessionAuditReportRow } from "@/frontend/common/views/dashboard/billing/accounting/reports/useSessionAuditReportsViewModel";

/** Root fields dropped from the Apollo cache after a successful bulk creation. */
export const CARRYOVER_LIST_FIELD = "carryoverBalances";
export const SESSION_AUDIT_REPORT_FIELD = "sessionAuditReport";

/**
 * Selection-fatal domain rejections: the same selection can never succeed, so
 * the dialog surfaces the server-localized reason as a banner and disables the
 * confirm button until the operator closes and re-picks the sessions.
 */
export const TERMINAL_REJECTION_CODES: ReadonlySet<string> = new Set([
  "CARRYOVER_SESSION_NOT_AUDITED",
  "CARRYOVER_SESSION_ALREADY_LINKED",
]);

/** Number of decimals used when converting aggregated minutes into hours. */
const HOURS_FRACTION_DIGITS = 1;

export interface TeacherGroup {
  readonly teacherId: string;
  readonly teacherName: string;
  /** Selected session ids backing this teacher's carryover balance. */
  readonly count: number;
  /** Distinct students across the teacher's selected sessions. */
  readonly students: number;
  /** Audited duration (calculated, falling back to scheduled) in whole minutes. */
  readonly totalMinutes: number;
  /** Sum of the audited session payouts, kept numeric for the totals row. */
  readonly totalPaid: number;
  /** Currency of the teacher's audited payouts (first seen wins). */
  readonly currency: CurrencyCode | null;
}

export interface TotalsSummary {
  readonly sessions: number;
  readonly students: number;
  readonly totalMinutes: number;
  readonly totalPaid: number;
  readonly currency: CurrencyCode | null;
}

/** Audited minutes for a row: actual calculated duration first, scheduled as fallback. */
function rowMinutes(row: SessionAuditReportRow): number {
  if (typeof row.calculatedDuration === "number") return row.calculatedDuration;
  return row.durationMinutes ?? 0;
}

/** Session payout kept numeric for aggregation; unparseable cells read as zero. */
function rowPaidAmount(row: SessionAuditReportRow): number {
  if (row.teacherPaidAmount === null) return 0;
  const parsed = Number.parseFloat(row.teacherPaidAmount);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/** Mutable per-teacher accumulator used while folding the selected rows. */
interface TeacherGroupDraft {
  teacherId: string;
  teacherName: string;
  count: number;
  totalMinutes: number;
  totalPaid: number;
  currency: CurrencyCode | null;
  readonly studentIds: Set<string>;
}

/** Groups the selected rows by teacher, preserving first-seen order for the summary list. */
export function groupRowsByTeacher(rows: readonly SessionAuditReportRow[]): TeacherGroup[] {
  const groups = new Map<string, TeacherGroupDraft>();
  for (const row of rows) {
    const teacherId = row.teacherId ?? "";
    let draft = groups.get(teacherId);
    if (draft === undefined) {
      draft = {
        teacherId,
        teacherName: row.teacherName ?? "",
        count: 0,
        totalMinutes: 0,
        totalPaid: 0,
        currency: null,
        studentIds: new Set<string>(),
      };
      groups.set(teacherId, draft);
    }
    if (row.studentId !== null) draft.studentIds.add(row.studentId);
    draft.count += 1;
    draft.totalMinutes += rowMinutes(row);
    draft.totalPaid += rowPaidAmount(row);
    draft.currency ??= row.teacherPaidCurrency;
  }
  return [...groups.values()].map(({ studentIds, ...draft }) => Object.assign(draft, { students: studentIds.size }));
}

/** Whole-selection totals for the breakdown footer, summed per shared currency. */
export function summarizeTotals(
  rows: readonly SessionAuditReportRow[],
  groups: readonly TeacherGroup[]
): TotalsSummary {
  const studentIds = new Set<string>();
  let totalMinutes = 0;
  let totalPaid = 0;
  for (const row of rows) {
    if (row.studentId !== null) studentIds.add(row.studentId);
    totalMinutes += rowMinutes(row);
    totalPaid += rowPaidAmount(row);
  }
  const currencies = new Set(groups.flatMap(group => (group.currency === null ? [] : [group.currency])));
  return {
    sessions: rows.length,
    students: studentIds.size,
    totalMinutes,
    totalPaid,
    currency: currencies.size === 1 ? ([...currencies][0] ?? null) : null,
  };
}

/** Cache of `Intl.NumberFormat` instances keyed by locale tag to avoid CPU and GC overhead in dialog breakdown tables. */
const hoursFormatCache = new Map<string, Intl.NumberFormat>();

function getHoursNumberFormat(locale: string): Intl.NumberFormat {
  let formatter = hoursFormatCache.get(locale);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, { maximumFractionDigits: HOURS_FRACTION_DIGITS });
    hoursFormatCache.set(locale, formatter);
  }
  return formatter;
}

/** Renders minutes as locale-aware hours matching the "Duration (h)" header. */
export function formatHours(minutes: number, locale: string): string {
  return getHoursNumberFormat(locale).format(minutes / 60);
}

/** Money cell: currency snapshot when known, the shared muted dash otherwise. */
export function formatPayable(amount: number, currency: CurrencyCode | null, locale: string): string {
  if (currency === null) return "—";
  return formatLockedAmount(amount.toFixed(2), currency, locale);
}

/** Instances selected for the bulk creation; report rows always carry an instance id. */
export function selectedInstanceIds(rows: readonly SessionAuditReportRow[]): string[] {
  return rows.flatMap(row => (row.instanceId === null ? [] : [row.instanceId]));
}

export function getGraphQLErrorCode(error: unknown): string | undefined {
  if (!CombinedGraphQLErrors.is(error)) return undefined;
  const code: unknown = error.errors[0]?.extensions?.code;
  return typeof code === "string" ? code : undefined;
}
