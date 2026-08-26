import { type AppPermission, isAppPermission } from "@/backend/enum";
import type { StudentFieldGroupDefinition, StudentFieldGroupKey } from "@/backend/types";

function studentPerm(
  group: StudentFieldGroupKey,
  action: "view_own" | "view_other" | "edit_own" | "edit_other"
): AppPermission {
  const key = `student.${group}.${action}`;
  if (isAppPermission(key)) {
    return key;
  }
  // The enum is exhaustive for all student.{group}.{action} combinations,
  // so this should never be reached; throw to satisfy the type guard return.
  throw new Error(`Unknown student permission: ${key}`);
}

export const STUDENT_FIELD_GROUPS: readonly StudentFieldGroupDefinition[] = [
  {
    groupKey: "student_identity",
    paths: ["name", "avatarUrl", "dateOfBirth", "gender", "language"],
    viewOwn: studentPerm("student_identity", "view_own"),
    viewOther: studentPerm("student_identity", "view_other"),
    editOwn: studentPerm("student_identity", "edit_own"),
    editOther: studentPerm("student_identity", "edit_other"),
  },
  {
    groupKey: "student_academic",
    paths: ["status", "hoursPerWeek", "classesRemaining", "classesTotal", "version"],
    viewOwn: studentPerm("student_academic", "view_own"),
    viewOther: studentPerm("student_academic", "view_other"),
    editOwn: studentPerm("student_academic", "edit_own"),
    editOther: studentPerm("student_academic", "edit_other"),
  },
  {
    groupKey: "student_teacher",
    paths: ["primaryTeacherId", "teacherName", "teacherUserId"],
    viewOwn: studentPerm("student_teacher", "view_own"),
    viewOther: studentPerm("student_teacher", "view_other"),
    editOwn: studentPerm("student_teacher", "edit_own"),
    editOther: studentPerm("student_teacher", "edit_other"),
  },
  {
    groupKey: "student_parent",
    paths: ["parentId", "parentName", "parentUserId"],
    viewOwn: studentPerm("student_parent", "view_own"),
    viewOther: studentPerm("student_parent", "view_other"),
    editOwn: studentPerm("student_parent", "edit_own"),
    editOther: studentPerm("student_parent", "edit_other"),
  },
  {
    groupKey: "student_schedule",
    paths: ["upcomingClasses"],
    viewOwn: studentPerm("student_schedule", "view_own"),
    viewOther: studentPerm("student_schedule", "view_other"),
    editOwn: studentPerm("student_schedule", "edit_own"),
    editOther: studentPerm("student_schedule", "edit_other"),
  },
  {
    groupKey: "student_history",
    paths: ["classHistory"],
    viewOwn: studentPerm("student_history", "view_own"),
    viewOther: studentPerm("student_history", "view_other"),
    editOwn: studentPerm("student_history", "edit_own"),
    editOther: studentPerm("student_history", "edit_other"),
  },
  {
    groupKey: "student_quota_edit",
    paths: ["classesRemaining"],
    viewOwn: studentPerm("student_quota_edit", "view_own"),
    viewOther: studentPerm("student_quota_edit", "view_other"),
    editOwn: studentPerm("student_quota_edit", "edit_own"),
    editOther: studentPerm("student_quota_edit", "edit_other"),
  },
] as const;

export const STUDENT_FIELD_GROUP_BY_KEY: Record<StudentFieldGroupKey, StudentFieldGroupDefinition> = {
  student_identity: STUDENT_FIELD_GROUPS[0],
  student_academic: STUDENT_FIELD_GROUPS[1],
  student_teacher: STUDENT_FIELD_GROUPS[2],
  student_parent: STUDENT_FIELD_GROUPS[3],
  student_schedule: STUDENT_FIELD_GROUPS[4],
  student_history: STUDENT_FIELD_GROUPS[5],
  student_quota_edit: STUDENT_FIELD_GROUPS[6],
};
