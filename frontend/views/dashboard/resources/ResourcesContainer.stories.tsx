import { MockedProvider } from "@apollo/client/testing/react";
import type { Meta, StoryObj } from "@storybook/react";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import {
  learningResourcesQueryDocument,
  uploadLearningResourceMutationDocument,
} from "@/frontend/graphql/sharedDocuments/learning-resource.documents";
import { useUserStore as useMockUserStore } from "@/frontend/stores/mockUserStore";
import { useUserStore } from "@/frontend/stores/userStore";
import { ResourcesContainer } from "./ResourcesContainer";

const MOCK_RESOURCE_ROWS = [
  {
    __typename: "LearningResourceRow" as const,
    id: "res-1",
    displayName: "English Grammar Handbook",
    filePath: "/resources/grammar-handbook.pdf",
    uploadedByUserId: "user-admin-1",
    uploadedByUserName: "Admin User",
    fileSize: 2450000,
    contentType: "application/pdf",
    createdAt: "2025-03-01T09:00:00Z",
  },
  {
    __typename: "LearningResourceRow" as const,
    id: "res-2",
    displayName: "Math Worksheets Grade 5",
    filePath: "/resources/math-worksheets.xlsx",
    uploadedByUserId: "user-admin-1",
    uploadedByUserName: "Admin User",
    fileSize: 890000,
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    createdAt: "2025-03-10T11:30:00Z",
  },
];

const resourceMocks = [
  {
    request: {
      query: learningResourcesQueryDocument,
      variables: {},
    },
    result: {
      data: {
        learningResources: MOCK_RESOURCE_ROWS,
      },
    },
  },
  {
    request: {
      query: learningResourcesQueryDocument,
      variables: { searchQuery: "" },
    },
    result: {
      data: {
        learningResources: MOCK_RESOURCE_ROWS,
      },
    },
  },
  {
    request: {
      query: learningResourcesQueryDocument,
      variables: { searchQuery: undefined },
    },
    result: {
      data: {
        learningResources: MOCK_RESOURCE_ROWS,
      },
    },
  },
  {
    request: {
      query: uploadLearningResourceMutationDocument,
      variables: {
        input: {
          displayName: "New Document",
          filePath: "/resources/new-doc.pdf",
          fileId: "file-new-1",
        },
      },
    },
    result: {
      data: {
        uploadLearningResource: {
          __typename: "LearningResourceRow",
          id: "res-new",
          displayName: "New Document",
          filePath: "/resources/new-doc.pdf",
          uploadedByUserId: "user-admin-1",
          uploadedByUserName: "Admin User",
          fileSize: 500000,
          contentType: "application/pdf",
          createdAt: "2025-03-15T10:00:00Z",
        },
      },
    },
  },
];

const meta: Meta<typeof ResourcesContainer> = {
  title: "Views/dashboard/resources/ResourcesContainer",
  component: ResourcesContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    Story => {
      const perms = [
        AppPermission.StudentsList,
        AppPermission.StaffViewDirectory,
        AppPermission.ResourcesList,
        AppPermission.ResourcesUpload,
        AppPermission.StaffEditProfile,
      ];
      useUserStore.setState({ permissions: perms });
      useMockUserStore.setState({ permissions: perms });
      return (
        <MockedProvider mocks={resourceMocks}>
          <Story />
        </MockedProvider>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof ResourcesContainer>;

export const Default: Story = {
  args: {},
};

export const Empty: Story = {
  args: {},
  decorators: [
    Story => (
      <MockedProvider
        mocks={[
          {
            request: { query: learningResourcesQueryDocument, variables: {} },
            result: { data: { learningResources: [] } },
          },
          {
            request: { query: learningResourcesQueryDocument, variables: { searchQuery: "" } },
            result: { data: { learningResources: [] } },
          },
          {
            request: { query: learningResourcesQueryDocument, variables: { searchQuery: undefined } },
            result: { data: { learningResources: [] } },
          },
        ]}
      >
        <Story />
      </MockedProvider>
    ),
  ],
};
