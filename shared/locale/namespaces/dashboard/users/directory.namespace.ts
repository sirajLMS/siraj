import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { UsersDirectoryParentLabels } from "@/shared/locale/types/dashboard/users/directory";

export const DashboardUsersDirectoryParent = defineNamespace<UsersDirectoryParentLabels>({
  load: {
    en: () =>
      import("@/shared/locale/en/dashboard/users/directory").then(module => module.dashboardUsersDirectoryParentEn),
    ar: () =>
      import("@/shared/locale/ar/dashboard/users/directory").then(module => module.dashboardUsersDirectoryParentAr),
  },
});
