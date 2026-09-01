import type { GridColDef } from "@mui/x-data-grid";
import type { Control, FieldErrors } from "react-hook-form";
import type { SuggestionFormData } from "@/frontend/common/views/dashboard/suggestions/schemas/suggestionFormSchema";
import type {
  AdminSuggestionRow,
  AdminSuggestionsSummary,
  SuggestionStatus,
} from "@/frontend/common/views/dashboard/suggestions/types/suggestions.types";
import type { SuggestionsAdminLabels, SuggestionsLabels } from "@/shared/locale";

export type { SuggestionsAdminLabels };

export interface SuggestionsDataGridProps {
  readonly rows: readonly AdminSuggestionRow[];
  readonly labels: SuggestionsAdminLabels;
  readonly canManage: boolean;
  readonly canDelete: boolean;
  readonly onMarkReviewed: (id: string) => void;
  readonly onRespond: (id: string) => void;
  readonly onMarkDuplicate: (id: string) => void;
  readonly onDelete: (id: string) => void;
  readonly columns?: readonly GridColDef<AdminSuggestionRow>[];
  readonly loading?: boolean;
}

export interface SuggestionsMetricsRowProps {
  readonly summary: AdminSuggestionsSummary;
  readonly labels: SuggestionsAdminLabels;
}

export interface SuggestionsTabBarProps {
  readonly activeTab: SuggestionStatus;
  readonly pendingCount: number;
  readonly reviewedCount: number;
  readonly duplicateCount: number;
  readonly labels: SuggestionsAdminLabels;
  readonly onTabChange: (tab: SuggestionStatus) => void;
}

export interface SuggestionsSearchBarProps {
  readonly value: string;
  readonly placeholder: string;
  readonly onChange: (value: string) => void;
}

export interface SuggestionFormFieldsProps {
  readonly control: Control<SuggestionFormData>;
  readonly errors: FieldErrors<SuggestionFormData>;
  readonly labels: SuggestionsLabels["parent"];
}

export interface SuggestionHeroBannerProps {
  readonly labels: SuggestionsLabels["parent"];
}

export interface SuggestionSupportCardsProps {
  readonly labels: SuggestionsLabels["parent"];
}

export interface SuggestionSocialProofProps {
  readonly labels: SuggestionsLabels["parent"];
}
