import { db } from "@/backend/db/drizzleDb";
import { CreditRepository } from "@/backend/db/repo/billing";
import { QuotaRepository } from "@/backend/db/repo/billing/quota.repository";
import { ClassSubjectRepository } from "@/backend/db/repo/classes/class-subject.repository";
import { AppPermission, SchedulingMode } from "@/backend/enum";
import { UnauthorizedError, ValidationError } from "@/backend/lib/errors";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { AvailabilityService } from "@/backend/services/scheduling/availability.service";
import type { CreateRecurringClassInput } from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

async function validateBalanceOrQuota(input: CreateRecurringClassInput, tErrors: ErrorsLabels): Promise<void> {
  if (input.schedulingMode === SchedulingMode.ON_DEMAND) return;

  if (input.quotaId) {
    const quota = await QuotaRepository.findById(db, input.quotaId);
    if (!quota || quota.remaining <= 0) {
      throw new ValidationError(tErrors.outOfQuota);
    }
    return;
  }

  const balance = await CreditRepository.getBalance(db, input.studentId);
  if (balance.classesRemaining <= 0) {
    throw new ValidationError(
      tErrors.credit.insufficientBalance({
        studentId: input.studentId,
        remaining: balance.classesRemaining,
      })
    );
  }
}

/**
 * Validate the recurring-class input before any DB work: checks permission,
 * required fields, duration, subject existence, availability, and active balance.
 * Throws localized `tErrors.*` messages on any failure.
 */
export async function validateCreateRecurringClass(
  userId: string,
  input: CreateRecurringClassInput,
  tErrors: ErrorsLabels
) {
  const hasCreateAccess = await PermissionsService.hasPermission(userId, AppPermission.SCHEDULE_CREATE_CLASS);
  if (!hasCreateAccess) {
    throw new UnauthorizedError(tErrors.unauthorizedAction);
  }

  if (!input.days || input.days.length === 0) {
    throw new ValidationError("RECURRING_CLASS_DAYS_REQUIRED", tErrors.recurringClassDaysRequired());
  }
  if (input.durationMinutes <= 0) {
    throw new ValidationError("INVALID_DURATION", tErrors.invalidDuration());
  }
  if (!input.subjectId) {
    throw new ValidationError("SUBJECT_REQUIRED", tErrors.subjectRequired());
  }

  let subject: Awaited<ReturnType<typeof ClassSubjectRepository.getSubjectById>>;
  try {
    subject = await ClassSubjectRepository.getSubjectById(input.subjectId);
  } catch {
    throw new ValidationError(tErrors.invalidInput);
  }
  if (!subject.isActive) {
    throw new ValidationError(tErrors.invalidInput);
  }

  const activeDays = input.days.filter(d => d.isActive);
  if (activeDays.length === 0) {
    throw new ValidationError(tErrors.invalidInput);
  }

  const startDate = input.effectiveFrom ? new Date(input.effectiveFrom) : new Date();
  const endDate = input.effectiveUntil
    ? new Date(input.effectiveUntil)
    : new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

  await AvailabilityService.assertSchedulePatternAvailable({
    studentId: input.studentId,
    teacherId: input.teacherId,
    days: activeDays,
    startDate,
    endDate,
    options: {
      ignoreInstanceIds: [],
      locale: input.locale,
      durationMinutes: input.durationMinutes,
      timezone: input.timezone,
    },
  });

  await validateBalanceOrQuota(input, tErrors);

  return subject;
}
