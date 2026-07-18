import { ParentRepository, StudentRepository, TeacherRepository, UserRepository } from "@/backend/db/repo";
import { AppPermission, NotificationEventType, StudentStatus } from "@/backend/enum";
import { parseStudentStatus } from "@/backend/lib/enum";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { dispatchWithPreferences } from "@/backend/services/notification/notification-dispatch.helpers";
import { buildStudentLifecyclePayloads } from "@/backend/services/notification/notification-payloads.builders";
import { assertStudentFieldEdit, buildStudentFieldFilterContext } from "@/backend/services/student/student-field-acl";
import type { ChangeStudentStatusResult, ReassignStudentTeacherResult, TeacherEntity } from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

export namespace StudentLifecycleService {
  export async function reassignTeacher(
    actorUserId: string,
    studentId: string,
    newTeacherId: string,
    tErrors: ErrorsLabels,
    expectedVersion?: number,
    locale?: string
  ): Promise<ReassignStudentTeacherResult> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.STUDENT_REASSIGN_TEACHER);
    if (!hasPermission) {
      throw new Error(tErrors.insufficientPermissions);
    }

    const teacher = await TeacherRepository.findById(newTeacherId);
    if (!teacher) {
      throw new Error(tErrors.teacherNotFound(newTeacherId));
    }

    const student = await StudentRepository.findById(studentId);
    if (!student) {
      throw new Error(tErrors.studentNotFound(studentId));
    }

    try {
      const updated = await StudentRepository.reassignTeacher(studentId, newTeacherId, tErrors, expectedVersion);

      logger.info("Student teacher reassigned", {
        actorUserId,
        studentId,
        previousTeacherId: student.primaryTeacherId,
        newTeacherId,
      });

      await dispatchStudentReassignmentNotifications(student, teacher, locale).catch(error => {
        logger.error("Student teacher reassignment notification dispatch failed", {
          actorUserId,
          studentId,
          previousTeacherId: student.primaryTeacherId,
          newTeacherId,
          error,
        });
      });

      return {
        id: updated.id,
        primaryTeacherId: updated.primaryTeacherId ?? null,
        version: updated.version,
      };
    } catch (error) {
      logger.error("Failed to reassign student teacher", {
        actorUserId,
        studentId,
        newTeacherId,
        error,
      });
      throw error;
    }
  }

  export async function changeStudentStatus(
    actorUserId: string,
    studentId: string,
    newStatus: StudentStatus,
    tErrors: ErrorsLabels,
    expectedVersion?: number,
    locale?: string
  ): Promise<ChangeStudentStatusResult> {
    const fieldCtx = await buildStudentFieldFilterContext(actorUserId, studentId);
    try {
      assertStudentFieldEdit(fieldCtx, "student_academic");
    } catch {
      throw new Error(tErrors.insufficientPermissions);
    }

    const current = await StudentRepository.findById(studentId);
    if (!current) {
      throw new Error(tErrors.studentNotFound(studentId));
    }
    const oldStatus = current.status;

    try {
      const updated = await StudentRepository.changeStatus(studentId, newStatus, tErrors, expectedVersion);

      logger.info("Student status changed", {
        actorUserId,
        studentId,
        previousStatus: oldStatus,
        newStatus: updated.status,
      });

      await dispatchStudentStatusChangedNotifications(studentId, current.name, oldStatus, updated.status, locale).catch(
        error => {
          logger.error("Student status change notification dispatch failed", {
            actorUserId,
            studentId,
            newStatus,
            error,
          });
        }
      );

      return {
        id: updated.id,
        status: parseStudentStatus(updated.status) ?? StudentStatus.REGULAR,
        version: updated.version,
      };
    } catch (error) {
      logger.error("Failed to change student status", {
        actorUserId,
        studentId,
        newStatus,
        error,
      });
      throw error;
    }
  }
}

async function dispatchStudentReassignmentNotifications(
  student: NonNullable<Awaited<ReturnType<typeof StudentRepository.findById>>>,
  newTeacher: NonNullable<Awaited<ReturnType<typeof TeacherRepository.findById>>>,
  locale?: string
): Promise<void> {
  const parentUserId = await ParentRepository.findUserIdByParentId(student.parentId);

  const previousTeacherId = student.primaryTeacherId;
  let oldTeacher: TeacherEntity | null = null;
  if (previousTeacherId) {
    oldTeacher = await TeacherRepository.findById(previousTeacherId);
  }

  const [, newTeacherName, oldTeacherName] = await Promise.all([
    parentUserId ? UserRepository.findById(parentUserId) : Promise.resolve(null),
    newTeacher.userId ? UserRepository.findById(newTeacher.userId) : Promise.resolve(null),
    oldTeacher?.userId ? UserRepository.findById(oldTeacher.userId) : Promise.resolve(null),
  ]);

  const baseMetadata = {
    studentName: student.name,
    newTeacherName: newTeacherName?.name ?? "—",
    oldTeacherName: oldTeacherName?.name ?? "—",
  };

  const payloads: ReturnType<typeof buildStudentLifecyclePayloads> = [];
  const targetUserIds: string[] = [];

  if (parentUserId) {
    payloads.push(
      ...buildStudentLifecyclePayloads(
        student.id,
        NotificationEventType.STUDENT_TEACHER_REASSIGNED,
        [parentUserId],
        locale,
        {
          ...baseMetadata,
          recipient: "parent",
        }
      )
    );
    targetUserIds.push(parentUserId);
  }
  if (oldTeacher?.userId) {
    payloads.push(
      ...buildStudentLifecyclePayloads(
        student.id,
        NotificationEventType.STUDENT_TEACHER_REASSIGNED,
        [oldTeacher.userId],
        locale,
        { ...baseMetadata, recipient: "oldTeacher" }
      )
    );
    targetUserIds.push(oldTeacher.userId);
  }
  if (newTeacher.userId) {
    payloads.push(
      ...buildStudentLifecyclePayloads(
        student.id,
        NotificationEventType.STUDENT_TEACHER_REASSIGNED,
        [newTeacher.userId],
        locale,
        { ...baseMetadata, recipient: "newTeacher" }
      )
    );
    targetUserIds.push(newTeacher.userId);
  }

  if (targetUserIds.length === 0) return;
  await dispatchWithPreferences(payloads, targetUserIds, locale);
}

async function dispatchStudentStatusChangedNotifications(
  studentId: string,
  studentName: string,
  oldStatus: string,
  newStatus: string,
  locale?: string
): Promise<void> {
  const student = await StudentRepository.findById(studentId);
  if (!student) return;

  const parentUserId = await ParentRepository.findUserIdByParentId(student.parentId);
  if (!parentUserId) return;

  const targetUserIds = [parentUserId];
  const payloads = buildStudentLifecyclePayloads(
    studentId,
    NotificationEventType.STUDENT_STATUS_CHANGED,
    targetUserIds,
    locale,
    {
      studentName,
      oldStatus,
      newStatus,
    }
  );

  await dispatchWithPreferences(payloads, targetUserIds, locale);
}
