import { create } from "zustand";
import { logger } from "@/frontend/utils/logger";
import type {
  LearningResourceRow,
  ResourceFilterType,
  ResourceSortBy,
  ResourceUploadFormData,
} from "@/frontend/views/dashboard/resources/types/resourcesTypes";
import { inferResourceFileType } from "@/frontend/views/dashboard/resources/utils/resourceFileTypeUtils";

export type {
  LearningResourceRow,
  ResourceFileType,
  ResourceFilterType,
  ResourceSortBy,
  ResourceUploadFormData,
} from "@/frontend/views/dashboard/resources/types/resourcesTypes";

interface ResourcesState {
  readonly resources: readonly LearningResourceRow[];
  readonly searchQuery: string;
  readonly filterType: ResourceFilterType;
  readonly sortBy: ResourceSortBy;
  readonly pendingDeleteId: string | null;
  readonly isUploading: boolean;
  readonly showUploadSuccess: boolean;
  setSearchQuery: (query: string) => void;
  setFilterType: (type: ResourceFilterType) => void;
  setSortBy: (sort: ResourceSortBy) => void;
  openDeleteDialog: (id: string) => void;
  closeDeleteDialog: () => void;
  confirmDelete: () => void;
  setUploading: (value: boolean) => void;
  setShowUploadSuccess: (value: boolean) => void;
  resetUploadSuccess: () => void;
  uploadResource: (data: ResourceUploadFormData) => void;
}

const MOCK_RESOURCES: LearningResourceRow[] = [
  {
    id: "res-1001",
    title: "BUSINESS NETWORKING",
    fileName: "Business Skill.pdf",
    fileType: "pdf",
    uploadedAt: "2 days ago",
    uploadedAtTimestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
  },
  {
    id: "res-1002",
    title: "MARKETING STRATEGY",
    fileName: "Q4_Strategy_v2.pptx",
    fileType: "pptx",
    uploadedAt: "5 days ago",
    uploadedAtTimestamp: Date.now() - 5 * 24 * 60 * 60 * 1000,
  },
  {
    id: "res-1003",
    title: "STUDENT ENROLLMENT",
    fileName: "Admission_List_2024.xlsx",
    fileType: "xlsx",
    uploadedAt: "1 week ago",
    uploadedAtTimestamp: Date.now() - 7 * 24 * 60 * 60 * 1000,
  },
  {
    id: "res-1004",
    title: "ACADEMIC CURRICULUM",
    fileName: "Standard_Curriculum.pdf",
    fileType: "pdf",
    uploadedAt: "Oct 20, 2023",
    uploadedAtTimestamp: new Date("2023-10-20").getTime(),
  },
];

export const useResourcesStore = create<ResourcesState>(set => ({
  resources: MOCK_RESOURCES,
  searchQuery: "",
  filterType: "all",
  sortBy: "date",
  pendingDeleteId: null,
  isUploading: false,
  showUploadSuccess: false,
  setSearchQuery: query => {
    set({ searchQuery: query });
  },
  setFilterType: type => {
    set({ filterType: type });
  },
  setSortBy: sort => {
    set({ sortBy: sort });
  },
  openDeleteDialog: id => {
    set({ pendingDeleteId: id });
  },
  closeDeleteDialog: () => {
    set({ pendingDeleteId: null });
  },
  confirmDelete: () => {
    set(state => {
      if (!state.pendingDeleteId) {
        return state;
      }

      logger.info("Resource deleted", { id: state.pendingDeleteId });

      return {
        resources: state.resources.filter(row => row.id !== state.pendingDeleteId),
        pendingDeleteId: null,
      };
    });
  },
  setUploading: value => {
    set({ isUploading: value });
  },
  setShowUploadSuccess: value => {
    set({ showUploadSuccess: value });
  },
  resetUploadSuccess: () => {
    set({ showUploadSuccess: false });
  },
  uploadResource: data => {
    logger.info("Resource uploaded", { data });

    const fileType = inferResourceFileType(data.fileName);
    const now = Date.now();

    const newResource: LearningResourceRow = {
      id: `res-${now}`,
      title: data.documentName.toUpperCase(),
      fileName: data.fileName,
      fileType,
      uploadedAt: "Just now",
      uploadedAtTimestamp: now,
    };

    set(state => ({
      resources: [newResource, ...state.resources],
      showUploadSuccess: true,
    }));
  },
}));
