import type { AppPermission } from "@/backend/enum";

export type StudentFieldGroupKey =
  | "student_identity"
  | "student_academic"
  | "student_teacher"
  | "student_parent"
  | "student_schedule"
  | "student_history"
  | "student_quota_edit";

export type StudentFieldGroupDefinition = {
  readonly groupKey: StudentFieldGroupKey;
  readonly paths: readonly string[];
  readonly viewOwn: AppPermission;
  readonly viewOther: AppPermission;
  readonly editOwn: AppPermission;
  readonly editOther: AppPermission;
};

function studentPerm(
  group: StudentFieldGroupKey,
  action: "view_own" | "view_other" | "edit_own" | "edit_other"
): AppPermission {
  return `student.${group}.${action}` as AppPermission;
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

export const STUDENT_FIELD_GROUP_BY_KEY: Readonly<Record<StudentFieldGroupKey, StudentFieldGroupDefinition>> =
  Object.fromEntries(STUDENT_FIELD_GROUPS.map(group => [group.groupKey, group])) as Readonly<
    Record<StudentFieldGroupKey, StudentFieldGroupDefinition>
  >;
