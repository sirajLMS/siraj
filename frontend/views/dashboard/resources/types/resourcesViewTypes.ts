import type { ResourcesLabels } from "@/shared/messages/types/dashboard/resources/main";
import type { ResourceUploadFormData } from "../schemas/resourceUploadSchema";
import type { LearningResourceRow, ResourceFilterType, ResourceSortBy } from "./resourcesTypes";

export interface ResourcesViewProps {
  readonly labels: ResourcesLabels;
  readonly resources: readonly LearningResourceRow[];
  readonly searchQuery: string;
  readonly filterType: ResourceFilterType;
  readonly sortBy: ResourceSortBy;
  readonly pendingDeleteId: string | null;
  readonly pendingDeleteTitle: string | null;
  readonly isUploading: boolean;
  readonly showUploadSuccess: boolean;
  readonly canManage: boolean;
  readonly onSearchChange: (query: string) => void;
  readonly onFilterTypeChange: (type: ResourceFilterType) => void;
  readonly onSortByChange: (sort: ResourceSortBy) => void;
  readonly onUpload: (data: ResourceUploadFormData) => void;
  readonly onDismissSuccess: () => void;
  readonly onDeleteRequest: (id: string) => void;
  readonly onDeleteCancel: () => void;
  readonly onDeleteConfirm: () => void;
}
