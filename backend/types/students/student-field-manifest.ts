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
