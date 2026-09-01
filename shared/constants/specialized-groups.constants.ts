import { SystemPermissionGroupSlug } from "@/shared/constants/permission-group.enum";

const SPECIALIZED_GROUP_SLUGS = [
  SystemPermissionGroupSlug.STUDENT_DEFAULT,
  SystemPermissionGroupSlug.TEACHER_DEFAULT,
  SystemPermissionGroupSlug.PARENT_DEFAULT,
] as const;

export const SPECIALIZED_GROUP_SLUG_SET = new Set<string>(SPECIALIZED_GROUP_SLUGS);

export function isSpecializedGroup(slug: string): boolean {
  return SPECIALIZED_GROUP_SLUG_SET.has(slug);
}
