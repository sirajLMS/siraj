import type { AppPermission, ProfileAudience, ProfileScope } from "@/backend/enum";

/** Context for filtering profile fields by actor permissions. */
export type FieldFilterContext = {
  readonly actorUserId: string;
  readonly targetUserId: string;
  readonly scope: ProfileScope;
  readonly audience: ProfileAudience;
  readonly permissions: ReadonlySet<AppPermission>;
};

/** Context for filtering student profile fields by actor permissions. */
export type StudentFieldFilterContext = {
  readonly actorUserId: string;
  readonly studentId: string;
  /** LMS user id of the student whose profile is being viewed or edited. */
  readonly studentUserId: string;
  readonly permissions: ReadonlySet<AppPermission>;
};
