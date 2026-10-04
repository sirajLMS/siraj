"use client";

import {
  PERSONAL_FIELD_KEYS,
  resolveFieldGroupKey,
} from "@/frontend/common/views/dashboard/profile/shared/sections/ProfilePersonalSection.helpers";
import type {
  PersonalFieldKey,
  ProfilePersonalSectionBaseProps,
} from "@/frontend/common/views/dashboard/profile/shared/sections/ProfilePersonalSection.types";
import { useProfileFieldAccess } from "@/frontend/common/views/dashboard/profile/shared/useProfileFieldAccess";

export function usePersonalFieldAccess(props: ProfilePersonalSectionBaseProps) {
  const { canView, canEdit } = useProfileFieldAccess({ scope: props.scope });

  const isFieldEnabled = (field: PersonalFieldKey): boolean => props.fields[field] === true;

  const canViewField = (field: PersonalFieldKey): boolean => {
    if (!isFieldEnabled(field)) {
      return false;
    }
    return canView(resolveFieldGroupKey(field, props));
  };

  const canEditField = (field: PersonalFieldKey): boolean => {
    if (!isFieldEnabled(field)) {
      return false;
    }
    return canEdit(resolveFieldGroupKey(field, props));
  };

  const hasAccessibleField = (): boolean => PERSONAL_FIELD_KEYS.some(field => canViewField(field));

  return { canViewField, canEditField, hasAccessibleField };
}
