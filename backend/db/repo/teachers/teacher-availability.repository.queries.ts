import { and, eq, gte, inArray, isNull, lte, sql } from "drizzle-orm";
import { caseInsensitiveLike, type db } from "@/backend/db";
import {
  classInstances,
  teacherAvailabilityWindows,
  teacherRecurringUnavailability,
  teachers,
  teacherVacationRequests,
  users,
} from "@/backend/db/schema";
import { type DayOfWeek, type Gender, VacationRequestStatus } from "@/backend/enum";
import type * as Types from "@/backend/types";
import type { DBTransaction } from "@/backend/types";
import { escapeLikeWildcards, groupByTeacherId, type MinuteRange, type TeacherShortInfo } from "@/backend/utils";
import { parseIanaTimezone } from "@/shared/lib/enum";

interface TeacherAvailabilityData {
  windowsByTeacher: Map<string, Types.TeacherAvailabilityWindowSelectType[]>;
  unavailabilitiesByTeacher: Map<string, Types.TeacherRecurringUnavailabilitySelectType[]>;
  vacationsByTeacher: Map<string, { startAt: Date; endAt: Date }[]>;
  bookingsByTeacher: Map<string, { scheduledStartAt: Date; scheduledEndAt: Date }[]>;
}

interface DateFilterCriteria {
  calendarDates: string[];
  allowedDays: Set<DayOfWeek> | null;
}

interface MinResultCriteria {
  minAvailableDays: number | null | undefined;
  minTotalGaps: number | null | undefined;
}

export interface BuildTeacherSearchResultsOptions {
  allTeachers: TeacherShortInfo[];
  availabilityData: TeacherAvailabilityData;
  dateFilter: DateFilterCriteria;
  timeRange: MinuteRange;
  minResultCriteria: MinResultCriteria;
}

interface BuildSearchOptionsParams {
  t: DBTransaction | typeof db;
  input: Types.CrossStaffSearchInput;
  allTeachers: TeacherShortInfo[];
  calendarDates: string[];
  allowedDays: Set<DayOfWeek> | null;
  timeRange: MinuteRange;
  rangeStart: Date;
  rangeEnd: Date;
}

export function buildCommonWindowValues(teacherId: string, input: Types.AvailabilityWindowInput) {
  const now = new Date();
  return {
    teacherId,
    dayOfWeek: input.dayOfWeek,
    startTime: input.startTime,
    endTime: input.endTime,
    timezone: input.timezone,
    utcOffsetSnapshot: input.utcOffsetSnapshot ?? null,
    effectiveFrom: input.effectiveFrom ?? null,
    effectiveUntil: input.effectiveUntil ?? null,
    createdAt: now,
    updatedAt: now,
  };
}

function buildTeacherQueryConditions(gender: Gender | null | undefined, teacherNameSearch?: string | null) {
  const conditions = [eq(users.status, "ACTIVATED")];
  if (gender) {
    conditions.push(eq(teachers.gender, gender));
  }
  if (teacherNameSearch?.trim()) {
    const escapedSearch = escapeLikeWildcards(teacherNameSearch.trim());
    conditions.push(caseInsensitiveLike(users.name, `%${escapedSearch}%`));
  }
  return conditions;
}

export async function fetchAllActiveTeachers(
  t: DBTransaction | typeof db,
  gender: Gender | null | undefined,
  teacherNameSearch?: string | null
): Promise<TeacherShortInfo[]> {
  return t
    .select({
      teacherId: teachers.id,
      teacherName: users.name,
      teacherGender: teachers.gender,
      teacherTimezone: users.timezone,
    })
    .from(teachers)
    .innerJoin(users, eq(teachers.userId, users.id))
    .where(and(...buildTeacherQueryConditions(gender, teacherNameSearch)))
    .orderBy(users.name)
    .then(rows =>
      rows.map(row => ({
        ...row,
        teacherTimezone: parseIanaTimezone(row.teacherTimezone),
      }))
    );
}

async function fetchTeacherAvailabilityData(t: DBTransaction | typeof db, teacherIds: string[]) {
  const [allWindows, allUnavailabilities] = await Promise.all([
    t.select().from(teacherAvailabilityWindows).where(inArray(teacherAvailabilityWindows.teacherId, teacherIds)),
    t
      .select()
      .from(teacherRecurringUnavailability)
      .where(inArray(teacherRecurringUnavailability.teacherId, teacherIds)),
  ]);

  return {
    windowsByTeacher: groupByTeacherId(allWindows),
    unavailabilitiesByTeacher: groupByTeacherId(allUnavailabilities),
  };
}

async function fetchApprovedVacations(
  t: DBTransaction | typeof db,
  teacherIds: string[],
  rangeStart: Date,
  rangeEnd: Date
) {
  if (teacherIds.length === 0) {
    return [];
  }

  return t
    .select({
      teacherId: teacherVacationRequests.teacherId,
      startAt: teacherVacationRequests.startAt,
      endAt: teacherVacationRequests.endAt,
    })
    .from(teacherVacationRequests)
    .where(
      and(
        inArray(teacherVacationRequests.teacherId, teacherIds),
        eq(teacherVacationRequests.status, VacationRequestStatus.APPROVED),
        sql`(${teacherVacationRequests.startAt} < ${rangeEnd} AND ${teacherVacationRequests.endAt} > ${rangeStart})`
      )
    );
}

async function fetchTeacherBookings(
  t: DBTransaction | typeof db,
  teacherIds: string[],
  rangeStart: Date,
  rangeEnd: Date
) {
  if (teacherIds.length === 0) {
    return [];
  }

  return t
    .select({
      teacherId: classInstances.teacherId,
      scheduledStartAt: classInstances.scheduledStartAt,
      scheduledEndAt: classInstances.scheduledEndAt,
    })
    .from(classInstances)
    .where(
      and(
        inArray(classInstances.teacherId, teacherIds),
        isNull(classInstances.deletedAt),
        gte(classInstances.scheduledStartAt, rangeStart),
        lte(classInstances.scheduledStartAt, rangeEnd)
      )
    );
}

export async function buildSearchOptions(
  params: BuildSearchOptionsParams
): Promise<{ options: Omit<BuildTeacherSearchResultsOptions, "allTeachers"> }> {
  const { t, input, allTeachers, calendarDates, allowedDays, timeRange, rangeStart, rangeEnd } = params;
  const teacherIds = allTeachers.map(teacher => teacher.teacherId);
  const { windowsByTeacher, unavailabilitiesByTeacher } = await fetchTeacherAvailabilityData(t, teacherIds);
  const vacations = await fetchApprovedVacations(t, teacherIds, rangeStart, rangeEnd);
  const bookings = await fetchTeacherBookings(t, teacherIds, rangeStart, rangeEnd);

  const vacationsByTeacher = groupByTeacherId(vacations);
  const bookingsByTeacher = groupByTeacherId(bookings);

  const options: Omit<BuildTeacherSearchResultsOptions, "allTeachers"> = {
    availabilityData: {
      windowsByTeacher,
      unavailabilitiesByTeacher,
      vacationsByTeacher,
      bookingsByTeacher,
    },
    dateFilter: {
      calendarDates,
      allowedDays,
    },
    timeRange,
    minResultCriteria: {
      minAvailableDays: input.minAvailableDays,
      minTotalGaps: input.minTotalGaps,
    },
  };
  return { options };
}
