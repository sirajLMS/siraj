import type { GridColDef } from "@mui/x-data-grid";
import type { Control, FieldErrors } from "react-hook-form";
import type { SuggestionFormData } from "@/frontend/common/views/dashboard/suggestions/schemas/suggestionFormSchema";
import type {
  AdminSuggestionRow,
  AdminSuggestionsSummary,
  SuggestionStatus,
} from "@/frontend/common/views/dashboard/suggestions/types/suggestions.types";
import type { SuggestionsAdminLabels, SuggestionsLabels } from "@/shared/locale";

export type { SuggestionsAdminLabels, SuggestionsLabels };

export interface ParentSuggestionsViewProps {
  readonly labels: SuggestionsLabels["parent"];
  readonly isSubmitting: boolean;
  readonly canSubmit: boolean;
  readonly onSubmit: (data: SuggestionFormData) => void;
}

export interface AdminSuggestionsViewProps {
  readonly labels: SuggestionsAdminLabels;
  readonly summary: AdminSuggestionsSummary;
  readonly rows: readonly AdminSuggestionRow[];
  readonly loading?: boolean;
  readonly searchQuery: string;
  readonly activeTab: SuggestionStatus;
  readonly canManage: boolean;
  readonly canDelete: boolean;
  readonly onSearchChange: (query: string) => void;
  readonly onTabChange: (tab: SuggestionStatus) => void;
  readonly onMarkReviewed: (id: string) => void;
  readonly onRespond: (id: string) => void;
  readonly onMarkDuplicate: (id: string) => void;
  readonly onDelete: (id: string) => void;
}

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

export interface SuggestionsCardListProps {
  readonly rows: readonly AdminSuggestionRow[];
  readonly labels: SuggestionsAdminLabels;
  readonly canManage: boolean;
  readonly canDelete: boolean;
  readonly onMarkReviewed: (id: string) => void;
  readonly onRespond: (id: string) => void;
  readonly onMarkDuplicate: (id: string) => void;
  readonly onDelete: (id: string) => void;
}

export interface SuggestionsMetricsRowProps {
  readonly summary: AdminSuggestionsSummary;
  readonly labels: SuggestionsAdminLabels;
  readonly compact?: boolean;
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

export interface SuggestionRespondDialogLabels {
  readonly respondTitle: string;
  readonly respondPlaceholder: string;
  readonly respondAction: string;
  readonly cancel: string;
}

export interface SuggestionRespondDialogProps {
  readonly open: boolean;
  readonly suggestionId: string;
  readonly isLoading: boolean;
  readonly labels: SuggestionRespondDialogLabels;
  readonly onConfirm: (suggestionId: string, adminResponse: string) => void;
  readonly onCancel: () => void;
}

export interface SuggestionDuplicateDialogLabels {
  readonly duplicateTitle: string;
  readonly duplicateSearchPlaceholder: string;
  readonly duplicateAction: string;
  readonly duplicateNoneFound: string;
  readonly cancel: string;
}

export interface SuggestionMarkDuplicateDialogProps {
  readonly open: boolean;
  readonly suggestionId: string;
  readonly isLoading: boolean;
  readonly labels: SuggestionDuplicateDialogLabels;
  readonly onConfirm: (suggestionId: string, duplicateOfId: string) => void;
  readonly onCancel: () => void;
}

export interface ParentSuggestionsDesktopViewProps {
  readonly labels: SuggestionsLabels["parent"];
  readonly control: Control<SuggestionFormData>;
  readonly errors: FieldErrors<SuggestionFormData>;
  readonly isSubmitting: boolean;
  readonly canSubmit: boolean;
  readonly onFormSubmit: () => void;
}

export interface ParentSuggestionsMobileViewProps {
  readonly labels: SuggestionsLabels["parent"];
  readonly control: Control<SuggestionFormData>;
  readonly errors: FieldErrors<SuggestionFormData>;
  readonly isSubmitting: boolean;
  readonly canSubmit: boolean;
  readonly onFormSubmit: () => void;
}

export interface SuggestionFormFieldsProps {
  readonly control: Control<SuggestionFormData>;
  readonly errors: FieldErrors<SuggestionFormData>;
  readonly labels: SuggestionsLabels["parent"];
  readonly variant: "desktop" | "mobile";
}

export interface SuggestionHeroBannerProps {
  readonly labels: SuggestionsLabels["parent"];
  readonly variant: "desktop" | "mobile";
}

export interface SuggestionSupportCardsProps {
  readonly labels: SuggestionsLabels["parent"];
  readonly variant: "desktop" | "mobile";
}

export interface SuggestionSocialProofProps {
  readonly labels: SuggestionsLabels["parent"];
}
