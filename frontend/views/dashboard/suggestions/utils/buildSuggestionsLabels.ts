import type {
  SuggestionsAdminLabels,
  SuggestionsLabels,
  SuggestionsParentLabels,
} from "@/shared/messages/types/dashboard/suggestions/main";

type SuggestionsTranslator = (key: string) => string;

function buildParentLabels(t: SuggestionsTranslator): SuggestionsParentLabels {
  return {
    pageTitle: t("parent.pageTitle"),
    heroTitle: t("parent.heroTitle"),
    heroSubtitle: t("parent.heroSubtitle"),
    fullName: t("parent.fullName"),
    fullNamePlaceholder: t("parent.fullNamePlaceholder"),
    suggestion: t("parent.suggestion"),
    suggestionPlaceholder: t("parent.suggestionPlaceholder"),
    submit: t("parent.submit"),
    successMessage: t("parent.successMessage"),
    socialProof: t("parent.socialProof"),
    support: {
      privacy: {
        title: t("parent.support.privacy.title"),
        body: t("parent.support.privacy.body"),
      },
      fastResponse: {
        title: t("parent.support.fastResponse.title"),
        body: t("parent.support.fastResponse.body"),
      },
      constantEvolution: {
        title: t("parent.support.constantEvolution.title"),
        body: t("parent.support.constantEvolution.body"),
      },
    },
    validation: {
      fullNameRequired: t("parent.validation.fullNameRequired"),
      suggestionRequired: t("parent.validation.suggestionRequired"),
    },
    notifications: {
      submitSuccess: t("parent.notifications.submitSuccess"),
      submitError: t("parent.notifications.submitError"),
    },
  };
}

function buildAdminLabels(t: SuggestionsTranslator): SuggestionsAdminLabels {
  return {
    pageTitle: t("admin.pageTitle"),
    pageSubtitle: t("admin.pageSubtitle"),
    metrics: {
      pending: t("admin.metrics.pending"),
      reviewed: t("admin.metrics.reviewed"),
      duplicate: t("admin.metrics.duplicate"),
      avgResponse: t("admin.metrics.avgResponse"),
      efficiencyNote: t("admin.metrics.efficiencyNote"),
    },
    tabs: {
      pending: t("admin.tabs.pending"),
      reviewed: t("admin.tabs.reviewed"),
      duplicate: t("admin.tabs.duplicate"),
    },
    searchPlaceholder: t("admin.searchPlaceholder"),
    table: {
      parentName: t("admin.table.parentName"),
      suggestion: t("admin.table.suggestion"),
      submittedAt: t("admin.table.submittedAt"),
      status: t("admin.table.status"),
      actions: t("admin.table.actions"),
      markReviewed: t("admin.table.markReviewed"),
      respond: t("admin.table.respond"),
      markDuplicate: t("admin.table.markDuplicate"),
      delete: t("admin.table.delete"),
      noEntries: t("admin.table.noEntries"),
    },
    statusLabels: {
      pending: t("admin.statusLabels.pending"),
      reviewed: t("admin.statusLabels.reviewed"),
      duplicate: t("admin.statusLabels.duplicate"),
    },
    notifications: {
      markReviewedSuccess: t("admin.notifications.markReviewedSuccess"),
      markReviewedError: t("admin.notifications.markReviewedError"),
      respondSuccess: t("admin.notifications.respondSuccess"),
      respondError: t("admin.notifications.respondError"),
      markDuplicateSuccess: t("admin.notifications.markDuplicateSuccess"),
      markDuplicateError: t("admin.notifications.markDuplicateError"),
      deleteSuccess: t("admin.notifications.deleteSuccess"),
      deleteError: t("admin.notifications.deleteError"),
    },
    dialogs: {
      deleteConfirmTitle: t("admin.dialogs.deleteConfirmTitle"),
      deleteConfirmBody: t("admin.dialogs.deleteConfirmBody"),
      deleteConfirmAction: t("admin.dialogs.deleteConfirmAction"),
      cancel: t("admin.dialogs.cancel"),
      respondTitle: t("admin.dialogs.respondTitle"),
      respondPlaceholder: t("admin.dialogs.respondPlaceholder"),
      respondAction: t("admin.dialogs.respondAction"),
      duplicateTitle: t("admin.dialogs.duplicateTitle"),
      duplicateSearchPlaceholder: t("admin.dialogs.duplicateSearchPlaceholder"),
      duplicateAction: t("admin.dialogs.duplicateAction"),
      duplicateNoneFound: t("admin.dialogs.duplicateNoneFound"),
    },
  };
}

export function buildSuggestionsLabels(t: SuggestionsTranslator): SuggestionsLabels {
  return {
    parent: buildParentLabels(t),
    admin: buildAdminLabels(t),
  };
}
