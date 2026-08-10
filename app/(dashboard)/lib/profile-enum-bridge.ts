import { ProfileAudience, ProfileMode, ProfileScope } from "@/backend/enum";
import {
  ProfileAudience as GqlProfileAudience,
  ProfileMode as GqlProfileMode,
  ProfileScope as GqlProfileScope,
} from "@/frontend/common/graphql/generated/gql/graphql-types";

export function toGqlProfileMode(mode: ProfileMode): GqlProfileMode {
  switch (mode) {
    case ProfileMode.VIEW:
      return GqlProfileMode.View;
    case ProfileMode.EDIT:
      return GqlProfileMode.Edit;
  }
  throw new Error(`Unhandled case in toGqlProfileMode`);
}

export function toGqlProfileScope(scope: ProfileScope): GqlProfileScope {
  switch (scope) {
    case ProfileScope.OWN:
      return GqlProfileScope.Own;
    case ProfileScope.OTHER:
      return GqlProfileScope.Other;
  }
  throw new Error(`Unhandled case in toGqlProfileScope`);
}

export function toGqlProfileAudience(audience: ProfileAudience): GqlProfileAudience {
  switch (audience) {
    case ProfileAudience.TEACHER:
      return GqlProfileAudience.Teacher;
    case ProfileAudience.PARENT:
      return GqlProfileAudience.Parent;
    case ProfileAudience.STAFF:
      return GqlProfileAudience.Staff;
    case ProfileAudience.STUDENT:
      return GqlProfileAudience.Student;
  }
  throw new Error(`Unhandled case in toGqlProfileAudience`);
}
