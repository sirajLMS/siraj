import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { CatalogImageUploadLabels } from "@/shared/locale/types/ui";

export const UiCatalogImageUpload = defineNamespace<CatalogImageUploadLabels>({
  load: {
    en: () => import("@/shared/locale/en/ui/catalog-image-upload").then(module => module.uiCatalogImageUploadEn),
    ar: () => import("@/shared/locale/ar/ui/catalog-image-upload").then(module => module.uiCatalogImageUploadAr),
  },
});
