"use client";

import type { ClassInstance } from "@/frontend/common/views/dashboard/classes/details/hooks/useClassDetailsViewModel";
import { getLocalizedClassTypeName } from "@/frontend/common/views/dashboard/classes/details/utils/localizedClassTypeName";
import { Translation, useAppTranslation } from "@/shared/locale";

/** Return a shallow instance copy with `courseName` resolved from the active locale. */
export function useLocalizedClassInstance(instance: ClassInstance): ClassInstance {
  const classTypes = useAppTranslation(Translation.Session).classTypes;
  return {
    ...instance,
    courseName: getLocalizedClassTypeName(instance.classType, classTypes, instance.courseName),
  };
}
