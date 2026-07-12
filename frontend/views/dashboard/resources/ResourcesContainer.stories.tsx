import type { Meta, StoryObj } from "@storybook/react";
import { AccountStatus, AppPermission, CurrencyCode } from "@/frontend/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/stores/userStore";
import { logger } from "@/frontend/utils/logger";
import { ResourcesView } from "@/frontend/views/dashboard/resources/resourcesView";
import type { ResourceFilterType, ResourceSortBy } from "@/frontend/views/dashboard/resources/types/resourcesTypes";

const mockLabels = {
  pageTitle: "Resource Library",
  pageSubtitle: "Access and manage academy materials",
  upload: {
    sectionTitle: "Upload New Resource",
    documentName: "Document Name",
    documentNamePlaceholder: "Enter a descriptive name",
    dropzoneTitle: "Choose a file or drag it here",
    dropzoneHint: "PDF, Word, Excel, PowerPoint up to 10MB",
    supportedFormats: "Supported formats: PDF, DOCX, XLSX, PPTX",
    submit: "Upload File",
    successMessage: "Resource uploaded successfully!",
  },
  guidelines: {
    title: "Upload Guidelines",
    items: [
      "File size must not exceed 10MB.",
      "Ensure document names are clear and professional.",
      "Only upload approved curriculum materials.",
    ],
  },
  governance: {
    title: "Material Governance",
    body: "All uploaded resources are subjected to verification by the administration team.",
  },
  library: {
    title: "All Materials",
    filter: "Filter by type",
    sortByDate: "Sort by date",
    sortByName: "Sort by name",
    typeAll: "All Types",
    uploaded: "Uploaded",
    noEntries: "No resources found.",
  },
  deleteDialog: {
    title: "Delete Resource",
    body: "Are you sure you want to permanently delete this resource? This action cannot be undone.",
    confirm: "Delete",
    cancel: "Cancel",
  },
  validation: {
    documentNameRequired: "Document name is required",
    fileRequired: "File selection is required",
  },
  notification: {
    fileTypeNotAllowed: "{type} is not an allowed file type",
    uploadPrepareFailed: "Failed to prepare upload",
    uploadFailed: "File upload failed. Please try again.",
    createRecordFailed: "Failed to create resource record.",
    uploadRetryFailed: "Failed to upload resource. Please try again.",
    deleteSuccess: "Resource deleted successfully.",
    deleteFailed: "Failed to delete resource.",
  },
};

const mockResources = [
  {
    id: "res-1",
    title: "English Grammar Handbook",
    fileName: "grammar-handbook.pdf",
    filePath: "resources/grammar-handbook.pdf",
    fileType: "pdf" as const,
    uploadedAt: "3/1/2025",
    uploadedAtTimestamp: 1740819600000,
  },
  {
    id: "res-2",
    title: "Math Worksheets Grade 5",
    fileName: "math-worksheets.xlsx",
    filePath: "resources/math-worksheets.xlsx",
    fileType: "xlsx" as const,
    uploadedAt: "3/10/2025",
    uploadedAtTimestamp: 1741599600000,
  },
];

const baseArgs = {
  labels: mockLabels,
  resources: mockResources,
  searchQuery: "",
  filterType: "all" as const,
  sortBy: "date" as const,
  pendingDeleteId: null,
  pendingDeleteTitle: null,
  isUploading: false,
  isDeleting: false,
  canManage: true,
  onSearchChange: (query: string) => {
    logger.info("onSearchChange:", query);
  },
  onFilterTypeChange: (type: ResourceFilterType) => {
    logger.info("onFilterTypeChange:", type);
  },
  onSortByChange: (sort: ResourceSortBy) => {
    logger.info("onSortByChange:", sort);
  },
  onUpload: (data: { documentName: string; fileName: string }, _file: File) => {
    logger.info("onUpload:", data);
  },
  onDeleteRequest: (id: string) => {
    logger.info("onDeleteRequest:", id);
  },
  onDeleteCancel: () => {
    logger.info("onDeleteCancel");
  },
  onDeleteConfirm: () => {
    logger.info("onDeleteConfirm");
  },
  onCardClick: (id: string) => {
    logger.info("onCardClick:", id);
  },
};

const meta: Meta<typeof ResourcesView> = {
  title: "Views/dashboard/resources/ResourcesView",
  component: ResourcesView,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof ResourcesView>;

export const Default: Story = {
  args: baseArgs,
  decorators: [
    Story => {
      const perms = [AppPermission.ResourcesList, AppPermission.ResourcesUpload, AppPermission.ResourcesDelete];
      useUserStore.setState({
        permissions: perms,
        user: {
          id: "mock-id",
          name: "Mock User",
          role: "Mock Role",
          avatarUrl: "",
          permissions: perms,
          notificationCount: 0,
          teacherId: null,
          parentId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          emailVerifiedAt: new Date().toISOString(),
          email: "mock@example.com",
          phone: null,
          status: AccountStatus.Activated,
          displayCurrency: CurrencyCode.Usd,
          __typename: "User",
        },
      });

      return <Story />;
    },
  ],
};

export const Empty: Story = {
  args: {
    ...baseArgs,
    resources: [],
  },
  decorators: [
    Story => {
      const perms = [AppPermission.ResourcesList, AppPermission.ResourcesUpload, AppPermission.ResourcesDelete];
      useUserStore.setState({
        permissions: perms,
        user: {
          id: "mock-id",
          name: "Mock User",
          role: "Mock Role",
          avatarUrl: "",
          permissions: perms,
          notificationCount: 0,
          teacherId: null,
          parentId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          emailVerifiedAt: new Date().toISOString(),
          email: "mock@example.com",
          phone: null,
          status: AccountStatus.Activated,
          displayCurrency: CurrencyCode.Usd,
          __typename: "User",
        },
      });

      return <Story />;
    },
  ],
};

export const ListOnly: Story = {
  args: {
    ...baseArgs,
    canManage: false,
  },
  decorators: [
    Story => {
      const perms = [AppPermission.ResourcesList];
      useUserStore.setState({
        permissions: perms,
        user: {
          id: "mock-id",
          name: "Mock User",
          role: "Mock Role",
          avatarUrl: "",
          permissions: perms,
          notificationCount: 0,
          teacherId: null,
          parentId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          emailVerifiedAt: new Date().toISOString(),
          email: "mock@example.com",
          phone: null,
          status: AccountStatus.Activated,
          displayCurrency: CurrencyCode.Usd,
          __typename: "User",
        },
      });

      return <Story />;
    },
  ],
};

export const DeleteInProgress: Story = {
  args: {
    ...baseArgs,
    pendingDeleteId: "res-1",
    pendingDeleteTitle: "English Grammar Handbook",
    isDeleting: true,
  },
  decorators: [
    Story => {
      const perms = [AppPermission.ResourcesList, AppPermission.ResourcesUpload, AppPermission.ResourcesDelete];
      useUserStore.setState({
        permissions: perms,
        user: {
          id: "mock-id",
          name: "Mock User",
          role: "Mock Role",
          avatarUrl: "",
          permissions: perms,
          notificationCount: 0,
          teacherId: null,
          parentId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          emailVerifiedAt: new Date().toISOString(),
          email: "mock@example.com",
          phone: null,
          status: AccountStatus.Activated,
          displayCurrency: CurrencyCode.Usd,
          __typename: "User",
        },
      });

      return <Story />;
    },
  ],
};

export const UploadingState: Story = {
  args: {
    ...baseArgs,
    isUploading: true,
  },
  decorators: [
    Story => {
      const perms = [AppPermission.ResourcesList, AppPermission.ResourcesUpload, AppPermission.ResourcesDelete];
      useUserStore.setState({
        permissions: perms,
        user: {
          id: "mock-id",
          name: "Mock User",
          role: "Mock Role",
          avatarUrl: "",
          permissions: perms,
          notificationCount: 0,
          teacherId: null,
          parentId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          emailVerifiedAt: new Date().toISOString(),
          email: "mock@example.com",
          phone: null,
          status: AccountStatus.Activated,
          displayCurrency: CurrencyCode.Usd,
          __typename: "User",
        },
      });

      return <Story />;
    },
  ],
};
