import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { NotificationPreferencesRepository } from "@/backend/db/repo/notifications";
import { SchedulingRepository } from "@/backend/db/repo/scheduling";
import { StudentRepository } from "@/backend/db/repo/students/student.repository";
import { NotificationEventType } from "@/backend/enum";
import { ClassReminderService, CommunicationService, EVENT_CHANNEL_ALLOWLIST } from "@/backend/services";
import type {
  ChannelDispatchResult,
  ClassInstanceSelectType,
  CommunicationPayload,
  StudentSelectType,
} from "@/backend/types";

// ─── Test fixtures ─────────────────────────────────────────────────────

const PARENT_USER_ID = "00000000-0000-0000-0000-000000000aaa";
const TEACHER_USER_ID = "00000000-0000-0000-0000-000000000bbb";
const STUDENT_ID = "00000000-0000-0000-0000-000000000ccc";
const INSTANCE_ID = "00000000-0000-0000-0000-000000000ddd";

/** Monotonically-increasing counter for deterministic `providerMessageId`s. */
let successResultSeq = 0;

function buildClassInstance(overrides: Partial<ClassInstanceSelectType> = {}): ClassInstanceSelectType {
  const baseNow = new Date("2026-07-18T08:00:00.000Z");
  return {
    id: INSTANCE_ID,
    studentId: STUDENT_ID,
    teacherId: "teacher-001",
    subjectId: "00000000-0000-0000-0000-000000000eee",
    recurringScheduleId: null,
    originalClassId: null,
    scheduledStartAt: new Date(baseNow.getTime() + 4 * 60 * 60 * 1000),
    scheduledEndAt: new Date(baseNow.getTime() + 5 * 60 * 60 * 1000),
    bookingTimezoneId: null,
    bookingTimezone: "UTC",
    bookingUtcOffset: 0,
    durationMinutes: 60,
    classType: "REGULAR",
    outcome: "PENDING",
    executionState: "NOT_ACTIVATED",
    isRescheduled: false,
    isFrozen: false,
    meetingJoinUrl: null,
    userMeetingConfigId: null,
    meetingProviderId: null,
    meetingConfigSnapshot: null,
    activatedAt: null,
    activatedByUserId: null,
    forceActivated: false,
    forceActivatedByUserId: null,
    actualStartAt: null,
    actualEndAt: null,
    quotaDeducted: false,
    schedulingMode: "NUMBER_OF_CLASSES",
    ondemandStatus: null,
    payrollCredited: false,
    rateAmount: null,
    rateCurrency: null,
    rateSource: null,
    isRateOverridden: false,
    remarks: null,
    adminNotes: null,
    idempotencyKey: "seed-instance-1",
    createdAt: baseNow,
    updatedAt: baseNow,
    deletedAt: null,
    ...overrides,
  };
}

function buildStudent(overrides: Partial<StudentSelectType> = {}): StudentSelectType {
  const baseNow = new Date("2026-07-18T08:00:00.000Z");
  return {
    id: STUDENT_ID,
    parentId: null,
    userId: PARENT_USER_ID,
    primaryTeacherId: null,
    name: "Ahmed Test-Student",
    avatarUrl: null,
    dateOfBirth: null,
    gender: null,
    language: null,
    timezoneOverride: null,
    status: "REGULAR",
    classesTotal: 0,
    classesRemaining: 0,
    version: 0,
    hoursPerWeek: "0",
    idempotencyKey: "seed-student-1",
    createdAt: baseNow,
    updatedAt: baseNow,
    ...overrides,
  };
}

function successResult(channel: CommunicationPayload["channel"]): ChannelDispatchResult {
  successResultSeq += 1;
  return { channel, success: true, providerMessageId: `pmid-${channel}-${successResultSeq}` };
}

/**
 * Capture every `CommunicationPayload` handed to `CommunicationService.dispatchMulti`
 * across all invocations of `ClassReminderService.dispatchDailyReminders` for
 * metadata + dedupe assertions.
 */
interface DispatchCapture {
  calls: CommunicationPayload[][];
}

function installDispatchCapture(capture: DispatchCapture): ReturnType<typeof spyOn> {
  return spyOn(CommunicationService, "dispatchMulti").mockImplementation(
    async (payloads: CommunicationPayload[]): Promise<ChannelDispatchResult[]> => {
      capture.calls.push(payloads);
      return payloads.map(p => successResult(p.channel));
    }
  );
}

// ─── Spies ─────────────────────────────────────────────────────────────

let findUpcomingSpy: ReturnType<typeof spyOn>;
let getAffectedUsersSpy: ReturnType<typeof spyOn>;
let findStudentSpy: ReturnType<typeof spyOn>;
let getPrefsSpy: ReturnType<typeof spyOn>;
let dispatchMultiSpy: ReturnType<typeof spyOn>;

beforeEach(() => {
  successResultSeq = 0;
  findUpcomingSpy = spyOn(SchedulingRepository, "findUpcomingInstances").mockResolvedValue([buildClassInstance()]);
  getAffectedUsersSpy = spyOn(SchedulingRepository, "getClassInstanceAffectedUsers").mockResolvedValue({
    parentUserId: PARENT_USER_ID,
    studentId: STUDENT_ID,
    studentUserId: null,
    teacherUserId: TEACHER_USER_ID,
  });
  findStudentSpy = spyOn(StudentRepository, "findById").mockResolvedValue(buildStudent());
  // "all enabled" — so dispatch isn't filtered down by prefs.
  getPrefsSpy = spyOn(NotificationPreferencesRepository, "getByUserId").mockResolvedValue([]);
  dispatchMultiSpy = spyOn(CommunicationService, "dispatchMulti").mockResolvedValue([]);
});

afterEach(() => {
  findUpcomingSpy.mockRestore();
  getAffectedUsersSpy.mockRestore();
  findStudentSpy.mockRestore();
  getPrefsSpy.mockRestore();
  dispatchMultiSpy.mockRestore();
});

// ─── Tests ─────────────────────────────────────────────────────────────
//
// NOTE on `CLASS_REMINDER` build-path:
// `buildClassLifecyclePayloads` (owned by S2) currently restricts the
// `eventType` argument to the 10 `CLASS_*` lifecycle transitions listed in
// `CLASS_LIFECYCLE_EVENTS` — `CLASS_REMINDER` is NOT a member, so the builder
// returns `[]` for it today. S2 must either add `CLASS_REMINDER` to the set
// OR ship a dedicated `buildClassReminderPayloads` builder (tracked as a
// CROSS-FILE DEPENDENCY on S2). Until then, the dispatch-deep tests below
// (`test.skip`) cannot assert payload metadata / dispatch counts. The
// graceful-behavior tests still hold today AND will continue to hold
// post-S2-reconciliation.
describe("ClassReminderService — daily cron orchestration", () => {
  test("returns success summary and processes one upcoming instance", async () => {
    const result = await ClassReminderService.dispatchDailyReminders({ withinHours: 24 });

    expect(result.success).toBe(true);
    expect(result.instancesProcessed).toBe(1);
    expect(findUpcomingSpy).toHaveBeenCalledWith({ withinHours: 24 });
  });

  test("honors a custom withinHours window — passes option through to the repository", async () => {
    findUpcomingSpy.mockResolvedValue([buildClassInstance({ id: "inst-2" })]);

    await ClassReminderService.dispatchDailyReminders({ withinHours: 12 });

    expect(findUpcomingSpy).toHaveBeenCalledWith({ withinHours: 12 });
  });

  test("CLASS_REMINDER is not in the EVENT_CHANNEL_ALLOWLIST — channels are unfiltered by it", () => {
    // Sanity check: CLASS_REMINDER does not get restricted by the per-event
    // allowlist, so the prefs step is the only filter on channels.
    expect(EVENT_CHANNEL_ALLOWLIST[NotificationEventType.CLASS_REMINDER]).toBeUndefined();
  });

  test("per-instance failure (getClassInstanceAffectedUsers throws) does NOT halt the cron run", async () => {
    const liveInstance = buildClassInstance({ id: "instance-live" });
    const doomedInstance = buildClassInstance({ id: "instance-doomed" });
    const thirdInstance = buildClassInstance({ id: "instance-third" });

    findUpcomingSpy.mockResolvedValue([liveInstance, doomedInstance, thirdInstance]);
    getAffectedUsersSpy.mockImplementation(async (id: string) => {
      if (id === "instance-doomed") throw new Error("affected-users resolve failed");
      return {
        parentUserId: PARENT_USER_ID,
        studentId: STUDENT_ID,
        studentUserId: null,
        teacherUserId: TEACHER_USER_ID,
      };
    });

    const result = await ClassReminderService.dispatchDailyReminders({ withinHours: 24 });

    expect(result.success).toBe(true);
    // All 3 instances were "processed" (queued); failures were logged per-instance.
    expect(result.instancesProcessed).toBe(3);
    // The doomed instance does not contribute dispatches; live + third do.
    expect(findUpcomingSpy).toHaveBeenCalled();
    expect(getAffectedUsersSpy).toHaveBeenCalledTimes(3);
  });

  test("an instance whose affected-users helper returns null is skipped, not thrown", async () => {
    findUpcomingSpy.mockResolvedValue([buildClassInstance()]);
    getAffectedUsersSpy.mockResolvedValue(null);

    const result = await ClassReminderService.dispatchDailyReminders({ withinHours: 24 });

    expect(result.success).toBe(true);
    expect(result.instancesProcessed).toBe(1);
    expect(result.deliveriesDispatched).toBe(0);
  });

  test("scheduling-query failure (findUpcomingInstances throws) → service returns unsuccessful summary and swallows", async () => {
    findUpcomingSpy.mockRejectedValue(new Error("DB unreachable"));

    const result = await ClassReminderService.dispatchDailyReminders({ withinHours: 24 });

    expect(result.success).toBe(false);
    expect(result.instancesProcessed).toBe(0);
    expect(result.deliveriesDispatched).toBe(0);
    expect(getAffectedUsersSpy).not.toHaveBeenCalled();
  });

  test("when affected-users resolve, the service queries the student by id for the display name", async () => {
    findUpcomingSpy.mockResolvedValue([buildClassInstance()]);

    await ClassReminderService.dispatchDailyReminders({ withinHours: 24 });

    expect(getAffectedUsersSpy).toHaveBeenCalledTimes(1);
    expect(findStudentSpy).toHaveBeenCalledTimes(1);
    expect(findStudentSpy).toHaveBeenCalledWith(STUDENT_ID);
  });
});

// ─── Idempotency-key + dedupe tests (active once S2 expands
//     `CLASS_LIFECYCLE_EVENTS` ∈ `notification-payloads.builders.ts` to
//     include `CLASS_REMINDER`, OR ships a dedicated `buildClassReminderPayloads`
//     builder — tracked as a CROSS-FILE DEPENDENCY on S2)
//
// These tests are skipped today because `buildClassLifecyclePayloads`
// deliberately short-circuits with `[]` for `CLASS_REMINDER` (it is not in
// the `CLASS_LIFECYCLE_EVENTS` set), so no payloads reach `dispatchMulti`.
// Once S2 expands support, un-skip these tests and they will:
//   (a) assert every dispatched payload carries the UTC-DATE idempotency key
//       in its metadata,
//   (b) verify two same-UTC-day reruns emit the SAME idempotency keys
//       (per-payload key pairing is 1:1 across runs),
//   (c) verify the service dispatches 8 deliveries per instance (4 channels
//       × 2 affected users) before the prefs / allowlist filter.
describe.skip("ClassReminderService — idempotency keys (S2 CROSS-FILE DEPENDENCY)", () => {
  test("every dispatched payload embeds the UTC-DATE idempotency key in its metadata", async () => {
    const capture: DispatchCapture = { calls: [] };
    dispatchMultiSpy.mockRestore();
    dispatchMultiSpy = installDispatchCapture(capture);

    await ClassReminderService.dispatchDailyReminders({ withinHours: 24 });

    const allPayloads = capture.calls.flat();
    expect(allPayloads.length).toBeGreaterThan(0);

    const todayKey = `class-reminder-${INSTANCE_ID}-${new Date().toISOString().slice(0, 10)}`;
    for (const p of allPayloads) {
      expect(p.metadata).toBeDefined();
      expect(p.metadata?.idempotencyKey).toBe(todayKey);
      expect(p.metadata?.studentName).toBe("Ahmed Test-Student");
      expect(p.eventType).toBe(NotificationEventType.CLASS_REMINDER);
    }
  });

  test("two same-day invocations emit the SAME idempotency keys (key stable across same-UTC-day reruns)", async () => {
    const firstCapture: DispatchCapture = { calls: [] };
    dispatchMultiSpy.mockRestore();
    dispatchMultiSpy = installDispatchCapture(firstCapture);
    await ClassReminderService.dispatchDailyReminders({ withinHours: 24 });
    const firstRunKeys = firstCapture.calls
      .flat()
      .map(p => p.metadata?.idempotencyKey)
      .filter((key): key is string => typeof key === "string");

    const secondCapture: DispatchCapture = { calls: [] };
    dispatchMultiSpy.mockRestore();
    dispatchMultiSpy = installDispatchCapture(secondCapture);
    await ClassReminderService.dispatchDailyReminders({ withinHours: 24 });
    const secondRunKeys = secondCapture.calls
      .flat()
      .map(p => p.metadata?.idempotencyKey)
      .filter((key): key is string => typeof key === "string");

    expect(firstRunKeys.length).toBeGreaterThan(0);
    expect(secondRunKeys).toHaveLength(firstRunKeys.length);
    for (let i = 0; i < firstRunKeys.length; i++) {
      expect(secondRunKeys[i]).toBe(firstRunKeys[i]);
    }
    expect(new Set(firstRunKeys).size).toBe(1);
    expect(new Set(secondRunKeys).size).toBe(1);
  });

  test("dispatchDailyReminders dispatches 8 deliveries per instance (4 channels × 2 affected users)", async () => {
    const capture: DispatchCapture = { calls: [] };
    dispatchMultiSpy.mockRestore();
    dispatchMultiSpy = installDispatchCapture(capture);

    const result = await ClassReminderService.dispatchDailyReminders({ withinHours: 24 });

    expect(result.deliveriesDispatched).toBe(8);
  });
});
