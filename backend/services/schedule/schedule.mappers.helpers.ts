import { SystemSettingsRepository } from "@/backend/db/repo/shared/system-settings.repository";
import { StaffProfileRepository } from "@/backend/db/repo/teachers/staff-profile.repository";
import { resolveClassAvatarUrl } from "@/backend/lib/avatar";
import { EffectiveMeetingService } from "@/backend/services/meeting/class-meeting-config.service";
import type { DailyScheduleResult, FutureClassRow, SupportContactReturnType } from "@/backend/types";
import { ClassOutcome } from "@/shared/constants/class-instance-detail.enum";
import { parseClassExecutionState, parseClassOutcome, parseClassTypeOrNull } from "@/shared/lib/enum";
import type { ErrorsLabels } from "@/shared/locale";

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export async function mapDailyScheduleListItem(item: DailyScheduleResult, tErrors: ErrorsLabels) {
  const unknownName = tErrors.unknownName;
  const effectiveMeeting = await EffectiveMeetingService.resolveForClassInstance(item.id, tErrors);
  return {
    id: item.id,
    studentTime: item.scheduledStartAt.toISOString(),
    teacherTime: item.scheduledStartAt.toISOString(),
    yourTime: item.yourTimeFormatted ?? item.scheduledStartAt.toISOString(),
    duration: item.durationMinutes,
    scheduledStartAt: item.scheduledStartAt,
    scheduledEndAt: item.scheduledEndAt,
    status: parseClassExecutionState(item.outcome || item.executionState),
    outcome: parseClassOutcome(item.outcome) ?? ClassOutcome.PENDING,
    executionState: parseClassExecutionState(item.executionState),
    isFrozen: item.isFrozen,
    student: {
      id: item.studentId,
      name: item.student?.name ?? unknownName,
      avatarUrl: item.student?.avatarUrl ?? null,
    },
    teacher: {
      id: item.teacherId,
      name: item.teacher?.user?.name ?? unknownName,
      avatarUrl: item.teacher?.user?.avatarUrl ?? null,
    },
    courseName: item.courseName ?? null,
    avatarUrl: item.avatarUrl ?? null,
    teacherTimezone: item.teacherTimezone ?? null,
    studentTimezone: item.studentTimezone ?? null,
    meetingJoinUrl: effectiveMeeting.joinUrl,
    effectiveMeeting,
  };
}

export async function resolveSupportContact(): Promise<SupportContactReturnType | null> {
  const staffProfileId = await SystemSettingsRepository.getStringValue("teacher_support_contact_staff_profile_id", "");
  if (!staffProfileId) return null;
  const staffRow = await StaffProfileRepository.findByStaffProfileId(staffProfileId);
  if (!staffRow) return null;
  return {
    id: staffRow.staffProfileId,
    name: staffRow.name,
    role: staffRow.roleName,
    avatarUrl: staffRow.avatarUrl,
    phone: staffRow.phone,
  };
}

export async function mapFutureClassItem(
  cls: FutureClassRow,
  now: Date,
  usedLeaves: number,
  maxLeaves: number,
  tErrors: ErrorsLabels
) {
  const classStart = new Date(cls.scheduledStartAt);
  const isPast = classStart < now;
  const isQuotaExhausted = usedLeaves >= maxLeaves;

  let leaveRequestDisabled = false;
  let leaveRequestDisabledReason: string | null = null;

  if (isPast) {
    leaveRequestDisabled = true;
    leaveRequestDisabledReason = "time";
  } else if (isQuotaExhausted) {
    leaveRequestDisabled = true;
    leaveRequestDisabledReason = "quota";
  }

  const resolvedClassType = parseClassTypeOrNull(cls.classType);
  const effectiveMeeting = await EffectiveMeetingService.resolveForClassInstance(cls.id, tErrors);

  return {
    id: cls.id,
    courseName: cls.subjectName ?? cls.studentName,
    scheduledDate: cls.scheduledStartAt.toISOString().split("T")[0],
    startTime: formatTime(cls.scheduledStartAt),
    endTime: formatTime(cls.scheduledEndAt),
    durationMinutes: cls.durationMinutes,
    isRescheduled: cls.isRescheduled,
    leaveRequestDisabled,
    leaveRequestDisabledReason,
    studentCount: 1,
    location: effectiveMeeting.joinUrl ?? "Virtual",
    subjectId: cls.subjectId,
    subjectName: cls.subjectName,
    classType: resolvedClassType,
    meetingJoinUrl: effectiveMeeting.joinUrl ?? null,
    effectiveMeeting,
    executionState: cls.executionState ?? null,
    outcome: cls.outcome ?? null,
    avatarUrl: resolveClassAvatarUrl(cls.recurringAvatarUrl, cls.subjectAvatarUrl),
  };
}
