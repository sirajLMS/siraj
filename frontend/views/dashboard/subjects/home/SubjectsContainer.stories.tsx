import type { Meta, StoryObj } from "@storybook/react";
import { AppPermission, CurrencyCode } from "@/frontend/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/stores/userStore";
import { SubjectsView } from "@/frontend/views/dashboard/subjects/home/SubjectsView";

const mockCategories = [
  {
    id: "cat-1",
    name: "Quran",
    slug: "quran",
    description: null,
    isActive: true,
    sortOrder: 0,
    __typename: "ClassCategory" as const,
  },
  {
    id: "cat-2",
    name: "Arabic Language",
    slug: "arabic-language",
    description: null,
    isActive: true,
    sortOrder: 1,
    __typename: "ClassCategory" as const,
  },
  {
    id: "cat-3",
    name: "Islamic Studies",
    slug: "islamic-studies",
    description: null,
    isActive: true,
    sortOrder: 2,
    __typename: "ClassCategory" as const,
  },
];

const mockSubjects = [
  {
    id: "subj-1",
    name: "Tajweed",
    slug: "tajweed",
    categoryId: "cat-1",
    description: "Science of Quran recitation",
    isActive: true,
    sortOrder: 0,
    category: mockCategories[0],
    resources: [
      {
        id: "res-1",
        subjectId: "subj-1",
        learningResourceId: "lr-1",
        resourceType: "pdf",
        sortOrder: 0,
        displayName: "Tajweed Rules",
        filePath: "/files/tajweed.pdf",
        __typename: "SubjectResource" as const,
      },
    ],
    avatarUrl: null,
    __typename: "ClassSubject" as const,
  },
  {
    id: "subj-2",
    name: "Hifz",
    slug: "hifz",
    categoryId: "cat-1",
    description: "Quran memorization",
    isActive: true,
    sortOrder: 1,
    category: mockCategories[0],
    resources: [],
    avatarUrl: null,
    __typename: "ClassSubject" as const,
  },
  {
    id: "subj-3",
    name: "Arabic Grammar",
    slug: "arabic-grammar",
    categoryId: "cat-2",
    description: "Nahw and Sarf fundamentals",
    isActive: true,
    sortOrder: 0,
    category: mockCategories[1],
    resources: [],
    avatarUrl: null,
    __typename: "ClassSubject" as const,
  },
  {
    id: "subj-4",
    name: "Seerah",
    slug: "seerah",
    categoryId: "cat-3",
    description: null,
    isActive: false,
    sortOrder: 0,
    category: mockCategories[2],
    resources: [],
    avatarUrl: null,
    __typename: "ClassSubject" as const,
  },
];

const baseArgs = {
  categories: mockCategories,
  subjects: mockSubjects,
  isLoading: false,
  activeCategoryId: null,
  onCategoryChange: () => {},
  onAddSubject: () => {},
  onEditSubject: () => {},
  onDeleteSubject: () => {},
  onSubjectClick: () => {},
  onCreateCategory: () => {},
  onEditCategory: () => {},
  onDeleteCategory: () => {},
  canManageSubjects: true,
  canManageCategories: true,
};

const meta: Meta<typeof SubjectsView> = {
  title: "Views/dashboard/subjects/home/SubjectsView",
  component: SubjectsView,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof SubjectsView>;

export const Default: Story = {
  args: baseArgs,
  decorators: [
    Story => {
      const perms = [
        AppPermission.SubjectsList,
        AppPermission.SubjectsCreate,
        AppPermission.SubjectsUpdate,
        AppPermission.SubjectsDelete,
        AppPermission.CategoriesList,
        AppPermission.CategoriesCreate,
        AppPermission.CategoriesUpdate,
        AppPermission.CategoriesDelete,
      ];
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
          displayCurrency: CurrencyCode.Usd,
          __typename: "User",
        },
      });
      return <Story />;
    },
  ],
};

export const Empty: Story = {
  args: { ...baseArgs, subjects: [] },
  decorators: [
    Story => {
      const perms = [AppPermission.SubjectsList];
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
          displayCurrency: CurrencyCode.Usd,
          __typename: "User",
        },
      });
      return <Story />;
    },
  ],
};

export const Loading: Story = {
  args: { ...baseArgs, isLoading: true, subjects: [] },
  decorators: [
    Story => {
      const perms = [AppPermission.SubjectsList];
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
          displayCurrency: CurrencyCode.Usd,
          __typename: "User",
        },
      });
      return <Story />;
    },
  ],
};

export const ReadOnly: Story = {
  args: { ...baseArgs, canManageSubjects: false, canManageCategories: false },
  decorators: [
    Story => {
      const perms = [AppPermission.SubjectsList, AppPermission.CategoriesList];
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
          displayCurrency: CurrencyCode.Usd,
          __typename: "User",
        },
      });
      return <Story />;
    },
  ],
};

export const FilteredByCategory: Story = {
  args: { ...baseArgs, activeCategoryId: "cat-1" },
  decorators: [
    Story => {
      const perms = [AppPermission.SubjectsList, AppPermission.CategoriesList];
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
          displayCurrency: CurrencyCode.Usd,
          __typename: "User",
        },
      });
      return <Story />;
    },
  ],
};
