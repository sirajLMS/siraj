import {
  createTimestampOnDate,
  daysBetween,
  formatDateKey,
  getDateWindow,
  getDayOfWeekEnum,
  iterateDatesInWindow,
  startOfDay,
} from "@/backend/db/seeds/lib/date-window";
import { ALL_CLASS_TYPES, cycleAtIndex } from "@/backend/db/seeds/lib/enum-coverage";
import { getFakerForIndex } from "@/backend/db/seeds/lib/faker-client";
import { parseTimeToHoursMinutes, type ScheduleDaySpec } from "@/backend/db/seeds/lib/schedule-factory";
import type { SeedConfig } from "@/backend/db/seeds/lib/seed-config";
import type { ClassInstanceInsertType } from "@/backend/types";
import { ClassExecutionState, ClassOutcome, ClassType } from "@/shared/constants/class-instance-detail.enum";

type ClassInstanceInsert = ClassInstanceInsertType;

export interface ScheduleContext {
  scheduleId: string;
  studentId: string;
  teacherId: string;
  subjectId: string;
  durationMinutes: number;
  days: ScheduleDaySpec[];
  isDemoSchedule: boolean;
}

export interface ResolvedInstanceState {
  executionState: ClassInstanceInsert["executionState"];
  outcome: ClassInstanceInsert["outcome"];
  actualStartAt: Date | null;
  actualEndAt: Date | null;
  classType: ClassInstanceInsert["classType"];
}

function resolvePastState(config: SeedConfig, scheduleIndex: number, dateKey: string): ResolvedInstanceState {
  const faker = getFakerForIndex(config.fakerSeed, scheduleIndex + dateKey.length);
  const roll = faker.number.int({ min: 1, max: 100 });
  const classType = cycleAtIndex(ALL_CLASS_TYPES, scheduleIndex + (dateKey.codePointAt(0) ?? 0));

  if (roll <= 85) {
    return {
      executionState: ClassExecutionState.COMPLETED,
      outcome: ClassOutcome.TAKEN,
      actualStartAt: null,
      actualEndAt: null,
      classType,
    };
  }
  if (roll <= 95) {
    return {
      executionState: ClassExecutionState.COMPLETED,
      outcome: ClassOutcome.ABSENT,
      actualStartAt: null,
      actualEndAt: null,
      classType,
    };
  }
  return {
    executionState: ClassExecutionState.COMPLETED,
    outcome: ClassOutcome.LEAVE,
    actualStartAt: null,
    actualEndAt: null,
    classType,
  };
}

function resolveFutureState(): ResolvedInstanceState {
  return {
    executionState: ClassExecutionState.NOT_ACTIVATED,
    outcome: ClassOutcome.PENDING,
    actualStartAt: null,
    actualEndAt: null,
    classType: ClassType.REGULAR,
  };
}

export function resolveInstanceState(
  config: SeedConfig,
  scheduleIndex: number,
  date: Date,
  daySpec: ScheduleDaySpec
): ResolvedInstanceState {
  const anchor = startOfDay(config.anchorDate);
  const target = startOfDay(date);
  const diff = daysBetween(anchor, target);

  if (diff > 0) {
    return resolveFutureState();
  }

  if (diff < 0) {
    const state = resolvePastState(config, scheduleIndex, formatDateKey(date));
    if (state.outcome === ClassOutcome.TAKEN || state.outcome === ClassOutcome.ABSENT) {
      const { hours, minutes } = parseTimeToHoursMinutes(daySpec.startTime);
      const start = createTimestampOnDate(date, hours, minutes);
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + 60);
      return { ...state, actualStartAt: start, actualEndAt: end };
    }
    return state;
  }

  // Today — default pending unless showcase overrides
  return {
    executionState: ClassExecutionState.NOT_ACTIVATED,
    outcome: ClassOutcome.PENDING,
    actualStartAt: null,
    actualEndAt: null,
    classType: ClassType.REGULAR,
  };
}

export function buildShowcaseInstancesForToday(
  schedule: ScheduleContext,
  config: SeedConfig,
  now: Date
): ClassInstanceInsert[] {
  const today = startOfDay(config.anchorDate);
  const createSlot = (hours: number, state: ResolvedInstanceState, idempotencyKey: string, classType: ClassType) => {
    const start = createTimestampOnDate(today, hours);
    const end = new Date(start);
    end.setHours(end.getHours() + 1);
    const actualStart =
      state.actualStartAt ??
      (state.executionState === ClassExecutionState.RUNNING || state.outcome !== ClassOutcome.PENDING ? start : null);
    const actualEnd =
      state.actualEndAt ??
      (state.executionState === ClassExecutionState.RUNNING || state.outcome !== ClassOutcome.PENDING ? end : null);

    return {
      recurringScheduleId: schedule.scheduleId,
      teacherId: schedule.teacherId,
      studentId: schedule.studentId,
      subjectId: schedule.subjectId,
      scheduledStartAt: start,
      scheduledEndAt: end,
      durationMinutes: schedule.durationMinutes,
      executionState: state.executionState,
      outcome: state.outcome,
      classType,
      actualStartAt: actualStart,
      actualEndAt: actualEnd,
      idempotencyKey,
      createdAt: now,
      updatedAt: now,
    } satisfies ClassInstanceInsert;
  };

  return [
    createSlot(
      10,
      {
        executionState: ClassExecutionState.NOT_ACTIVATED,
        outcome: ClassOutcome.PENDING,
        actualStartAt: null,
        actualEndAt: null,
        classType: ClassType.REGULAR,
      },
      "demo_instance_scheduled_today",
      ClassType.REGULAR
    ),
    createSlot(
      11,
      {
        executionState: ClassExecutionState.RUNNING,
        outcome: ClassOutcome.PENDING,
        actualStartAt: null,
        actualEndAt: null,
        classType: ClassType.REGULAR,
      },
      "demo_instance_running_today",
      ClassType.REGULAR
    ),
    createSlot(
      12,
      {
        executionState: ClassExecutionState.COMPLETED,
        outcome: ClassOutcome.TAKEN,
        actualStartAt: null,
        actualEndAt: null,
        classType: ClassType.TRIAL,
      },
      "demo_instance_completed_today",
      ClassType.TRIAL
    ),
    createSlot(
      14,
      {
        executionState: ClassExecutionState.COMPLETED,
        outcome: ClassOutcome.ABSENT,
        actualStartAt: null,
        actualEndAt: null,
        classType: ClassType.REGULAR,
      },
      "demo_instance_cancelled_today",
      ClassType.REGULAR
    ),
    createSlot(
      16,
      {
        executionState: ClassExecutionState.COMPLETED,
        outcome: ClassOutcome.TAKEN,
        actualStartAt: null,
        actualEndAt: null,
        classType: ClassType.ADVANCE,
      },
      "demo_instance_advance_today",
      ClassType.ADVANCE
    ),
  ];
}

export function generateClassInstancesForSchedule(
  schedule: ScheduleContext,
  scheduleIndex: number,
  config: SeedConfig,
  now: Date
): ClassInstanceInsert[] {
  const { start, end } = getDateWindow(config.anchorDate, config.monthsBefore, config.monthsAfter);
  const activeDays = new Set(schedule.days.map(d => d.dayOfWeek));
  const dayByWeekday = new Map(schedule.days.map(d => [d.dayOfWeek, d]));
  const instances: ClassInstanceInsert[] = [];
  const today = startOfDay(config.anchorDate);

  for (const date of iterateDatesInWindow(start, end)) {
    const dow = getDayOfWeekEnum(date);
    if (!activeDays.has(dow)) continue;

    const daySpec = dayByWeekday.get(dow);
    if (!daySpec) continue;

    // Demo schedule uses showcase instances on anchor date instead of generated row
    if (schedule.isDemoSchedule && startOfDay(date).getTime() === today.getTime()) {
      continue;
    }

    const { hours, minutes } = parseTimeToHoursMinutes(daySpec.startTime);
    const scheduledStartAt = createTimestampOnDate(date, hours, minutes);
    const scheduledEndAt = new Date(scheduledStartAt);
    scheduledEndAt.setMinutes(scheduledEndAt.getMinutes() + schedule.durationMinutes);

    const state = resolveInstanceState(config, scheduleIndex, date, daySpec);
    const actualStartAt =
      state.actualStartAt ??
      (state.outcome === ClassOutcome.TAKEN || state.outcome === ClassOutcome.ABSENT ? scheduledStartAt : null);
    const actualEndAt =
      state.actualEndAt ??
      (state.outcome === ClassOutcome.TAKEN || state.outcome === ClassOutcome.ABSENT ? scheduledEndAt : null);

    instances.push({
      recurringScheduleId: schedule.scheduleId,
      teacherId: schedule.teacherId,
      studentId: schedule.studentId,
      subjectId: schedule.subjectId,
      scheduledStartAt,
      scheduledEndAt,
      durationMinutes: schedule.durationMinutes,
      executionState: state.executionState,
      outcome: state.outcome,
      classType: state.classType,
      actualStartAt,
      actualEndAt,
      idempotencyKey: `seed_ci_${schedule.scheduleId}_${formatDateKey(date)}`,
      createdAt: now,
      updatedAt: now,
    });
  }

  return instances;
}
