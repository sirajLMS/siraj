import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { BooksAndBagsLabels } from "@/shared/locale/types/dashboard/resources";

export const DashboardBooksAndBags = defineNamespace<BooksAndBagsLabels>("dashboard.resources.booksAndBags", {
  load: {
    en: () =>
      import("@/shared/locale/en/dashboard/resources/booksAndBags").then(module => module.dashboardBooksAndBagsEn),
    ar: () =>
      import("@/shared/locale/ar/dashboard/resources/booksAndBags").then(module => module.dashboardBooksAndBagsAr),
  },
});
