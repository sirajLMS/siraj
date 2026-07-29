"use client";

import type { ClassInstanceDetail } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { getLocalizedClassTypeName } from "@/frontend/common/views/dashboard/classes/details/utils/localizedClassTypeName";
import { Translation, useAppTranslation } from "@/shared/locale";

/** Return a shallow instance copy with `courseName` resolved from the active locale. */
export function useLocalizedClassInstance(instance: ClassInstanceDetail): ClassInstanceDetail {
  const classTypes = useAppTranslation(Translation.Session).classTypes;
  return {
    ...instance,
    courseName: getLocalizedClassTypeName(instance.classType, classTypes, instance.courseName),
  };
}
