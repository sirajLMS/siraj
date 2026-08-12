import type { ResourceFileType, ResourceFilterType, ResourceSortBy } from "@/frontend/common/types/shared.types";
import type { ResourcesLabels } from "@/shared/locale";

export type {
  LearningResourceRow as GqlLearningResourceRow,
  ResourceUploadInput,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
export type { ResourceFileType, ResourceFilterType, ResourceSortBy };

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

/** Shared props for both {@link ResourceLibraryGridProps} and {@link ResourceLibraryListProps}. */
interface ResourceLibrarySharedProps {
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

export type ResourceLibraryGridProps = ResourceLibrarySharedProps;

export type ResourceLibraryListProps = ResourceLibrarySharedProps;

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
