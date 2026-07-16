import type {
  LearningResourceRow,
  ResourceFilterType,
  ResourceSortBy,
  ResourceUploadFormData,
} from "@/frontend/common/views/dashboard/resources/types/resourcesTypes";
import type { ResourcesLabels } from "@/shared/locale";

export interface ResourcesViewProps {
  readonly labels: ResourcesLabels;
  readonly resources: readonly LearningResourceRow[];
  readonly searchQuery: string;
  readonly filterType: ResourceFilterType;
  readonly sortBy: ResourceSortBy;
  readonly pendingDeleteId: string | null;
  readonly pendingDeleteTitle: string | null;
  readonly isUploading: boolean;
  readonly isDeleting: boolean;
  readonly canManage: boolean;
  readonly onSearchChange: (query: string) => void;
  readonly onFilterTypeChange: (type: ResourceFilterType) => void;
  readonly onSortByChange: (sort: ResourceSortBy) => void;
  readonly onUpload: (data: ResourceUploadFormData, file: File) => void;
  readonly onDeleteRequest: (id: string) => void;
  readonly onDeleteCancel: () => void;
  readonly onDeleteConfirm: () => void;
  readonly onCardClick: (id: string) => void;
}

export interface ResourcesLayoutViewProps {
  readonly labels: ResourcesLabels;
  readonly resources: readonly LearningResourceRow[];
  readonly filterType: ResourceFilterType;
  readonly sortBy: ResourceSortBy;
  readonly pendingDeleteId: string | null;
  readonly pendingDeleteTitle: string | null;
  readonly isUploading: boolean;
  readonly isDeleting: boolean;
  readonly canManage: boolean;
  readonly documentName: string;
  readonly selectedFileName: string;
  readonly onFilterTypeChange: (type: ResourceFilterType) => void;
  readonly onSortByChange: (sort: ResourceSortBy) => void;
  readonly onDocumentNameChange: (name: string) => void;
  readonly onFormSubmit: () => void;
  readonly onFileSelect: (file: File) => void;
  readonly onDeleteRequest: (id: string) => void;
  readonly onDeleteCancel: () => void;
  readonly onDeleteConfirm: () => void;
  readonly onCardClick: (id: string) => void;
}
