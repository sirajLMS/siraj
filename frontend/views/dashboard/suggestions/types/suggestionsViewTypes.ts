import type { SuggestionsLabels } from "@/shared/messages/types/dashboard/suggestions/main";
import type { SuggestionFormData } from "../schemas/suggestionFormSchema";
import type { AdminSuggestionRow, AdminSuggestionsSummary, SuggestionStatus } from "./suggestions.types";

export type { SuggestionsLabels };

export interface ParentSuggestionsViewProps {
  readonly labels: SuggestionsLabels["parent"];
  readonly isSubmitting: boolean;
  readonly showSuccess: boolean;
  readonly canSubmit: boolean;
  readonly onSubmit: (data: SuggestionFormData) => void;
  readonly onDismissSuccess: () => void;
}

export interface AdminSuggestionsViewProps {
  readonly labels: SuggestionsLabels["admin"];
  readonly summary: AdminSuggestionsSummary;
  readonly rows: readonly AdminSuggestionRow[];
  readonly searchQuery: string;
  readonly activeTab: SuggestionStatus;
  readonly canManage: boolean;
  readonly onSearchChange: (query: string) => void;
  readonly onTabChange: (tab: SuggestionStatus) => void;
  readonly onMarkReviewed: (id: string) => void;
}
