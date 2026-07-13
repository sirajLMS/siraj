import { ParentRepository, StudentRepository, TeacherRepository } from "@/backend/db";
import { AppPermission, StudentStatus } from "@/backend/enum";
import { parseAppLanguage, parseGender, parseStudentStatus } from "@/backend/lib/enum";
import { getBackendTranslations } from "@/backend/lib/intl";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { StudentHistoryService } from "@/backend/services/history/student-history.service";
import {
  filterStudentProfileByFieldGroups,
  type StudentFieldFilterContext,
} from "@/backend/services/profile/profile-field-filter";
import { StudentStatusService } from "@/backend/services/student/student-status.service";
import { STUDENT_FIELD_GROUPS } from "@/backend/types/students/student-field-manifest";
import type { StudentProfileReturnType } from "@/backend/types/students/student-profile.types";

type GetProfileOptions = {
  readonly year?: number | null;
  readonly month?: number | null;
};

async function hasAnyStudentViewPermission(actorUserId: string): Promise<boolean> {
  const viewKeys = STUDENT_FIELD_GROUPS.flatMap(group => [group.viewOwn, group.viewOther]);
  return PermissionsService.hasAnyPermission(actorUserId, viewKeys);
}

async function assertCanViewStudentProfile(actorUserId: string, locale?: string): Promise<void> {
  const hasLegacy = await PermissionsService.hasPermission(actorUserId, AppPermission.STUDENT_VIEW_ASSOCIATED);
  if (hasLegacy) {
    return;
  }
  if (await hasAnyStudentViewPermission(actorUserId)) {
    return;
  }
  const t = await getBackendTranslations({ locale, namespace: "errors" });
  throw new Error(t("insufficientPermissions"));
}

async function resolveIsAssociatedViewer(actorUserId: string, studentId: string): Promise<boolean> {
  const profile = await StudentRepository.findProfileById(studentId);
  if (!profile) {
    return false;
  }

  // LMS — Student login accounts can view their own profile.
  if (profile.userId === actorUserId) {
    return true;
  }

  const parent = await ParentRepository.findByUserId(actorUserId);
  if (parent && parent.id === profile.parentId) {
    return true;
  }

  const teacher = await TeacherRepository.findByUserId(actorUserId);
  if (teacher && profile.primaryTeacherId === teacher.id) {
    return true;
  }

  return false;
}

function mapProfileRow(
  row: NonNullable<Awaited<ReturnType<typeof StudentRepository.findProfileById>>>
): Omit<StudentProfileReturnType, "upcomingClasses" | "classHistory" | "isAssociatedViewer"> {
  return {
    id: row.id,
    name: row.name,
    status: parseStudentStatus(row.status) ?? StudentStatus.REGULAR,
    avatarUrl: row.avatarUrl,
    dateOfBirth: row.dateOfBirth,
    gender: row.gender ? (parseGender(row.gender) ?? null) : null,
    language: row.language ? (parseAppLanguage(row.language) ?? null) : null,
    parentId: row.parentId,
    parentUserId: row.parentUserId,
    parentName: row.parentName,
    primaryTeacherId: row.primaryTeacherId,
    teacherUserId: row.teacherUserId,
    teacherName: row.teacherName,
    hoursPerWeek: row.hoursPerWeek ? Number(row.hoursPerWeek) : null,
    classesRemaining: row.classesRemaining,
    classesTotal: row.classesTotal,
    version: row.version,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export namespace StudentProfileService {
  export async function getProfile(
    actorUserId: string,
    studentId: string,
    options: GetProfileOptions = {},
    locale?: string
  ): Promise<StudentProfileReturnType> {
    await assertCanViewStudentProfile(actorUserId, locale);

    const row = await StudentRepository.findProfileById(studentId);
    if (!row) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("studentNotFound", { id: studentId }));
    }

    const isAssociatedViewer = await resolveIsAssociatedViewer(actorUserId, studentId);
    const permissionContext = await PermissionsService.getUserContext(actorUserId);
    const filterCtx: StudentFieldFilterContext = {
      actorUserId,
      studentId,
      isAssociatedViewer,
      permissions: new Set(permissionContext.permissions),
    };

    let upcomingClasses: Awaited<ReturnType<typeof StudentStatusService.getUpcomingClasses>> | null;
    try {
      upcomingClasses = await StudentStatusService.getUpcomingClasses(actorUserId, studentId, locale);
    } catch {
      upcomingClasses = null;
    }

    let classHistory = null;
    if (options.year != null && options.month != null) {
      try {
        classHistory = await StudentHistoryService.getStudentClassHistory(
          actorUserId,
          studentId,
          options.year,
          options.month,
          locale
        );
      } catch {
        classHistory = null;
      }
    }

    return filterStudentProfileByFieldGroups(
      {
        ...mapProfileRow(row),
        isAssociatedViewer,
        upcomingClasses,
        classHistory,
      },
      filterCtx
    );
  }
}
