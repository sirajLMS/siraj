import type { Meta, StoryObj } from "@storybook/react";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/stores/userStore";
import { SubjectDetailView } from "./SubjectDetailView";
import type { SubjectDetailData, SubjectResourceItem } from "./types";

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
  resources: mockResources,
};

const baseArgs = {
  subject: mockSubject,
  resources: mockResources,
  breadcrumbs: [
    { label: "Subjects", href: "/subjects" },
    { label: "Tajweed", current: true },
  ],
};

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

const mockPermsDecorator = (Story: React.ComponentType) => {
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
    },
  });
  return <Story />;
};

export const Default: Story = {
  args: baseArgs,
  decorators: [mockPermsDecorator],
};

export const NoResources: Story = {
  args: {
    ...baseArgs,
    resources: [],
    subject: { ...mockSubject, resources: [] },
  },
  decorators: [mockPermsDecorator],
};

export const NoCategory: Story = {
  args: {
    ...baseArgs,
    subject: { ...mockSubject, category: null },
  },
  decorators: [mockPermsDecorator],
};
