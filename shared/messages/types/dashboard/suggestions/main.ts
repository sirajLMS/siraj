export interface SuggestionSupportCardLabels {
  readonly title: string;
  readonly body: string;
}

export interface SuggestionValidationLabels {
  readonly fullNameRequired: string;
  readonly suggestionRequired: string;
}

export interface SuggestionsParentLabels {
  readonly pageTitle: string;
  readonly heroTitle: string;
  readonly heroSubtitle: string;
  readonly fullName: string;
  readonly fullNamePlaceholder: string;
  readonly suggestion: string;
  readonly suggestionPlaceholder: string;
  readonly submit: string;
  readonly successMessage: string;
  readonly socialProof: string;
  readonly support: {
    readonly privacy: SuggestionSupportCardLabels;
    readonly fastResponse: SuggestionSupportCardLabels;
    readonly constantEvolution: SuggestionSupportCardLabels;
  };
  readonly validation: SuggestionValidationLabels;
}

export interface SuggestionsAdminLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly metrics: {
    readonly pending: string;
    readonly reviewed: string;
    readonly duplicate: string;
    readonly avgResponse: string;
    readonly efficiencyNote: string;
  };
  readonly tabs: {
    readonly pending: string;
    readonly reviewed: string;
    readonly duplicate: string;
  };
  readonly searchPlaceholder: string;
  readonly table: {
    readonly parentName: string;
    readonly suggestion: string;
    readonly submittedAt: string;
    readonly status: string;
    readonly actions: string;
    readonly markReviewed: string;
    readonly respond: string;
    readonly markDuplicate: string;
    readonly delete: string;
    readonly noEntries: string;
  };
  readonly statusLabels: Record<"pending" | "reviewed" | "duplicate", string>;
  readonly notifications: {
    readonly markReviewedSuccess: string;
    readonly markReviewedError: string;
    readonly respondSuccess: string;
    readonly respondError: string;
    readonly markDuplicateSuccess: string;
    readonly markDuplicateError: string;
    readonly deleteSuccess: string;
    readonly deleteError: string;
  };
  readonly dialogs: {
    readonly deleteConfirmTitle: string;
    readonly deleteConfirmBody: string;
    readonly deleteConfirmAction: string;
    readonly cancel: string;
    readonly respondTitle: string;
    readonly respondPlaceholder: string;
    readonly respondAction: string;
    readonly duplicateTitle: string;
    readonly duplicateSearchPlaceholder: string;
    readonly duplicateAction: string;
    readonly duplicateNoneFound: string;
  };
}

export interface SuggestionsLabels {
  readonly parent: SuggestionsParentLabels;
  readonly admin: SuggestionsAdminLabels;
}
