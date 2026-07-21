import type { Meta, StoryObj } from "@storybook/react";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { seedPermissions } from "@/frontend/common/stories";
import { SubjectsContainer } from "@/frontend/common/views/dashboard/subjects/home/SubjectsContainer";

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
