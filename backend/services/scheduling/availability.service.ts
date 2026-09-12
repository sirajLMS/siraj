import type { db } from "@/backend/db/drizzleDb";
import { SchedulingRepository } from "@/backend/db/repo/scheduling";
import { TeacherAvailabilityRepository } from "@/backend/db/repo/teachers/teacher-availability.repository";
import { VacationRequestStatus } from "@/backend/enum";
import { ValidationError } from "@/backend/lib/errors";
import { logger } from "@/backend/lib/logger";
import {
  computeSlotBounds,
  getUtcDateString,
  isVacationRequestStatus,
  timeToMinutes,
  validateSlotInMemory,
} from "@/backend/services/scheduling/availability.helpers";
import type {
  AssertSchedulePatternAvailableInput,
  AvailabilitySearchResult,
  AvailableClassSlot,
  CrossStaffSearchInput,
  DBTransaction,
  ProcessVacationRequestInput,
  SlotAvailabilityInput,
  SubmitVacationRequestInput,
  TeacherVacationRequestSelectType,
} from "@/backend/types";
import { getServerTranslations } from "@/shared/locale";

type ReadExecutor = DBTransaction | typeof db;

// Type guard: `ReadExecutor` is a union of `DBTransaction | typeof db`. Both
// members share Drizzle's query interface, so repositories treat them
// interchangeably. We cannot reliably distinguish them at runtime, so this
// guard accepts any `ReadExecutor` as a `DBTransaction`.
const isDbTransaction = (_tx: ReadExecutor): _tx is DBTransaction => true;

// Helper to narrow `ReadExecutor` to `DBTransaction` for repository calls.
const txParam = (tx?: ReadExecutor): DBTransaction | undefined =>
  tx !== undefined && isDbTransaction(tx) ? tx : undefined;

export namespace AvailabilityService {
  export const isSlotAvailable = async (input: SlotAvailabilityInput, tx?: ReadExecutor): Promise<boolean> => {
    const { studentId, teacherId, startAt, endAt, ignoreInstanceIds = [], locale } = input;
    const hasConflict = await SchedulingRepository.hasOverlappingInstance(
      studentId,
      teacherId,
      startAt,
      endAt,
      ignoreInstanceIds,
      txParam(tx)
    );

    if (hasConflict) return false;

    // Check teacher availability windows, unavailability, and vacations
    try {
      await AvailabilityService.validateBookingAvailability(teacherId, startAt, endAt, txParam(tx), locale ?? "en");
    } catch (error) {
      logger.debug(error);
      return false;
    }

    return true;
  };

  export const assertSchedulePatternAvailable = async (input: AssertSchedulePatternAvailableInput): Promise<void> => {
    const { studentId, teacherId, days, startDate, endDate, options = {} } = input;
    const { ignoreInstanceIds = [], locale = "en", tx, durationMinutes = 60, timezone = "UTC" } = options;
    const occurrences = buildPatternOccurrences(days, startDate, endDate, durationMinutes, timezone);

    if (occurrences.length === 0) return;

    const firstStart = occurrences.at(0)?.start;
    const lastEnd = occurrences.at(-1)?.end;

    if (!firstStart || !lastEnd) {
      return;
    }

    // Batch-fetch all overlapping instances for the entire occurrence range in one query (via repository)
    const overlappingInstances = await SchedulingRepository.findOverlappingInstancesForRange(
      studentId,
      teacherId,
      firstStart,
      lastEnd,
      ignoreInstanceIds,
      txParam(tx)
    );

    // Check each occurrence against the pre-fetched overlapping instances in memory
    for (const occ of occurrences) {
      const conflicts = overlappingInstances.filter(
        inst => inst.scheduledStartAt < occ.end && inst.scheduledEndAt > occ.start
      );
      if (conflicts.length > 0) {
        const tErrors = getServerTranslations(locale).errorsTranslations;
        throw new ValidationError(tErrors.invalidInput);
      }
    }

    // Single batched teacher-availability validation for all occurrences (3 DB queries total)
    try {
      await AvailabilityService.validateBookingAvailabilityBatch(
        teacherId,
        occurrences.map(occ => ({ startTime: occ.start, endTime: occ.end })),
        txParam(tx),
        locale
      );
    } catch (error) {
      logger.error(error);
      const tErrors = getServerTranslations(locale).errorsTranslations;
      throw new ValidationError(tErrors.invalidInput);
    }
  };

  /**
   * Find available class slots for a student on a given date.
   * Generates candidate slots (default 60-min) throughout the day and checks
   * both teacher availability and class-instance conflicts in batch.
   *
   * @param studentId - The student to find slots for
   * @param date - The date (UTC) to search on
   * @param teacherId - Optional specific teacher; if omitted, returns empty
   * @param durationMinutes - Slot duration (default 60)
   * @param tx - Optional transaction
   * @param locale - Locale for error messages
   */
  type FindAvailableSlotsOptions = {
    studentId: string;
    date: Date;
    teacherId?: string | null;
    durationMinutes?: number;
    tx?: ReadExecutor;
    locale?: string;
  };

  // Type guard: checks if a value is a FindAvailableSlotsOptions object.

  // Type guard: checks if a value is a Drizzle-compatible query executor.

  export const findAvailableSlots = async (options: FindAvailableSlotsOptions): Promise<AvailableClassSlot[]> => {
    return findAvailableSlotsImpl(options);
  };

  // Implementation that accepts a single options object (keeps logic isolated and testable)
  async function findAvailableSlotsImpl(options: FindAvailableSlotsOptions): Promise<AvailableClassSlot[]> {
    const { studentId, date, teacherId = null, durationMinutes = 60, tx, locale = "en" } = options;
    if (!teacherId) return [];

    // Build candidate slots from 00:00 to 24:00 UTC on the given date
    const dayStart = new Date(date);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    const candidates: { startTime: Date; endTime: Date }[] = [];
    const slotMs = durationMinutes * 60 * 1000;
    for (let t = dayStart.getTime(); t + slotMs <= dayEnd.getTime(); t += slotMs) {
      candidates.push({ startTime: new Date(t), endTime: new Date(t + slotMs) });
    }

    if (candidates.length === 0) return [];

    const firstCandidateStart = candidates.at(0)?.startTime;
    const lastCandidateEnd = candidates.at(-1)?.endTime;

    if (!firstCandidateStart || !lastCandidateEnd) {
      return [];
    }

    // Batch-check teacher availability (returns boolean[] — no throw)
    const teacherAvailable = await AvailabilityService.checkBookingAvailabilityBatch(
      teacherId,
      candidates,
      txParam(tx),
      locale
    );

    // Batch-fetch all overlapping instances for the entire candidate range in one query
    const overlappingInstances = await SchedulingRepository.findOverlappingInstancesForRange(
      studentId,
      teacherId,
      firstCandidateStart,
      lastCandidateEnd,
      [],
      txParam(tx)
    );

    // Filter to slots where teacher is available, then check class conflicts in memory
    const result: AvailableClassSlot[] = [];
    for (let i = 0; i < candidates.length; i++) {
      const slot = candidates[i];
      if (!slot || !teacherAvailable[i]) continue;

      const hasConflict = overlappingInstances.some(
        inst => inst.scheduledStartAt < slot.endTime && inst.scheduledEndAt > slot.startTime
      );

      result.push({ teacherId, startAt: slot.startTime, endAt: slot.endTime, available: !hasConflict });
    }

    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Booking availability validation (moved from repository — business logic)
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Validates that a teacher is available for the requested booking time.
   * Checks vacation conflicts, recurring unavailability patterns, and
   * availability windows — throws ValidationError on the first failure.
   */
  export const validateBookingAvailability = async (
    teacherId: string,
    startTime: Date,
    endTime: Date,
    tx?: DBTransaction,
    locale?: string
  ): Promise<void> => {
    const { vacationsRows, unavailabilityRows, windowRows } =
      await TeacherAvailabilityRepository.fetchBookingAvailabilityData(teacherId, startTime, endTime, tx);

    validateSlotInMemory({ startTime, endTime }, vacationsRows, unavailabilityRows, windowRows, locale);
  };

  /**
   * Batched validation of a teacher's availability for multiple occurrences.
   * Fetches data in 3 queries, then validates each slot in-memory.
   * Throws the first conflict error.
   */
  export const validateBookingAvailabilityBatch = async (
    teacherId: string,
    slots: { startTime: Date; endTime: Date }[],
    tx?: DBTransaction,
    locale?: string
  ): Promise<void> => {
    if (slots.length === 0) return;
    const { earliestStart, latestEnd } = computeSlotBounds(slots);
    const { vacationsRows, unavailabilityRows, windowRows } =
      await TeacherAvailabilityRepository.fetchBookingAvailabilityData(teacherId, earliestStart, latestEnd, tx);

    for (const slot of slots) {
      validateSlotInMemory(slot, vacationsRows, unavailabilityRows, windowRows, locale);
    }
  };

  /**
   * Non-throwing batched availability check. Returns boolean[] (same order as slots).
   * true = available, false = conflicts with vacation, unavailability, or
   * falls outside availability windows.
   */
  export const checkBookingAvailabilityBatch = async (
    teacherId: string,
    slots: { startTime: Date; endTime: Date }[],
    tx?: DBTransaction,
    locale?: string
  ): Promise<boolean[]> => {
    if (slots.length === 0) return [];
    const { earliestStart, latestEnd } = computeSlotBounds(slots);
    const { vacationsRows, unavailabilityRows, windowRows } =
      await TeacherAvailabilityRepository.fetchBookingAvailabilityData(teacherId, earliestStart, latestEnd, tx);

    return slots.map(slot => {
      try {
        validateSlotInMemory(slot, vacationsRows, unavailabilityRows, windowRows, locale);
        return true;
      } catch {
        return false;
      }
    });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Vacation workflow (moved from repository — business state machine)
  // ─────────────────────────────────────────────────────────────────────────────

  export const submitVacationRequest = async (
    input: SubmitVacationRequestInput,
    requestedByUserId: string,
    teacherId: string,
    tx?: DBTransaction,
    locale?: string
  ): Promise<TeacherVacationRequestSelectType> => {
    if (input.startAt >= input.endAt) {
      const errorsTranslations = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new ValidationError(errorsTranslations.scheduling.vacationStartBeforeEnd);
    }

    return TeacherAvailabilityRepository.insertVacationRequest(input, requestedByUserId, teacherId, tx);
  };

  export const approveVacationRequest = async (
    input: ProcessVacationRequestInput,
    processedByUserId: string,
    tx?: DBTransaction,
    locale?: string
  ): Promise<TeacherVacationRequestSelectType> => {
    return processVacationRequest(input, VacationRequestStatus.APPROVED, processedByUserId, tx, locale);
  };

  export const rejectVacationRequest = async (
    input: ProcessVacationRequestInput,
    processedByUserId: string,
    tx?: DBTransaction,
    locale?: string
  ): Promise<TeacherVacationRequestSelectType> => {
    return processVacationRequest(input, VacationRequestStatus.REJECTED, processedByUserId, tx, locale);
  };

  async function processVacationRequest(
    input: ProcessVacationRequestInput,
    status: VacationRequestStatus.APPROVED | VacationRequestStatus.REJECTED,
    processedByUserId: string,
    tx?: DBTransaction,
    locale?: string
  ): Promise<TeacherVacationRequestSelectType> {
    // Lock + fetch in the same transaction
    const current = await TeacherAvailabilityRepository.fetchVacationRequestForUpdate(input.vacationRequestId, tx);

    assertVacationStatus(
      current,
      s => s !== VacationRequestStatus.PENDING,
      "vacationRequestNotPending",
      input.vacationRequestId,
      locale
    );

    return TeacherAvailabilityRepository.updateVacationRequestStatus(
      input.vacationRequestId,
      { status, processedByUserId },
      tx
    );
  }

  export const cancelVacationRequest = async (
    vacationRequestId: string,
    tx?: DBTransaction,
    locale?: string
  ): Promise<TeacherVacationRequestSelectType> => {
    const current = await TeacherAvailabilityRepository.fetchVacationRequestForUpdate(vacationRequestId, tx);

    assertVacationStatus(
      current,
      s => s === VacationRequestStatus.CANCELLED,
      "vacationRequestAlreadyCancelled",
      vacationRequestId,
      locale
    );

    return TeacherAvailabilityRepository.updateVacationRequestStatus(
      vacationRequestId,
      { status: VacationRequestStatus.CANCELLED },
      tx
    );
  };

  function assertVacationStatus(
    current: TeacherVacationRequestSelectType,
    shouldFail: (status: VacationRequestStatus) => boolean,
    errorKey: "vacationRequestNotPending" | "vacationRequestAlreadyCancelled",
    vacationRequestId: string,
    locale?: string
  ): void {
    if (!isVacationRequestStatus(current.status) || shouldFail(current.status)) {
      const errorsTranslations = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new ValidationError(
        errorKey === "vacationRequestNotPending"
          ? errorsTranslations.scheduling.vacationRequestNotPending(vacationRequestId)
          : errorsTranslations.scheduling.vacationRequestAlreadyCancelled(vacationRequestId)
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Cross-staff availability search (moved from repository — business validation)
  // ─────────────────────────────────────────────────────────────────────────────

  export const searchCrossStaffAvailability = async (
    input: CrossStaffSearchInput,
    tx?: DBTransaction,
    locale?: string
  ): Promise<AvailabilitySearchResult> => {
    const fromMinutes = timeToMinutes(input.fromTime);
    const toMinutes = timeToMinutes(input.toTime);

    if (fromMinutes >= toMinutes) {
      const errorsTranslations = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new ValidationError(errorsTranslations.scheduling.startTimeBeforeEndTime);
    }

    const fromDate = input.fromDate ?? getUtcDateString(new Date());
    const toDate = input.toDate ?? getUtcDateString(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

    if (fromDate > toDate) {
      const errorsTranslations = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new ValidationError(errorsTranslations.scheduling.vacationStartBeforeEnd);
    }

    const MAX_AVAILABILITY_SEARCH_SPAN_DAYS = 90;
    const fromDateMs = Date.parse(`${fromDate}T00:00:00.000Z`);
    const toDateMs = Date.parse(`${toDate}T00:00:00.000Z`);
    const spanDays = (toDateMs - fromDateMs) / (24 * 60 * 60 * 1000);
    if (spanDays > MAX_AVAILABILITY_SEARCH_SPAN_DAYS) {
      const errorsTranslations = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new ValidationError(errorsTranslations.scheduling.dateRangeExceedsMax(MAX_AVAILABILITY_SEARCH_SPAN_DAYS));
    }

    return TeacherAvailabilityRepository.searchCrossStaffAvailabilityData(input, tx);
  };
}

const tzDtfCache = new Map<string, Intl.DateTimeFormat>();
const weekdayDtfCache = new Map<string, Intl.DateTimeFormat>();

function getDtf(timezone: string): Intl.DateTimeFormat {
  let dtf = tzDtfCache.get(timezone);
  if (!dtf) {
    dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    tzDtfCache.set(timezone, dtf);
  }
  return dtf;
}

function getWeekdayDtf(timezone: string): Intl.DateTimeFormat {
  let dtf = weekdayDtfCache.get(timezone);
  if (!dtf) {
    dtf = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: timezone });
    weekdayDtfCache.set(timezone, dtf);
  }
  return dtf;
}

/**
 * Returns the timezone offset in milliseconds for the given IANA timezone
 * at the given point in time. Positive = ahead of UTC, negative = behind.
 * Uses cached Intl.DateTimeFormat instances to avoid CPU & allocation overhead.
 */
function getTzOffsetMs(timezone: string, date: Date): number {
  const dtf = getDtf(timezone);
  const parts = dtf.formatToParts(date);
  let year = 0;
  let month = 0;
  let day = 0;
  let hour = 0;
  let minute = 0;
  let second = 0;

  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (p.type === "year") year = Number.parseInt(p.value, 10);
    else if (p.type === "month") month = Number.parseInt(p.value, 10) - 1;
    else if (p.type === "day") day = Number.parseInt(p.value, 10);
    else if (p.type === "hour") {
      hour = Number.parseInt(p.value, 10);
      if (hour === 24) hour = 0;
    } else if (p.type === "minute") minute = Number.parseInt(p.value, 10);
    else if (p.type === "second") second = Number.parseInt(p.value, 10);
  }

  const asUtc = Date.UTC(year, month, day, hour, minute, second);
  return asUtc - date.getTime();
}

const DAY_MAP: Record<string, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

const TZ_DAY_MAP: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/**
 * Builds a list of { start, end } occurrences for each matching day-of-week
 * and start-time within [startDate, endDate], interpreting times in the
 * given timezone.
 * Optimized to reuse cached DateTimeFormats and avoid string splitting/formatting.
 */
function buildPatternOccurrences(
  days: { dayOfWeek: string; startTime: string }[],
  startDate: Date,
  endDate: Date,
  durationMinutes: number,
  timezone: string
): { start: Date; end: Date }[] {
  const occurrences: { start: Date; end: Date }[] = [];
  const curr = new Date(startDate);
  const weekdayDtf = getWeekdayDtf(timezone);

  // Pre-parse start times and target days before entering loop
  const parsedDays = days.map(d => {
    const colonIdx = d.startTime.indexOf(":");
    const hours = colonIdx === -1 ? Number.parseInt(d.startTime, 10) : Number.parseInt(d.startTime.slice(0, colonIdx), 10);
    const minutes = colonIdx === -1 ? 0 : Number.parseInt(d.startTime.slice(colonIdx + 1), 10);
    return {
      targetDayNum: DAY_MAP[d.dayOfWeek.toUpperCase()],
      hours: Number.isNaN(hours) ? 0 : hours,
      minutes: Number.isNaN(minutes) ? 0 : minutes,
    };
  });

  const durationMs = durationMinutes * 60 * 1000;

  while (curr.getTime() <= endDate.getTime()) {
    const tzDay = weekdayDtf.format(curr);
    const dayOfWeekNum = TZ_DAY_MAP[tzDay] ?? curr.getUTCDay();

    for (let i = 0; i < parsedDays.length; i++) {
      const d = parsedDays[i];
      if (d.targetDayNum !== dayOfWeekNum) continue;

      const year = curr.getUTCFullYear();
      const month = curr.getUTCMonth();
      const date = curr.getUTCDate();
      const slotStart = new Date(Date.UTC(year, month, date, d.hours, d.minutes, 0));

      try {
        const offsetMs = getTzOffsetMs(timezone, slotStart);
        slotStart.setTime(slotStart.getTime() - offsetMs);
      } catch (error) {
        // Fallback: treat as UTC (original behavior)
        logger.debug(error);
      }

      const slotEnd = new Date(slotStart.getTime() + durationMs);
      occurrences.push({ start: slotStart, end: slotEnd });
    }
    curr.setUTCDate(curr.getUTCDate() + 1);
  }

  return occurrences;
}
