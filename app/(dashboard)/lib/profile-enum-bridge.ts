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
}

export function toGqlProfileScope(scope: ProfileScope): GqlProfileScope {
  switch (scope) {
    case ProfileScope.OWN:
      return GqlProfileScope.Own;
    case ProfileScope.OTHER:
      return GqlProfileScope.Other;
  }
}

export function toGqlProfileAudience(audience: ProfileAudience): GqlProfileAudience {
  switch (audience) {
    case ProfileAudience.TEACHER:
      return GqlProfileAudience.Teacher;
    case ProfileAudience.PARENT:
      return GqlProfileAudience.Parent;
    case ProfileAudience.STAFF:
      return GqlProfileAudience.Staff;
  }
}
