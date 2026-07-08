/**
 * Canonical profile / person href helpers.
 *
 * Prefer unified `/users/{userId}/profile` when userId is known.
 * Fall back to entity redirect routes for teacher/parent when only those IDs exist.
 * Students use `/students/{studentId}` (not unified profile).
 */

export function profileHrefForUser(userId: string): string {
  return `/users/${userId}/profile`;
}

export function profileHrefForTeacher(ids: {
  readonly userId?: string | null;
  readonly teacherId?: string | null;
}): string | undefined {
  if (ids.userId) {
    return profileHrefForUser(ids.userId);
  }
  if (ids.teacherId) {
    return `/teachers/${ids.teacherId}/profile`;
  }
  return undefined;
}

export function profileHrefForParent(ids: {
  readonly userId?: string | null;
  readonly parentId?: string | null;
}): string | undefined {
  if (ids.userId) {
    return profileHrefForUser(ids.userId);
  }
  if (ids.parentId) {
    return `/parents/${ids.parentId}/profile`;
  }
  return undefined;
}

export function profileHrefForStaff(ids: { readonly userId?: string | null }): string | undefined {
  if (ids.userId) {
    return profileHrefForUser(ids.userId);
  }
  return undefined;
}

export function studentHref(studentId: string): string {
  return `/students/${studentId}`;
}

export function ownProfileHref(): string {
  return "/profile";
}
