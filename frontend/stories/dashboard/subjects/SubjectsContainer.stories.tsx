import type { Meta, StoryObj } from "@storybook/react";
import { AccountStatus, AppPermission, CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { SubjectsContainer } from "@/frontend/common/views/dashboard/subjects/home/SubjectsContainer";

function seedPermissions(perms: AppPermission[]) {
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
}

const meta = {
  title: "Views/dashboard/subjects/home/SubjectsContainer",
  component: SubjectsContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof SubjectsContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  decorators: [
    Story => {
      seedPermissions([
        AppPermission.SubjectsList,
        AppPermission.SubjectsCreate,
        AppPermission.SubjectsUpdate,
        AppPermission.SubjectsDelete,
        AppPermission.CategoriesList,
        AppPermission.CategoriesCreate,
        AppPermission.CategoriesUpdate,
        AppPermission.CategoriesDelete,
      ]);
      return <Story />;
    },
  ],
};

export const Empty: Story = {
  decorators: [
    Story => {
      seedPermissions([AppPermission.SubjectsList]);
      return <Story />;
    },
  ],
};

export const Loading: Story = {
  decorators: [
    Story => {
      seedPermissions([AppPermission.SubjectsList]);
      return <Story />;
    },
  ],
};

export const ReadOnly: Story = {
  decorators: [
    Story => {
      seedPermissions([AppPermission.SubjectsList, AppPermission.CategoriesList]);
      return <Story />;
    },
  ],
};

export const FilteredByCategory: Story = {
  decorators: [
    Story => {
      seedPermissions([AppPermission.SubjectsList, AppPermission.CategoriesList]);
      return <Story />;
    },
  ],
};
