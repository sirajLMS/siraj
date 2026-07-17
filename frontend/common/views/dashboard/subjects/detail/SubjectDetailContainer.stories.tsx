import { MockedProvider } from "@apollo/client/testing/react";
import type { Meta, StoryObj } from "@storybook/react";
import { AccountStatus, AppPermission, CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { classSubjectByIdQueryDocument } from "@/frontend/common/graphql/sharedDocuments/classes/class-subject.documents";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { SubjectDetailView } from "@/frontend/common/views/dashboard/subjects/detail/SubjectDetailContainer";
import type { SubjectDetailData, SubjectResourceItem } from "@/frontend/common/views/dashboard/subjects/detail/types";

const mockResources: SubjectResourceItem[] = [
  {
    id: "res-1",
    subjectId: "subj-1",
    learningResourceId: "lr-1",
    resourceType: "pdf",
    sortOrder: 0,
    displayName: "Tajweed Rules Handbook",
    filePath: "/files/tajweed-rules.pdf",
  },
  {
    id: "res-2",
    subjectId: "subj-1",
    learningResourceId: "lr-2",
    resourceType: "video",
    sortOrder: 1,
    displayName: "Pronunciation Guide",
    filePath: "/files/pronunciation-guide.mp4",
  },
  {
    id: "res-3",
    subjectId: "subj-1",
    learningResourceId: "lr-3",
    resourceType: "pdf",
    sortOrder: 2,
    displayName: "Practice Worksheets",
    filePath: "/files/tajweed-worksheets.pdf",
  },
];

const mockSubject: SubjectDetailData = {
  id: "subj-1",
  name: "Tajweed",
  slug: "tajweed",
  categoryId: "cat-1",
  description: "Science of Quran recitation covering pronunciation rules and articulation points.",
  isActive: true,
  sortOrder: 0,
  category: { id: "cat-1", name: "Quran", slug: "quran" },
  avatarUrl: null,
  resources: mockResources,
};

function subjectByIdMocks(subject: SubjectDetailData | null) {
  return [
    {
      request: { query: classSubjectByIdQueryDocument, variables: { id: subject?.id ?? "subj-1" } },
      result: { data: { classSubject: subject } },
    },
  ];
}

function applyMockPerms() {
  const perms = [AppPermission.SubjectsViewResources, AppPermission.SubjectsList];
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
      __typename: "User",
      phone: null,
      status: AccountStatus.Activated,
      displayCurrency: CurrencyCode.Usd,
    },
  });
}

const meta: Meta<typeof SubjectDetailView> = {
  title: "Views/dashboard/subjects/detail/SubjectDetailView",
  component: SubjectDetailView,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof SubjectDetailView>;

export const Default: Story = {
  args: { subjectId: "subj-1" },
  decorators: [
    function DefaultDecorator(Story: React.ComponentType) {
      applyMockPerms();
      return (
        <MockedProvider mocks={subjectByIdMocks(mockSubject)}>
          <Story />
        </MockedProvider>
      );
    },
  ],
};

export const NoResources: Story = {
  args: { subjectId: "subj-1" },
  decorators: [
    function NoResourcesDecorator(Story: React.ComponentType) {
      applyMockPerms();
      return (
        <MockedProvider mocks={subjectByIdMocks({ ...mockSubject, resources: [] })}>
          <Story />
        </MockedProvider>
      );
    },
  ],
};

export const NoCategory: Story = {
  args: { subjectId: "subj-1" },
  decorators: [
    function NoCategoryDecorator(Story: React.ComponentType) {
      applyMockPerms();
      return (
        <MockedProvider mocks={subjectByIdMocks({ ...mockSubject, category: null })}>
          <Story />
        </MockedProvider>
      );
    },
  ],
};

export const NotFound: Story = {
  args: { subjectId: "missing-subject" },
  decorators: [
    function NotFoundDecorator(Story: React.ComponentType) {
      applyMockPerms();
      return (
        <MockedProvider mocks={subjectByIdMocks(null)}>
          <Story />
        </MockedProvider>
      );
    },
  ],
};
