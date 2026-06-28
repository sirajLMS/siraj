import type { ResourcesLabels } from "@/shared/messages/types/dashboard/resources/main";

export type {
  LearningResourceRow as GqlLearningResourceRow,
  ResourceUploadInput,
} from "@/frontend/graphql/generated/gql/graphql-types";

/**
 * Learning Resources — Shared Types
 *
 * GraphQL-generated types (from codegen) are used for data shapes.
 * This file contains UI-specific types for file type classification, filtering, and sorting.
 */

/**
 * Supported resource file types for display and filtering.
 * Derived from the file extension in `filePath`, not from GraphQL.
 */
export type ResourceFileType = "pdf" | "pptx" | "xlsx" | "docx";

/**
 * Sort order for the resource library list.
 */
export type ResourceSortBy = "date" | "name";

/**
 * Filter type for the resource library — "all" or a specific file type.
 */
export type ResourceFilterType = ResourceFileType | "all";

/**
 * Upload form data shape — used by the upload dialog component.
 * This is the form-level type before it's converted to `ResourceUploadInput` for the mutation.
 */
export interface ResourceUploadFormData {
  readonly documentName: string;
  readonly fileName: string;
}

/**
 * View-specific learning resource row.
 * Maps the GraphQL LearningResourceRow fields to what the UI views expect.
 */
export interface LearningResourceRow {
  readonly id: string;
  readonly title: string;
  readonly fileName: string;
  readonly filePath: string;
  readonly fileType: ResourceFileType;
  readonly uploadedAt: string;
  readonly uploadedAtTimestamp: number;
}

export interface ResourceLibraryCardProps {
  readonly resource: LearningResourceRow;
  readonly labels: ResourcesLabels;
  readonly canManage: boolean;
  readonly onDeleteRequest: (id: string) => void;
  readonly onCardClick: (id: string) => void;
  readonly variant: "grid" | "list";
}

export interface ResourceUploadFormProps {
  readonly labels: ResourcesLabels;
  readonly documentName: string;
  readonly selectedFileName: string;
  readonly isUploading: boolean;
  readonly canManage: boolean;
  readonly onDocumentNameChange: (name: string) => void;
  readonly onFormSubmit: () => void;
  readonly onFileSelect: (file: File) => void;
  readonly variant: "desktop" | "mobile";
}

export interface ResourceUploadDropzoneProps {
  readonly labels: ResourcesLabels;
  readonly selectedFileName: string;
  readonly hasError?: boolean;
  readonly errorMessage?: string;
  readonly onFileSelect: (file: File) => void;
  readonly variant: "desktop" | "mobile";
}

export interface ResourceUploadGuidelinesProps {
  readonly labels: ResourcesLabels;
}

export interface ResourceLibraryHeaderProps {
  readonly labels: ResourcesLabels;
  readonly filterType: ResourceFilterType;
  readonly sortBy: ResourceSortBy;
  readonly onFilterTypeChange: (type: ResourceFilterType) => void;
  readonly onSortByChange: (sort: ResourceSortBy) => void;
}

export interface ResourceLibraryGridProps {
  readonly resources: readonly LearningResourceRow[];
  readonly labels: ResourcesLabels;
  readonly filterType: ResourceFilterType;
  readonly sortBy: ResourceSortBy;
  readonly canManage: boolean;
  readonly onFilterTypeChange: (type: ResourceFilterType) => void;
  readonly onSortByChange: (sort: ResourceSortBy) => void;
  readonly onDeleteRequest: (id: string) => void;
  readonly onCardClick: (id: string) => void;
}

export interface ResourceLibraryListProps {
  readonly resources: readonly LearningResourceRow[];
  readonly labels: ResourcesLabels;
  readonly filterType: ResourceFilterType;
  readonly sortBy: ResourceSortBy;
  readonly canManage: boolean;
  readonly onFilterTypeChange: (type: ResourceFilterType) => void;
  readonly onSortByChange: (sort: ResourceSortBy) => void;
  readonly onDeleteRequest: (id: string) => void;
  readonly onCardClick: (id: string) => void;
}

export interface ResourceFileTypeIconProps {
  readonly fileType: ResourceFileType;
}

export interface ResourceGovernancePanelProps {
  readonly labels: ResourcesLabels;
}

export interface ResourceDeleteDialogProps {
  readonly labels: ResourcesLabels;
  readonly open: boolean;
  readonly resourceTitle: string | null;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
  readonly loading?: boolean;
}
