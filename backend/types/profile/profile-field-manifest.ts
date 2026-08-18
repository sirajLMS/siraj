import type { AppPermission, ProfileAudience, ProfileScope } from "@/backend/enum";

export type FieldGroupScope = ProfileScope;

export type ProfileFieldGroupKey =
  | "core_identity"
  | "core_contact"
  | "teacher_professional"
  | "teacher_identity"
  | "parent_social"
  | "parent_identity"
  | "parent_billing"
  | "parent_account"
  | "parent_students"
  | "teacher_students"
  | "staff_role"
  | "staff_permissions"
  | "payment_methods"
  | "meeting_configs";

export type ProfileFieldGroupDefinition = {
  readonly groupKey: ProfileFieldGroupKey;
  readonly paths: readonly string[];
  readonly audiences: readonly ProfileAudience[];
  readonly scopes: readonly FieldGroupScope[];
  readonly viewOwn: AppPermission;
  readonly viewOther: AppPermission;
  readonly editOwn: AppPermission;
  readonly editOther: AppPermission;
};
