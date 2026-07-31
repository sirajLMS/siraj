import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { UserSelectLabels } from "@/shared/locale/types/ui";

export const UiUserSelect = defineNamespace<UserSelectLabels>("ui.userSelect", {
  load: {
    en: () => import("@/shared/locale/en/ui/user-select").then(module => module.uiUserSelectEn),
    ar: () => import("@/shared/locale/ar/ui/user-select").then(module => module.uiUserSelectAr),
  },
});
