import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { CreateUserLabels } from "@/shared/locale/types/dashboard/users/createUser";

export const DashboardUsersCreateUser = defineNamespace<CreateUserLabels>("dashboard.users.createUser", {
  load: {
    en: () => import("@/shared/locale/en/dashboard/users/createUser").then(module => module.dashboardUsersCreateUserEn),
    ar: () => import("@/shared/locale/ar/dashboard/users/createUser").then(module => module.dashboardUsersCreateUserAr),
  },
});
