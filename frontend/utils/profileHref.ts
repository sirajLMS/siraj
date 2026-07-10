/**
 * Canonical profile / person href helpers.
 *
 * Prefer unified `/users/{userId}/profile` when userId is known.
 * Fall back to entity redirect routes for teacher/parent when only those IDs exist.
 * Students use the unified profile shell at `/students/{studentId}/profile?tab=...`.
 */

export function profileHrefForUser(userId: string): string {
  return `/users/${userId}/profile`;
}

function profileHrefWithEntityFallback(
  userId: string | null | undefined,
  entityId: string | null | undefined,
  entityPath: (id: string) => string
): string | undefined {
  if (userId) {
    return profileHrefForUser(userId);
  }
  if (entityId) {
    return entityPath(entityId);
  }
  return undefined;
}

export function profileHrefForTeacher(ids: {
  readonly userId?: string | null;
  readonly teacherId?: string | null;
}): string | undefined {
  return profileHrefWithEntityFallback(ids.userId, ids.teacherId, id => `/teachers/${id}/profile`);
}

export function profileHrefForParent(ids: {
  readonly userId?: string | null;
  readonly parentId?: string | null;
}): string | undefined {
  return profileHrefWithEntityFallback(ids.userId, ids.parentId, id => `/parents/${id}/profile`);
}

export function profileHrefForStaff(ids: { readonly userId?: string | null }): string | undefined {
  if (ids.userId) {
    return profileHrefForUser(ids.userId);
  }
  return undefined;
}

export type StudentProfileTab = "status" | "quota" | "history";

export function studentHref(studentId: string): string {
  return `/students/${studentId}/profile?tab=status`;
}

export function studentProfileTabHref(studentId: string, tab: StudentProfileTab): string {
  return `/students/${studentId}/profile?tab=${tab}`;
}

export function classHref(classInstanceId: string): string {
  return `/classes/${classInstanceId}`;
}

export function ownProfileHref(): string {
  return "/profile";
}
