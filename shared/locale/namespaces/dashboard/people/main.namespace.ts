import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { PeopleDirectoryParentLabels } from "@/shared/locale/types/dashboard/people/main";

export const DashboardPeopleDirectoryParent = defineNamespace<PeopleDirectoryParentLabels>({
  load: {
    en: () =>
      import("@/shared/locale/en/dashboard/people/main").then(module => module.dashboardPeopleDirectoryParentEn),
    ar: () =>
      import("@/shared/locale/ar/dashboard/people/main").then(module => module.dashboardPeopleDirectoryParentAr),
  },
});
