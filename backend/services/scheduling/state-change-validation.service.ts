import { ParentRepository } from "@/backend/db/repo/parents/parent.repository";
import type { DBTransaction } from "@/backend/db/repo/scheduling/shared";
import { TeacherRepository } from "@/backend/db/repo/teachers/teacher.repository";
import { AppPermission } from "@/backend/enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type * as Types from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

/**
 * V3-019/V3-020: Moved from backend/db/repo/scheduling/state-changes.ts
 * These are business-logic validation functions, not data access — they belong
 * in the service layer, not the repository.
 */

/**
 * Checks whether the actor is authorized to change the state of the given
 * class instance. Authorization is granted if:
 *   - Actor has any of SESSION_OVERRIDE_ACTIONS, SESSION_ACTIVATE_OVERRIDE,
 *     or SESSION_RESET permissions (privileged override)
 *   - Actor is the teacher assigned to the class
 *   - Actor is the parent of the student in the class
 */
export async function checkStateChangeAuth(
  t: DBTransaction,
  existing: Types.ClassInstanceEntity,
  actorUserId: string,
  tErrors: ErrorsLabels
): Promise<void> {
  const isPrivilegedActor = await PermissionsService.hasAnyPermission(actorUserId, [
    AppPermission.SESSION_OVERRIDE_ACTIONS,
    AppPermission.SESSION_ACTIVATE_OVERRIDE,
    AppPermission.SESSION_RESET,
  ]);

  if (isPrivilegedActor) {
    return;
  }

  const teacher = await TeacherRepository.findByUserId(actorUserId, t);
  const parent = await ParentRepository.findByUserId(actorUserId, t);

  let isParentOfStudent = false;
  if (parent) {
    const associatedStudents = await ParentRepository.getAssociatedStudents(parent.id, t);
    isParentOfStudent = associatedStudents.some(s => s.id === existing.studentId);
  }

  const isTeacherOfClass = existing.teacherId === teacher?.id;

  if (!isTeacherOfClass && !isParentOfStudent) {
    throw new Error(tErrors.unauthorizedAction);
  }
}

/**
 * Validates that a state transition is legal according to the class lifecycle:
 *   - ACTIVATED can only come from NOT_ACTIVATED
 *   - RUNNING can only come from ACTIVATED
 *   - COMPLETED can come from RUNNING, or ACTIVATED+NOT_ACTIVATED with early outcomes
 */
export async function validateStateTransition(
  existing: Types.ClassInstanceEntity,
  state: Partial<Types.ClassInstanceInsertInput>,
  tErrors: ErrorsLabels
): Promise<void> {
  if (state.executionState === "ACTIVATED") {
    if (existing.executionState !== "NOT_ACTIVATED") {
      throw new Error(tErrors.invalidTransition);
    }
  } else if (state.executionState === "RUNNING") {
    if (existing.executionState !== "ACTIVATED") {
      throw new Error(tErrors.invalidTransition);
    }
  } else if (state.executionState === "COMPLETED") {
    const isValidStandard = existing.executionState === "RUNNING";
    const isValidEarly =
      existing.executionState === "ACTIVATED" && (state.outcome === "ABSENT" || state.outcome === "LEAVE");
    const isValidAutomatedLeave = existing.executionState === "NOT_ACTIVATED" && state.outcome === "LEAVE";
    const isValidAutomatedAbsent = existing.executionState === "NOT_ACTIVATED" && state.outcome === "ABSENT";
    if (!isValidStandard && !isValidEarly && !isValidAutomatedLeave && !isValidAutomatedAbsent) {
      throw new Error(tErrors.invalidTransition);
    }
  }
}

/**
 * Validates that an original class instance can be rescheduled. The original
 * must exist, must not be completed, must not have been already rescheduled,
 * and the new instance must not be the same as the original.
 */
export async function validateRescheduleState(
  original: Types.ClassInstanceEntity,
  input: Omit<Types.ClassInstanceInsertInput, "createdAt" | "updatedAt">,
  tErrors: ErrorsLabels
): Promise<void> {
  if (original.id === input.id) {
    throw new Error(tErrors.cannotRescheduleToSelf);
  }
  if (original.executionState === "COMPLETED" || original.outcome === "TAKEN") {
    throw new Error(tErrors.cannotRescheduleCompleted);
  }
  if (original.isRescheduled) {
    throw new Error(tErrors.cannotRescheduleAlreadyRescheduled);
  }
}
