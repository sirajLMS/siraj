import type { SuggestionsLabels } from "@/frontend/messages/types/dashboard/suggestions/main";

type SuggestionsTranslator = (key: string) => string;

export function buildSuggestionsLabels(t: SuggestionsTranslator): SuggestionsLabels {
  return {
    parent: {
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
    },
    admin: {
      pageTitle: t("admin.pageTitle"),
      pageSubtitle: t("admin.pageSubtitle"),
      metrics: {
        pending: t("admin.metrics.pending"),
        reviewed: t("admin.metrics.reviewed"),
        avgResponse: t("admin.metrics.avgResponse"),
        efficiencyNote: t("admin.metrics.efficiencyNote"),
      },
      tabs: {
        pending: t("admin.tabs.pending"),
        reviewed: t("admin.tabs.reviewed"),
      },
      searchPlaceholder: t("admin.searchPlaceholder"),
      table: {
        parentName: t("admin.table.parentName"),
        suggestion: t("admin.table.suggestion"),
        submittedAt: t("admin.table.submittedAt"),
        status: t("admin.table.status"),
        actions: t("admin.table.actions"),
        markReviewed: t("admin.table.markReviewed"),
        noEntries: t("admin.table.noEntries"),
      },
      statusLabels: {
        pending: t("admin.statusLabels.pending"),
        reviewed: t("admin.statusLabels.reviewed"),
      },
    },
  };
}
