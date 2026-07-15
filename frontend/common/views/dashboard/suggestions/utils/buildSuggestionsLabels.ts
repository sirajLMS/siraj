import type {
  SuggestionsAdminLabels,
  SuggestionsLabels,
  SuggestionsParentLabels,
} from "@/shared/locale/types/dashboard/suggestions";

function buildParentLabels(t: SuggestionsParentLabels): SuggestionsParentLabels {
  return {
    pageTitle: t.pageTitle,
    heroTitle: t.heroTitle,
    heroSubtitle: t.heroSubtitle,
    fullName: t.fullName,
    fullNamePlaceholder: t.fullNamePlaceholder,
    suggestion: t.suggestion,
    suggestionPlaceholder: t.suggestionPlaceholder,
    submit: t.submit,
    successMessage: t.successMessage,
    socialProof: t.socialProof,
    support: {
      privacy: {
        title: t.support.privacy.title,
        body: t.support.privacy.body,
      },
      fastResponse: {
        title: t.support.fastResponse.title,
        body: t.support.fastResponse.body,
      },
      constantEvolution: {
        title: t.support.constantEvolution.title,
        body: t.support.constantEvolution.body,
      },
    },
    validation: {
      fullNameRequired: t.validation.fullNameRequired,
      suggestionRequired: t.validation.suggestionRequired,
    },
    notifications: {
      submitSuccess: t.notifications.submitSuccess,
      submitError: t.notifications.submitError,
    },
  };
}

function buildAdminLabels(t: SuggestionsAdminLabels): SuggestionsAdminLabels {
  return {
    pageTitle: t.pageTitle,
    pageSubtitle: t.pageSubtitle,
    metrics: {
      pending: t.metrics.pending,
      reviewed: t.metrics.reviewed,
      duplicate: t.metrics.duplicate,
      avgResponse: t.metrics.avgResponse,
      efficiencyNote: t.metrics.efficiencyNote,
    },
    tabs: {
      pending: t.tabs.pending,
      reviewed: t.tabs.reviewed,
      duplicate: t.tabs.duplicate,
    },
    searchPlaceholder: t.searchPlaceholder,
    table: {
      parentName: t.table.parentName,
      suggestion: t.table.suggestion,
      submittedAt: t.table.submittedAt,
      status: t.table.status,
      actions: t.table.actions,
      markReviewed: t.table.markReviewed,
      respond: t.table.respond,
      markDuplicate: t.table.markDuplicate,
      delete: t.table.delete,
      noEntries: t.table.noEntries,
    },
    statusLabels: {
      pending: t.statusLabels.pending,
      reviewed: t.statusLabels.reviewed,
      duplicate: t.statusLabels.duplicate,
    },
    notifications: {
      markReviewedSuccess: t.notifications.markReviewedSuccess,
      markReviewedError: t.notifications.markReviewedError,
      respondSuccess: t.notifications.respondSuccess,
      respondError: t.notifications.respondError,
      markDuplicateSuccess: t.notifications.markDuplicateSuccess,
      markDuplicateError: t.notifications.markDuplicateError,
      deleteSuccess: t.notifications.deleteSuccess,
      deleteError: t.notifications.deleteError,
    },
    dialogs: {
      deleteConfirmTitle: t.dialogs.deleteConfirmTitle,
      deleteConfirmBody: t.dialogs.deleteConfirmBody,
      deleteConfirmAction: t.dialogs.deleteConfirmAction,
      cancel: t.dialogs.cancel,
      respondTitle: t.dialogs.respondTitle,
      respondPlaceholder: t.dialogs.respondPlaceholder,
      respondAction: t.dialogs.respondAction,
      duplicateTitle: t.dialogs.duplicateTitle,
      duplicateSearchPlaceholder: t.dialogs.duplicateSearchPlaceholder,
      duplicateAction: t.dialogs.duplicateAction,
      duplicateNoneFound: t.dialogs.duplicateNoneFound,
    },
  };
}

export function buildSuggestionsLabels(t: {
  parent: SuggestionsParentLabels;
  admin: SuggestionsAdminLabels;
}): SuggestionsLabels {
  return {
    parent: buildParentLabels(t.parent),
    admin: buildAdminLabels(t.admin),
  };
}
