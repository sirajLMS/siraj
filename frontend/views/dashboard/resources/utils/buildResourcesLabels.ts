import type { ResourcesLabels } from "@/frontend/messages/types/dashboard/resources/main";

type ResourcesTranslator = (key: string) => string;

export function buildResourcesLabels(t: ResourcesTranslator): ResourcesLabels {
  return {
    pageTitle: t("pageTitle"),
    pageSubtitle: t("pageSubtitle"),
    upload: {
      sectionTitle: t("upload.sectionTitle"),
      documentName: t("upload.documentName"),
      documentNamePlaceholder: t("upload.documentNamePlaceholder"),
      dropzoneTitle: t("upload.dropzoneTitle"),
      dropzoneHint: t("upload.dropzoneHint"),
      supportedFormats: t("upload.supportedFormats"),
      submit: t("upload.submit"),
      successMessage: t("upload.successMessage"),
    },
    guidelines: {
      title: t("guidelines.title"),
      items: [t("guidelines.items.0"), t("guidelines.items.1"), t("guidelines.items.2")],
    },
    governance: {
      title: t("governance.title"),
      body: t("governance.body"),
    },
    library: {
      title: t("library.title"),
      filter: t("library.filter"),
      sortByDate: t("library.sortByDate"),
      sortByName: t("library.sortByName"),
      typeAll: t("library.typeAll"),
      uploaded: t("library.uploaded"),
      noEntries: t("library.noEntries"),
    },
    deleteDialog: {
      title: t("deleteDialog.title"),
      body: t("deleteDialog.body"),
      confirm: t("deleteDialog.confirm"),
      cancel: t("deleteDialog.cancel"),
    },
    validation: {
      documentNameRequired: t("validation.documentNameRequired"),
      fileRequired: t("validation.fileRequired"),
    },
  };
}
